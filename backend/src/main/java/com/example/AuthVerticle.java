package com.example;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.auth.JWTOptions;
import io.vertx.ext.auth.jwt.JWTAuth;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.sql.ResultSet;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.CorsHandler;
import at.favre.lib.crypto.bcrypt.BCrypt;

public class AuthVerticle extends AbstractVerticle {
    // private final JDBCClient dbClient;
    private  JDBCClient dbClient;
    private JWTAuth jwtAuth;
    public AuthVerticle(JDBCClient dbClient, JWTAuth jwtAuth) {
        this.dbClient = dbClient;
        this.jwtAuth = jwtAuth;
    }

    @Override
    public void start(Promise<Void> startPromise) {
        Router router = Router.router(vertx);
        
        // CORS Configuration
                router.route().handler(CorsHandler.create()
                .addOrigin("*")
                .allowedMethod(HttpMethod.GET)
                .allowedMethod(HttpMethod.POST)
                .allowedMethod(HttpMethod.PUT)
                .allowedMethod(HttpMethod.DELETE)
                .allowedHeader("Content-Type")
                .allowedHeader("Authorization"));

        router.route().handler(BodyHandler.create());
        
        // Auth Endpoints
        router.post("/api/login").handler(this::handleLogin);
        router.post("/api/register").handler(this::handleRegister);
        router.post("/api/claim-invite").handler(this::handleClaimInvite);

        vertx.createHttpServer()
            .requestHandler(router)
            .listen(8080)
            .onSuccess(server -> startPromise.complete())
            .onFailure(startPromise::fail);
    }
    private void handleLogin(RoutingContext ctx) {
        JsonObject credentials = ctx.body().asJsonObject();
        String username = credentials.getString("username");
        String password = credentials.getString("password");

        // Use queryWithParams instead of preparedQuery
        dbClient.queryWithParams(
            "SELECT u.*, COALESCE(e.role, u.role) AS role FROM users u LEFT JOIN employees e ON e.user_id = u.id WHERE u.username = ?",
            new JsonArray().add(username),
            res -> {
                if (res.failed()) {
                    ctx.fail(res.cause());
                    return;
                }

                ResultSet result = res.result();
                if (result.getResults().isEmpty()) {
                    ctx.response().setStatusCode(401).end("Invalid credentials");
                    return;
                }

                JsonObject user = result.getRows().get(0);
                if (BCrypt.verifyer().verify(
                    password.toCharArray(),
                    user.getString("password")).verified) {
                    
                    String token = jwtAuth.generateToken(
                        new JsonObject()
                            .put("sub", user.getString("username"))
                            .put("role", user.getString("role")),
                        new JWTOptions().setExpiresInSeconds(3600));
                    
                    ctx.response()
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject().put("token", token).encode());
                } else {
                    ctx.response().setStatusCode(401).end("Invalid credentials");
                }
            });
    }

    private void handleRegister(RoutingContext ctx) {
        JsonObject user = ctx.body().asJsonObject();
        String hashedPassword = BCrypt.withDefaults().hashToString(12, 
            user.getString("password").toCharArray());

        // Use updateWithParams instead of preparedQuery
        dbClient.updateWithParams(
            "INSERT INTO users(username, password) VALUES (?, ?)",
            new JsonArray()
                .add(user.getString("username"))
                .add(hashedPassword),
            res -> {
                if (res.failed()) {
                    if (res.cause().getMessage().contains("Duplicate")) {
                        ctx.response().setStatusCode(409).end("Username exists");
                    } else {
                        ctx.fail(500);
                    }
                    return;
                }
                ctx.response().setStatusCode(201).end();
            });
    }

    private void handleClaimInvite(RoutingContext ctx) {
        JsonObject body = ctx.body().asJsonObject();
        String inviteToken = body.getString("invite_token");
        String username = body.getString("username");
        String password = body.getString("password");

        if (inviteToken == null || inviteToken.isBlank() || username == null || username.isBlank() || password == null || password.isBlank()) {
            ctx.response().setStatusCode(400).end("Invalid payload");
            return;
        }

        // 1) Find pending employee by invite token
        dbClient.queryWithParams(
            "SELECT id, role FROM employees WHERE invite_token = ? AND status = 'pending'",
            new JsonArray().add(inviteToken),
            empRes -> {
                if (empRes.failed() || empRes.result().getRows().isEmpty()) {
                    ctx.response().setStatusCode(400).end("Invalid or expired invite token");
                    return;
                }

                JsonObject emp = empRes.result().getRows().get(0);
                int employeeId = emp.getInteger("id");
                String employeeRole = emp.getString("role", "EMPLOYEE");

                // 2) Create user
                String hashed = at.favre.lib.crypto.bcrypt.BCrypt.withDefaults().hashToString(12, password.toCharArray());
                dbClient.updateWithParams(
                    "INSERT INTO users(username, password, role) VALUES (?, ?, ?)",
                    new JsonArray().add(username).add(hashed).add(employeeRole),
                    createUserRes -> {
                        if (createUserRes.failed()) {
                            String msg = createUserRes.cause() != null ? createUserRes.cause().getMessage() : "";
                            if (msg != null && msg.toLowerCase().contains("duplicate")) {
                                ctx.response().setStatusCode(409).end("Username already exists");
                            } else {
                                ctx.response().setStatusCode(500).end("Failed to create user account");
                            }
                            return;
                        }

                        // 3) Fetch new user id
                        dbClient.queryWithParams(
                            "SELECT id FROM users WHERE username = ?",
                            new JsonArray().add(username),
                            userIdRes -> {
                                if (userIdRes.failed() || userIdRes.result().getRows().isEmpty()) {
                                    ctx.response().setStatusCode(500).end("Failed to retrieve user ID");
                                    return;
                                }

                                int userId = userIdRes.result().getRows().get(0).getInteger("id");

                                // 4) Link employee and activate (atomic finalization)
                                dbClient.updateWithParams(
                                    "UPDATE employees SET user_id = ?, status = 'active', activated_at = CURRENT_TIMESTAMP, invite_token = NULL WHERE id = ?",
                                    new JsonArray().add(userId).add(employeeId),
                                    linkRes -> {
                                        if (linkRes.failed() || linkRes.result().getUpdated() == 0) {
                                            // Roll back user
                                            dbClient.updateWithParams("DELETE FROM users WHERE id = ?", new JsonArray().add(userId), delRes -> {
                                                ctx.response().setStatusCode(500).end("Failed to link employee account");
                                            });
                                        } else {
                                            ctx.response()
                                                .setStatusCode(201)
                                                .putHeader("Content-Type", "application/json")
                                                .end(new JsonObject().put("message", "Account created successfully").encode());
                                        }
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
}