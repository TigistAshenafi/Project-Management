package com.example.controller;

import io.vertx.core.json.Json;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.sql.SQLConnection;
import io.vertx.ext.web.RoutingContext;

public class TimeLogHandler {
    private final JDBCClient dbClient;

    public TimeLogHandler(JDBCClient dbClient) {
        this.dbClient = dbClient;
    }

    public void createTimeLog(RoutingContext ctx) {
        JsonObject body = ctx.getBodyAsJson();
        String query = "INSERT INTO time_logs(user_id, task_id, date, hours, description) VALUES (?, ?, ?, ?, ?)";

        dbClient.getConnection(ar -> {
            if (ar.succeeded()) {
                SQLConnection conn = ar.result();
                conn.updateWithParams(query,
                        new JsonArray()
                                .add(Integer.parseInt(body.getString("user_id")))
                                .add(Integer.parseInt(body.getString("task_id")))
                                .add(body.getString("date"))
                                .add(body.getDouble("hours"))
                                .add(body.getString("description")),
                        res -> {
                            if (res.succeeded()) {
                                ctx.response()
                                        .putHeader("Content-Type", "application/json")
                                        .setStatusCode(201)
                                        .end(new JsonObject().put("message", "Time log created.").encode());
                            } else {
                                ctx.response()
                                        .setStatusCode(500)
                                        .putHeader("Content-Type", "application/json")
                                        .end(new JsonObject().put("error", "Internal server error").encode());

                            }
                            conn.close();
                        });
            } else {
                ctx.response()
                        .setStatusCode(500)
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject().put("error", "Internal server error").encode());

            }
        });
    }

    // public void getByTaskId(RoutingContext ctx) {
    //     String taskId = ctx.pathParam("taskId");
    //     String query = "SELECT * FROM time_logs WHERE task_id = ? ORDER BY date DESC";

    //     dbClient.getConnection(ar -> {
    //         if (ar.succeeded()) {
    //             SQLConnection conn = ar.result();
    //             conn.queryWithParams(query, new JsonArray().add(Integer.parseInt(taskId)), res -> {
    //                 if (res.succeeded()) {
    //                     ctx.response()
    //                             .putHeader("Content-Type", "application/json")
    //                             .end(Json.encodePrettily(res.result().getRows()));
    //                 } else {
    //                     ctx.fail(500, res.cause());
    //                 }
    //                 conn.close();
    //             });
    //         } else {
    //             ctx.response()
//    .setStatusCode(500)
//    .putHeader("Content-Type", "application/json")
//    .end(new JsonObject().put("error", "Internal server error").encode());

    //         }
    //     });
    // }

    public void getAllTasks(RoutingContext ctx) {
        dbClient.query("SELECT * FROM tasks", res -> {
            if (res.succeeded()) {
                ctx.response()
                        .putHeader("Content-Type", "application/json")
                        .end(Json.encodePrettily(res.result().getRows()));
            } else {
                ctx.response()
                   .setStatusCode(500)
                   .putHeader("Content-Type", "application/json")
                   .end(new JsonObject().put("error", "Internal server error").encode());

            }
        });
    }

    public void getAllLogs(RoutingContext ctx) {
        dbClient.query("SELECT * FROM time_logs", res -> {
            if (res.succeeded()) {
                JsonArray result = new JsonArray();
                res.result().getRows().forEach(result::add);
                
                ctx.response()
                    .putHeader("Content-Type", "application/json")
                    .end(result.encode());
            } else {
                ctx.response()
                    .setStatusCode(500)
                    .end("Failed to fetch time logs");
            }
        });
    }

    public void getRemainingTimeForToday(RoutingContext ctx) {
        String userId = ctx.request().getParam("user_id");
        String taskId = ctx.request().getParam("task_id");
        String today = java.time.LocalDate.now().toString();
        if (userId == null || taskId == null) {
            ctx.response()
                .setStatusCode(400)
                .putHeader("Content-Type", "application/json")
                .end(new JsonObject().put("error", "Missing user_id or task_id").encode());
            return;
        }
        String query = "SELECT SUM(hours) as total_hours FROM time_logs WHERE user_id = ? AND task_id = ? AND date = ?";
        dbClient.getConnection(ar -> {
            if (ar.succeeded()) {
                SQLConnection conn = ar.result();
                conn.queryWithParams(query, new JsonArray().add(Integer.parseInt(userId)).add(Integer.parseInt(taskId)).add(today), res -> {
                    if (res.succeeded()) {
                        double totalLogged = 0.0;
                        if (!res.result().getRows().isEmpty() && res.result().getRows().get(0).getValue("total_hours") != null) {
                            totalLogged = ((Number)res.result().getRows().get(0).getValue("total_hours")).doubleValue();
                        }
                        double remaining = 8.0 - totalLogged;
                        if (remaining < 0) remaining = 0;
                        ctx.response()
                            .putHeader("Content-Type", "application/json")
                            .end(new JsonObject().put("remaining_hours", remaining).encode());
                    } else {
                        ctx.response()
                            .setStatusCode(500)
                            .putHeader("Content-Type", "application/json")
                            .end(new JsonObject().put("error", "Internal server error").encode());
                    }
                    conn.close();
                });
            } else {
                ctx.response()
                    .setStatusCode(500)
                    .putHeader("Content-Type", "application/json")
                    .end(new JsonObject().put("error", "Internal server error").encode());
            }
        });
    }


    public void updateTimeLog(RoutingContext ctx) {
            String id = ctx.pathParam("id");
        JsonObject body = ctx.body().asJsonObject();

        dbClient.getConnection(ar -> {
            if (ar.succeeded()) {
                SQLConnection conn = ar.result();
                conn.updateWithParams(
                    "UPDATE time_logs SET user_id = ?, task_id = ?, date = ?, hours = ?, description = ? WHERE id = ?",
                    new JsonArray()
                        .add(body.getInteger("user_id"))
                        .add(body.getInteger("task_id"))
                        .add(body.getString("date"))
                        .add(body.getDouble("hours"))
                        .add(body.getString("description"))
                        .add(Integer.parseInt(id)),
                    res -> {
                        if (res.succeeded()) {
                            if (res.result().getUpdated() == 0) {
                                ctx.response()
                                    .setStatusCode(404)
                                    .end("Time log not found");
                            } else {
                                JsonObject responseJson = new JsonObject()
                                    .put("message", "Time log updated")
                                    .put("id", id);
                                ctx.response()
                                    .setStatusCode(200)
                                    .putHeader("Content-Type", "application/json")
                                    .end(responseJson.encode());
                            }
                        } else {
                            System.err.println("Update failed: " + res.cause().getMessage());
                            res.cause().printStackTrace();
                            ctx.response()
                                .setStatusCode(500)
                                .end("Failed to update time log");
                        }
                        conn.close();
                    }
                );
            } else {
                ctx.response()
                    .setStatusCode(500)
                    .end("Failed to get database connection");
            }
        });
    }
    public void deleteTimeLog(RoutingContext ctx) {
        String id = ctx.pathParam("id");
        String query = "DELETE FROM time_logs WHERE id = ?";

        dbClient.getConnection(ar -> {
            if (ar.succeeded()) {
                SQLConnection conn = ar.result();

                conn.updateWithParams(query,
                        new JsonArray().add(Integer.parseInt(id)),
                        res -> {
                            if (res.succeeded()) {
                                if (res.result().getUpdated() > 0) {
                                    ctx.response()
                                            .putHeader("Content-Type", "application/json")
                                            .end(new JsonObject().put("message", "Time log deleted.").encode());
                                } else {
                                    ctx.response()
                                            .setStatusCode(404)
                                            .end(new JsonObject().put("error", "Time log not found").encode());
                                }
                            } else {
                                ctx.response()
                                .setStatusCode(500)
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject().put("error", "Internal server error").encode());

                            }
                            conn.close();
                        });
            } else {
               ctx.response()
                   .setStatusCode(500)
                   .end("Internal server error");
            }
        });
    }
}
