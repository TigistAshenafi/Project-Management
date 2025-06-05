package com.example.controller;

import java.time.LocalDateTime;
import java.util.List;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.web.RoutingContext;

public class ProjectHandler {
    private final JDBCClient dbClient;

    public ProjectHandler(JDBCClient dbClient) {
        this.dbClient = dbClient;
    }

    private void executeQuery(String query, JsonArray params, RoutingContext context, String successMessage) {
        dbClient.updateWithParams(query, params, res -> {
            if (res.succeeded()) {
                JsonObject json = new JsonObject().put("message", successMessage);
                context.response()
                    .setStatusCode(201)
                    .putHeader("Content-Type", "application/json")
                    .end(json.encode());
            } else {
                JsonObject errorJson = new JsonObject().put("error", res.cause().getMessage());
                context.response()
                    .setStatusCode(500)
                    .putHeader("Content-Type", "application/json")
                    .end(errorJson.encode());
            }
        });
    }

    public void getAllProjects(RoutingContext context) {
        dbClient.query("SELECT * FROM projects", res -> {
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

    public void createProject(RoutingContext context) {
        try {
            JsonObject project = context.body().asJsonObject();
            System.out.println("Received project: " + project.encodePrettily());

            String name = project.getString("name");
            String description = project.getString("description");
            String status = project.getString("status", "not started"); // Default to 'not started'

            dbClient.updateWithParams(
                "INSERT INTO projects(name, description, status) VALUES (?, ?, ?)",
                new JsonArray()
                    .add(name)
                    .add(description)
                    .add(status),
                res -> {
                    if (res.succeeded()) {
                        long generatedId = res.result().getKeys().getLong(0); // Get auto-generated ID
                        JsonObject responseJson = new JsonObject()
                            .put("message", "Project added")
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

    public void updateProject(RoutingContext context) {
        String id = context.pathParam("id");
        JsonObject project = context.body().asJsonObject();

        dbClient.updateWithParams(
            "UPDATE projects SET name = ?, description = ?, status = ? WHERE id = ?",
            new JsonArray()
                .add(project.getString("name"))
                .add(project.getString("description"))
                .add(project.getString("status"))
                .add(id),
            res -> {
                if (res.succeeded()) {
                    JsonObject responseJson = new JsonObject()
                        .put("message", "Project updated")
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

    public void deleteProject(RoutingContext context) {
        String id = context.pathParam("id");
        dbClient.updateWithParams(
            "DELETE FROM projects WHERE id = ?",
            new JsonArray().add(id),
            res -> {
                if (res.succeeded()) {
                    context.response()
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject().put("message", "Project deleted").encode());
                } else {
                    context.response().setStatusCode(500).end(res.cause().getMessage());
                }
            });
    }
}
