import { json, body, requireAdmin } from '../../../_utils.js';

export async function onRequestGet({ params, request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: 'Belum login.' }, 401);
  const { results = [] } = await env.DB.prepare(`
    SELECT id, guest_name, guest_token, created_at
    FROM guests WHERE invitation_id = ?
    ORDER BY guest_name COLLATE NOCASE ASC
  `).bind(params.id).all();
  return json({ guests: results });
}

export async function onRequestPost({ params, request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: 'Belum login.' }, 401);
  const b = await body(request);
  const name = String(b?.guest_name || '').trim().slice(0, 100);
  if (!name) return json({ error: 'Nama tamu wajib diisi.' }, 400);
  const inv = await env.DB.prepare('SELECT id FROM invitations WHERE id = ?').bind(params.id).first();
  if (!inv) return json({ error: 'Undangan tidak ditemukan.' }, 404);
  const token = crypto.randomUUID().replace(/-/g, '');
  await env.DB.prepare('INSERT INTO guests (invitation_id, guest_name, guest_token) VALUES (?, ?, ?)')
    .bind(params.id, name, token).run();
  return json({ ok: true }, 201);
}
