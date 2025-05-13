package com.example;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.auth.jwt.JWTAuth;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.CorsHandler;
import io.vertx.ext.web.handler.JWTAuthHandler;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.sql.SQLClient;

import java.util.Set;
import com.example.controller.*;

public class AllRoute extends AbstractVerticle {
    private static io.vertx.ext.sql.SQLClient sqlClient;
    private static final SQLClient SQLClient = sqlClient;
    private final EmployeeHandler employeeHandler;
    private final ProjectHandler projectHandler;
    private final TaskHandler taskHandler;
    private final TimeLogHandler timeLogHandler;
    private final DocumentHandler documentHandler;
    private final DashboardHandler dashboardHandler;
    private final JWTAuth jwtAuth;

    public AllRoute(JDBCClient dbClient, JWTAuth jwtAuth) {
        this.employeeHandler = new EmployeeHandler(dbClient);
        this.projectHandler = new ProjectHandler(dbClient);
        this.taskHandler = new TaskHandler(dbClient);
        this.timeLogHandler = new TimeLogHandler(dbClient);
        this.documentHandler = new DocumentHandler(dbClient);
        this.dashboardHandler = new DashboardHandler(dbClient);
        this.jwtAuth = jwtAuth;
    }

    @Override
    public void start(Promise<Void> startPromise) {
        Router router = Router.router(vertx);

router.route().handler(CorsHandler.create()
    .addOrigin("*")
    .allowedMethods(Set.of(HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.DELETE, HttpMethod.OPTIONS))
    .allowedHeaders(Set.of("Content-Type", "Authorization"))
    .exposedHeaders(Set.of("Authorization"))
    .allowCredentials(true));

router.options().handler(ctx -> {
ctx.response()
   .putHeader("Access-Control-Allow-Origin", "*")
   .putHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
   .putHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
   .setStatusCode(204)
   .end();
});
   router.route().handler(BodyHandler.create());
        
        // JWT Middleware
        router.route().handler(JWTAuthHandler.create(jwtAuth));

        // Employee Routes
        router.get("/api/employees").handler(employeeHandler::getAllEmployees);
        router.post("/api/employees").handler(employeeHandler::createEmployee);
        router.put("/api/employees/:id").handler(employeeHandler::updateEmployee);
        router.delete("/api/employees/:id").handler(employeeHandler::deleteEmployee);

        // Project Routes
        router.get("/api/projects").handler(projectHandler::getAllProjects);
        router.post("/api/projects").handler(projectHandler::createProject);
        router.put("/api/projects/:id").handler(projectHandler::updateProject);
        router.delete("/api/projects/:id").handler(projectHandler::deleteProject);

        // Task Routes
        router.get("/api/tasks").handler(taskHandler::getAllTask);
        router.post("/api/tasks").handler(taskHandler::createTask);
        router.put("/api/tasks/:id").handler(taskHandler::updateTask);
        router.delete("/api/tasks/:id").handler(taskHandler::deleteTask);

        // Time-Log Routes
       router.post("/api/time-logs").handler(timeLogHandler::createTimeLog);
       router.get("/api/time-logs").handler(timeLogHandler::getAllTasks);
       router.get("/api/time-logs/:task_id").handler(timeLogHandler::getByTaskId);
       router.get("/api/time-logs").handler(timeLogHandler::getAllLogs);
       router.route().handler(JWTAuthHandler.create(jwtAuth));

    //    Document Routes
       router.post("/api/projects/:projectId/documents").handler(BodyHandler.create().setUploadsDirectory("uploads"));
router.post("/api/projects/:projectId/documents").handler(documentHandler::uploadDocument);
router.get("/api/projects/:projectId/documents").handler(documentHandler::listDocuments);
router.get("/api/documents/:id").handler(documentHandler::downloadDocument);
router.delete("/api/documents/:id").handler(documentHandler::deleteDocument);

// 
router.get("/api/admin/dashboard")
      .handler(JWTAuthHandler.create(jwtAuth))
      .handler(ctx -> {
          JsonObject user = ctx.user().principal();
          if (!"admin".equals(user.getString("role"))) {
              ctx.response().setStatusCode(403).end("Forbidden");
              return;
          }
          new DashboardHandler(SQLClient).handle(ctx);
      });

 
        vertx.createHttpServer()
            .requestHandler(router)
            .listen(8081)
            .onSuccess(server -> startPromise.complete())
            .onFailure(startPromise::fail);
    }
}