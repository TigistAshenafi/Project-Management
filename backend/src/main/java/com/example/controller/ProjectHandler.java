package com.example.controller;

import java.time.LocalDateTime;
import java.util.List;


import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.web.RoutingContext;
public class ProjectHandler {
    private final JDBCClient dbClient;

    public ProjectHandler(JDBCClient dbClient) {
        this.dbClient = dbClient;
        // ObjectMapper objectMapper = new ObjectMapper();
        // objectMapper.registerModule(new JavaTimeModule());
        // JsonObject.setMapper(objectMapper);
    }
    private void executeQuery(String query, JsonArray params, RoutingContext context, String successMessage) {
        dbClient.updateWithParams(query, params, res -> {
          if (res.succeeded()) {
            context.response().end(successMessage);
          } else {
            context.response().setStatusCode(500).end(res.cause().getMessage());
          }
        });
      }
  public void getAllProjects(RoutingContext context) {
    System.out.println("-------------------------->");
    dbClient.query("SELECT * FROM projects", res -> {
        if (res.succeeded()) {
            List<JsonObject> rows = res.result().getRows();
    System.out.println("-------------------------->");
            
            // Convert LocalDateTime fields to string
            List<JsonObject> processedRows = rows.stream().map(row -> {
                JsonObject json = new JsonObject();
                row.forEach(entry -> {
                    if (entry.getValue() instanceof LocalDateTime) {
                        // Convert LocalDateTime to String
                        json.put(entry.getKey(), entry.getValue().toString());
                    } else {
                        json.put(entry.getKey(), entry.getValue());
                    }
                });
                return json;
            }).toList();

            JsonArray jsonArray = new JsonArray(processedRows);  
    System.out.println("-------------------------->"+jsonArray);

            context.response()
                .putHeader("Content-Type", "application/json")
                .end(jsonArray.encodePrettily());
        } else {
            context.response().setStatusCode(500).end(res.cause().getMessage());
        }
    });
}


    public void createProject(RoutingContext context) {
        
            System.out.println("....................."+context.body().asJsonObject());
            try{
                JsonObject project = context.body().asJsonObject();
                // String id=   
                 executeQuery(
                        "INSERT INTO projects(name, description) VALUES (?, ?)",
                        new JsonArray()
                            .add(project.getString("name"))
                            .add(project.getString("description")),
                            context, "project added");
                
            //     JsonObject body = context.getBodyAsJson();
            // executeQuery("INSERT INTO employees(name, position, salary) VALUES (?, ?, ?)",
            //              new JsonArray()
            //              .add(body.getString("name"))
            //              .add(body.getDouble("price")),
            //              context, "Product added");
            // return context.response().setStatusCode(201).end();
            }catch(Exception e){
                // context.fail(e.getMessage());
            }
          
    }

    public void updateProject(RoutingContext context){
        // return ctx -> {
            String id = context.pathParam("id");
            JsonObject project = context.body().asJsonObject();
            dbClient.updateWithParams(
                "UPDATE projects SET name = ?, description = ? WHERE id = ?",
                new JsonArray()
                    .add(project.getString("name"))
                    .add(project.getString("description"))
                    .add(id),
                res -> {
                    if (res.succeeded()) {
                        context.response().end();
                    } else {
                        context.fail(res.cause());
                    }
                });
        // };
    }

    public void deleteProject(RoutingContext context) {
        // return ctx -> {
            String id = context.pathParam("id");
            dbClient.updateWithParams(
                "DELETE FROM projects WHERE id = ?",
                new JsonArray().add(id),
                res -> {
                    if (res.succeeded()) {
                        context.response().end();
                    } else {
                        context.fail(res.cause());
                    }
                });
        // };
    }
}