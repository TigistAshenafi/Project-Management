package com.example;
import com.example.config.AuthConfig;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.auth.jwt.JWTAuth;
import io.vertx.ext.auth.jwt.JWTAuthOptions;
import io.vertx.ext.jdbc.JDBCClient;
import java.util.Base64;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.vertx.core.json.jackson.DatabindCodec;
public class MainVerticle extends AbstractVerticle {
    // private JDBCClient dbClient; // Store the shared dbClient

    public static void main(String[] args) {
                // DatabindCodec.mapper().registerModule(new JavaTimeModule());
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
                // JWTAuth jwtAuth = JWTAuth.create(vertx, 
                //     new JWTAuthOptions().setAlgorithm("HS256").setSecret(AuthConfig.JWT_SECRET)
                // );
                String encodedSecret = Base64.getUrlEncoder().withoutPadding().encodeToString(AuthConfig.JWT_SECRET.getBytes());

                JWTAuth jwtAuth = JWTAuth.create(vertx, 
                    new JWTAuthOptions().addJwk(new JsonObject()
                        .put("kty", "oct")
                        .put("k", encodedSecret) // Properly encoded secret key
                        .put("alg", "HS256") // Algorithm
                    )
                );
                return CompositeFuture.all(
                    vertx.deployVerticle(new AuthVerticle(dbClient, jwtAuth)),
                    vertx.deployVerticle(new AllRoute(dbClient, jwtAuth))
                );
            })
            .onComplete(res -> startPromise.handle(res.mapEmpty()));
    }
}