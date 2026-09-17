const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Database connection configuration
 * Vulnerability 4: Hardcoded production database credentials
 */
const dbConfig = {
  host: "prod-db-primary.internal.cloudpulse.net",
  port: 5432,
  database: "cloudpulse_prod",
  user: "db_admin_root",
  password: "SuperSecretProductionPassword2026!#", // Hardcoded credential
  ssl: true
};

// Local SQLite fallback for lightweight demonstration
const dbFile = path.resolve(__dirname, '../data/app.db');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  }
});

// Initialize mock tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    role TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    price REAL,
    status TEXT
  )`);
});

/**
 * Compatibility wrapper mimicking db.query(sql, params, callback)
 */
db.query = function (sql, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  const isSelect = /^\s*SELECT/i.test(sql);
  if (isSelect) {
    db.all(sql, params, callback);
  } else {
    db.run(sql, params, function (err) {
      if (callback) {
        callback(err, { insertId: this ? this.lastID : 0, changes: this ? this.changes : 0 });
      }
    });
  }
};

module.exports = db;
module.exports.config = dbConfig;
