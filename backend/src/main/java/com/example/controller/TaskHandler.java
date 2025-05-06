package com.example.controller;

import java.time.LocalDateTime;
import java.util.List;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.web.RoutingContext;

public class TaskHandler {
    private final JDBCClient dbClient;

    public TaskHandler(JDBCClient dbClient) {
        this.dbClient = dbClient;
    }

    public void getAllTask(RoutingContext context) {
        dbClient.query("SELECT * FROM tasks", res -> {
            if (res.succeeded()) {
                List<JsonObject> rows = res.result().getRows();

                // Convert LocalDateTime fields to string if any
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

    public void createTask(RoutingContext context) {
        JsonObject body = context.body().asJsonObject();
    
        if (body == null) {
            context.response().setStatusCode(400).end("Invalid JSON");
            return;
        }
    
        String title = body.getString("title");
        String description = body.getString("description");
        String status = body.getString("status");
        Integer projectId = body.getInteger("projectId");
        Integer employeeId = body.getInteger("employeeId");
        String dueDate = body.getString("dueDate");
    
        String query = "INSERT INTO tasks (title, description, status, project_id, assigned_to, dueDate) VALUES (?, ?, ?, ?, ?, ?)";
        JsonArray params = new JsonArray().add(title).add(description).add(status).add(projectId).add(employeeId).add(dueDate);
    
        dbClient.updateWithParams(query, params, res -> {
            if (res.succeeded()) {
                context.response()
                       .setStatusCode(201)
                       .putHeader("Content-Type", "application/json")
                       .end(new JsonObject().put("message", "Task created successfully").encode());
            } else {
                context.fail(res.cause());
            }
        });
    }
    
    
    public void updateTask(RoutingContext context) {
        String id = context.pathParam("id");
        JsonObject task = context.body().asJsonObject();

        dbClient.updateWithParams(
            "UPDATE tasks SET title = ?, description = ?, status = ?, project_id = ?, assigned_to = ?, dueDate = ? WHERE id = ?",
            new JsonArray()
                .add(task.getString("title"))
                .add(task.getString("description"))
                .add(task.getString("status"))
                .add(task.getInteger("projectId"))
                .add(task.getInteger("employeeId"))
                .add(task.getString("dueDate"))
                .add(id),
            res -> {
                if (res.succeeded()) {
                    context.response().end("Task updated");
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
