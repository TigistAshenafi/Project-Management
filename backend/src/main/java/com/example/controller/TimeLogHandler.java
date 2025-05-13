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
                                ctx.fail(500, res.cause());
                            }
                            conn.close();
                        });
            } else {
                ctx.fail(500);
            }
        });
    }

    public void getByTaskId(RoutingContext ctx) {
        String taskId = ctx.pathParam("taskId");
        String query = "SELECT * FROM time_logs WHERE task_id = ? ORDER BY date DESC";

        dbClient.getConnection(ar -> {
            if (ar.succeeded()) {
                SQLConnection conn = ar.result();
                conn.queryWithParams(query, new JsonArray().add(Integer.parseInt(taskId)), res -> {
                    if (res.succeeded()) {
                        ctx.response()
                                .putHeader("Content-Type", "application/json")
                                .end(Json.encodePrettily(res.result().getRows()));
                    } else {
                        ctx.fail(500, res.cause());
                    }
                    conn.close();
                });
            } else {
                ctx.fail(500);
            }
        });
    }

    public void getAllTasks(RoutingContext ctx) {
        dbClient.query("SELECT * FROM tasks", res -> {
            if (res.succeeded()) {
                ctx.response()
                        .putHeader("Content-Type", "application/json")
                        .end(Json.encodePrettily(res.result().getRows()));
            } else {
                ctx.fail(500);
            }
        });
    }

    public void getAllLogs(RoutingContext ctx) {
    dbClient.query("SELECT * FROM time_logs", res -> {
        if (res.succeeded()) {
            JsonArray result = new JsonArray();
            res.result().getRows().forEach(result::add); // No need for toJson()
            
            ctx.response()
                .putHeader("Content-Type", "application/json")
                .end(result.encode()); // .encode() converts JsonArray to JSON string
        } else {
            ctx.response()
                .setStatusCode(500)
                .end("Failed to fetch time logs");
        }
    });
}
}
