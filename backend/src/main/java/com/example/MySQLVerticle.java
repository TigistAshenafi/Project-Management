package com.example;

import com.example.config.DatabaseConfig;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.sql.SQLConnection;

public class MySQLVerticle extends AbstractVerticle {
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
                System.out.println("❌ Cannot connect to DB");
                startPromise.fail(conn.cause());
                return;
            }

            SQLConnection connection = conn.result();

            createTables(connection)
                .compose(v -> migrateTables(connection))
                .onComplete(res -> {
                    connection.close();
                    if (res.succeeded()) {
                        System.out.println("✅ Database initialized successfully");
                        startPromise.complete();
                    } else {
                        System.err.println("❌ Database initialization failed: " + res.cause().getMessage());
                        res.cause().printStackTrace();
                        startPromise.fail(res.cause());
                    }
                });
        });
    }

    // ---- Create Tables ----
    private Future<Void> createTables(SQLConnection connection) {
        return execute(connection, """
            CREATE TABLE IF NOT EXISTS users(
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'EMPLOYEE'
            )
        """).compose(v -> execute(connection, """
            CREATE TABLE IF NOT EXISTS employees(
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                position VARCHAR(255) NOT NULL,
                job_type VARCHAR(50) NOT NULL,
                role VARCHAR(50) DEFAULT 'EMPLOYEE',
                status ENUM('pending', 'active') DEFAULT 'pending',
                invite_token VARCHAR(255) UNIQUE,
                invited_at TIMESTAMP NULL,
                activated_at TIMESTAMP NULL,
                user_id INT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)).compose(v -> execute(connection, """
            CREATE TABLE IF NOT EXISTS projects(
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                description VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'not started',
                deadline DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)).compose(v -> execute(connection, """
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
            )
        """)).compose(v -> execute(connection, """
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
            )
        """)).compose(v -> execute(connection, """
            CREATE TABLE IF NOT EXISTS documents (
                id INT PRIMARY KEY AUTO_INCREMENT,
                project_id INT,
                file_name VARCHAR(255),
                file_path VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        """)).compose(v -> execute(connection, """
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """));
    }

    // ---- Migrate Tables (safe ALTERs) ----
    private Future<Void> migrateTables(SQLConnection connection) {
        return executeIgnoreError(connection,
                "ALTER TABLE employees ADD COLUMN email VARCHAR(255)")
            .compose(v -> executeIgnoreError(connection,
                "ALTER TABLE employees ADD COLUMN role VARCHAR(50) DEFAULT 'EMPLOYEE'"))
            .compose(v -> executeIgnoreError(connection,
                "ALTER TABLE employees ADD COLUMN status ENUM('pending', 'active') DEFAULT 'pending'"))
            .compose(v -> executeIgnoreError(connection,
                "ALTER TABLE employees ADD COLUMN invite_token VARCHAR(255) UNIQUE"))
            .compose(v -> executeIgnoreError(connection,
                "ALTER TABLE employees ADD COLUMN invited_at TIMESTAMP NULL"))
            .compose(v -> executeIgnoreError(connection,
                "ALTER TABLE employees ADD COLUMN activated_at TIMESTAMP NULL"))
            .compose(v -> executeIgnoreError(connection,
                "ALTER TABLE employees ADD COLUMN user_id INT UNIQUE"))
            .compose(v -> executeIgnoreError(connection,
                "ALTER TABLE employees ADD CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"));
    }

    // ---- Utility: Execute SQL with proper Future ----
    private Future<Void> execute(SQLConnection connection, String sql) {
        Promise<Void> promise = Promise.promise();
        connection.execute(sql, ar -> {
            if (ar.succeeded()) {
                promise.complete();
            } else {
                promise.fail(ar.cause());
            }
        });
        return promise.future();
    }

    // ---- Utility: Ignore errors (e.g. duplicate column on ALTER) ----
    private Future<Void> executeIgnoreError(SQLConnection connection, String sql) {
        Promise<Void> promise = Promise.promise();
        connection.execute(sql, ar -> {
            if (ar.succeeded()) {
                promise.complete();
            } else {
                System.out.println("⚠️ Migration notice: " + ar.cause().getMessage());
                promise.complete(); // ignore and continue
            }
        });
        return promise.future();
    }

    public static JDBCClient getSharedDbClient() {
        return sharedDbClient;
    }
}
