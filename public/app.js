const $ = id => document.getElementById(id);

async function loadAll() {
  const [tamu, stats] = await Promise.all([
    fetch('/api/tamu').then(r => r.json()),
    fetch('/api/stats').then(r => r.json())
  ]);
  renderList(tamu);
  $('statTotal').textContent = stats.total;
  $('statHariIni').textContent = stats.hariIni;
}

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
        <div>
          <small>${relatif(t.waktu)}</small>
          <button class="del" onclick="hapus(${t.id})" title="Hapus">✕</button>
        </div>
      </div>
      <p>${esc(t.pesan)}</p>
    </div>
  `).join('');
}

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
    const res = await fetch('/api/tamu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, asal, pesan })
    });
    if (!res.ok) throw new Error();

    $('nama').value = $('asal').value = $('pesan').value = '';
    status.style.color = '#4ade80';
    status.textContent = '✅ Terima kasih, data tersimpan!';
    setTimeout(() => status.textContent = '', 2500);
    await loadAll();
  } catch {
    status.style.color = '#f87171';
    status.textContent = '❌ Gagal menyimpan, coba lagi.';
  } finally {
    $('btnKirim').disabled = false;
  }
});

async function hapus(id) {
  if (!confirm('Hapus data tamu ini?')) return;
  await fetch('/api/tamu/' + id, { method: 'DELETE' });
  loadAll();
}

$('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.entry').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

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

loadAll();
setInterval(loadAll, 10000);