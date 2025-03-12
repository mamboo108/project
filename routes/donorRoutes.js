const express = require("express");
const router = express.Router();
const db = require("../db"); // Import MySQL connection

// ✅ 1. Register a Donor
router.post("/register", (req, res) => {
  const { name, age, weight, location, disease, blood_group } = req.body;

  // Check if the donor has a restricted disease
  db.query(
    "SELECT * FROM diseases WHERE name = ?",
    [disease],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (results.length > 0) {
        return res
          .status(400)
          .json({ message: "You are not eligible to donate blood." });
      }

      // Insert donor details into the database
      db.query(
        "INSERT INTO donors (name, age, weight, location, disease, blood_group) VALUES (?, ?, ?, ?, ?, ?)",
        [name, age, weight, location, disease, blood_group],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: "✅ Donor registered successfully!" });
        }
      );
    }
  );
});

// ✅ 2. Get List of Donors
router.get("/", (req, res) => {
  db.query("SELECT * FROM donors", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

module.exports = router;
