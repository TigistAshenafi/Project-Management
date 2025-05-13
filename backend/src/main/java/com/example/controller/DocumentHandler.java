package com.example.controller;

import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.sql.SQLConnection;
import io.vertx.ext.web.RoutingContext;

import java.util.UUID;
import java.util.List;
import java.util.Set;

public class DocumentHandler {
    
     Vertx vertx = Vertx.vertx();
   private final JDBCClient dbClient;

    public DocumentHandler(JDBCClient dbClient) {
        this.dbClient = dbClient;
    }

public void uploadDocument(RoutingContext ctx) {
    int project_id = Integer.parseInt(ctx.pathParam("project_id"));
    long maxSize = 5 * 1024 * 1024; // 5 MB

    Set<String> allowedExtensions = Set.of("pdf", "png", "jpg", "jpeg");

    ctx.fileUploads().forEach(fileUpload -> {
        String tempFile = fileUpload.uploadedFileName();
        String originalName = fileUpload.fileName();
        long size = fileUpload.size();

        // Check size
        if (size > maxSize) {
            vertx.fileSystem().delete(tempFile, res -> {
                if (res.failed()) {
                    ctx.response().setStatusCode(500).end("Failed to delete temp file");
                }
            });
            ctx.response().setStatusCode(413).end("File too large (limit is 5MB)");
            return;
        }

        // Check file extension
        String extension = getExtension(originalName).toLowerCase();
        if (!allowedExtensions.contains(extension)) {
            vertx.fileSystem().delete(tempFile, res -> {
                if (res.failed()) {
                    ctx.response().setStatusCode(500).end("Failed to delete temp file");
                }
            });
            ctx.response().setStatusCode(400).end("Invalid file type: " + extension);
            return;
        }

        // Create project-specific folder
        String folderPath = "uploads/project_" + project_id;
        vertx.fileSystem().mkdirs(folderPath, mkdirRes -> {
            if (mkdirRes.failed()) {
                vertx.fileSystem().delete(tempFile, res -> {
                    if (res.failed()) {
                        ctx.response().setStatusCode(500).end("Failed to delete temp file");
                    }
                });
                ctx.response().setStatusCode(500).end("Failed to create folder");
                return;
            }

            // Unique filename
            String uniqueFileName = UUID.randomUUID() + "." + extension;
            String finalPath = folderPath + "/" + uniqueFileName;

            vertx.fileSystem().move(tempFile, finalPath, moveRes -> {
                if (moveRes.failed()) {
                    ctx.response().setStatusCode(500).end("File move failed");
                    return;
                }

                dbClient.getConnection(connRes -> {
                    if (connRes.failed()) {
                        ctx.response().setStatusCode(500).end("DB connection failed");
                        return;
                    }

                    SQLConnection conn = connRes.result();
                    String sql = "INSERT INTO documents (project_id, file_name, file_path, upload_date) VALUES (?, ?, ?, NOW())";
                    JsonArray params = new JsonArray()
                        .add(project_id)
                        .add(originalName)
                        .add(finalPath);

                    conn.updateWithParams(sql, params, insertRes -> {
                        conn.close();
                        if (insertRes.failed()) {
                            ctx.response().setStatusCode(500).end("DB insert failed");
                        } else {
                            JsonObject json = new JsonObject()
                                .put("project_id", project_id)
                                .put("file_name", originalName)
                                .put("file_path", finalPath)
                                .put("size", size)
                                .put("message", "Upload successful");

                            ctx.response()
                               .putHeader("Content-Type", "application/json")
                               .end(json.encodePrettily());
                        }
                    });
                });
            });
        });
    });
}

private String getExtension(String fileName) {
    int dot = fileName.lastIndexOf(".");
    return (dot >= 0) ? fileName.substring(dot + 1) : "";
}

// public void listDocuments(RoutingContext ctx) {
//     int project_id = Integer.parseInt(ctx.pathParam("project_id"));

//     dbClient.getConnection(ar -> {
//         if (ar.failed()) {
//             ctx.response().setStatusCode(500).end("DB connection failed");
//             return;
//         }

//         SQLConnection conn = ar.result();
//         // String query = "SELECT id, file_name, upload_date FROM documents WHERE project_id = ?";
//         String query = "SELECT * FROM documents";

//         conn.queryWithParams(query, new JsonArray().add(project_id), res -> {
//             conn.close();

//             if (res.failed()) {
//                 ctx.response().setStatusCode(500).end("Query failed");
//                 return;
//             }

//             JsonArray json = new JsonArray();
//             for (JsonObject row : res.result().getRows()) {
//                 json.add(new JsonObject()
//                         .put("project_id",row.getInteger("project_id"))
//                         .put("file_name", row.getString("file_name"))
//                         .put("upload_date", row.getString("upload_date")));
//             }

//             ctx.response()
//                .putHeader("Content-Type", "application/json")
//                .end(json.encode());
//         });
//     });
// }

public void listDocuments(RoutingContext context) {
    dbClient.query("SELECT * FROM documents", res -> {
        if (res.succeeded()) {
            List<JsonObject> rows = res.result().getRows();
            List<JsonObject> processedRows = rows.stream().map(row -> {
                JsonObject json = new JsonObject();
                row.forEach(entry -> {
                    Object value = entry.getValue();
                        json.put(entry.getKey(), value);
                });
                return json;
            }).toList();

            JsonArray jsonArray = new JsonArray(processedRows);
            context.response()
                .putHeader("Content-Type", "application/json")
                .end(jsonArray.encodePrettily());
        } else {
            context.response().setStatusCode(500).end(res.cause().getMessage());
        }
    });
}


public void downloadDocument(RoutingContext ctx) {
    int id = Integer.parseInt(ctx.pathParam("id"));

    dbClient.getConnection(ar -> {
        if (ar.failed()) {
            ctx.response().setStatusCode(500).end("DB connection failed");
            return;
        }

        SQLConnection conn = ar.result();
        String query = "SELECT file_name, file_path FROM documents WHERE id = ?";

        conn.queryWithParams(query, new JsonArray().add(id), res -> {
            conn.close();

            if (res.failed()) {
                ctx.response().setStatusCode(500).end("Query failed");
                return;
            }

            if (res.result().getNumRows() == 0) {
                ctx.response().setStatusCode(404).end("Not Found");
                return;
            }

            JsonObject row = res.result().getRows().get(0);
            String fileName = row.getString("file_name");
            String path = row.getString("file_path");

            ctx.response()
               .putHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
               .sendFile(path);
        });
    });
}

    public void deleteDocument(RoutingContext ctx) {
    int id = Integer.parseInt(ctx.pathParam("id"));

    dbClient.getConnection(ar -> {
        if (ar.failed()) {
            ctx.response().setStatusCode(500).end("DB connection error");
            return;
        }

        SQLConnection connection = ar.result();
        connection.queryWithParams("SELECT file_path FROM documents WHERE id = ?", new JsonArray().add(id), selectRes -> {
            if (selectRes.failed()) {
                ctx.response().setStatusCode(500).end("Query error");
                connection.close();
                return;
            }

            if (selectRes.result().getNumRows() == 0) {
                ctx.response().setStatusCode(404).end("Not Found");
                connection.close();
                return;
            }

            String path = selectRes.result().getRows().get(0).getString("file_path");

            connection.updateWithParams("DELETE FROM documents WHERE id = ?", new JsonArray().add(id), deleteRes -> {
                connection.close(); // always close connection when done

                if (deleteRes.failed()) {
                    ctx.response().setStatusCode(500).end("Delete DB error");
                    return;
                }

                vertx.fileSystem().delete(path, fileRes -> {
                    if (fileRes.succeeded()) {
                        ctx.response().end("Deleted");
                    } else {
                        ctx.response().setStatusCode(500).end("File deletion failed");
                    }
                });
            });
        });
    });
}

}



