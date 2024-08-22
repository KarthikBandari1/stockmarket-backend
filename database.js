const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./stocks.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT,
      price REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
