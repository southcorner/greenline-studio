export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }

  const { content, sha } = body;
  if (!content || !sha) {
    return new Response(JSON.stringify({ error: 'Missing content or sha' }), { status: 400 });
  }

  // btoa with encodeURIComponent handles non-ASCII characters (curly quotes etc.)
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

  const res = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/contents/content.json`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Greenline-CMS/1.0',
      },
      body: JSON.stringify({
        message: 'chore: update site content via CMS',
        content: encoded,
        sha,
        branch: env.GITHUB_BRANCH,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const status = res.status === 409 ? 409 : 500;
    return new Response(
      JSON.stringify({ error: status === 409 ? 'conflict' : 'GitHub update failed', detail: err.message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = await res.json();
  return new Response(JSON.stringify({ ok: true, commit: result.commit?.sha }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
