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

  console.log("📩 Donor Registration Request:", req.body);

  if (!name || !age || !weight || !location || !blood_group_id) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check age and weight eligibility
  if (age < 18 || age > 60) {
    console.log("❌ Age restriction: Not eligible to donate");
    return res.status(400).json({ message: "❌ Not eligible: Age must be between 18 and 60 years." });
  }

  if (weight < 50) {
    console.log("❌ Weight restriction: Not eligible to donate");
    return res.status(400).json({ message: "❌ Not eligible: Weight must be at least 50kg." });
  }

  console.log(`🔍 Checking disease ID: ${disease_id}`);

  // Check if the disease ID is valid
  const diseaseQuery = "SELECT * FROM diseases WHERE disease_id = ?";
  db.query(diseaseQuery, [disease_id], (diseaseErr, diseaseResult) => {
    if (diseaseErr) {
      console.error("❌ Database Error - Checking Disease:", diseaseErr);
      return res.status(500).json({ message: "Database error" });
    }

    console.log("🩺 Disease Query Result:", diseaseResult);

    if (diseaseResult.length === 0) {
      console.log("❌ Invalid Disease ID Provided");
      return res.status(400).json({ message: "Invalid disease selection" });
    }

    // ✅ Allow donation ONLY IF disease_id = 5 (None)
    if (parseInt(disease_id) !== 5) {
      console.log(`❌ Donor cannot donate due to ${diseaseResult[0].name}`);
      return res.status(400).json({
        message: `❌ You cannot donate blood due to ${diseaseResult[0].name}.`
      });
    }

    // Proceed with donor registration
    registerDonor();
  });

  function registerDonor() {
    console.log("✅ Disease check passed, registering donor...");

    const sql =
      "INSERT INTO donors (name, age, weight, location, disease_id, blood_group_id) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, age, weight, location, disease_id, blood_group_id], (err, result) => {
      if (err) {
        console.error("❌ Database Error - Inserting Donor:", err);
        return res.status(500).json({ message: "Database error" });
      }

      console.log(`🩸 Donor Registered! Donor ID: ${result.insertId}`);

      // Find the nearest hospital
      const hospitalQuery = "SELECT * FROM hospitals WHERE location = ? LIMIT 1";
      db.query(hospitalQuery, [location], (hospitalErr, hospitalResult) => {
        if (hospitalErr) {
          console.error("❌ Database Error - Fetching Hospital:", hospitalErr);
          return res.status(500).json({ message: "Hospital lookup error" });
        }

        console.log("🏥 Nearest Hospital Result:", hospitalResult);

        let hospitalInfo =
          hospitalResult.length > 0
            ? hospitalResult[0]
            : { message: "No hospital found in this location" };

        res.status(201).json({
          message: "✅ Donor registered successfully!",
          donor_id: result.insertId,
          hospital: hospitalInfo
        });
      });
    });
  }
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
  
  app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const sql = "SELECT * FROM users WHERE username = ?";
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error("❌ Error fetching user:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = results[0];

        if (password !== user.password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // If user is a donor, fetch donor details by matching name with username
        if (user.role === "donor") {
            const donorQuery = `
                SELECT donors.*, blood_groups.blood_type
                FROM donors
                JOIN blood_groups ON donors.blood_group_id = blood_groups.blood_group_id
                WHERE donors.name = ?`;

            db.query(donorQuery, [username], (donorErr, donorResults) => {
                if (donorErr) {
                    console.error("❌ Error fetching donor:", donorErr);
                    return res.status(500).json({ message: "Error fetching donor details" });
                }

                if (donorResults.length > 0) {
                    const donor = donorResults[0];

                    // Fetch nearest hospital based on donor's location
                    const hospitalQuery = "SELECT * FROM hospitals WHERE location = ? LIMIT 1";
                    db.query(hospitalQuery, [donor.location], (hospitalErr, hospitalResults) => {
                        if (hospitalErr) {
                            console.error("❌ Error fetching hospital:", hospitalErr);
                            return res.status(500).json({ message: "Hospital lookup error" });
                        }

                        return res.status(200).json({
                            message: "✅ Donor logged in successfully!",
                            role: "donor",
                            userDetails: { ...user, ...donor },  // Combine user and donor details
                            hospital: hospitalResults.length > 0 ? hospitalResults[0] : { message: "No hospital found in this location" }
                        });
                    });
                } else {
                    return res.status(200).json({ message: "No donor details found. Please complete registration.", role: "donor", askForDetails: true });
                }
            });

        } 
        // If user is a receiver, fetch receiver details by matching name with username
        else if (user.role === "receiver") {
            const receiverQuery = `
                SELECT receivers.*, blood_groups.blood_type
                FROM receivers
                JOIN blood_groups ON receivers.blood_group_id = blood_groups.blood_group_id
                WHERE receivers.name = ?`;

            db.query(receiverQuery, [username], (receiverErr, receiverResults) => {
                if (receiverErr) {
                    console.error("❌ Error fetching receiver:", receiverErr);
                    return res.status(500).json({ message: "Error fetching receiver details" });
                }

                if (receiverResults.length > 0) {
                    return res.status(200).json({
                        message: "✅ Receiver logged in successfully!",
                        role: "receiver",
                        userDetails: { ...user, ...receiverResults[0] } // Combine user and receiver details
                    });
                } else {
                    return res.status(200).json({ message: "No receiver details found. Please complete registration.", role: "receiver", askForDetails: true });
                }
            });

        } else {
            return res.status(400).json({ message: "Invalid user role." });
        }
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

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const sql = "SELECT * FROM admins WHERE username = ? AND password = ?";
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.status(200).json({
      message: "✅ Admin logged in successfully!",
      admin: results[0],
    });
  });
});

// 🔹 Get All Donors and Receivers (Admin Only)
app.get("/admin/data", (req, res) => {
  const donorsQuery = "SELECT d.donor_id, d.name, d.age, d.weight, d.location, bg.blood_type FROM donors d JOIN blood_groups bg ON d.blood_group_id = bg.blood_group_id";
  const receiversQuery = "SELECT r.receiver_id, r.name, r.age, r.location, bg.blood_type FROM receivers r JOIN blood_groups bg ON r.blood_group_id = bg.blood_group_id";

  db.query(donorsQuery, (donorErr, donorResults) => {
    if (donorErr) {
      console.error("❌ Error fetching donors:", donorErr);
      return res.status(500).json({ message: "Database error" });
    }

    db.query(receiversQuery, (receiverErr, receiverResults) => {
      if (receiverErr) {
        console.error("❌ Error fetching receivers:", receiverErr);
        return res.status(500).json({ message: "Database error" });
      }

      res.status(200).json({
        message: "✅ Donors and Receivers fetched successfully!",
        donors: donorResults,
        receivers: receiverResults,
      });
    });
  });
}); 
  
  
  
  
// Start the server
const PORT = 5500;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
