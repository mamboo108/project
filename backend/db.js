const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",       // Ensure this is correct
  user: "root",            // Your MySQL username
  password: "root123",     // Your MySQL password
  database: "blood_bank",  // Your database name
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL database.");
});

module.exports = db;
