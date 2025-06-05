package com.example.controller;

import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.sql.SQLConnection;
import io.vertx.core.Future;
import io.vertx.core.Promise;

import java.util.List;

import io.vertx.core.CompositeFuture;
import io.vertx.ext.web.RoutingContext;

public class DashboardHandler {
  private final JDBCClient db;

  public DashboardHandler(JDBCClient db) {
    this.db = db;
  }

  public void getDashboardSummary(RoutingContext ctx) {
    Future<Integer> totalProjectsF = count("projects");
    Future<JsonObject> projectStatusF = groupCount("projects", "status");
    Future<Integer> totalEmployeesF = count("employees"); 
    Future<Integer> totalTasksF = count("tasks");
    Future<Integer> totalTimeLoggedF = sum("time_logs", "hours");

    Future<JsonObject> taskStatusF = groupCount("tasks", "status");
    Future<JsonObject> taskByYearF = countByYear("tasks", "created_at");
    Future<JsonObject> projectsByYearF = countByYear("projects", "created_at");
    Future<JsonObject> tasksPerProjectF = countTasksPerProjectByName();

    CompositeFuture.all(List.of(
      totalProjectsF, totalEmployeesF, totalTasksF, totalTimeLoggedF,
      taskStatusF, projectStatusF, taskByYearF, projectsByYearF, tasksPerProjectF
    )).onComplete(ar -> {
      if (ar.succeeded()) {
        JsonObject result = new JsonObject()
          .put("totalProjects", totalProjectsF.result())
          .put("totalEmployees", totalEmployeesF.result())
          .put("Tasks", totalTasksF.result())
          .put("totalTimeLogged", totalTimeLoggedF.result())
          .put("taskStatus", taskStatusF.result())     
          .put("projectStatus", projectStatusF.result())
          .put("taskByYear", taskByYearF.result())
          .put("projectsByYear", projectsByYearF.result())
          .put("tasksPerProject", tasksPerProjectF.result());

        ctx.response().putHeader("Content-Type", "application/json")
           .end(result.encodePrettily());
      } else {
        ctx.fail(ar.cause());
      }
    });
  }

  private Future<Integer> count(String table) {
    Promise<Integer> promise = Promise.promise();
    db.getConnection(ar -> {
      if (ar.failed()) {
        promise.fail(ar.cause());
        return;
      }
      SQLConnection conn = ar.result();
      conn.query("SELECT COUNT(*) as total FROM " + table, res -> {
        if (res.succeeded()) {
          int total = res.result().getRows().get(0).getInteger("total");
          promise.complete(total);
        } else {
          promise.fail(res.cause());
        }
        conn.close();
      });
    });
    return promise.future();
  }

  private Future<Integer> sum(String table, String column) {
    Promise<Integer> promise = Promise.promise();
    db.getConnection(ar -> {
      if (ar.failed()) {
        promise.fail(ar.cause());
        return;
      }
      SQLConnection conn = ar.result();
      conn.query("SELECT SUM(" + column + ") as total FROM " + table, res -> {
        if (res.succeeded()) {
          Integer sum = res.result().getRows().get(0).getInteger("total");
          promise.complete(sum == null ? 0 : sum);
        } else {
          promise.fail(res.cause());
        }
        conn.close();
      });
    });
    return promise.future();
  }

  private Future<JsonObject> groupCount(String table, String column) {
    Promise<JsonObject> promise = Promise.promise();
    db.getConnection(ar -> {
      if (ar.failed()) {
        promise.fail(ar.cause());
        return;
      }
      SQLConnection conn = ar.result();
      String sql = "SELECT " + column + ", COUNT(*) as total FROM " + table + " GROUP BY " + column;
      conn.query(sql, res -> {
        if (res.succeeded()) {
          JsonObject json = new JsonObject();
          res.result().getRows().forEach(row -> json.put(row.getString(column), row.getInteger("total")));
          promise.complete(json);
        } else {
          promise.fail(res.cause());
        }
        conn.close();
      });
    });
    return promise.future();
  }

  private Future<JsonObject> countByYear(String table, String dateColumn) {
    Promise<JsonObject> promise = Promise.promise();
    db.getConnection(ar -> {
      if (ar.failed()) {
        promise.fail(ar.cause());
        return;
      }
      SQLConnection conn = ar.result();
      String sql = "SELECT YEAR(" + dateColumn + ") as year, COUNT(*) as total FROM " + table + " GROUP BY YEAR(" + dateColumn + ")";
      conn.query(sql, res -> {
        if (res.succeeded()) {
          JsonObject json = new JsonObject();
          res.result().getRows().forEach(row -> json.put(row.getInteger("year").toString(), row.getInteger("total")));
          promise.complete(json);
        } else {
          promise.fail(res.cause());
        }
        conn.close();
      });
    });
    return promise.future();
  }

  private Future<JsonObject> countTasksPerProjectByName() {
    Promise<JsonObject> promise = Promise.promise();
    db.getConnection(ar -> {
      if (ar.failed()) {
        promise.fail(ar.cause());
        return;
      }

      SQLConnection conn = ar.result();
      String sql = "SELECT p.name AS project_name, COUNT(t.id) AS total " +
                   "FROM tasks t " +
                   "JOIN projects p ON t.project_id = p.id " +
                   "GROUP BY p.name";

      conn.query(sql, res -> {
        if (res.succeeded()) {
          JsonObject json = new JsonObject();
          res.result().getRows().forEach(row -> {
            json.put(row.getString("project_name"), row.getInteger("total"));
          });
          promise.complete(json);
        } else {
          promise.fail(res.cause());
        }
        conn.close();
      });
    });

    return promise.future();
  }
}
