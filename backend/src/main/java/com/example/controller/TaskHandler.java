package com.example.controller;

import java.time.LocalDateTime;
import java.util.List;


import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.web.RoutingContext;
public class TaskHandler {
    private final JDBCClient dbClient;

    public TaskHandler(JDBCClient dbClient) {
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
  public void getAllTask(RoutingContext context) {
    System.out.println("------------------------>");
    dbClient.query("SELECT * FROM tasks", res -> {
        if (res.succeeded()) {
            List<JsonObject> rows = res.result().getRows();
    System.out.println("------------------------>");
            
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


    public void createTask(RoutingContext context) {
        
            System.out.println("....................."+context.body().asJsonObject());
            try{
                JsonObject task = context.body().asJsonObject();
                 executeQuery(
                        "INSERT INTO tasks(name, description) VALUES (?, ?)",
                        new JsonArray()
                            .add(task.getString("name"))
                            .add(task.getString("description")),
                            context, "task added");
                
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

    public void updateTask(RoutingContext context){
        // return ctx -> {
            String id = context.pathParam("id");
            JsonObject task = context.body().asJsonObject();
            dbClient.updateWithParams(
                "UPDATE tasks SET name = ?, description = ? WHERE id = ?",
                new JsonArray()
                    .add(task.getString("name"))
                    .add(task.getString("description"))
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

    public void deleteTask(RoutingContext context) {
        // return ctx -> {
            String id = context.pathParam("id");
            dbClient.updateWithParams(
                "DELETE FROM tasks WHERE id = ?",
                new JsonArray().add(id),
                res -> {
                    if (res.succeeded()) {
                        context.response().setStatusCode(204).end();
                    } else {
                        context.fail(res.cause());
                    }
                });
        // };
    }
}