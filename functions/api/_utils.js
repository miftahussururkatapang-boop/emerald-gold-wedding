export const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, no-cache, must-revalidate',
    ...headers
  }
});

export const slugOk = s => typeof s === 'string' && /^[a-z0-9-]{2,60}$/.test(s);

export async function body(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function cookie(req, name) {
  const raw = req.headers.get('Cookie') || '';
  const item = raw.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

const enc = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const dec = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function key(secret) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function makeSession(secret) {
  const payload = enc(new TextEncoder().encode(JSON.stringify({
    exp: Date.now() + 8 * 60 * 60 * 1000,
    nonce: crypto.randomUUID()
  })));
  const sig = await crypto.subtle.sign('HMAC', await key(secret), new TextEncoder().encode(payload));
  return payload + '.' + enc(sig);
}

export async function validSession(req, env) {
  const token = cookie(req, 'egw_session');
  if (!token || !env.SESSION_SECRET) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  try {
    const ok = await crypto.subtle.verify('HMAC', await key(env.SESSION_SECRET), dec(sig), new TextEncoder().encode(payload));
    if (!ok) return false;
    const data = JSON.parse(new TextDecoder().decode(dec(payload)));
    return data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function requireAdmin(req, env) {
  return await validSession(req, env);
}

export const sessionCookie = token => `egw_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`;
export const clearCookie = 'egw_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
