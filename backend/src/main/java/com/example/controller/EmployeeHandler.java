package com.example.controller;

import java.time.LocalDateTime;
import java.util.List;

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
        dbClient.query("SELECT * FROM employees", res -> {
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
                context.response().setStatusCode(500).end(res.cause().getMessage());
            }
        });
    }

    public void createEmployee(RoutingContext context) {
        try {
            JsonObject employee = context.body().asJsonObject();
            System.out.println("Received employee: " + employee.encodePrettily());
    
            dbClient.updateWithParams(
                "INSERT INTO employees(name, position, job_type) VALUES (?, ?, ?)",
                new JsonArray()
                    .add(employee.getString("name"))
                    .add(employee.getString("position"))
                    .add(employee.getString("job_type")),
                res -> {
                    if (res.succeeded()) {
                        long generatedId = res.result().getKeys().getLong(0); // Get auto-generated ID
                        JsonObject responseJson = new JsonObject()
                            .put("message", "employee added")
                            .put("id", generatedId);
    
                        context.response()
                            .setStatusCode(201)
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
            "UPDATE employees SET name = ?, position = ?, job_type = ? WHERE id = ?",
            new JsonArray()
                .add(employee.getString("name"))
                .add(employee.getString("position"))
                .add(employee.getString("job_type"))
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
}
