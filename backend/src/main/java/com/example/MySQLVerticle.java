package com.example;

import com.example.config.DatabaseConfig;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.sql.SQLConnection;

public class MySQLVerticle extends AbstractVerticle {
    // private JDBCClient dbClient;
    private static JDBCClient sharedDbClient; // Static reference

    @Override
    public void start(Promise<Void> startPromise) {
        JsonObject config = new JsonObject()
                .put("url", DatabaseConfig.URL)
                .put("driver_class", DatabaseConfig.DRIVER)
                .put("user", DatabaseConfig.USER)
                .put("password", DatabaseConfig.PASSWORD)
                .put("max_pool_size", DatabaseConfig.MAX_POOL_SIZE);

        sharedDbClient = JDBCClient.createShared(vertx, config);

        sharedDbClient.getConnection(conn -> {
            if (conn.failed()) {
                System.out.println("Can not connect to DB");
                startPromise.fail(conn.cause());
                return;
            }

            SQLConnection connection = conn.result();
            createTables(connection)
                    .onComplete(res -> {
                        connection.close();
                        if (res.succeeded()) {
                            startPromise.complete();
                        } else {
                            startPromise.fail(res.cause());
                        }
                    });
        });
    }

    private Future<Void> createTables(SQLConnection connection) {
        return Future.future(promise -> connection.execute("""
                CREATE TABLE IF NOT EXISTS employees(
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    position VARCHAR(255) NOT NULL,
                    salary DECIMAL(10,2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """, ar -> {
                    if (ar.failed()) {
                        promise.fail(ar.cause());
                        return;
                    }
                    connection.execute("""
                        CREATE TABLE IF NOT EXISTS users(
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            username VARCHAR(255) UNIQUE NOT NULL,
                            password VARCHAR(255) NOT NULL,
                            role VARCHAR(50) DEFAULT 'user'
                        )
                        """, promise);
                        connection.execute("""
                        CREATE TABLE IF NOT EXISTS projects(
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) UNIQUE NOT NULL,
                            description VARCHAR(255) NOT NULL,
                            status VARCHAR(50) DEFAULT 'not started',
                            deadline DATE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        )
                        """, promise);
                        connection.execute("""
                            CREATE TABLE IF NOT EXISTS tasks (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                title VARCHAR(255) NOT NULL,
                                description TEXT,
                                status VARCHAR(50),
                                project_id INT,
                                assigned_to INT,
                                due_date DATE,
                                estimated_hours DOUBLE,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                FOREIGN KEY (project_id) REFERENCES projects(id)
                            );
                            """, promise);
                         connection.execute("""
                           CREATE TABLE IF NOT EXISTS time_logs (
                           id INT AUTO_INCREMENT PRIMARY KEY,
                           user_id INT NOT NULL,
                           task_id INT NOT NULL,
                           date DATE NOT NULL,
                           hours DOUBLE NOT NULL,
                           description TEXT,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                           FOREIGN KEY (task_id) REFERENCES tasks(id),
                           FOREIGN KEY (user_id) REFERENCES users(id)
                       );
                           """, promise);
                         connection.execute("""
                                 CREATE TABLE IF NOT EXISTS documents ( 
                                 id INT PRIMARY KEY AUTO_INCREMENT,
                                 project_id INT,
                                 file_name VARCHAR(255),
                                 file_path VARCHAR(255),
                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 FOREIGN KEY (project_id) REFERENCES projects(id)
                                 );
                                 """,promise);

                }));
    }

    public static JDBCClient getSharedDbClient() {
        return sharedDbClient;
    }
}