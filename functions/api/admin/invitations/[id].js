import { json, body, requireAdmin, slugOk } from '../../_utils.js';

export async function onRequestPut({ params, request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: 'Belum login.' }, 401);
  const b = await body(request);
  if (!b || !slugOk(b.slug) || !b.groom_name || !b.bride_name) {
    return json({ error: 'Data wajib belum lengkap.' }, 400);
  }
  try {
    await env.DB.prepare(`
      UPDATE invitations SET
        slug = ?, groom_name = ?, bride_name = ?, groom_parents = ?, bride_parents = ?,
        event_date = ?, event_time = ?, reception_time = ?, venue = ?, address = ?, maps_url = ?,
        quote_text = ?, story_text = ?, music_url = ?, cover_image = ?, video_url = ?,
        bank_name = ?, bank_account = ?, bank_holder = ?, gift_address = ?,
        gallery_json = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      b.slug, b.groom_name, b.bride_name, b.groom_parents || '', b.bride_parents || '',
      b.event_date || '', b.event_time || '', b.reception_time || '', b.venue || '', b.address || '', b.maps_url || '',
      b.quote_text || '', b.story_text || '', b.music_url || '', b.cover_image || '', b.video_url || '',
      b.bank_name || '', b.bank_account || '', b.bank_holder || '', b.gift_address || '',
      b.gallery_json || '[]', b.is_published ? 1 : 0, params.id
    ).run();
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Gagal memperbarui. Slug mungkin sudah digunakan.' }, 400);
  }
}

export async function onRequestDelete({ params, request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: 'Belum login.' }, 401);
  await env.DB.prepare('DELETE FROM invitations WHERE id = ?').bind(params.id).run();
  return json({ ok: true });
}
