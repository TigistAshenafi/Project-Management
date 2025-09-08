package com.example;

import com.example.config.AuthConfig;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.auth.jwt.JWTAuth;
import io.vertx.ext.auth.jwt.JWTAuthOptions;
import io.vertx.ext.jdbc.JDBCClient;

import java.util.Base64;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.vertx.core.json.jackson.DatabindCodec;

public class MainVerticle extends AbstractVerticle {

    public static void main(String[] args) {
        Vertx vertx = Vertx.vertx();
        vertx.deployVerticle(new MainVerticle());
    }

    @Override
    public void start(Promise<Void> startPromise) {
        ObjectMapper mapper = DatabindCodec.mapper();
        mapper.registerModule(new JavaTimeModule());

        ObjectMapper prettyMapper = DatabindCodec.prettyMapper();
        prettyMapper.registerModule(new JavaTimeModule());

        vertx.deployVerticle(new MySQLVerticle())
            .compose(id -> {
                JDBCClient dbClient = MySQLVerticle.getSharedDbClient();

                String encodedSecret = Base64.getUrlEncoder().withoutPadding().encodeToString(AuthConfig.JWT_SECRET.getBytes());

                JWTAuth jwtAuth = JWTAuth.create(vertx,
                    new JWTAuthOptions().addJwk(new JsonObject()
                        .put("kty", "oct")
                        .put("k", encodedSecret)
                        .put("alg", "HS256")
                    )
                );

                // ✅ Schedule daily deadline check
                vertx.setPeriodic(86400000, timerId -> {
                    checkProjectDeadlines(dbClient);
                });

                return CompositeFuture.all(
                    vertx.deployVerticle(new AuthVerticle(dbClient, jwtAuth)),
                    vertx.deployVerticle(new AllRoute(dbClient, jwtAuth))
                );
            })
            .onComplete(res -> startPromise.handle(res.mapEmpty()));
    }

    // ✅ Method to check deadlines and avoid duplicate notifications
    private void checkProjectDeadlines(JDBCClient dbClient) {
        String query = """
            SELECT p.id AS project_id, p.name AS project_name, p.deadline, up.user_id
            FROM projects p
            JOIN user_project up ON p.id = up.project_id
            WHERE DATE(p.deadline) = CURDATE() + INTERVAL 7 DAY
        """;

        dbClient.query(query, res -> {
            if (res.succeeded()) {
                for (JsonObject row : res.result().getRows()) {
                    int userId = row.getInteger("user_id");
                    String projectName = row.getString("project_name");
                    String message = "📅 Project '" + projectName + "' is due in 7 days!";

                    String checkQuery = """
                        SELECT COUNT(*) AS count
                        FROM notifications
                        WHERE user_id = ? AND message = ? AND DATE(created_at) = CURDATE()
                    """;

                    JsonArray checkParams = new JsonArray().add(userId).add(message);

                    dbClient.queryWithParams(checkQuery, checkParams, checkRes -> {
                        if (checkRes.succeeded()) {
                            int count = checkRes.result().getRows().get(0).getInteger("count");

                            if (count == 0) {
                                // No duplicate, insert new notification
                                String insert = "INSERT INTO notifications (user_id, message) VALUES (?, ?)";
                                JsonArray insertParams = new JsonArray().add(userId).add(message);

                                dbClient.updateWithParams(insert, insertParams, insertRes -> {
                                    if (insertRes.succeeded()) {
                                        System.out.println("✅ Notification added for user " + userId);
                                    } else {
                                        insertRes.cause().printStackTrace();
                                    }
                                });
                            } else {
                                System.out.println("⚠️ Skipped duplicate notification for user " + userId);
                            }
                        } else {
                            checkRes.cause().printStackTrace();
                        }
                    });
                }
            } else {
                res.cause().printStackTrace();
            }
        });
    }
}
