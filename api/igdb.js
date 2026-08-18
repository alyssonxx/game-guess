let tokenCache = { accessToken: null, expiresAt: 0 };
const countCache = new Map();
const COUNT_CACHE_TTL_MS = 20 * 60 * 1000;
const BRAZIL_FAMOUS = {"7":["Crash Bandicoot","Crash Bandicoot 2: Cortex Strikes Back","Crash Bandicoot: Warped","Crash Team Racing","Winning Eleven 3: Final Ver.","ISS Pro Evolution","ISS Pro Evolution 2","Resident Evil","Resident Evil 2","Resident Evil 3: Nemesis","Dino Crisis","Dino Crisis 2","Metal Gear Solid","Tekken 3","Gran Turismo","Gran Turismo 2","Driver","Driver 2","Tony Hawk's Pro Skater 2","Mortal Kombat Trilogy","Mega Man X4","Castlevania: Symphony of the Night","Silent Hill","Final Fantasy VII","Final Fantasy IX","Spyro the Dragon","Spyro 2: Ripto's Rage!","Twisted Metal 4","Vigilante 8","Yu-Gi-Oh! Forbidden Memories","Jackie Chan Stuntmaster","Pepsiman","Digimon World 3","Marvel vs. Capcom: Clash of Super Heroes"],"8":["Grand Theft Auto: San Andreas","Grand Theft Auto: Vice City","Grand Theft Auto III","God of War","God of War II","Resident Evil 4","Need for Speed: Underground","Need for Speed: Underground 2","Need for Speed: Most Wanted","Need for Speed: Carbon","Black","Guitar Hero II","Guitar Hero III: Legends of Rock","Bully","Shadow of the Colossus","Winning Eleven 10","Pro Evolution Soccer 2008","Pro Evolution Soccer 2010","FIFA Street 2","Dragon Ball Z: Budokai Tenkaichi 3","Dragon Ball Z: Budokai 3","Naruto Shippuden: Ultimate Ninja 5","Mortal Kombat: Shaolin Monks","Mortal Kombat: Armageddon","Mortal Kombat: Deception","Def Jam: Fight for NY","Downhill Domination","Burnout 3: Takedown","Midnight Club 3: DUB Edition","WWE SmackDown! Here Comes the Pain","God Hand","Medal of Honor: Frontline","Tekken 5","Prince of Persia: The Sands of Time","Kingdom Hearts II","Tony Hawk's Underground 2"],"9":["Grand Theft Auto V","Grand Theft Auto IV","The Last of Us","God of War III","Uncharted 2: Among Thieves","Uncharted 3: Drake's Deception","FIFA 13","FIFA 14","Pro Evolution Soccer 2013","Call of Duty: Black Ops II","Call of Duty: Modern Warfare 3","Battlefield 3","Battlefield 4","Minecraft","Red Dead Redemption","The Elder Scrolls V: Skyrim","Assassin's Creed II","Assassin's Creed III","Assassin's Creed IV: Black Flag","Batman: Arkham City","Far Cry 3","Mortal Kombat","Naruto Shippuden: Ultimate Ninja Storm 3","Naruto Shippuden: Ultimate Ninja Storm Revolution","LittleBigPlanet 2","Gran Turismo 5","Gran Turismo 6","Need for Speed: Hot Pursuit","Need for Speed: Most Wanted","Dragon Ball: Xenoverse"],"48":["Grand Theft Auto V","FIFA 17","FIFA 18","FIFA 19","FIFA 20","FIFA 21","FIFA 22","Pro Evolution Soccer 2018","Pro Evolution Soccer 2019","eFootball PES 2020","Fortnite","Minecraft","God of War","Marvel's Spider-Man","The Last of Us Part II","Red Dead Redemption 2","Horizon Zero Dawn","Uncharted 4: A Thief's End","Ghost of Tsushima","Bloodborne","Resident Evil 2","Resident Evil 7 biohazard","Mortal Kombat X","Mortal Kombat 11","Call of Duty: Black Ops III","Call of Duty: Modern Warfare","Rocket League","Fall Guys","Dragon Ball FighterZ","Dragon Ball Xenoverse 2","Naruto Shippuden: Ultimate Ninja Storm 4","Days Gone","The Witcher 3: Wild Hunt","Dark Souls III"],"167":["EA Sports FC 24","EA Sports FC 25","EA Sports FC 26","Grand Theft Auto V","Fortnite","Minecraft","Marvel's Spider-Man 2","God of War Ragnarök","Elden Ring","Resident Evil 4","Hogwarts Legacy","Black Myth: Wukong","Astro Bot","Call of Duty: Modern Warfare III","Call of Duty: Black Ops 6","Mortal Kombat 1","Dragon Ball: Sparking! Zero","Gran Turismo 7","Helldivers 2","Cyberpunk 2077","The Last of Us Part I","Silent Hill 2","Final Fantasy VII Rebirth","Marvel's Spider-Man: Miles Morales"],"11":["Halo: Combat Evolved","Halo 2","Grand Theft Auto: San Andreas","Need for Speed: Underground 2","Need for Speed: Most Wanted","Black","Burnout 3: Takedown","Fable","Forza Motorsport","Tom Clancy's Splinter Cell: Chaos Theory","Ninja Gaiden Black","Star Wars: Knights of the Old Republic","Prince of Persia: The Sands of Time","Mortal Kombat: Shaolin Monks","Def Jam: Fight for NY","Tony Hawk's Underground 2","GTA: Vice City","The Elder Scrolls III: Morrowind"],"12":["Grand Theft Auto V","Minecraft: Xbox 360 Edition","FIFA 13","FIFA 14","FIFA 15","FIFA 16","Pro Evolution Soccer 2013","Call of Duty: Modern Warfare 2","Call of Duty: Modern Warfare 3","Call of Duty: Black Ops","Call of Duty: Black Ops II","Halo 3","Halo: Reach","Halo 4","Gears of War","Gears of War 2","Gears of War 3","Forza Horizon","Red Dead Redemption","The Elder Scrolls V: Skyrim","Far Cry 3","Assassin's Creed II","Assassin's Creed III","Assassin's Creed IV: Black Flag","Grand Theft Auto IV","Kinect Adventures!","Mortal Kombat","Naruto Shippuden: Ultimate Ninja Storm 3","Dragon Ball: Raging Blast 2","Dragon Ball: Xenoverse","Castle Crashers"],"49":["Grand Theft Auto V","FIFA 17","FIFA 18","FIFA 19","FIFA 20","FIFA 21","FIFA 22","FIFA 23","Fortnite","Minecraft","Forza Horizon 3","Forza Horizon 4","Forza Horizon 5","Call of Duty: Warzone","Red Dead Redemption 2","Mortal Kombat 11","Assassin's Creed Origins","Assassin's Creed Odyssey","The Witcher 3: Wild Hunt","Tom Clancy's Rainbow Six Siege","Rocket League","PUBG: Battlegrounds","Halo 5: Guardians","Gears of War 4","Gears 5","Sea of Thieves","Minecraft Dungeons","Resident Evil 2","Resident Evil 7 biohazard"],"169":["Forza Horizon 5","Grand Theft Auto V","Fortnite","Minecraft","EA Sports FC 24","EA Sports FC 25","EA Sports FC 26","Call of Duty: Modern Warfare II","Call of Duty: Modern Warfare III","Call of Duty: Black Ops 6","Halo Infinite","Starfield","Mortal Kombat 1","Elden Ring","Hogwarts Legacy","Cyberpunk 2077","Diablo IV","Palworld","Resident Evil 4","Dragon Ball: Sparking! Zero","Indiana Jones and the Great Circle","Senua's Saga: Hellblade II","Hi-Fi Rush"],"6":["Counter-Strike","Counter-Strike: Condition Zero","Counter-Strike: Source","Counter-Strike: Global Offensive","Counter-Strike 2","Grand Theft Auto: San Andreas","Grand Theft Auto V","Minecraft","League of Legends","Valorant","Tibia","Ragnarök Online","Mu Online","Gunbound","Priston Tale","Point Blank","CrossFire","Dota 2","Warcraft III: Reign of Chaos","Warcraft III: The Frozen Throne","Age of Empires II: The Age of Kings","The Sims","The Sims 2","The Sims 3","The Sims 4","Need for Speed: Underground 2","Need for Speed: Most Wanted","Half-Life","Left 4 Dead 2","Euro Truck Simulator 2","Roblox","Fortnite","World of Warcraft","GTA: Vice City"],"18":["Super Mario Bros.","Super Mario Bros. 3","Contra","Battle City","Bomberman","Mega Man 2","Mega Man 3","Duck Hunt","Excitebike","Double Dragon II: The Revenge","Teenage Mutant Ninja Turtles II: The Arcade Game","Adventure Island","Castlevania","Ninja Gaiden","Ice Climber","Balloon Fight","Tetris"],"19":["Super Mario World","Donkey Kong Country","Donkey Kong Country 2: Diddy's Kong Quest","Donkey Kong Country 3: Dixie Kong's Double Trouble!","Top Gear","Top Gear 2","International Superstar Soccer Deluxe","Street Fighter II Turbo","Super Street Fighter II","Ultimate Mortal Kombat 3","Mortal Kombat II","Super Mario Kart","The Legend of Zelda: A Link to the Past","Mega Man X","Mega Man X2","Mega Man X3","Chrono Trigger","Final Fight","Sunset Riders","Killer Instinct","Goof Troop","Rock N' Roll Racing","F-Zero","Super Metroid","Super Mario World 2: Yoshi's Island","Super Bomberman 4","Super Bomberman 5"],"4":["Super Mario 64","Mario Kart 64","GoldenEye 007","The Legend of Zelda: Ocarina of Time","The Legend of Zelda: Majora's Mask","Super Smash Bros.","Pokémon Stadium","Pokémon Stadium 2","Pokémon Snap","Banjo-Kazooie","Banjo-Tooie","Perfect Dark","Diddy Kong Racing","Mario Party","Mario Party 2","Mario Party 3","International Superstar Soccer 64","International Superstar Soccer 2000","Mortal Kombat 4","Star Fox 64","Donkey Kong 64","FIFA 99","Wave Race 64"],"21":["Mario Kart: Double Dash!!","Super Smash Bros. Melee","Super Mario Sunshine","The Legend of Zelda: The Wind Waker","The Legend of Zelda: Twilight Princess","Resident Evil 4","Luigi's Mansion","Mario Party 4","Mario Party 5","Mario Party 6","Mario Party 7","Pokémon Colosseum","Pokémon XD: Gale of Darkness","Need for Speed: Underground 2","Need for Speed: Most Wanted","Sonic Adventure 2: Battle","SoulCalibur II","Paper Mario: The Thousand-Year Door","Metroid Prime","Naruto: Clash of Ninja 2"],"5":["Wii Sports","Mario Kart Wii","New Super Mario Bros. Wii","Wii Sports Resort","Just Dance 2","Just Dance 3","Just Dance 4","Super Mario Galaxy","Super Mario Galaxy 2","Super Smash Bros. Brawl","The Legend of Zelda: Twilight Princess","The Legend of Zelda: Skyward Sword","Guitar Hero III: Legends of Rock","Guitar Hero World Tour","Donkey Kong Country Returns","Mario Party 8","Mario Party 9","Resident Evil 4: Wii Edition","Sonic Colors","Wii Fit","Wii Play"],"41":["Mario Kart 8","Super Smash Bros. for Wii U","Super Mario 3D World","New Super Mario Bros. U","Splatoon","The Legend of Zelda: Breath of the Wild","Nintendo Land","Super Mario Maker","Donkey Kong Country: Tropical Freeze","The Legend of Zelda: The Wind Waker HD","Yoshi's Woolly World","Hyrule Warriors","Minecraft: Wii U Edition","Pokkén Tournament","Mario Party 10"],"130":["Mario Kart 8 Deluxe","The Legend of Zelda: Breath of the Wild","The Legend of Zelda: Tears of the Kingdom","Super Mario Odyssey","Super Smash Bros. Ultimate","Animal Crossing: New Horizons","Pokémon Sword","Pokémon Shield","Pokémon Scarlet","Pokémon Violet","Pokémon Legends: Arceus","Fortnite","Minecraft","FIFA 18","FIFA 19","FIFA 20","FIFA 21","FIFA 22","FIFA 23 Legacy Edition","EA Sports FC 24","EA Sports FC 25","Mario Party Superstars","Super Mario Party Jamboree","Super Mario Bros. Wonder","Luigi's Mansion 3","Splatoon 2","Splatoon 3","Pokémon: Let's Go, Pikachu!","Pokémon: Let's Go, Eevee!","Fall Guys","Cuphead","Hollow Knight","Super Mario Party"]};


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

function normalizeTitle(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleMatchesCurated(gameName, curatedName) {
  const a = normalizeTitle(gameName);
  const b = normalizeTitle(curatedName);
  if (!a || !b) return false;
  if (a === b) return true;
  // Aceita subtítulos/edições da IGDB sem transformar nomes curtos em falsos positivos.
  if (b.length >= 9 && (a.startsWith(b + ' ') || b.startsWith(a + ' '))) return true;
  return false;
}

function brazilFamousForPlatform(game, platformId) {
  const curated = BRAZIL_FAMOUS[platformId] || [];
  return curated.some(name => titleMatchesCurated(game?.name, name));
}

async function fetchBrazilFamous(platformIds, startTs, endTs, requestedLimit, clientId, accessToken) {
  const ids = platformIds.filter(id => Array.isArray(BRAZIL_FAMOUS[id]) && BRAZIL_FAMOUS[id].length);
  if (!ids.length) return [];
  const all = [];
  // Até 8 consultas por multiquery; em seleção "Todas", dividimos em poucos lotes sequenciais.
  for (let start = 0; start < ids.length; start += 8) {
    const group = ids.slice(start, start + 8);
    const multi = group.map((platformId, i) => {
      const where = `platforms = ${platformId} & first_release_date >= ${startTs} & first_release_date < ${endTs} & cover != null & screenshots != null & version_parent = null`;
      return `query games "br-${platformId}-${i}" { fields ${GAME_FIELDS}; where ${where}; sort total_rating_count desc; limit 500; };`;
    }).join('\n');
    const data = await igdbPost('multiquery', multi, clientId, accessToken);
    for (let i = 0; i < group.length; i++) {
      const platformId = group[i];
      const entry = (Array.isArray(data) ? data : []).find(x => x?.name === `br-${platformId}-${i}`) || (Array.isArray(data) ? data[i] : null);
      const result = Array.isArray(entry?.result) ? entry.result : [];
      for (const game of result) if (brazilFamousForPlatform(game, platformId)) all.push(game);
    }
    if (start + 8 < ids.length) await new Promise(resolve => setTimeout(resolve, 280));
  }
  return shuffle(dedupeGames(all)).slice(0, requestedLimit);
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

  if (category === 'brazil') {
    const games = await fetchBrazilFamous(platformIds, startTs, endTs, requestedLimit, clientId, accessToken);
    return {
      games,
      totalEligible: games.length,
      returned: games.length,
      category,
      curated: true,
      random: true,
      note: 'Curadoria cultural brasileira por plataforma; não é ranking oficial de vendas.'
    };
  }

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
