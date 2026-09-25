/**
 * Proxy somente-leitura para recursos binários do Mapillary hospedados no CDN da Meta.
 * Evita falhas do MapillaryJS quando o navegador/rede bloqueia requisições diretas a fbcdn.net.
 */
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_REDIRECTS = 4;

function allowedHost(hostname = '') {
  const h = String(hostname).toLowerCase();
  return h === 'fbcdn.net' || h.endsWith('.fbcdn.net') ||
    h === 'cdninstagram.com' || h.endsWith('.cdninstagram.com') ||
    h === 'fbsbx.com' || h.endsWith('.fbsbx.com');
}

function parseAllowedUrl(value) {
  let u;
  try { u = new URL(String(value || '')); } catch { return null; }
  if (u.protocol !== 'https:' || !allowedHost(u.hostname)) return null;
  return u;
}

async function fetchSafe(startUrl, signal) {
  let current = startUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const r = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: {
        'Accept': 'image/avif,image/webp,image/*,application/octet-stream,*/*;q=0.8',
        'User-Agent': 'GameGuess-MapillaryProxy/20.4'
      }
    });

    if (r.status >= 300 && r.status < 400) {
      const location = r.headers.get('location');
      if (!location) return r;
      const next = new URL(location, current);
      if (next.protocol !== 'https:' || !allowedHost(next.hostname)) {
        throw new Error('Redirecionamento do CDN não permitido');
      }
      current = next;
      continue;
    }
    return r;
  }
  throw new Error('Redirecionamentos demais');
}

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const target = parseAllowedUrl(req.query?.url);
  if (!target) {
    return res.status(400).json({ error: 'Invalid Mapillary CDN URL' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const upstream = await fetchSafe(target, controller.signal);
    if (!upstream.ok) {
      return res.status(upstream.status || 502).json({
        error: 'Mapillary CDN request failed',
        status: upstream.status
      });
    }

    const declared = Number(upstream.headers.get('content-length') || 0);
    if (declared > MAX_BYTES) {
      return res.status(413).json({ error: 'Mapillary resource too large' });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return res.status(413).json({ error: 'Mapillary resource too large' });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    res.setHeader('X-GameGuess-Mapillary-Proxy', '1');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'HEAD') return res.end();
    return res.end(buffer);
  } catch (e) {
    if (e?.name === 'AbortError') {
      return res.status(504).json({ error: 'Mapillary CDN proxy timeout' });
    }
    console.error('[Mapillary Proxy]', e);
    return res.status(502).json({ error: 'Mapillary CDN proxy failed', message: e?.message || String(e) });
  } finally {
    clearTimeout(timer);
  }
}
