import { json, requireAdmin } from '../../_utils.js';

export async function onRequestDelete({ params, request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: 'Belum login.' }, 401);
  await env.DB.prepare('DELETE FROM guests WHERE id = ?').bind(params.id).run();
  return json({ ok: true });
}
