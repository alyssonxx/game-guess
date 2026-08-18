let tokenCache = {
  accessToken: null,
  expiresAt: 0,
};

const gamesCache = new Map();
const GAME_CACHE_TTL_MS = 10 * 60 * 1000;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.json(body);
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

async function getAppAccessToken(clientId, clientSecret) {
  const now = Date.now();
  if (tokenCache.accessToken && now < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });

  const response = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const message = data?.message || 'Não foi possível autenticar com a Twitch.';
    throw new Error(`Twitch OAuth: ${message}`);
  }

  const expiresIn = Number(data.expires_in || 0);
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + Math.max(60, expiresIn - 300) * 1000,
  };
  return tokenCache.accessToken;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Método não permitido.' });
  }

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return json(res, 500, {
      error: 'IGDB não configurada no servidor. Defina IGDB_CLIENT_ID e IGDB_CLIENT_SECRET no Vercel.',
    });
  }

  const body = parseBody(req);
  const platformId = Number(body.platformId);
  const startYear = Number(body.startYear);
  const endYear = Number(body.endYear);
  const currentYear = new Date().getUTCFullYear();

  const valid =
    Number.isInteger(platformId) && platformId > 0 && platformId < 10000 &&
    Number.isInteger(startYear) && Number.isInteger(endYear) &&
    startYear >= 1950 && endYear <= currentYear + 2 &&
    startYear <= endYear && endYear - startYear <= 70;

  if (!valid) {
    return json(res, 400, { error: 'Console ou período inválido.' });
  }

  const cacheKey = `${platformId}:${startYear}:${endYear}`;
  const cached = gamesCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < GAME_CACHE_TTL_MS) {
    res.setHeader('X-Game-Guess-Cache', 'HIT');
    return json(res, 200, { games: cached.games, cached: true });
  }

  try {
    const accessToken = await getAppAccessToken(clientId, clientSecret);
    const startTs = Math.floor(Date.UTC(startYear, 0, 1) / 1000);
    const endTs = Math.floor(Date.UTC(endYear + 1, 0, 1) / 1000);

    // Mantemos a consulta ampla e descartamos entradas sem nome/capa no frontend.
    // involved_companies.developer permite exibir a desenvolvedora com mais precisão.
    const query = [
      'fields name,cover.url,first_release_date,platforms.name,genres.name,involved_companies.company.name,involved_companies.developer,summary,total_rating_count;',
      `where platforms = (${platformId}) & first_release_date >= ${startTs} & first_release_date < ${endTs} & cover != null;`,
      'sort total_rating_count desc;',
      'limit 200;',
    ].join(' ');

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'text/plain',
      },
      body: query,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      // Se o token tiver sido invalidado, força renovação na próxima chamada.
      if (response.status === 401) tokenCache = { accessToken: null, expiresAt: 0 };
      const apiMessage = Array.isArray(data) ? data?.[0]?.title : data?.message;
      throw new Error(apiMessage || `IGDB respondeu HTTP ${response.status}`);
    }

    if (!Array.isArray(data)) {
      throw new Error('A IGDB retornou um formato inesperado.');
    }

    const games = data.filter(game => game?.name && game?.cover?.url);
    gamesCache.set(cacheKey, { createdAt: Date.now(), games });

    // Limpa entradas antigas para não crescer indefinidamente em instâncias quentes.
    if (gamesCache.size > 60) {
      const oldest = [...gamesCache.entries()]
        .sort((a, b) => a[1].createdAt - b[1].createdAt)
        .slice(0, 20);
      oldest.forEach(([key]) => gamesCache.delete(key));
    }

    res.setHeader('X-Game-Guess-Cache', 'MISS');
    return json(res, 200, { games, cached: false });
  } catch (error) {
    console.error('IGDB proxy error:', error);
    return json(res, 502, {
      error: error?.message || 'Falha ao consultar a IGDB.',
    });
  }
}
