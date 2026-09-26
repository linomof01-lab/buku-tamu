const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/api/tamu', (req, res) => {
  const rows = db.prepare('SELECT * FROM tamu ORDER BY id DESC').all();
  res.json(rows);
});

app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS n FROM tamu').get().n;
  const hariIni = db.prepare(
    "SELECT COUNT(*) AS n FROM tamu WHERE DATE(waktu) = DATE('now','localtime')"
  ).get().n;
  res.json({ total, hariIni });
});

app.post('/api/tamu', (req, res) => {
  const { nama, asal, pesan } = req.body;
  if (!nama?.trim() || !pesan?.trim())
    return res.status(400).json({ error: 'Nama & pesan wajib diisi' });

  const info = db.prepare(
    'INSERT INTO tamu (nama, asal, pesan) VALUES (?,?,?)'
  ).run(nama.trim(), (asal || '').trim(), pesan.trim());

  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/tamu/:id', (req, res) => {
  db.prepare('DELETE FROM tamu WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server: http://localhost:${PORT}`));