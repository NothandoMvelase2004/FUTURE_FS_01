const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

fetch("http://localhost:3000/api/dashboard/stats", {
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  }
})
.then(res => res.json())
.then(data => {
  document.getElementById("users").innerText = data.totalUsers;
  document.getElementById("contacts").innerText = data.totalContacts;
  document.getElementById("today").innerText = data.todayMessages;
})
.catch(err => console.error(err));


router.get("/stats", authMiddleware, (req, res) => {
  const queries = {
    users: "SELECT COUNT(*) AS totalUsers FROM users",
    contacts: "SELECT COUNT(*) AS totalContacts FROM contacts",
    today: `
      SELECT COUNT(*) AS todayCount 
      FROM contacts 
      WHERE DATE(created_at) = CURDATE()
    `
  };

  const stats = {};

  db.query(queries.users, (err, userResult) => {
    if (err) return res.status(500).json(err);
    stats.totalUsers = userResult[0].totalUsers;

    db.query(queries.contacts, (err, contactResult) => {
      if (err) return res.status(500).json(err);
      stats.totalContacts = contactResult[0].totalContacts;

      db.query(queries.today, (err, todayResult) => {
        if (err) return res.status(500).json(err);
        stats.todayMessages = todayResult[0].todayCount;

        res.json(stats);
      });
    });
  });
});

module.exports = router;
