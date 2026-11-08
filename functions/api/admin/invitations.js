import { json, body, requireAdmin, slugOk } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: 'Belum login.' }, 401);
  const { results = [] } = await env.DB.prepare(`
    SELECT i.*,
      (SELECT COUNT(*) FROM rsvps r WHERE r.invitation_id = i.id) AS rsvp_count,
      (SELECT COALESCE(SUM(guest_count), 0) FROM rsvps r WHERE r.invitation_id = i.id AND attendance = 'hadir') AS attend_count,
      (SELECT COUNT(*) FROM guests g WHERE g.invitation_id = i.id) AS guest_count
    FROM invitations i
    ORDER BY i.created_at DESC
  `).all();
  return json({ invitations: results });
}

export async function onRequestPost({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: 'Belum login.' }, 401);
  const b = await body(request);
  if (!b || !slugOk(b.slug) || !b.groom_name || !b.bride_name) {
    return json({ error: 'Slug dan nama kedua mempelai wajib diisi.' }, 400);
  }
  try {
    const r = await env.DB.prepare(`
      INSERT INTO invitations (
        slug, groom_name, bride_name, groom_parents, bride_parents,
        event_date, event_time, reception_time, venue, address, maps_url,
        quote_text, story_text, music_url, cover_image, video_url,
        bank_name, bank_account, bank_holder, gift_address,
        gallery_json, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      b.slug, b.groom_name, b.bride_name, b.groom_parents || '', b.bride_parents || '',
      b.event_date || '', b.event_time || '', b.reception_time || '', b.venue || '', b.address || '', b.maps_url || '',
      b.quote_text || '', b.story_text || '', b.music_url || '', b.cover_image || '', b.video_url || '',
      b.bank_name || '', b.bank_account || '', b.bank_holder || '', b.gift_address || '',
      b.gallery_json || '[]', b.is_published ? 1 : 0
    ).run();
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  } catch (e) {
    return json({ error: 'Gagal menyimpan. Pastikan slug belum pernah digunakan.' }, 400);
  }
}
