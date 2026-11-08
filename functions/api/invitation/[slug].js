import { json } from '../_utils.js';

export async function onRequestGet({ params, request, env }) {
  const slug = params.slug;
  const row = await env.DB.prepare('SELECT * FROM invitations WHERE slug = ? AND is_published = 1').bind(slug).first();
  if (!row) return json({ error: 'Undangan tidak ditemukan atau belum diterbitkan.' }, 404);

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  let guestToken = null;
  if (token) {
    const guest = await env.DB.prepare('SELECT id, guest_name, guest_token FROM guests WHERE invitation_id = ? AND guest_token = ?')
      .bind(row.id, token).first();
    if (guest) guestToken = guest.guest_token;
  }

  // Load public guest wishes (RSVP messages)
  const { results: rsvps = [] } = await env.DB.prepare(`
    SELECT guest_name, attendance, message, created_at
    FROM rsvps
    WHERE invitation_id = ? AND message IS NOT NULL AND TRIM(message) != ''
    ORDER BY created_at DESC
    LIMIT 100
  `).bind(row.id).all();

  return json({ invitation: row, guestToken, rsvps });
}
