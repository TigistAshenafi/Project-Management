package com.example.controller;
import io.vertx.core.json.Json;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.sql.SQLConnection;
import io.vertx.ext.web.RoutingContext;

public class TimeLogHandler {

    public static void createTimeLog(RoutingContext ctx) {
        JsonObject body = ctx.getBodyAsJson();

        String query = "INSERT INTO time_logs(user_id, task_id, date, hours, description) VALUES (?, ?, ?, ?, ?)";
        ctx.vertx().eventBus().<SQLConnection>request("db.connection", null, reply -> {
            if (reply.succeeded()) {
                SQLConnection conn = reply.result().body();
                conn.updateWithParams(query,
                    new JsonArray()
                        .add(body.getInteger("user_id"))
                        .add(body.getInteger("task_id"))
                        .add(body.getString("date"))
                        .add(body.getDouble("hours"))
                        .add(body.getString("description")),
                    res -> {
                        if (res.succeeded()) {
                            ctx.response().setStatusCode(201).end("Time entry created.");
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

    public static void getAll(RoutingContext ctx) {
        String query = "SELECT * FROM time_entries ORDER BY date DESC";
        ctx.vertx().eventBus().<SQLConnection>request("db.connection", null, reply -> {
            if (reply.succeeded()) {
                SQLConnection conn = reply.result().body();
                conn.query(query, res -> {
                    if (res.succeeded()) {
                        ctx.response().putHeader("Content-Type", "application/json")
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
}
