const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Deteksi slug: dari path /i/:slug atau fallback query param ?slug= atau 'demo'
let slug = 'demo';
const pathParts = location.pathname.split('/').filter(Boolean);
if (pathParts.length >= 2 && pathParts[0] === 'i') {
  slug = pathParts[1];
} else if (pathParts.length === 1 && pathParts[0] !== 'index.html' && pathParts[0] !== 'admin') {
  slug = pathParts[0];
}

const urlParams = new URLSearchParams(location.search);
const guestParam = urlParams.get('to') || '';
const tokenParam = urlParams.get('token') || '';

let invitation = null;
let guestToken = null;
let countdownTimer = null;

async function init() {
  try {
    const qs = new URLSearchParams();
    if (guestParam) qs.set('to', guestParam);
    if (tokenParam) qs.set('token', tokenParam);

    const res = await fetch(`/api/invitation/${encodeURIComponent(slug)}${qs.toString() ? `?${qs.toString()}` : ''}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Undangan tidak ditemukan atau belum diterbitkan.');

    invitation = data.invitation;
    guestToken = data.guestToken || tokenParam || null;
    render(data.rsvps || []);
  } catch (err) {
    $('loading').innerHTML = `
      <div style="max-width:420px; padding:20px;">
        <h3 style="color:#d32f2f; margin-bottom:10px;">Gagal Memuat Undangan</h3>
        <p style="font-size:13.5px; line-height:1.6; color:#444;">${esc(err.message)}</p>
        <p style="font-size:12px; color:#777; margin-top:14px;">Pastikan database Cloudflare D1 sudah dibuat dan tabel diisi melalui dashboard admin atau seed.sql.</p>
      </div>
    `;
  }
}

function render(rsvps) {
  const d = invitation;
  const groomFirst = (d.groom_name || '').split(/[, ]+/)[0];
  const brideFirst = (d.bride_name || '').split(/[, ]+/)[0];
  const shortNames = `${groomFirst} & ${brideFirst}`;

  document.title = `The Wedding of ${d.groom_name} & ${d.bride_name}`;
  $('coverNames').textContent = shortNames;
  $('coverDate').textContent = formatDate(d.event_date);
  $('guestName').textContent = guestParam || 'Tamu Undangan';

  // Mempelai & Parents
  $('groom').textContent = d.groom_name;
  $('bride').textContent = d.bride_name;
  $('groomParents').textContent = d.groom_parents || '';
  $('brideParents').textContent = d.bride_parents || '';
  $('footerNames').textContent = `${d.groom_name} & ${d.bride_name}`;

  // Kutipan & Story
  $('quote').textContent = d.quote_text || 'Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.';
  $('story').textContent = d.story_text || 'Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud menyelenggarakan pernikahan ini sebagai penyempurna ibadah kami.';

  // Tanggal & Event
  $('dateDay').textContent = d.event_date ? new Date(d.event_date + 'T00:00:00').getDate() : '—';
  $('dateMonth').textContent = d.event_date ? new Date(d.event_date + 'T00:00:00').toLocaleDateString('id-ID', { month: 'long' }) : '';
  $('dateYear').textContent = d.event_date ? new Date(d.event_date + 'T00:00:00').getFullYear() : '';

  $('eventTime').textContent = d.event_time || '08.00 WIB - Selesai';
  $('venue').textContent = d.venue || 'Kediaman Mempelai';
  $('address').textContent = d.address || '';

  // Resepsi (jika diisi)
  if (d.reception_time) {
    $('receptionCard').hidden = false;
    $('receptionTime').textContent = d.reception_time;
    $('receptionVenue').textContent = d.venue || '';
    $('receptionAddress').textContent = d.address || '';
  }

  // Maps
  if (d.maps_url) {
    $('maps').href = d.maps_url;
  } else {
    $('maps').parentElement.style.display = 'none';
  }

  // Cover Photo
  if (d.cover_image) {
    $('coverPhoto').style.backgroundImage = `url("${d.cover_image.replace(/["\\]/g, '')}")`;
  }

  // Video Pernikahan (YouTube embed otomatis)
  if (d.video_url && d.video_url.trim()) {
    const embedUrl = getYouTubeEmbedUrl(d.video_url.trim());
    if (embedUrl) {
      $('videoSec').hidden = false;
      $('videoWrapper').innerHTML = `<iframe src="${esc(embedUrl)}" title="Video Mempelai" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }
  }

  // Galeri Foto
  const gallery = safeJson(d.gallery_json, []);
  if (gallery.length > 0) {
    $('gallery').innerHTML = gallery.map(url => `<img loading="lazy" src="${esc(url)}" alt="Momen Bahagia">`).join('');
  } else {
    $('gallerySec').hidden = true;
  }

  // Amplop Digital & Rekening
  let hasGift = false;
  if (d.bank_account) {
    $('bankCard').hidden = false;
    $('bankName').textContent = d.bank_name || 'Transfer Bank / E-Wallet';
    $('bankAccount').textContent = d.bank_account;
    $('bankHolder').textContent = d.bank_holder || `${d.groom_name} / ${d.bride_name}`;
    hasGift = true;
  }
  if (d.gift_address) {
    $('addressCard').hidden = false;
    $('giftAddress').textContent = d.gift_address;
    hasGift = true;
  }
  if (hasGift) {
    $('giftSec').hidden = false;
  }

  // RSVP Form Default Name
  if (guestParam) {
    $('rsvpName').value = guestParam;
  }

  // Render Buku Tamu
  renderWishes(rsvps);

  // Setup Musik Latar
  if (d.music_url) {
    $('music').src = d.music_url;
  }

  $('loading').hidden = true;
  $('app').hidden = false;

  if (d.event_date) {
    startCountdown(d.event_date);
  }
}

function safeJson(v, fallback) {
  try {
    const res = typeof v === 'string' ? JSON.parse(v) : v;
    return Array.isArray(res) ? res : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(v) {
  if (!v) return 'Tanggal Menyusul';
  try {
    return new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return v;
  }
}

function getYouTubeEmbedUrl(url) {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
  } catch (e) {}
  return url.includes('youtube.com/embed/') ? url : null;
}

function startCountdown(dateStr) {
  if (countdownTimer) clearInterval(countdownTimer);
  const target = new Date(dateStr + 'T08:00:00').getTime();
  const tick = () => {
    const diff = Math.max(0, target - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000) % 24;
    const minutes = Math.floor(diff / 60000) % 60;
    const seconds = Math.floor(diff / 1000) % 60;

    $('days').textContent = String(days).padStart(2, '0');
    $('hours').textContent = String(hours).padStart(2, '0');
    $('minutes').textContent = String(minutes).padStart(2, '0');
    $('seconds').textContent = String(seconds).padStart(2, '0');
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function renderWishes(list) {
  $('wishesCount').textContent = list.length;
  if (!list.length) {
    $('wishesList').innerHTML = '<p class="muted" style="text-align:center; padding:16px;">Belum ada doa tertulis. Jadilah yang pertama memberikan doa restu!</p>';
    return;
  }
  $('wishesList').innerHTML = list.map(item => `
    <div class="wish-bubble">
      <div class="wish-header">
        <span class="wish-name">${esc(item.guest_name)}</span>
        <span class="wish-badge badge-${esc(item.attendance)}">${esc(item.attendance === 'hadir' ? 'Hadir' : (item.attendance === 'ragu' ? 'Ragu' : 'Tidak Hadir'))}</span>
      </div>
      <p class="wish-msg">${esc(item.message)}</p>
      <span class="wish-time">${item.created_at ? new Date(item.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}</span>
    </div>
  `).join('');
}

// Buka Undangan & Autoplay Musik (kompatibel penuh Chrome/Samsung Internet Android)
$('openInvitation').addEventListener('click', () => {
  $('cover').style.display = 'none';
  $('invitationContent').hidden = false;
  $('invitationContent').scrollIntoView({ behavior: 'smooth' });

  if (invitation?.music_url) {
    $('musicToggle').hidden = false;
    const audio = $('music');
    audio.play().then(() => {
      $('musicToggle').classList.add('playing');
    }).catch(err => {
      console.log('Autoplay audio ditunda oleh browser:', err);
      $('musicToggle').classList.remove('playing');
    });
  }
});

// Toggle Musik
$('musicToggle').addEventListener('click', () => {
  const audio = $('music');
  if (audio.paused) {
    audio.play().then(() => {
      $('musicToggle').classList.add('playing');
    }).catch(() => {});
  } else {
    audio.pause();
    $('musicToggle').classList.remove('playing');
  }
});

// Salin No Rekening & Alamat
$('copyBankBtn')?.addEventListener('click', async () => {
  const num = $('bankAccount').textContent;
  await navigator.clipboard.writeText(num);
  $('copyBankBtn').textContent = 'Tersalin! ✓';
  setTimeout(() => { $('copyBankBtn').textContent = 'Salin No. Rekening'; }, 2000);
});

$('copyAddressBtn')?.addEventListener('click', async () => {
  const addr = $('giftAddress').textContent;
  await navigator.clipboard.writeText(addr);
  $('copyAddressBtn').textContent = 'Tersalin! ✓';
  setTimeout(() => { $('copyAddressBtn').textContent = 'Salin Alamat'; }, 2000);
});

// Submit RSVP
$('rsvpForm').addEventListener('submit', async e => {
  e.preventDefault();
  const statusEl = $('rsvpStatus');
  const btn = $('submitRsvpBtn');
  statusEl.className = 'form-status';
  statusEl.textContent = 'Mengirim doa restu & konfirmasi...';
  btn.disabled = true;

  const payload = {
    slug,
    guest_token: guestToken,
    guest_name: $('rsvpName').value.trim(),
    attendance: $('attendance').value,
    guest_count: Number($('guestCount').value),
    message: $('message').value.trim()
  };

  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal mengirim RSVP.');

    statusEl.className = 'form-status success';
    statusEl.textContent = 'Alhamdulillah, terima kasih! Konfirmasi & doa Anda telah tersimpan.';

    // Tambahkan doa baru ke list realtime
    if (payload.message) {
      const currentCount = Number($('wishesCount').textContent) || 0;
      $('wishesCount').textContent = currentCount + 1;
      const newBubble = `
        <div class="wish-bubble" style="border: 1.5px solid var(--gold-500);">
          <div class="wish-header">
            <span class="wish-name">${esc(payload.guest_name)}</span>
            <span class="wish-badge badge-${esc(payload.attendance)}">${esc(payload.attendance === 'hadir' ? 'Hadir' : (payload.attendance === 'ragu' ? 'Ragu' : 'Tidak Hadir'))}</span>
          </div>
          <p class="wish-msg">${esc(payload.message)}</p>
          <span class="wish-time">Baru saja</span>
        </div>
      `;
      if (currentCount === 0) {
        $('wishesList').innerHTML = newBubble;
      } else {
        $('wishesList').insertAdjacentHTML('afterbegin', newBubble);
      }
    }
    $('message').value = '';
  } catch (err) {
    statusEl.className = 'form-status error';
    statusEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

// Share WhatsApp
$('shareWaBtn').addEventListener('click', () => {
  const d = invitation;
  const groomFirst = (d.groom_name || '').split(/[, ]+/)[0];
  const brideFirst = (d.bride_name || '').split(/[, ]+/)[0];
  const currentUrl = location.href;
  const msg = `Assalamu’alaikum Warahmatullahi Wabarakatuh.\n\nTanpa mengurangi rasa hormat, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan kami:\n\n*${groomFirst} & ${brideFirst}*\n\nDetail acara dan konfirmasi kehadiran dapat dilihat melalui tautan resmi undangan kami berikut:\n${currentUrl}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila berkenan hadir dan memberikan doa restu.\n\nTerima kasih.\nWassalamu’alaikum Warahmatullahi Wabarakatuh.`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
});

init();
