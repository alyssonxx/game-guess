let tokenCache = { accessToken: null, expiresAt: 0 };
const countCache = new Map();
const COUNT_CACHE_TTL_MS = 20 * 60 * 1000;

function json(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.json(body);
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function safeSearch(value) {
  return String(value || '').replace(/[\\"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

async function getAppAccessToken(clientId, clientSecret) {
  const now = Date.now();
  if (tokenCache.accessToken && now < tokenCache.expiresAt) return tokenCache.accessToken;

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });

  const response = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(`Twitch OAuth: ${data?.message || 'não foi possível autenticar.'}`);
  }

  const expiresIn = Number(data.expires_in || 0);
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + Math.max(60, expiresIn - 300) * 1000,
  };
  return tokenCache.accessToken;
}

async function igdbPost(path, body, clientId, accessToken) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);
  try {
    const response = await fetch(`https://api.igdb.com/v4/${path}`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'text/plain',
      },
      body,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401) tokenCache = { accessToken: null, expiresAt: 0 };
      const message = Array.isArray(data) ? data?.[0]?.title : data?.message;
      throw new Error(message || `IGDB respondeu HTTP ${response.status}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dedupeGames(games) {
  const seen = new Set();
  return games.filter(game => {
    if (!game?.id || seen.has(game.id)) return false;
    seen.add(game.id);
    return Boolean(game?.name && game?.cover?.url && Array.isArray(game?.screenshots) && game.screenshots.length);
  });
}

function names(list) {
  return (Array.isArray(list) ? list : []).map(x => String(x?.name || '').toLowerCase()).filter(Boolean);
}

function matchesCategory(game, category) {
  if (!category || category === 'all') return true;
  const genres = names(game.genres);
  const themes = names(game.themes);
  const perspectives = names(game.player_perspectives);

  if (category === 'horror') return themes.some(x => x.includes('horror')) || genres.some(x => x.includes('horror'));
  if (category === 'racing') return genres.some(x => x.includes('racing'));
  if (category === 'rpg') return genres.some(x => x.includes('role-playing') || x === 'rpg' || x.includes('rpg'));
  if (category === 'fps') {
    const shooter = genres.some(x => x.includes('shooter'));
    const firstPerson = perspectives.some(x => x.includes('first person'));
    return shooter && (firstPerson || perspectives.length === 0);
  }
  if (category === 'platform') return genres.some(x => x.includes('platform'));
  if (category === 'adventure') return genres.some(x => x.includes('adventure'));
  return true;
}

function randomOffsets(total, chunkSize, count) {
  if (total <= chunkSize) return [0];
  const maxOffset = Math.max(0, total - chunkSize);
  const offsets = [];
  for (let attempt = 0; attempt < count * 8 && offsets.length < count; attempt++) {
    const offset = Math.floor(Math.random() * (maxOffset + 1));
    if (!offsets.some(x => Math.abs(x - offset) < Math.floor(chunkSize * 0.65))) offsets.push(offset);
  }
  if (!offsets.length) offsets.push(0);
  return offsets;
}

function normalizePlatformIds(raw) {
  const values = Array.isArray(raw) ? raw : [raw];
  return [...new Set(values.map(Number).filter(n => Number.isInteger(n) && n > 0 && n < 10000))].slice(0, 30);
}

const GAME_FIELDS = [
  'id','name','url','first_release_date','rating','total_rating','total_rating_count',
  'cover.url','cover.image_id','screenshots.url','screenshots.image_id',
  'platforms.id','platforms.name','genres.name','themes.name','player_perspectives.name',
  'involved_companies.company.name','involved_companies.developer'
].join(',');

async function handleSearch(body, clientId, accessToken) {
  const q = safeSearch(body.query);
  if (q.length < 2) return { results: [] };
  const query = `search "${q}"; fields ${GAME_FIELDS}; where version_parent = null; limit 8;`;
  const data = await igdbPost('games', query, clientId, accessToken);
  return { results: Array.isArray(data) ? data : [] };
}

async function handleSession(body, clientId, accessToken) {
  const platformIds = normalizePlatformIds(body.platformIds ?? body.platformId);
  const startYear = Number(body.startYear);
  const endYear = Number(body.endYear);
  const category = String(body.category || 'all').toLowerCase();
  const requestedLimit = Math.min(180, Math.max(20, Number(body.limit) || 90));
  const currentYear = new Date().getUTCFullYear();

  const valid = platformIds.length > 0 && Number.isInteger(startYear) && Number.isInteger(endYear) &&
    startYear >= 1970 && endYear <= currentYear + 2 && startYear <= endYear && endYear - startYear <= 70;
  if (!valid) throw Object.assign(new Error('Console ou período inválido.'), { status: 400 });

  const startTs = Math.floor(Date.UTC(startYear, 0, 1) / 1000);
  const endTs = Math.floor(Date.UTC(endYear + 1, 0, 1) / 1000);
  const platformFilter = platformIds.length === 1 ? `${platformIds[0]}` : `(${platformIds.join(',')})`;
  const where = `platforms = ${platformFilter} & first_release_date >= ${startTs} & first_release_date < ${endTs} & cover != null & screenshots != null & version_parent = null & total_rating_count > 0`;

  const countKey = `${platformIds.join(',')}:${startYear}:${endYear}`;
  let totalEligible = 0;
  const cached = countCache.get(countKey);
  if (cached && Date.now() - cached.createdAt < COUNT_CACHE_TTL_MS) {
    totalEligible = cached.count;
  } else {
    const countData = await igdbPost('games/count', `where ${where};`, clientId, accessToken);
    totalEligible = Number(countData?.count || 0);
    countCache.set(countKey, { count: totalEligible, createdAt: Date.now() });
  }

  if (!totalEligible) return { games: [], totalEligible: 0, category, offsets: [] };

  // Uma chamada multiquery traz vários pedaços aleatórios do universo, reduzindo repetição
  // e mantendo o consumo bem abaixo do limite de requisições da IGDB.
  const chunkSize = Math.min(160, Math.max(60, Math.ceil(requestedLimit * (category === 'all' ? 1.15 : 1.9))));
  const batchCount = category === 'all' ? 4 : 7;
  const offsets = randomOffsets(totalEligible, Math.min(chunkSize, totalEligible), batchCount);
  const multi = offsets.map((offset, i) => `query games "batch-${i}" { fields ${GAME_FIELDS}; where ${where}; sort id asc; limit ${Math.min(chunkSize, 500)}; offset ${offset}; };`).join('\n');
  const multiData = await igdbPost('multiquery', multi, clientId, accessToken);

  const merged = [];
  for (const entry of Array.isArray(multiData) ? multiData : []) {
    if (Array.isArray(entry?.result)) merged.push(...entry.result);
  }

  let games = dedupeGames(merged).filter(game => matchesCategory(game, category));
  games = shuffle(games).slice(0, requestedLimit);

  return {
    games,
    totalEligible,
    returned: games.length,
    category,
    offsets,
    random: true,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Método não permitido.' });
  }

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return json(res, 500, { error: 'IGDB não configurada. Defina IGDB_CLIENT_ID e IGDB_CLIENT_SECRET no Vercel.' });
  }

  const body = parseBody(req);
  const action = String(body.action || 'session').toLowerCase();

  try {
    const accessToken = await getAppAccessToken(clientId, clientSecret);
    if (action === 'search') return json(res, 200, await handleSearch(body, clientId, accessToken));
    if (action === 'session') return json(res, 200, await handleSession(body, clientId, accessToken));
    return json(res, 400, { error: 'Ação inválida.' });
  } catch (error) {
    console.error('IGDB proxy error:', error);
    const status = Number(error?.status) || 502;
    return json(res, status, { error: error?.name === 'AbortError' ? 'Tempo limite ao consultar a IGDB.' : (error?.message || 'Falha ao consultar a IGDB.') });
  }
}
