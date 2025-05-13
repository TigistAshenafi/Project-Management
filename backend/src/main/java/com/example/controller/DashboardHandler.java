package com.example.controller;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.sql.SQLClient;
import io.vertx.ext.web.RoutingContext;

public class DashboardHandler {

    private final SQLClient client;

    public DashboardHandler(SQLClient client) {
        this.client = client;
    }

    public void handle(RoutingContext ctx) {
        JsonObject dashboardData = new JsonObject();

        CompositeFuture.all(
            getTotalProjects(),
            getProjectStatusCount(),
            getTotalEmployees(),
            getTaskStatusCount(),
            getTotalLoggedHours()
        ).onSuccess(res -> {
            dashboardData
                .put("totalProjects", res.resultAt(0))
                .put("projectStatus", res.resultAt(1))
                .put("totalEmployees", res.resultAt(2))
                .put("taskStatus", res.resultAt(3))
                .put("loggedHours", res.resultAt(4));

            ctx.response()
               .putHeader("Content-Type", "application/json")
               .end(dashboardData.encode());
        }).onFailure(err -> {
            ctx.response().setStatusCode(500).end(new JsonObject().put("error", err.getMessage()).encode());
        });
    }

    private Future<JsonObject> getTotalProjects() {
        Promise<JsonObject> promise = Promise.promise();
        client.query("SELECT COUNT(*) AS total FROM projects", res -> {
            if (res.succeeded()) {
                int total = res.result().getResults().get(0).getInteger(0);
                promise.complete(new JsonObject().put("total", total));
            } else {
                promise.fail(res.cause());
            }
        });
        return promise.future();
    }

    private Future<JsonObject> getProjectStatusCount() {
        Promise<JsonObject> promise = Promise.promise();
        client.query("SELECT status, COUNT(*) AS count FROM projects GROUP BY status", res -> {
            if (res.succeeded()) {
                JsonObject statusCounts = new JsonObject();
                for (JsonArray row : res.result().getResults()) {
                    statusCounts.put(row.getString(0), row.getInteger(1));
                }
                promise.complete(statusCounts);
            } else {
                promise.fail(res.cause());
            }
        });
        return promise.future();
    }

    private Future<JsonObject> getTotalEmployees() {
        Promise<JsonObject> promise = Promise.promise();
        client.query("SELECT COUNT(*) AS total FROM employees", res -> {
            if (res.succeeded()) {
                int total = res.result().getResults().get(0).getInteger(0);
                promise.complete(new JsonObject().put("total", total));
            } else {
                promise.fail(res.cause());
            }
        });
        return promise.future();
    }

    private Future<JsonObject> getTaskStatusCount() {
        Promise<JsonObject> promise = Promise.promise();
        client.query("SELECT status, COUNT(*) AS count FROM tasks GROUP BY status", res -> {
            if (res.succeeded()) {
                JsonObject taskStatus = new JsonObject();
                for (JsonArray row : res.result().getResults()) {
                    taskStatus.put(row.getString(0), row.getInteger(1));
                }
                promise.complete(taskStatus);
            } else {
                promise.fail(res.cause());
            }
        });
        return promise.future();
    }

    private Future<JsonObject> getTotalLoggedHours() {
        Promise<JsonObject> promise = Promise.promise();
        client.query("SELECT SUM(hours_logged) AS total_hours FROM time_logs", res -> {
            if (res.succeeded()) {
                Integer total = res.result().getResults().get(0).getInteger(0);
                promise.complete(new JsonObject().put("total_hours", total == null ? 0 : total));
            } else {
                promise.fail(res.cause());
            }
        });
        return promise.future();
    }
}
