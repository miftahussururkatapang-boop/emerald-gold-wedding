import { json, body, makeSession, sessionCookie } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const b = await body(request);
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: 'ADMIN_PASSWORD dan SESSION_SECRET belum dipasang di environment Cloudflare.' }, 500);
  }
  if (!b || typeof b.password !== 'string' || b.password.length > 200) {
    return json({ error: 'Password tidak valid.' }, 400);
  }
  if (b.password !== env.ADMIN_PASSWORD) {
    return json({ error: 'Password salah.' }, 401);
  }
  const token = await makeSession(env.SESSION_SECRET);
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(token) });
}
