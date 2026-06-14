export async function onRequest(context) {
  const url     = new URL(context.request.url);
  const imgPath = url.pathname.replace(/^\/img/, '');
  const tmdbUrl = `https://image.tmdb.org/t/p${imgPath}`;

  try {
    const res = await fetch(tmdbUrl);
    if (!res.ok) return new Response('', { status: res.status });

    const body        = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type':  contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response('', { status: 502 });
  }
}
