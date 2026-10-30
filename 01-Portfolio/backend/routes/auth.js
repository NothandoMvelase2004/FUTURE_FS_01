const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (results.length === 0) return res.status(401).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, results[0].password);
    if (!valid) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign({ id: results[0].id }, process.env.JWT_SECRET);
    res.json({ token });
  });
});

module.exports = router;
