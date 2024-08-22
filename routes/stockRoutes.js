const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();

const db = new sqlite3.Database(":memory:");

router.get("/", (req, res) => {
  db.all("SELECT * FROM stocks", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

router.post("/", (req, res) => {
  const { symbol, price } = req.body;
  db.run(
    "INSERT INTO stocks (symbol, price) VALUES (?, ?)",
    [symbol, price],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, symbol, price });
    }
  );
});

module.exports = router;
