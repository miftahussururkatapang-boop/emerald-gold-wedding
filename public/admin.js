const $ = id => document.getElementById(id);
let invitations = [], activeInvitation = null;

async function api(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) }
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Permintaan gagal diproses.');
  return d;
}

function showLogin() {
  $('loginPanel').hidden = false;
  $('dashboard').hidden = true;
  $('logoutBtn').hidden = true;
}

function showDashboard() {
  $('loginPanel').hidden = true;
  $('dashboard').hidden = false;
  $('logoutBtn').hidden = false;
  loadDashboard();
}

async function check() {
  try {
    await api('/api/admin/me');
    showDashboard();
  } catch {
    showLogin();
  }
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('loginStatus').textContent = 'Memverifikasi password…';
  $('loginStatus').className = 'form-status';
  try {
    await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: $('password').value })
    });
    $('password').value = '';
    $('loginStatus').textContent = '';
    showDashboard();
  } catch (err) {
    $('loginStatus').className = 'form-status error';
    $('loginStatus').textContent = err.message;
  }
});

$('logoutBtn').onclick = async () => {
  await api('/api/admin/logout', { method: 'POST', body: '{}' }).catch(() => {});
  showLogin();
};

async function loadDashboard() {
  try {
    const d = await api('/api/admin/invitations');
    invitations = d.invitations || [];
    $('totalInv').textContent = invitations.length;
    $('totalRsvp').textContent = invitations.reduce((a, x) => a + (Number(x.rsvp_count) || 0), 0);
    $('totalAttend').textContent = invitations.reduce((a, x) => a + (Number(x.attend_count) || 0), 0);

    $('invitationList').innerHTML = invitations.map(x => `
      <div class="inv-row">
        <div>
          <strong>${esc(x.groom_name)} & ${esc(x.bride_name)}</strong>
          <small>Slug: <code>/i/${esc(x.slug)}</code> · ${x.rsvp_count || 0} RSVP · ${x.guest_count || 0} Tamu · ${x.is_published ? '✅ Aktif' : '🔒 Draf'}</small>
        </div>
        <div class="actions">
          <button data-act="open" data-id="${x.id}">Buka Undangan</button>
          <button data-act="edit" data-id="${x.id}">Edit</button>
          <button data-act="guests" data-id="${x.id}">Kelola Tamu</button>
          <button data-act="rsvp" data-id="${x.id}">Rekap RSVP</button>
          <button data-act="delete" data-id="${x.id}" class="btn-danger-sm">Hapus</button>
        </div>
      </div>
    `).join('') || '<p class="muted" style="text-align:center; padding:20px;">Belum ada undangan dibuat. Klik tombol "+ Buat Undangan" di atas.</p>';
  } catch (e) {
    $('invitationList').innerHTML = `<p style="color:#d32f2f;">${esc(e.message)}</p>`;
  }
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

$('invitationList').addEventListener('click', async e => {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const inv = invitations.find(x => x.id == b.dataset.id);
  if (!inv) return;
  activeInvitation = inv;

  if (b.dataset.act === 'open') {
    window.open(`/i/${encodeURIComponent(inv.slug)}`, '_blank');
  }
  if (b.dataset.act === 'edit') openEditor(inv);
  if (b.dataset.act === 'guests') openGuests(inv);
  if (b.dataset.act === 'rsvp') openRsvp(inv);
  if (b.dataset.act === 'delete' && confirm(`Yakin ingin menghapus undangan "${inv.slug}" beserta semua daftar tamu dan RSVP-nya?`)) {
    try {
      await api(`/api/admin/invitations/${inv.id}`, { method: 'DELETE', body: '{}' });
      loadDashboard();
    } catch (e) {
      alert(e.message);
    }
  }
});

$('newInvitation').onclick = () => openEditor(null);
$('closeEditor').onclick = () => { $('editorPanel').hidden = true; };
$('closeGuests').onclick = () => { $('guestPanel').hidden = true; };
$('closeRsvp').onclick = () => { $('rsvpPanel').hidden = true; };

function openEditor(x) {
  $('editorPanel').hidden = false;
  $('guestPanel').hidden = true;
  $('rsvpPanel').hidden = true;
  $('editorTitle').textContent = x ? `Edit Undangan (${x.slug})` : 'Buat Undangan Baru';
  $('invId').value = x?.id || '';

  const map = {
    slug: 'slug',
    groomName: 'groom_name',
    brideName: 'bride_name',
    groomParents: 'groom_parents',
    brideParents: 'bride_parents',
    eventDate: 'event_date',
    eventTime: 'event_time',
    receptionTime: 'reception_time',
    venue: 'venue',
    address: 'address',
    mapsUrl: 'maps_url',
    quoteText: 'quote_text',
    storyText: 'story_text',
    musicUrl: 'music_url',
    coverImage: 'cover_image',
    videoUrl: 'video_url',
    bankName: 'bank_name',
    bankAccount: 'bank_account',
    bankHolder: 'bank_holder',
    giftAddress: 'gift_address'
  };

  Object.entries(map).forEach(([elemId, key]) => {
    $(elemId).value = x?.[key] || '';
  });

  $('galleryUrls').value = (x ? safeJson(x.gallery_json, []) : []).join('\n');
  $('published').checked = x ? Boolean(x.is_published) : true;
  $('editorStatus').textContent = '';
  $('editorPanel').scrollIntoView({ behavior: 'smooth' });
}

function safeJson(v, fallback) {
  try {
    const res = typeof v === 'string' ? JSON.parse(v) : v;
    return Array.isArray(res) ? res : fallback;
  } catch {
    return fallback;
  }
}

$('invitationForm').onsubmit = async e => {
  e.preventDefault();
  $('editorStatus').className = 'form-status';
  $('editorStatus').textContent = 'Menyimpan undangan…';

  const body = {
    slug: $('slug').value.trim().toLowerCase(),
    groom_name: $('groomName').value.trim(),
    bride_name: $('brideName').value.trim(),
    groom_parents: $('groomParents').value.trim(),
    bride_parents: $('brideParents').value.trim(),
    event_date: $('eventDate').value,
    event_time: $('eventTime').value.trim(),
    reception_time: $('receptionTime').value.trim(),
    venue: $('venue').value.trim(),
    address: $('address').value.trim(),
    maps_url: $('mapsUrl').value.trim(),
    quote_text: $('quoteText').value.trim(),
    story_text: $('storyText').value.trim(),
    music_url: $('musicUrl').value.trim(),
    cover_image: $('coverImage').value.trim(),
    video_url: $('videoUrl').value.trim(),
    bank_name: $('bankName').value.trim(),
    bank_account: $('bankAccount').value.trim(),
    bank_holder: $('bankHolder').value.trim(),
    gift_address: $('giftAddress').value.trim(),
    gallery_json: JSON.stringify($('galleryUrls').value.split('\n').map(x => x.trim()).filter(Boolean)),
    is_published: $('published').checked ? 1 : 0
  };

  try {
    if ($('invId').value) {
      await api(`/api/admin/invitations/${$('invId').value}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await api('/api/admin/invitations', { method: 'POST', body: JSON.stringify(body) });
    }
    $('editorStatus').className = 'form-status success';
    $('editorStatus').textContent = 'Undangan berhasil disimpan ke database D1!';
    loadDashboard();
  } catch (err) {
    $('editorStatus').className = 'form-status error';
    $('editorStatus').textContent = err.message;
  }
};

async function openGuests(inv) {
  $('guestPanel').hidden = false;
  $('editorPanel').hidden = true;
  $('rsvpPanel').hidden = true;
  $('guestTitle').textContent = `Daftar Tamu · ${inv.slug}`;
  await loadGuests();
}

async function loadGuests() {
  const d = await api(`/api/admin/invitations/${activeInvitation.id}/guests`);
  $('guestList').innerHTML = d.guests.map(g => {
    const personalUrl = `${location.origin}/i/${encodeURIComponent(activeInvitation.slug)}?to=${encodeURIComponent(g.guest_name)}&token=${encodeURIComponent(g.guest_token)}`;
    const waText = encodeURIComponent(`Assalamu’alaikum Warahmatullahi Wabarakatuh.\n\nKepada Yth. ${g.guest_name},\n\nTanpa mengurangi rasa hormat, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara pernikahan kami.\n\nTautan undangan personal Anda:\n${personalUrl}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila berkenan hadir dan memberikan doa restu.\n\nTerima kasih.\nWassalamu’alaikum Warahmatullahi Wabarakatuh.`);
    const waUrl = `https://api.whatsapp.com/send?text=${waText}`;

    return `
      <div class="guest-row">
        <div style="flex:1;">
          <strong>${esc(g.guest_name)}</strong>
          <span class="guest-link-preview">${esc(personalUrl)}</span>
        </div>
        <div class="actions">
          <button data-copy="${esc(personalUrl)}">Salin Link</button>
          <a href="${esc(waUrl)}" target="_blank" rel="noopener" style="background:#25d366; color:#fff; border-color:#25d366;">Kirim WA</a>
          <button data-del="${g.id}" class="btn-danger-sm">Hapus</button>
        </div>
      </div>
    `;
  }).join('') || '<p class="muted" style="text-align:center; padding:16px;">Belum ada tamu khusus ditambahkan.</p>';
}

$('guestForm').onsubmit = async e => {
  e.preventDefault();
  try {
    await api(`/api/admin/invitations/${activeInvitation.id}/guests`, {
      method: 'POST',
      body: JSON.stringify({ guest_name: $('newGuestName').value.trim() })
    });
    $('newGuestName').value = '';
    loadGuests();
    loadDashboard();
  } catch (e) {
    alert(e.message);
  }
};

$('guestList').onclick = async e => {
  const c = e.target.closest('[data-copy]');
  if (c) {
    await navigator.clipboard.writeText(c.dataset.copy);
    const orig = c.textContent;
    c.textContent = 'Tersalin! ✓';
    setTimeout(() => { c.textContent = orig; }, 1800);
    return;
  }
  const d = e.target.closest('[data-del]');
  if (d && confirm('Hapus tamu ini dari daftar?')) {
    await api(`/api/admin/guests/${d.dataset.del}`, { method: 'DELETE', body: '{}' });
    loadGuests();
    loadDashboard();
  }
};

async function openRsvp(inv) {
  $('rsvpPanel').hidden = false;
  $('guestPanel').hidden = true;
  $('editorPanel').hidden = true;
  $('rsvpTitle').textContent = `Rekap RSVP · ${inv.slug}`;
  $('exportCsvBtn').href = `/api/admin/invitations/${inv.id}/rsvps?export=csv`;

  const d = await api(`/api/admin/invitations/${inv.id}/rsvps`);
  $('rsvpList').innerHTML = d.rsvps.map(r => `
    <div class="rsvp-row">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <strong style="color:var(--emerald-800);">${esc(r.guest_name)}</strong>
        <span class="wish-badge badge-${esc(r.attendance)}">${esc(r.attendance === 'hadir' ? 'Hadir' : (r.attendance === 'ragu' ? 'Ragu' : 'Tidak Hadir'))} · ${Number(r.guest_count) || 1} orang</span>
      </div>
      <p style="font-size:13px; color:#444; margin:4px 0;">${esc(r.message || '— (Tanpa ucapan)')}</p>
      <small style="color:#777; font-size:11px;">${r.created_at || ''}</small>
    </div>
  `).join('') || '<p class="muted" style="text-align:center; padding:16px;">Belum ada konfirmasi kehadiran (RSVP) yang masuk.</p>';
}

check();
