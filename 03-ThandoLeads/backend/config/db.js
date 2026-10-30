// Import MySQL
const mysql = require("mysql2");

// Load environment variables
require("dotenv").config();

// Create MySQL connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost" ,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "thandoleads",
    port: Number(process.env.DB_PORT || 3306),

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0

});

// Test database connection
db.getConnection((err, connection) => {

    if (err) {
        console.error("MySQL Connection Failed!");
        console.error(err.message);

        return;

    }

    console.log("MySQL Connected Successfully!");
    connection.release();

});

// Export database connection
module.exports = db.promise();