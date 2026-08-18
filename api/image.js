const ALLOWED_SIZES = new Set([
  'thumb', 'cover_small', 'cover_big', 'cover_big_2x',
  'screenshot_med', 'screenshot_big', 'screenshot_huge',
  '720p', '1080p'
]);

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function cleanId(value) {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9_-]{3,120}$/.test(id) ? id : '';
}

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'GameGuess/4.2 image-proxy'
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  const id = cleanId(req.query?.id);
  const requestedSize = String(req.query?.size || 'screenshot_big');
  if (!id || !ALLOWED_SIZES.has(requestedSize)) {
    return sendJson(res, 400, { error: 'Imagem ou tamanho inválido.' });
  }

  // Se uma variante específica não existir, tenta automaticamente tamanhos
  // compatíveis antes de declarar a imagem como indisponível.
  const fallbackSizes = requestedSize.startsWith('cover')
    ? [requestedSize, 'cover_big_2x', 'cover_big', 'cover_small']
    : [requestedSize, 'screenshot_huge', 'screenshot_big', '720p'];

  const uniqueSizes = [...new Set(fallbackSizes)].filter(x => ALLOWED_SIZES.has(x));

  try {
    for (const size of uniqueSizes) {
      const upstreamUrl = `https://images.igdb.com/igdb/image/upload/t_${size}/${id}.jpg`;
      const upstream = await fetchWithTimeout(upstreamUrl);
      if (!upstream.ok) continue;

      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      if (!contentType.toLowerCase().startsWith('image/')) continue;

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
      res.setHeader('X-Game-Guess-Image-Proxy', 'IGDB');
      if (req.method === 'HEAD') return res.end();

      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Length', String(bytes.length));
      return res.end(bytes);
    }

    return sendJson(res, 404, { error: 'Imagem não encontrada na IGDB.' });
  } catch (error) {
    console.error('IGDB image proxy:', error);
    if (error?.name === 'AbortError') return sendJson(res, 504, { error: 'A imagem da IGDB demorou demais para responder.' });
    return sendJson(res, 502, { error: 'Falha ao carregar a imagem da IGDB.' });
  }
}
