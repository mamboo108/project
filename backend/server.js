const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root123",
  database: "blood_bank",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database!");
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Blood Bank Server is Running...");
});

// 🔹 Donor Registration API
app.post("/donors/register", (req, res) => {
    const { name, age, weight, location, disease_id, blood_group_id } = req.body;
  
    if (!name || !age || !weight || !location || !blood_group_id) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    const sql = "INSERT INTO donors (name, age, weight, location, disease_id, blood_group_id) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [name, age, weight, location, disease_id, blood_group_id], (err, result) => {
      if (err) {
        console.error("Error inserting donor:", err);
        return res.status(500).json({ message: "Database error" });
      }
  
      // Now, fetch the nearest hospital
      const hospitalQuery = "SELECT * FROM hospitals WHERE location = ? LIMIT 1";
      
      db.query(hospitalQuery, [location], (hospitalErr, hospitalResult) => {
        if (hospitalErr) {
          console.error("Error fetching nearest hospital:", hospitalErr);
          return res.status(500).json({ message: "Hospital lookup error" });
        }
  
        let hospitalInfo = null;
        if (hospitalResult.length > 0) {
          hospitalInfo = hospitalResult[0]; // Get the first matching hospital
        }
  
        res.status(201).json({
          message: "✅ Donor registered successfully!",
          donor_id: result.insertId, // Return the new donor's ID
          hospital: hospitalInfo || { message: "No hospital found in this location" }
        });
      });
    });
  });

// 🔹 Receiver Registration API
app.post("/receivers/register", (req, res) => {
  console.log("📩 POST request received at /receivers/register");

  const { name, age, blood_group_id, location } = req.body;
  console.log("Request Body:", req.body);

  if (!name || !age || !blood_group_id || !location) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = `
    INSERT INTO receivers (name, age, blood_group_id, location) 
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, age, blood_group_id, location], (err, result) => {
    if (err) {
      console.error("❌ Error inserting receiver:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    const receiver_id = result.insertId;
    res.status(201).json({
      message: "✅ Receiver registered successfully!",
      receiver_id: receiver_id
    });
  });
});

// 🔹 Search for Available Blood
app.get("/blood/search", (req, res) => {
    console.log("🔍 GET request received at /blood/search");
  
    const { blood_group_id, location } = req.query;
    console.log("Query Params:", req.query);
  
    if (!blood_group_id || !location) {
      return res.status(400).json({ message: "Blood group and location are required" });
    }
  
    const sql = `
      SELECT donors.donor_id, donors.name, donors.age, donors.weight, donors.location, blood_groups.blood_type 
      FROM donors
      JOIN blood_groups ON donors.blood_group_id = blood_groups.blood_group_id
      WHERE donors.blood_group_id = ? AND donors.location = ?
    `;
  
    db.query(sql, [blood_group_id, location], (err, results) => {
      if (err) {
        console.error("❌ Error searching for blood:", err);
        return res.status(500).json({ message: "Database error", error: err });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: "❌ No donors found for this blood group in this location." });
      }
  
      res.status(200).json({
        message: "✅ Donors found!",
        donors: results
      });
    });
  });
  app.get("/blood-availability", (req, res) => {
    const { blood_group_id, location } = req.query;
  
    if (!blood_group_id || !location) {
      return res.status(400).json({ message: "Blood group and location are required" });
    }
  
    const sql = `
      SELECT d.donor_id, d.name, d.age, d.weight, d.location, bg.blood_type
      FROM donors d
      JOIN blood_groups bg ON d.blood_group_id = bg.blood_group_id
      WHERE d.blood_group_id = ? AND d.location = ?;
    `;
  
    db.query(sql, [blood_group_id, location], (err, results) => {
      if (err) {
        console.error("Error fetching blood availability:", err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json(results);
    });
  }); 

  app.get("/nearest-hospital", (req, res) => {
    const { location } = req.query;
  
    if (!location) {
      return res.status(400).json({ message: "Location is required" });
    }
  
    const sql = "SELECT * FROM hospitals WHERE location = ? LIMIT 1";
  
    db.query(sql, [location], (err, results) => {
      if (err) {
        console.error("Error fetching nearest hospital:", err);
        return res.status(500).json({ message: "Database error" });
      }
      
      if (results.length > 0) {
        res.json(results[0]); // Return the nearest hospital
      } else {
        res.status(404).json({ message: "No hospitals found in this location" });
      }
    });
  });
  const bcrypt = require("bcrypt");

  // 🔑 User Login API (Donor or Receiver)
  app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const sql = "SELECT * FROM users WHERE username = ?";
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = results[0];

        if (password !== user.password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        res.status(200).json({ message: "✅ Login successful", role: user.role });
    });
});



// 🔹 User Registration API
app.post("/register", (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
  }

  const checkUserQuery = "SELECT * FROM users WHERE username = ?";
  db.query(checkUserQuery, [username], (err, results) => {
      if (err) {
          console.error("Error checking user:", err);
          return res.status(500).json({ message: "Database error" });
      }

      if (results.length > 0) {
          return res.status(400).json({ message: "Username already exists. Please choose a different one." });
      }

      // Insert new user
      const insertUserQuery = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
      db.query(insertUserQuery, [username, password, role], (err, result) => {
          if (err) {
              console.error("Error inserting user:", err);
              return res.status(500).json({ message: "Database error" });
          }

          res.status(201).json({ message: "✅ Registration successful! You can now log in." });
      });
  });
});

  
  
  
  
  
// Start the server
const PORT = 5500;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
