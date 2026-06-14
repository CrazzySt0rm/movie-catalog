exports.handler = async (event) => {
  const imgPath = event.path.replace(/^\/img/, '');
  const url     = `https://image.tmdb.org/t/p${imgPath}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return { statusCode: res.status, body: '' };

    const buffer      = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return {
      statusCode: 200,
      headers: {
        'Content-Type':  contentType,
        'Cache-Control': 'public, max-age=86400',
      },
      body:             Buffer.from(buffer).toString('base64'),
      isBase64Encoded:  true,
    };
  } catch {
    return { statusCode: 502, body: '' };
  }
};
