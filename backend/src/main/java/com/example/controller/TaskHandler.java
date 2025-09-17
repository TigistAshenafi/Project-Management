package com.example.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.web.RoutingContext;
import com.example.util.EmailUtil;
// import java.time.*;
import java.sql.Timestamp;

public class TaskHandler {
    private final JDBCClient dbClient;

    public TaskHandler(JDBCClient dbClient) {
        this.dbClient = dbClient;
    }
public void getAllTask(RoutingContext context) {
    dbClient.query("SELECT * FROM tasks", res -> {
        if (res.succeeded()) {
            List<JsonObject> rows = res.result().getRows();
            List<JsonObject> processedRows = rows.stream().map(row -> {
                JsonObject json = new JsonObject();
                row.forEach(entry -> {
                    Object value = entry.getValue();
                    if (value instanceof LocalDateTime) {
                        json.put(entry.getKey(), value.toString());
                    } else if (value instanceof LocalDate) {
                        json.put(entry.getKey(), value.toString());
                    } else if (value instanceof LocalTime) {
                        json.put(entry.getKey(), value.toString());
                    } else if (value instanceof OffsetDateTime) {
                        json.put(entry.getKey(), value.toString());
                    } else if (value instanceof ZonedDateTime) {
                        json.put(entry.getKey(), value.toString());
                    } else if (value instanceof Timestamp) {
                        json.put(entry.getKey(), ((Timestamp) value).toLocalDateTime().toString());
                    } else {
                        json.put(entry.getKey(), value);
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
    public void createTask(RoutingContext context) {
        JsonObject body = context.body().asJsonObject();
    
        if (body == null) {
            context.response().setStatusCode(400).end("Invalid JSON");
            return;
        }
    
        String title = body.getString("title");
        String description = body.getString("description");
        String status = body.getString("status");
        Integer project_id = body.getInteger("project_id");
        Integer employee_id = body.getInteger("assigned_to");
        String due_date = body.getString("due_date");

    
        String query ="INSERT INTO tasks (title, description, status, project_id, assigned_to, due_date) VALUES (?, ?, ?, ?, ?, ?)";
        JsonArray params = new JsonArray().add(title).add(description).add(status).add(project_id).add(employee_id).add(due_date);
    
        dbClient.updateWithParams(query, params, res -> {
            if (res.succeeded()) {
                long generatedId = res.result().getKeys().getLong(0); // Get auto-generated ID
                        JsonObject responseJson = new JsonObject()
                            .put("message", "Task added")
                            .put("id", generatedId);
    
                        // Send email to assigned employee if available
                        if (employee_id != null) {
                            // Look up employee email and project name
                            dbClient.queryWithParams(
                                "SELECT e.email AS email, p.name AS project_name FROM employees e LEFT JOIN projects p ON p.id = ? WHERE e.id = ?",
                                new JsonArray().add(project_id).add(employee_id),
                                infoRes -> {
                                    if (infoRes.succeeded() && !infoRes.result().getRows().isEmpty()) {
                                        JsonObject row = infoRes.result().getRows().get(0);
                                        String email = row.getString("email");
                                        String projectName = row.getString("project_name");
                                        if (email != null && !email.isBlank()) {
                                            EmailUtil.sendTaskAssignmentEmail(email, title, projectName, due_date);
                                        }
                                    }
                                }
                            );
                        }

                        context.response()
                            .setStatusCode(201)
                            .putHeader("Content-Type", "application/json")
                            .end(responseJson.encode());
            } else {
                Throwable cause = res.cause();
                cause.printStackTrace();  // ← This will print the stack trace in your terminal
                context.response().setStatusCode(500).end("Database error: " + cause.getMessage());
            }
        });
    }
    
    public void updateTask(RoutingContext context) {
        String id = context.pathParam("id");
        JsonObject task = context.body().asJsonObject();

        dbClient.updateWithParams(
            "UPDATE tasks SET title = ?, description = ?, status = ?, project_id = ?, assigned_to = ?, due_date = ? WHERE id = ?",
            new JsonArray()
                .add(task.getString("title"))
                .add(task.getString("description"))
                .add(task.getString("status"))
                .add(Integer.parseInt(task.getString("project_id")))
                .add(Integer.parseInt(task.getString("assigned_to")))
                .add(task.getString("due_date"))
                .add(id),
            res -> {
                if (res.succeeded()) {
                    JsonObject responseJson = new JsonObject()
                    .put("message", "Task updated")
                    .put("id", id);
                    context.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json")
                    .end(responseJson.encode());
                } else {
                    context.fail(res.cause());
                }
            }
        );
    }

    public void deleteTask(RoutingContext context) {
        String id = context.pathParam("id");
        dbClient.updateWithParams(
            "DELETE FROM tasks WHERE id = ?",
            new JsonArray().add(id),
            res -> {
                if (res.succeeded()) {
                    context.response().setStatusCode(204).end();
                } else {
                    context.fail(res.cause());
                }
            }
        );
    }
}
