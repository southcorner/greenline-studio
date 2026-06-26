const COOKIE = 'gl_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

async function verify(cookieHeader, password) {
  if (!cookieHeader) return false;
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const parts = m[1].split('.');
  if (parts.length !== 2) return false;
  const [hmacB64, tsStr] = parts;
  const ts = parseInt(tsStr, 10);
  if (isNaN(ts) || Date.now() - ts > MAX_AGE_MS) return false;

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`gl-admin:${ts}`))
  );
  const actual = Uint8Array.from(
    atob(hmacB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)
  );
  if (expected.length !== actual.length) return false;
  return expected.every((b, i) => b === actual[i]);
}

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/admin/')) return next();
  // Login endpoint is always public
  if (url.pathname === '/admin/login') return next();

  const authed = await verify(request.headers.get('Cookie') || '', env.ADMIN_PASSWORD || '');
  if (!authed && url.pathname.startsWith('/admin/api/')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }
  // For /admin/ page itself, pass through — the UI handles the unauthed state
  return next();
}
