const API_KEY   = '58e2fcc65e1f212e130af7aa916b9a7a';
const TMDB_BASE = 'https://api.themoviedb.org/3';

exports.handler = async (event) => {
  const tmdbPath = event.path.replace(/^\/api/, '') || '/';
  const params   = new URLSearchParams(event.queryStringParameters || {});
  params.set('api_key', API_KEY);

  try {
    const res  = await fetch(`${TMDB_BASE}${tmdbPath}?${params}`);
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'public, max-age=300',
      },
      body,
    };
  } catch {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Proxy error' }),
    };
  }
};
