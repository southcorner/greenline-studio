export async function onRequestGet({ env }) {
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/content.json?ref=${env.GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Greenline-CMS/1.0',
    },
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'GitHub fetch failed', status: res.status }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const data    = await res.json();
  // atob() returns a binary string (one char per byte). For UTF-8 content we
  // must decode those bytes as UTF-8, not treat them as Latin-1 characters.
  const rawStr  = atob(data.content.replace(/\n/g, ''));
  const bytes   = Uint8Array.from(rawStr, c => c.charCodeAt(0));
  const content = JSON.parse(new TextDecoder('utf-8').decode(bytes));

  return new Response(JSON.stringify({ content, sha: data.sha }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
