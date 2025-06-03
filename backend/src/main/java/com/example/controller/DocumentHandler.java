package com.example.controller;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.sql.SQLClient;
// import io.vertx.ext.sql.UpdateResult;
import io.vertx.ext.web.FileUpload;
import io.vertx.ext.web.RoutingContext;

// import java.io.File;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
// import java.util.Set;

public class DocumentHandler {
    private final SQLClient dbClient;

    public DocumentHandler(SQLClient dbClient) {
        this.dbClient = dbClient;
    }

    // Upload document
public void uploadDocument(RoutingContext ctx) {
    String project_id = ctx.pathParam("project_id");
    List<FileUpload> uploads = ctx.fileUploads();

    if (uploads.isEmpty()) {
        ctx.response().setStatusCode(400).end("No file uploaded");
        return;
    }

    FileUpload upload = uploads.iterator().next();
    String fileName = upload.fileName();
    String uploadedPath = upload.uploadedFileName();
    String targetPath = "uploads/" + fileName;

    // Move the file to the desired location
    ctx.vertx().fileSystem().move(uploadedPath, targetPath, moveRes -> {
        if (moveRes.failed()) {
            ctx.response().setStatusCode(500).end("File move failed");
            return;
        }

        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());

        // Save file name and path in DB
        JsonArray params = new JsonArray()
            .add(fileName)
            .add(targetPath)  // Save the full path here
            .add(project_id)
            .add(now);

        String sql = "INSERT INTO documents (file_name, file_path, project_id, upload_date) VALUES (?, ?, ?, ?)";

        dbClient.updateWithParams(sql, params, res -> {
            if (res.succeeded()) {
                ctx.response()
                       .putHeader("Content-Type", "application/json")
                       .setStatusCode(201)
                       .end(new JsonObject().put("message", "File uploaded successfully").encode());
            } else {
                ctx.response().setStatusCode(500).end("DB Insert failed");
            }
        });
    });
}
    // List documents for a project
public void listDocuments(RoutingContext ctx) {
    String sql = "SELECT * FROM documents";
System.out.println("Request received for /api/documents");
  dbClient.query(sql, res -> {
    if (res.succeeded()) {
        System.out.println("Query successful, documents fetched.");
        List<JsonObject> rows = res.result().getRows();

        // Convert LocalDateTime to String
        for (JsonObject row : rows) {
            if (row.containsKey("upload_date")) {
                Object uploadDate = row.getValue("upload_date");
                if (uploadDate instanceof LocalDateTime) {
                    row.put("upload_date", uploadDate.toString()); // ISO format
                }
            }
        }

        JsonArray json = new JsonArray(rows);
        ctx.response()
            .putHeader("Content-Type", "application/json")
            .end(json.encode());
    } else {
        ctx.response()
            .setStatusCode(500)
            .putHeader("Content-Type", "text/plain")
            .end("Failed to fetch documents");
    }
});

}
    // Download document
    public void downloadDocument(RoutingContext ctx) {
        String id = ctx.pathParam("id");
        String sql = "SELECT * FROM documents WHERE id = ?";

        dbClient.queryWithParams(sql, new JsonArray().add(id), res -> {
            if (res.succeeded() && !res.result().getRows().isEmpty()) {
                JsonObject doc = res.result().getRows().get(0);
                String fileName = doc.getString("file_name");
                String filePath = "uploads/" + fileName;

                ctx.response()
                    .putHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .sendFile(filePath);
            } else {
                ctx.response().setStatusCode(404).end("Document not found");
            }
        });
    }

//     public void getDocumentsByProject(RoutingContext ctx) {
//     String project_id = ctx.pathParam("project_id");
//     String sql = "SELECT * FROM documents WHERE project_id = ?";

//     dbClient.queryWithParams(sql, new JsonArray().add(project_id), res -> {
//         if (res.succeeded()) {
//             List<JsonObject> rows = res.result().getRows();

//             // Convert upload_date to string if it's LocalDateTime
//             for (JsonObject row : rows) {
//                 if (row.containsKey("upload_date")) {
//                     Object uploadDate = row.getValue("upload_date");
//                     if (uploadDate instanceof LocalDateTime) {
//                         row.put("upload_date", uploadDate.toString());
//                     }
//                 }
//             }

//             JsonArray json = new JsonArray(rows);

//             ctx.response()
//                 .putHeader("Content-Type", "application/json")
//                 .end(json.encode());

//         } else {
//             ctx.response()
//                 .setStatusCode(500)
//                 .end("Failed to fetch documents for project");
//         }
//     });
// }


    // Delete document
    public void deleteDocument(RoutingContext ctx) {
        String id = ctx.pathParam("id");
        String sql = "SELECT * FROM documents WHERE id = ?";

        dbClient.queryWithParams(sql, new JsonArray().add(id), res -> {
            if (res.succeeded() && !res.result().getRows().isEmpty()) {
                JsonObject doc = res.result().getRows().get(0);
                String fileName = doc.getString("file_name");
                String filePath = "uploads/" + fileName;

                // Delete from DB
                dbClient.updateWithParams("DELETE FROM documents WHERE id = ?", new JsonArray().add(id), delRes -> {
                    if (delRes.succeeded()) {
                        // Delete file
                        ctx.vertx().fileSystem().delete(filePath, fileDel -> {
                            if (fileDel.succeeded()) {
                                ctx.response()
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject().put("message", "Document deleted").encode());
                            } else {
                                ctx.response().setStatusCode(500).end("File deletion failed");
                            }
                        });
                    } else {
                        ctx.response().setStatusCode(500).end("DB deletion failed");
                    }
                });
            } else {
                ctx.response().setStatusCode(404).end("Document not found");
            }
        });
    }
}
