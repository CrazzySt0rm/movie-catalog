const API_KEY   = '58e2fcc65e1f212e130af7aa916b9a7a';
const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function onRequest(context) {
  const url    = new URL(context.request.url);
  const path   = url.pathname.replace(/^\/api/, '') || '/';
  const params = new URLSearchParams(url.search);
  params.set('api_key', API_KEY);

  try {
    const res  = await fetch(`${TMDB_BASE}${path}?${params}`);
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
