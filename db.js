const Database = require('better-sqlite3');
const db = new Database('tamu.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tamu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    asal TEXT,
    pesan TEXT NOT NULL,
    waktu DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;