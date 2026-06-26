const COOKIE = 'gl_session';

async function makeCookie(password) {
  const ts  = Date.now();
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`gl-admin:${ts}`))
  );
  const b64 = btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${b64}.${ts}`;
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }

  // Always compute HMAC to resist timing attacks
  const cookie = await makeCookie(env.ADMIN_PASSWORD || 'dummy');

  if (!env.ADMIN_PASSWORD || body.password !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `${COOKIE}=${cookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
    }
  });
}
