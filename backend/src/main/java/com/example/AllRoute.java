package com.example;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.auth.jwt.JWTAuth;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.CorsHandler;
import io.vertx.ext.web.handler.JWTAuthHandler;
import io.vertx.ext.jdbc.JDBCClient;
import java.util.Set;

import com.example.controller.EmployeeHandler;
import com.example.controller.ProjectHandler;
import com.example.controller.TaskHandler;
import com.example.controller.TimeLogHandler;

public class AllRoute extends AbstractVerticle {
    private final EmployeeHandler employeeHandler;
    private final ProjectHandler projectHandler;
    private final TaskHandler taskHandler;
    private final TimeLogHandler timeLogHandler;
    private final JWTAuth jwtAuth;

    public AllRoute(JDBCClient dbClient, JWTAuth jwtAuth) {
        this.employeeHandler = new EmployeeHandler(dbClient);
        this.projectHandler = new ProjectHandler(dbClient);
        this.taskHandler = new TaskHandler(dbClient);
        this.timeLogHandler = new TimeLogHandler();
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
        router.post("/api/time-log").handler(TimeLogHandler::createTimeLog);
        router.get("/api/time-log").handler(TimeLogHandler::getAll);
        
        vertx.createHttpServer()
            .requestHandler(router)
            .listen(8081)
            .onSuccess(server -> startPromise.complete())
            .onFailure(startPromise::fail);
    }
}