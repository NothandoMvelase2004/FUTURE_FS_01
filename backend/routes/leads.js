const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, (req, res) => {
  db.query("SELECT * FROM leads", (err, results) => {
    res.json(results);
  });
});

router.post("/", auth, (req, res) => {
  const { name, email, phone, status } = req.body;
  db.query(
    "INSERT INTO leads (name, email, phone, status) VALUES (?, ?, ?, ?)",
    [name, email, phone, status],
    () => res.json({ message: "Lead added" })
  );
});

router.put("/:id", auth, (req, res) => {
  const { status } = req.body;
  db.query("UPDATE leads SET status=? WHERE id=?", [status, req.params.id]);
  res.json({ message: "Lead updated" });
});

router.delete("/:id", auth, (req, res) => {
  db.query("DELETE FROM leads WHERE id=?", [req.params.id]);
  res.json({ message: "Lead deleted" });
});

module.exports = router;
