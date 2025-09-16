package com.example.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.web.RoutingContext;

public class EmployeeHandler {
    private final JDBCClient dbClient;

    public EmployeeHandler(JDBCClient dbClient) {
        this.dbClient = dbClient;
    }

    public void getAllEmployees(RoutingContext context) {
        // Try to get all columns first, with fallback for missing columns
        String query = "SELECT id, name, " +
                      "COALESCE(email, '') as email, " +
                      "COALESCE(role, 'EMPLOYEE') as role, " +
                      "COALESCE(job_type, 'On-Site') as job_type, " +
                      "COALESCE(position, '') as position, " +
                      "COALESCE(status, 'active') as status, " +
                      "invited_at, activated_at " +
                      "FROM employees ORDER BY id DESC";
        
        dbClient.query(query, res -> {
            if (res.succeeded()) {
                List<JsonObject> rows = res.result().getRows();
                List<JsonObject> processedRows = rows.stream().map(row -> {
                    JsonObject json = new JsonObject();
                    row.forEach(entry -> {
                        if (entry.getValue() instanceof LocalDateTime) {
                            json.put(entry.getKey(), entry.getValue().toString());
                        } else {
                            json.put(entry.getKey(), entry.getValue());
                        }
                    });
                    return json;
                }).toList();

                JsonArray jsonArray = new JsonArray(processedRows);
                context.response()
                    .putHeader("Content-Type", "application/json")
                    .end(jsonArray.encodePrettily());
            } else {
                // If the query fails, try a simpler query with just basic columns
                System.out.println("Full query failed, trying basic query: " + res.cause().getMessage());
                dbClient.query("SELECT id, name, position, job_type FROM employees ORDER BY id DESC", basicRes -> {
                    if (basicRes.succeeded()) {
                        List<JsonObject> rows = basicRes.result().getRows();
                        List<JsonObject> processedRows = rows.stream().map(row -> {
                            JsonObject json = new JsonObject();
                            row.forEach(entry -> {
                                if (entry.getValue() instanceof LocalDateTime) {
                                    json.put(entry.getKey(), entry.getValue().toString());
                                } else {
                                    json.put(entry.getKey(), entry.getValue());
                                }
                            });
                            // Add default values for missing columns
                            json.put("email", "");
                            json.put("role", "EMPLOYEE");
                            json.put("status", "active");
                            return json;
                        }).toList();

                        JsonArray jsonArray = new JsonArray(processedRows);
                        context.response()
                            .putHeader("Content-Type", "application/json")
                            .end(jsonArray.encodePrettily());
                    } else {
                        context.response().setStatusCode(500).end(basicRes.cause().getMessage());
                    }
                });
            }
        });
    }

    public void createEmployee(RoutingContext context) {
        try {
            JsonObject employee = context.body().asJsonObject();
            System.out.println("Received employee: " + employee.encodePrettily());
            System.out.println("Email field: " + employee.getString("email"));
            
            // Try the full insert first (with new columns)
            String fullInsertQuery = "INSERT INTO employees(name, email, role, job_type, position, invite_token, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
            String inviteToken = UUID.randomUUID().toString().replace("-", "");
            
            dbClient.updateWithParams(
                fullInsertQuery,
                new JsonArray()
                    .add(employee.getString("name"))
                    .add(employee.getString("email"))
                    .add(employee.getString("role"))
                    .add(employee.getString("job_type"))
                    .add(employee.getString("position"))
                    .add(inviteToken)
                    .add("pending"),
                res -> {
                    if (res.succeeded()) {
                        long generatedId = res.result().getKeys().getLong(0);
                        JsonObject responseJson = new JsonObject()
                            .put("message", "Employee created and invite sent")
                            .put("id", generatedId)
                            .put("invite_token", inviteToken);
    
                        context.response()
                            .setStatusCode(201)
                            .putHeader("Content-Type", "application/json")
                            .end(responseJson.encode());
                    } else {
                        // If full insert fails, try basic insert (without new columns)
                        System.out.println("Full insert failed, trying basic insert: " + res.cause().getMessage());
                        System.out.println("Error details: " + res.cause().toString());
                        dbClient.updateWithParams(
                            "INSERT INTO employees(name, position, job_type) VALUES (?, ?, ?)",
                            new JsonArray()
                                .add(employee.getString("name"))
                                .add(employee.getString("position"))
                                .add(employee.getString("job_type")),
                            basicRes -> {
                                if (basicRes.succeeded()) {
                                    long generatedId = basicRes.result().getKeys().getLong(0);
                                    JsonObject responseJson = new JsonObject()
                                        .put("message", "Employee created (basic mode - please add database columns for full functionality)")
                                        .put("id", generatedId);
        
                                    context.response()
                                        .setStatusCode(201)
                                        .putHeader("Content-Type", "application/json")
                                        .end(responseJson.encode());
                                } else {
                                    context.response()
                                        .setStatusCode(500)
                                        .putHeader("Content-Type", "application/json")
                                        .end(new JsonObject().put("error", basicRes.cause().getMessage()).encode());
                                }
                            }
                        );
                    }
                }
            );
        } catch (Exception e) {
            e.printStackTrace();
            context.response()
                .setStatusCode(500)
                .putHeader("Content-Type", "application/json")
                .end(new JsonObject().put("error", e.getMessage()).encode());
        }
    }
    
    public void updateEmployee(RoutingContext context) {
        String id = context.pathParam("id");
        JsonObject employee = context.body().asJsonObject();
    
        dbClient.updateWithParams(
            "UPDATE employees SET name = ?, email = ?, role = ?, job_type = ?, position = ? WHERE id = ?",
            new JsonArray()
                .add(employee.getString("name"))
                .add(employee.getString("email"))
                .add(employee.getString("role"))
                .add(employee.getString("job_type"))
                .add(employee.getString("position"))
                .add(id),
            res -> {
                if (res.succeeded()) {
                    JsonObject responseJson = new JsonObject()
                        .put("message", "Employee updated")
                        .put("id", id);
    
                    context.response()
                        .setStatusCode(200)
                        .putHeader("Content-Type", "application/json")
                        .end(responseJson.encode());
                } else {
                    context.response()
                        .setStatusCode(500)
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject().put("error", res.cause().getMessage()).encode());
                }
            }
        );
    }

    public void deleteEmployee(RoutingContext context) {
        String id = context.pathParam("id");
        dbClient.updateWithParams(
            "DELETE FROM employees WHERE id = ?",
            new JsonArray().add(id),
            res -> {
                if (res.succeeded()) {
                    context.response().end();
                } else {
                    context.fail(res.cause());
                }
            });
    }

    public void resendInvite(RoutingContext context) {
        String id = context.pathParam("id");
        String newInviteToken = UUID.randomUUID().toString().replace("-", "");
        
        dbClient.updateWithParams(
            "UPDATE employees SET invite_token = ?, invited_at = CURRENT_TIMESTAMP WHERE id = ?",
            new JsonArray().add(newInviteToken).add(id),
            res -> {
                if (res.succeeded()) {
                    JsonObject responseJson = new JsonObject()
                        .put("message", "Invite resent")
                        .put("invite_token", newInviteToken);
                    
                    context.response()
                        .setStatusCode(200)
                        .putHeader("Content-Type", "application/json")
                        .end(responseJson.encode());
                } else {
                    context.response()
                        .setStatusCode(500)
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject().put("error", res.cause().getMessage()).encode());
                }
            }
        );
    }
}
