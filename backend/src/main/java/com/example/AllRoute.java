package com.example;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonArray;
// import io.vertx.core.json.JsonObject;
import io.vertx.ext.auth.jwt.JWTAuth;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.CorsHandler;
import io.vertx.ext.web.handler.JWTAuthHandler;

import com.example.controller.*;

import java.util.Set;

public class AllRoute extends AbstractVerticle {

    private final EmployeeHandler employeeHandler;
    private final ProjectHandler projectHandler;
    private final TaskHandler taskHandler;
    private final TimeLogHandler timeLogHandler;
    private final DocumentHandler documentHandler;
    private final DashboardHandler dashboardHandler;
    private final JWTAuth jwtAuth;
    private JDBCClient dbClient;

    public AllRoute(JDBCClient dbClient, JWTAuth jwtAuth) {
        this.dbClient = dbClient;
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

        // CORS
        router.route().handler(CorsHandler.create("*")
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

        // Body handler for all routes
        router.route().handler(BodyHandler.create());

        // JWT middleware for protected routes
        router.route().handler(JWTAuthHandler.create(jwtAuth));
        router.route("/api/employees/*").handler(JWTAuthHandler.create(jwtAuth));
        router.route("/api/projects/*").handler(JWTAuthHandler.create(jwtAuth));

        // --- Employee Routes ---
        router.get("/api/employees").handler(employeeHandler::getAllEmployees);
        router.post("/api/employees").handler(employeeHandler::createEmployee);
        router.put("/api/employees/:id").handler(employeeHandler::updateEmployee);
        router.delete("/api/employees/:id").handler(employeeHandler::deleteEmployee);

        // --- Project Routes ---
        router.get("/api/projects").handler(projectHandler::getAllProjects);
        router.post("/api/projects").handler(projectHandler::createProject);
        router.put("/api/projects/:id").handler(projectHandler::updateProject);
        router.delete("/api/projects/:id").handler(projectHandler::deleteProject);

        // --- Task Routes ---
        router.get("/api/tasks").handler(taskHandler::getAllTask);
        router.post("/api/tasks").handler(taskHandler::createTask);
        router.put("/api/tasks/:id").handler(taskHandler::updateTask);
        router.delete("/api/tasks/:id").handler(taskHandler::deleteTask);

        // --- Time Log Routes ---
        router.post("/api/time-logs").handler(timeLogHandler::createTimeLog);
        router.get("/api/time-logs").handler(timeLogHandler::getAllLogs);
        router.put("/api/time-logs/:id").handler(timeLogHandler::updateTimeLog);
        router.delete("/api/time-logs/:id").handler(timeLogHandler::deleteTimeLog);
                // router.get("/api/time-logs/:task_id").handler(timeLogHandler::getByTaskId);
        router.get("/api/time-logs/remaining").handler(timeLogHandler::getRemainingTimeForToday);

        // --- Document Routes ---
        // Upload: with BodyHandler that supports file upload
        router.post("/api/documents/projects/:project_id")
                .handler(BodyHandler.create().setUploadsDirectory("uploads"))
                .handler(documentHandler::uploadDocument);

        router.get("/api/documents").handler(documentHandler::listDocuments);
        // router.get("/api/documents/projects/:project_id").handler(documentHandler::getDocumentsByProject);
        router.get("/api/documents/download/:id").handler(documentHandler::downloadDocument);
        router.delete("/api/documents/:id").handler(documentHandler::deleteDocument);

        // --- Admin Dashboard Report Route ---
router.get("/api/admin/dashboard/summary").handler(dashboardHandler::getDashboardSummary);

router.get("/api/notifications/:userId").handler(ctx -> {
    String userId = ctx.pathParam("userId"); // as String since it's UUID
    
    String query = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC";
    
    dbClient.queryWithParams(query, new JsonArray().add(userId), res -> {
        if (res.succeeded()) {
            ctx.response()
                .putHeader("Content-Type", "application/json")
                .end(new JsonArray(res.result().getRows()).encode());
        } else {
            ctx.fail(res.cause());
        }
    });
});

        // Start HTTP server
        vertx.createHttpServer()
                .requestHandler(router)
                .listen(8081)
                .onSuccess(server -> startPromise.complete())
                .onFailure(startPromise::fail);
    }
}

