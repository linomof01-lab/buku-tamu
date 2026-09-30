require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tamu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      asal TEXT,
      pesan TEXT NOT NULL,
      waktu DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Database Turso terhubung & tabel siap!');
}

initDb().catch(console.error);

module.exports = db;