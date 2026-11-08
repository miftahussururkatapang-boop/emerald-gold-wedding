import { json, body, slugOk } from './_utils.js';

export async function onRequestPost({ request, env }) {
  const b = await body(request);
  if (!b || !slugOk(b.slug) || !['hadir', 'tidak_hadir', 'ragu'].includes(b.attendance)) {
    return json({ error: 'Data RSVP tidak valid.' }, 400);
  }
  const name = String(b.guest_name || '').trim().slice(0, 100);
  const message = String(b.message || '').trim().slice(0, 500);
  const count = Number(b.guest_count);
  if (!name || !Number.isInteger(count) || count < 1 || count > 10) {
    return json({ error: 'Nama atau jumlah tamu tidak valid.' }, 400);
  }
  const inv = await env.DB.prepare('SELECT id FROM invitations WHERE slug = ? AND is_published = 1').bind(b.slug).first();
  if (!inv) return json({ error: 'Undangan tidak tersedia.' }, 404);

  let guestId = null;
  if (b.guest_token) {
    const guest = await env.DB.prepare('SELECT id FROM guests WHERE invitation_id = ? AND guest_token = ?').bind(inv.id, String(b.guest_token)).first();
    if (guest) guestId = guest.id;
  }

  await env.DB.prepare(`
    INSERT INTO rsvps (invitation_id, guest_id, guest_name, attendance, guest_count, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(inv.id, guestId, name, b.attendance, count, message).run();

  return json({ ok: true });
}
