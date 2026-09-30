const express = require('express');
const crypto = require('crypto');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const sessions = new Map();

function getToken(req) {
  const cookies = req.headers.cookie || '';
  const match = cookies.split('; ').find(c => c.startsWith('session='));
  return match ? match.split('=')[1] : null;
}
function isAdmin(req) {
  const token = getToken(req);
  return token && sessions.has(token);
}
function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ==== Ambil semua tamu ====
app.get('/api/tamu', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM tamu ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

// ==== Statistik ====
app.get('/api/stats', async (req, res) => {
  try {
    const totalResult = await db.execute('SELECT COUNT(*) AS n FROM tamu');
    const hariIniResult = await db.execute(
      "SELECT COUNT(*) AS n FROM tamu WHERE DATE(waktu) = DATE('now','localtime')"
    );
    res.json({
      total: Number(totalResult.rows[0].n),
      hariIni: Number(hariIniResult.rows[0].n)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil statistik' });
  }
});

// ==== Tambah tamu ====
app.post('/api/tamu', async (req, res) => {
  const { nama, asal, pesan } = req.body;
  if (!nama?.trim() || !pesan?.trim())
    return res.status(400).json({ error: 'Nama & pesan wajib diisi' });

  try {
    const result = await db.execute({
      sql: 'INSERT INTO tamu (nama, asal, pesan) VALUES (?,?,?)',
      args: [nama.trim(), (asal || '').trim(), pesan.trim()]
    });
    res.json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan data' });
  }
});

// ==== Login admin ====
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Password salah' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { createdAt: Date.now() });
  res.setHeader('Set-Cookie',
    `session=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);
  res.json({ ok: true });
});

// ==== Logout ====
app.post('/api/logout', (req, res) => {
  const token = getToken(req);
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0');
  res.json({ ok: true });
});

// ==== Cek status login ====
app.get('/api/me', (req, res) => {
  res.json({ isAdmin: isAdmin(req) });
});

// ==== Hapus tamu (admin only) ====
app.delete('/api/tamu/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM tamu WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`🔐 Admin password: ${ADMIN_PASSWORD}`);
});