const KP_WORKER = 'https://wispy-scene-d3da.jonekarter85.workers.dev/v1.4';

export async function onRequest(context) {
  const url    = new URL(context.request.url);
  const path   = url.pathname.replace(/^\/kp/, '') || '/';
  const target = `${KP_WORKER}${path}?${url.searchParams}`;

  try {
    const res  = await fetch(target);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'public, max-age=300',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
