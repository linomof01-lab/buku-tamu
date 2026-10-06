// ==== KONEKSI TURSO ====
import { createClient } from 'https://esm.sh/@libsql/client/web@0.15.0';

const db = createClient({
  url: 'libsql://buku-tamu-linomof01-lab.aws-ap-northeast-1.turso.io',
  authToken: 'ZTvKLTZ10Tc2WzRmNDAwYjJ9.lUtGAFj-jQnW20Zzqth9La0kuTUpB7Pp6yZe_Q1FAo8ctp6VcnpbosFUVFlIdSw-zI3ZtBTxO4K6FK8B58rFAA'
});

const $ = id => document.getElementById(id);

// ==== LOAD DATA ====
async function loadAll() {
  try {
    const [tamuRes, totalRes, todayRes] = await Promise.all([
      db.execute('SELECT * FROM tamu ORDER BY id DESC'),
      db.execute('SELECT COUNT(*) AS n FROM tamu'),
      db.execute("SELECT COUNT(*) AS n FROM tamu WHERE DATE(waktu) = DATE('now','localtime')")
    ]);
    renderList(tamuRes.rows);
    $('statTotal').textContent = Number(totalRes.rows[0].n);
    $('statHariIni').textContent = Number(todayRes.rows[0].n);
  } catch (err) {
    console.error('Gagal load:', err);
  }
}

// ==== RENDER LIST (TANPA TOMBOL HAPUS) ====
function renderList(data) {
  const list = $('list');
  if (!data.length) {
    list.innerHTML = '<p class="empty">Belum ada tamu. Jadilah yang pertama! 🌟</p>';
    return;
  }
  list.innerHTML = data.map(t => `
    <div class="entry">
      <div class="head">
        <div>
          <b>${esc(t.nama)}</b>
          ${t.asal ? `<span class="asal"> • ${esc(t.asal)}</span>` : ''}
        </div>
        <small>${relatif(t.waktu)}</small>
      </div>
      <p>${esc(t.pesan)}</p>
    </div>
  `).join('');
}

// ==== KIRIM FORM ====
$('btnKirim').addEventListener('click', async () => {
  const nama  = $('nama').value.trim();
  const asal  = $('asal').value.trim();
  const pesan = $('pesan').value.trim();
  const status = $('status');

  if (!nama || !pesan) {
    status.style.color = '#f87171';
    status.textContent = '⚠️ Nama dan pesan wajib diisi!';
    return;
  }

  $('btnKirim').disabled = true;
  try {
    await db.execute({
      sql: 'INSERT INTO tamu (nama, asal, pesan) VALUES (?, ?, ?)',
      args: [nama, asal || '', pesan]
    });

    $('nama').value = $('asal').value = $('pesan').value = '';
    status.style.color = '#4ade80';
    status.textContent = '✅ Terima kasih, data tersimpan!';
    setTimeout(() => status.textContent = '', 2500);
    await loadAll();
  } catch (err) {
    console.error(err);
    status.style.color = '#f87171';
    status.textContent = '❌ Gagal menyimpan, coba lagi.';
  } finally {
    $('btnKirim').disabled = false;
  }
});

// ==== SEARCH ====
$('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.entry').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

// ==== HELPER ====
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
  ));
}

function relatif(tgl) {
  const d = new Date(tgl.replace(' ', 'T') + 'Z');
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  if (s < 604800) return Math.floor(s / 86400) + ' hari lalu';
  return d.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
}

// ==== INIT ====
loadAll();
setInterval(loadAll, 10000);
