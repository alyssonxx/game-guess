(() => {
  'use strict';

  const API_URL = '/api/igdb';
  const CURRENT_YEAR = new Date().getFullYear();
  const STORAGE_KEY = 'gameGuessArcadeV4'; // mantido para preservar progresso da V4

  const CONSOLES = {
    ps1:{name:'PlayStation 1',short:'PS1',icon:'🎮',id:7,years:[1994,2000],family:'playstation'},
    ps2:{name:'PlayStation 2',short:'PS2',icon:'🎮',id:8,years:[2000,2006],family:'playstation'},
    ps3:{name:'PlayStation 3',short:'PS3',icon:'🎮',id:9,years:[2006,2017],family:'playstation'},
    ps4:{name:'PlayStation 4',short:'PS4',icon:'🎮',id:48,years:[2013,2026],family:'playstation'},
    ps5:{name:'PlayStation 5',short:'PS5',icon:'🎮',id:167,years:[2020,2026],family:'playstation'},
    xbox:{name:'Xbox',short:'Xbox',icon:'🟢',id:11,years:[2001,2008],family:'xbox'},
    xbox360:{name:'Xbox 360',short:'360',icon:'🟢',id:12,years:[2005,2016],family:'xbox'},
    xboxone:{name:'Xbox One',short:'One',icon:'🟢',id:49,years:[2013,2026],family:'xbox'},
    xsx:{name:'Xbox Series X|S',short:'Series',icon:'🟢',id:169,years:[2020,2026],family:'xbox'},
    pc:{name:'PC (Windows)',short:'PC',icon:'💻',id:6,years:[1980,2026],family:'pc'},
    nes:{name:'NES',short:'NES',icon:'🔴',id:18,years:[1983,1995],family:'nintendo'},
    snes:{name:'Super Nintendo',short:'SNES',icon:'🟣',id:19,years:[1990,1998],family:'nintendo'},
    n64:{name:'Nintendo 64',short:'N64',icon:'🟡',id:4,years:[1996,2002],family:'nintendo'},
    gamecube:{name:'GameCube',short:'GC',icon:'🟣',id:21,years:[2001,2007],family:'nintendo'},
    wii:{name:'Wii',short:'Wii',icon:'⚪',id:5,years:[2006,2014],family:'nintendo'},
    wiiu:{name:'Wii U',short:'Wii U',icon:'⚪',id:41,years:[2012,2018],family:'nintendo'},
    switch:{name:'Nintendo Switch',short:'Switch',icon:'🔴',id:130,years:[2017,2026],family:'nintendo'}
  };

  const MODES = {
    quick:{title:'Jogo Rápido',icon:'⚡',glow:'#42e8ff',desc:'Entre e jogue imediatamente. Um desafio totalmente aleatório.',tag:'1 rodada • sem configuração',setup:false},
    classic:{title:'Clássico',icon:'🧠',glow:'#a97cff',desc:'Escolha plataforma, época, tema e dificuldade. O Game Guess tradicional turbinado.',tag:'20 rodadas',setup:true},
    survival:{title:'Survival',icon:'❤️',glow:'#ff6277',desc:'Você começa com 3 vidas. Cada jogo perdido custa uma vida. Até onde consegue chegar?',tag:'3 vidas • recorde de sobrevivência',setup:true},
    blitz:{title:'Blitz',icon:'⏱️',glow:'#ffc857',desc:'Dois minutos. Acerte o máximo de jogos possível antes do relógio zerar.',tag:'120 segundos',setup:true},
    mystery:{title:'Console Misterioso',icon:'🕵️',glow:'#56f39a',desc:'As plataformas são misturadas e você não sabe de qual console veio cada jogo.',tag:'plataforma vira pista',setup:true},
    decades:{title:'Décadas',icon:'📼',glow:'#ff9d5c',desc:'Viaje pelos anos 80, 90, 2000, 2010 ou 2020 misturando plataformas da época.',tag:'nostalgia pura',setup:true},
    themed:{title:'Temático',icon:'👻',glow:'#ff54e8',desc:'Terror, corrida, RPG, tiro, aventura ou famílias de consoles.',tag:'sessões por categoria',setup:true},
    random:{title:'Caos Aleatório',icon:'🎲',glow:'#74f6d2',desc:'Plataformas, screenshots, pistas e até a dificuldade mudam durante a partida.',tag:'tudo randomizado',setup:false}
  };

  const DIFFICULTIES = {
    easy:{title:'Fácil',icon:'🌱',attempts:6,initialPieces:2,scoreMult:.85,zoom:1,redaction:.30,clueLevel:0,coinBonus:0},
    normal:{title:'Normal',icon:'🎯',attempts:6,initialPieces:1,scoreMult:1,zoom:1,redaction:.52,clueLevel:1,coinBonus:10},
    hard:{title:'Difícil',icon:'🔥',attempts:5,initialPieces:0,scoreMult:1.35,zoom:1.15,redaction:.72,clueLevel:2,coinBonus:25},
    insane:{title:'Insano',icon:'💀',attempts:3,initialPieces:0,scoreMult:1.8,zoom:1.38,redaction:.88,clueLevel:3,coinBonus:45}
  };

  const DECADES = {
    all:{title:'Todas',range:[1980,CURRENT_YEAR]},
    d80:{title:'Anos 80',range:[1980,1989]},
    d90:{title:'Anos 90',range:[1990,1999]},
    d00:{title:'Anos 2000',range:[2000,2009]},
    d10:{title:'Anos 2010',range:[2010,2019]},
    d20:{title:'Anos 2020',range:[2020,CURRENT_YEAR]}
  };

  const CATEGORIES = {
    all:{title:'Todos',icon:'🎲',kind:'all'},
    brazil:{title:'Famosos no Brasil',icon:'🇧🇷',kind:'brazil'},
    horror:{title:'Terror',icon:'👻',kind:'semantic'},
    racing:{title:'Corrida',icon:'🏎️',kind:'semantic'},
    rpg:{title:'RPG',icon:'⚔️',kind:'semantic'},
    fps:{title:'Tiro / FPS',icon:'🔫',kind:'semantic'},
    platform:{title:'Plataforma',icon:'🍄',kind:'semantic'},
    adventure:{title:'Aventura',icon:'🧭',kind:'semantic'},
    playstation:{title:'PlayStation Classics',icon:'🔵',kind:'family'},
    xbox:{title:'Xbox Classics',icon:'🟢',kind:'family'},
    nintendo:{title:'Nintendo',icon:'🔴',kind:'family'},
    pc:{title:'PC',icon:'💻',kind:'family'},
    retro:{title:'Retrô',icon:'🕹️',kind:'retro'}
  };

  // Traduções dos metadados da IGDB. As pistas nunca exibem a summary original em inglês.
  const GENRE_PT = {
    'point-and-click':'Apontar e clicar','fighting':'Luta','shooter':'Tiro','music':'Musical','platform':'Plataforma',
    'puzzle':'Quebra-cabeça','racing':'Corrida','real time strategy (rts)':'Estratégia em tempo real','role-playing (rpg)':'RPG',
    'simulator':'Simulação','sport':'Esporte','strategy':'Estratégia','turn-based strategy (tbs)':'Estratégia por turnos',
    'tactical':'Tático','hack and slash/beat \'em up':'Ação corpo a corpo','quiz/trivia':'Perguntas e respostas','pinball':'Pinball',
    'adventure':'Aventura','indie':'Independente','arcade':'Arcade','visual novel':'Novela visual','card & board game':'Cartas e tabuleiro',
    'moba':'Arena de batalha online'
  };
  const THEME_PT = {
    'action':'Ação','fantasy':'Fantasia','science fiction':'Ficção científica','horror':'Terror','thriller':'Suspense','survival':'Sobrevivência',
    'historical':'Histórico','stealth':'Furtividade','comedy':'Comédia','business':'Negócios','drama':'Drama','non-fiction':'Não ficção',
    'sandbox':'Mundo livre','educational':'Educacional','kids':'Infantil','open world':'Mundo aberto','warfare':'Guerra','party':'Festa',
    '4x (explore, expand, exploit, and exterminate)':'Estratégia 4X','erotic':'Adulto','mystery':'Mistério','romance':'Romance'
  };
  const PERSPECTIVE_PT = {
    'first person':'Primeira pessoa','third person':'Terceira pessoa','bird view / isometric':'Visão aérea / isométrica','side view':'Visão lateral',
    'text':'Baseado em texto','auditory':'Foco em áudio','virtual reality':'Realidade virtual'
  };

  const labelKey = value => String(value || '').trim().toLowerCase();
  function translateGenre(value) { return GENRE_PT[labelKey(value)] || 'Outro estilo'; }
  function translateTheme(value) { return THEME_PT[labelKey(value)] || 'Tema variado'; }
  function translatePerspective(value) { return PERSPECTIVE_PT[labelKey(value)] || 'Perspectiva variável'; }
  function translatedGenres(game) { return [...new Set((game?.genres||[]).map(g=>translateGenre(g?.name)).filter(Boolean))]; }
  function translatedThemes(game) { return [...new Set((game?.themes||[]).map(t=>translateTheme(t?.name)).filter(x=>x&&x!=='Tema variado'))]; }
  function translatedPerspectives(game) { return [...new Set((game?.player_perspectives||[]).map(p=>translatePerspective(p?.name)).filter(x=>x&&x!=='Perspectiva variável'))]; }

  function decadePhrase(ts) {
    if(!ts) return 'uma época não informada';
    const y=new Date(ts*1000).getUTCFullYear(), dec=Math.floor(y/10)*10, pos=y-dec;
    const phase=pos<=2?'início':pos<=6?'meados':'fim';
    return `${phase} dos anos ${dec}`;
  }

  function mechanicFlavor(game) {
    const keys=(game?.genres||[]).map(g=>labelKey(g?.name));
    const options=[];
    const add=(test,text)=>{ if(keys.some(k=>test(k))) options.push(text); };
    add(k=>k.includes('platform'),'movimentação precisa, saltos e domínio dos cenários');
    add(k=>k.includes('shooter'),'combate à distância, mira e posicionamento');
    add(k=>k.includes('role-playing')||k==='rpg'||k.includes('rpg'),'progressão, evolução de habilidades e escolhas de equipamento');
    add(k=>k.includes('adventure'),'exploração, descoberta e avanço por ambientes variados');
    add(k=>k.includes('puzzle'),'observação, raciocínio e resolução de desafios');
    add(k=>k.includes('racing'),'velocidade, trajetórias e disputa por tempo ou posição');
    add(k=>k.includes('fighting'),'confrontos diretos, leitura do adversário e execução de golpes');
    add(k=>k.includes('strategy')||k.includes('tactical'),'planejamento, posicionamento e decisões táticas');
    add(k=>k.includes('simulator'),'sistemas que simulam ou reinterpretam uma atividade');
    add(k=>k.includes('sport'),'competição inspirada em modalidades esportivas');
    add(k=>k.includes('hack and slash')||k.includes("beat 'em up"),'combate corpo a corpo veloz contra vários adversários');
    add(k=>k.includes('visual novel'),'narrativa, diálogos e escolhas do jogador');
    add(k=>k.includes('arcade'),'partidas diretas, resposta rápida e busca por desempenho');
    add(k=>k.includes('moba'),'batalhas em equipe, controle de mapa e objetivos');
    add(k=>k.includes('card & board'),'combinações, cartas e planejamento');
    add(k=>k.includes('music'),'ritmo, precisão e ações sincronizadas à música');
    add(k=>k.includes('point-and-click'),'exploração de cenários e interação cuidadosa com objetos');
    return options.length?randomChoice(options):'exploração e domínio gradual de suas mecânicas';
  }

  function atmosphereFlavor(game) {
    const keys=(game?.themes||[]).map(t=>labelKey(t?.name));
    const options=[];
    const add=(test,text)=>{ if(keys.some(k=>test(k))) options.push(text); };
    add(k=>k==='fantasy','um universo de fantasia e elementos fora do cotidiano');
    add(k=>k==='science fiction','tecnologia, futuro ou ficção científica');
    add(k=>k==='horror','tensão, ameaça e uma atmosfera sombria');
    add(k=>k==='thriller','suspense e sensação constante de perigo');
    add(k=>k==='survival','sobrevivência, risco e administração de recursos');
    add(k=>k==='historical','referências a períodos e acontecimentos históricos');
    add(k=>k==='stealth','furtividade, observação e evitar confrontos desnecessários');
    add(k=>k==='comedy','humor e situações menos sérias');
    add(k=>k==='drama','conflitos pessoais e uma narrativa mais dramática');
    add(k=>k==='sandbox'||k==='open world','liberdade para explorar e escolher caminhos');
    add(k=>k==='warfare','conflitos armados e cenários de guerra');
    add(k=>k==='mystery','mistério, pistas e descoberta gradual de informações');
    add(k=>k==='romance','relações e vínculos entre personagens');
    add(k=>k==='action','ritmo de ação e situações de confronto');
    return options.length?randomChoice(options):'uma ambientação que depende mais da experiência do que de um tema único';
  }

  function perspectiveFlavor(game) {
    const keys=(game?.player_perspectives||[]).map(p=>labelKey(p?.name));
    if(keys.some(k=>k==='first person')) return 'a ação é vista pelos olhos do personagem';
    if(keys.some(k=>k==='third person')) return 'a câmera acompanha o personagem por fora';
    if(keys.some(k=>k.includes('bird view')||k.includes('isometric'))) return 'a visão privilegia leitura de área e posicionamento';
    if(keys.some(k=>k==='side view')) return 'a ação é apresentada principalmente de lado';
    if(keys.some(k=>k==='virtual reality')) return 'a apresentação foi pensada para realidade virtual';
    return 'a câmera não é a principal pista desta rodada';
  }

  const ASSIST_COSTS = { piece:100, letters:150, first:200, platform:250 };

  const ACHIEVEMENTS = {
    firstWin:{icon:'🎯',title:'Primeiro Acerto',desc:'Acerte seu primeiro jogo.',reward:50},
    nostalgia:{icon:'📼',title:'Nostalgia',desc:'Acerte 10 jogos do PlayStation 1.',reward:120},
    unstoppable:{icon:'🔥',title:'Imparável',desc:'Chegue a 10 acertos seguidos.',reward:180},
    encyclopedia:{icon:'🧠',title:'Enciclopédia Gamer',desc:'Acerte jogos de 10 plataformas diferentes.',reward:180},
    speedrunner:{icon:'⚡',title:'Speedrunner',desc:'Acerte um jogo em menos de 5 segundos.',reward:100},
    survivor:{icon:'❤️',title:'Sobrevivente',desc:'Acerte 10 jogos numa partida Survival.',reward:150},
    blitzMaster:{icon:'⏱️',title:'Mestre do Blitz',desc:'Acerte 10 jogos numa única partida Blitz.',reward:150},
    pureGuess:{icon:'🔮',title:'Instinto Gamer',desc:'Acerte sem usar pistas nem comprar ajuda.',reward:100},
    rich:{icon:'🪙',title:'Colecionador',desc:'Tenha 1.000 moedas ao mesmo tempo.',reward:100},
    challenger:{icon:'⚔️',title:'Challenger',desc:'Acerte 20 campeões de League of Legends.',reward:160},
    pokemonMaster:{icon:'🔴',title:'Mestre Pokémon',desc:'Acerte 50 Pokémon.',reward:220},
    digichosen:{icon:'🔵',title:'DigiEscolhido',desc:'Acerte 20 Digimon.',reward:160},
    cartoonMemory:{icon:'📺',title:'Memória de Elefante',desc:'Acerte 20 personagens de desenhos clássicos.',reward:160},
    globinhoKid:{icon:'☀️',title:'Filho da Globinho',desc:'Acerte 15 personagens do especial TV Globinho.',reward:180},
    zWarrior:{icon:'🐉',title:'Guerreiro Z',desc:'Acerte 20 personagens do universo Dragon Ball.',reward:180},
    duelKing:{icon:'🃏',title:'Rei dos Duelos',desc:'Acerte 20 personagens de Yu-Gi-Oh!.',reward:180},
    hokage:{icon:'🍥',title:'Caminho do Hokage',desc:'Acerte 20 personagens de Naruto.',reward:180},
    cosmoBurning:{icon:'♈',title:'Queime o Cosmo',desc:'Acerte 20 personagens de Cavaleiros do Zodíaco.',reward:200},
    chaosWalker:{icon:'🎲',title:'Senhor do Caos',desc:'Acerte 20 personagens no Caos Multiverso.',reward:220},
    wordsmith:{icon:'🔤',title:'Mestre das Palavras',desc:'Resolva 10 palavras no Termo Arcade.',reward:140},
    termoStreak:{icon:'♾️',title:'Sequência Infinita',desc:'Acerte 5 palavras seguidas no Termo Arcade.',reward:190},
    multiverse:{icon:'🌌',title:'Viajante do Multiverso',desc:'Acerte ao menos um desafio em cada universo de personagens.',reward:350}
  };

  const DEFAULT_PROFILE = {
    coins:300, highScore:0, gamesPlayed:0, gamesWon:0, bestStreak:0, sound:true,
    achievements:{}, platformWins:{}, modeWins:{}, modeRecords:{survival:0,blitz:0}, recentGameIds:[], tutorialSeen:false
  };

  let profile = loadProfile();
  let setupConfig = null;
  let session = null;
  let resultAction = null;
  let ticker = null;
  let searchCache = new Map();
  let isResolving = false;
  let isGuessing = false;

  const $ = id => document.getElementById(id);
  const qsa = selector => [...document.querySelectorAll(selector)];

  function loadProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        ...DEFAULT_PROFILE,
        ...saved,
        achievements:{...DEFAULT_PROFILE.achievements,...(saved.achievements||{})},
        platformWins:{...DEFAULT_PROFILE.platformWins,...(saved.platformWins||{})},
        modeWins:{...DEFAULT_PROFILE.modeWins,...(saved.modeWins||{})},
        modeRecords:{...DEFAULT_PROFILE.modeRecords,...(saved.modeRecords||{})},
        recentGameIds:Array.isArray(saved.recentGameIds)?saved.recentGameIds.slice(0,100):[]
      };
    } catch { return {...DEFAULT_PROFILE}; }
  }

  function saveProfile() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    updatePersistentUI();
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function normalizeStr(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
      .replace(/[®™©]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  }

  function shuffle(items) {
    const a = [...items];
    for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }

  function randomChoice(items) { return items?.length ? items[Math.floor(Math.random()*items.length)] : null; }
  function clamp(v,min,max){return Math.min(max,Math.max(min,v));}

  function showScreen(id) {
    qsa('.screen').forEach(el => el.classList.toggle('active', el.id === id));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function setApiStatus(type,text) {
    const el=$('apiStatus'); el.className='status-pill'+(type?` ${type}`:''); el.innerHTML=`<i></i> ${escapeHTML(text)}`;
  }

  function toast(title,message,type='') {
    const el=document.createElement('div'); el.className=`toast ${type}`;
    el.innerHTML=`<div>${type==='achievement'?'🏅':type==='error'?'⚠️':'🎮'}</div><div><b>${escapeHTML(title)}</b><span>${escapeHTML(message)}</span></div>`;
    $('toastStack').appendChild(el); setTimeout(()=>el.remove(),4200);
  }

  function updatePersistentUI() {
    $('coinsTop').querySelector('b').textContent=profile.coins;
    $('recordTop').querySelector('b').textContent=profile.highScore;
    $('homeBestStreak').textContent=profile.bestStreak;
    $('homeAccuracy').textContent=profile.gamesPlayed?`${Math.round(profile.gamesWon/profile.gamesPlayed*100)}%`:'0%';
    $('homeAchievements').textContent=Object.keys(profile.achievements).filter(k=>profile.achievements[k]).length;
    $('soundButton').textContent=profile.sound?'🔊':'🔇';
    if(session) $('coinsMetric').textContent=profile.coins;
  }

  function renderModes() {
    $('modeGrid').innerHTML='';
    Object.entries(MODES).forEach(([key,mode])=>{
      const btn=document.createElement('button'); btn.className='mode-card'; btn.style.setProperty('--glow',mode.glow);
      btn.innerHTML=`<div class="mode-icon">${mode.icon}</div><h3>${escapeHTML(mode.title)}</h3><p>${escapeHTML(mode.desc)}</p><small>${escapeHTML(mode.tag)} →</small>`;
      btn.addEventListener('click',()=>chooseMode(key)); $('modeGrid').appendChild(btn);
    });
  }

  function chooseMode(modeKey) {
    if (modeKey==='quick') return startSession({mode:'quick',difficulty:'normal',platform:'all',decade:'all',category:'all',timed:false});
    if (modeKey==='random') return startSession({mode:'random',difficulty:'normal',platform:'all',decade:'all',category:'all',timed:false,dynamicDifficulty:true});
    setupConfig={mode:modeKey,difficulty:'normal',platform:'all',decade:modeKey==='decades'?'d00':'all',category:modeKey==='themed'?'horror':'all',timed:false};
    renderSetup(); showScreen('setupScreen');
  }

  function renderSetup() {
    const mode=MODES[setupConfig.mode];
    $('setupTitle').textContent=mode.title; $('setupDescription').textContent=mode.desc; $('setupIcon').textContent=mode.icon; $('summaryMode').textContent=mode.title;
    $('difficultyChoices').innerHTML='';
    Object.entries(DIFFICULTIES).forEach(([key,d])=>{
      const b=document.createElement('button'); b.className='choice-btn'+(setupConfig.difficulty===key?' active':'');
      b.innerHTML=`<b>${d.icon} ${d.title}</b><small>${d.attempts} tentativas • ${d.initialPieces} inicial</small>`;
      b.onclick=()=>{setupConfig.difficulty=key;renderSetup();}; $('difficultyChoices').appendChild(b);
    });

    const hidePlatform=['mystery','decades'].includes(setupConfig.mode);
    $('platformCard').classList.toggle('hidden',hidePlatform);
    $('platformChoices').innerHTML='';
    const all=document.createElement('button'); all.className='select-btn'+(setupConfig.platform==='all'?' active':''); all.innerHTML='<span>🎲</span><div><b>Todas</b><small>Misturar plataformas</small></div>'; all.onclick=()=>{setupConfig.platform='all';renderSetup();}; $('platformChoices').appendChild(all);
    Object.entries(CONSOLES).forEach(([key,c])=>{
      const b=document.createElement('button'); b.className='select-btn'+(setupConfig.platform===key?' active':'');
      b.innerHTML=`<span>${c.icon}</span><div><b>${escapeHTML(c.short)}</b><small>${escapeHTML(c.name)}</small></div>`;
      b.onclick=()=>{setupConfig.platform=key;renderSetup();}; $('platformChoices').appendChild(b);
    });

    $('periodCard').classList.toggle('hidden',false);
    $('decadeChoices').innerHTML='';
    Object.entries(DECADES).forEach(([key,d])=>{
      if(setupConfig.mode==='decades' && key==='all') return;
      const b=document.createElement('button'); b.className='choice-btn'+(setupConfig.decade===key?' active':''); b.innerHTML=`<b>${escapeHTML(d.title)}</b><small>${d.range[0]}–${d.range[1]}</small>`;
      b.onclick=()=>{setupConfig.decade=key;renderSetup();}; $('decadeChoices').appendChild(b);
    });

    $('categoryChoices').innerHTML='';
    Object.entries(CATEGORIES).forEach(([key,c])=>{
      if(setupConfig.mode==='classic' && ['playstation','xbox','nintendo','pc'].includes(key)) return;
      const b=document.createElement('button'); b.className='choice-btn'+(setupConfig.category===key?' active':'');
      const extra=key==='brazil'?'<small>Curadoria por console</small>':'';
      b.innerHTML=`<b>${c.icon} ${escapeHTML(c.title)}</b>${extra}`;
      b.onclick=()=>{setupConfig.category=key;if(c.kind==='family')setupConfig.platform='all';if(c.kind==='retro')setupConfig.decade='all';renderSetup();}; $('categoryChoices').appendChild(b);
    });
    $('platformHelp').textContent=setupConfig.category==='brazil'?'Escolha um console para jogar seus clássicos mais lembrados no Brasil':'Escolha uma ou misture todas';

    $('timerCard').classList.toggle('hidden',setupConfig.mode==='blitz');
    $('timerToggle').checked=setupConfig.timed;
    updateSetupSummary();
  }

  function updateSetupSummary() {
    const d=DIFFICULTIES[setupConfig.difficulty]; const mode=MODES[setupConfig.mode];
    const platform=setupConfig.platform==='all'?'Todas':CONSOLES[setupConfig.platform]?.name;
    const decade=DECADES[setupConfig.decade]?.title || 'Todas'; const cat=CATEGORIES[setupConfig.category]?.title || 'Todos';
    const timer=setupConfig.mode==='blitz'?'2 min globais':setupConfig.timed?'30s por jogo':'Sem limite';
    $('summaryList').innerHTML=`<div><span>Dificuldade</span><b>${d.icon} ${d.title}</b></div><div><span>Plataforma</span><b>${escapeHTML(['mystery','decades'].includes(setupConfig.mode)?'Misturada':platform)}</b></div><div><span>Época</span><b>${escapeHTML(decade)}</b></div><div><span>Categoria</span><b>${escapeHTML(cat)}</b></div><div><span>Tempo</span><b>${escapeHTML(timer)}</b></div>`;
    $('startButton').textContent=setupConfig.mode==='blitz'?'INICIAR BLITZ ▶':'JOGAR AGORA ▶';
    $('setupIcon').textContent=mode.icon;
  }

  function resolveQueryConfig(config) {
    let [startYear,endYear]=DECADES[config.decade]?.range || [1980,CURRENT_YEAR];
    let keys=Object.keys(CONSOLES);
    if(config.platform && config.platform!=='all') keys=[config.platform];
    const cat=CATEGORIES[config.category] || CATEGORIES.all;
    if(cat.kind==='family') keys=Object.keys(CONSOLES).filter(k=>CONSOLES[k].family===config.category);
    if(cat.kind==='retro') { endYear=Math.min(endYear,2005); keys=keys.filter(k=>CONSOLES[k].years[0]<=2005); }
    keys=keys.filter(k=>CONSOLES[k].years[1]>=startYear && CONSOLES[k].years[0]<=endYear);
    return {
      platformIds:[...new Set(keys.map(k=>CONSOLES[k].id))],startYear,endYear,
      apiCategory:['semantic','brazil'].includes(cat.kind)?config.category:'all'
    };
  }

  async function apiPost(body,timeoutMs=18000) {
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try {
      const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data?.error || `HTTP ${res.status}`); return data;
    } finally { clearTimeout(timer); }
  }

  async function fetchSessionGames(config) {
    const q=resolveQueryConfig(config);
    if(!q.platformIds.length) throw new Error('Essa combinação de plataforma e época não possui consoles compatíveis. Escolha outra época ou use Todas.');
    if(q.startYear>q.endYear) throw new Error('A combinação de filtros de época é inválida.');
    const limit=config.mode==='quick'?35:['survival','blitz'].includes(config.mode)?160:120;
    const data=await apiPost({action:'session',platformIds:q.platformIds,startYear:q.startYear,endYear:q.endYear,category:q.apiCategory,limit},22000);
    if(!Array.isArray(data.games)) return [];
    setApiStatus('online',config.category==='brazil'?`🇧🇷 Brasil • ${data.games.length} clássicos encontrados`:`IGDB online • ${data.games.length} jogos sorteados`);
    const recent=new Set(profile.recentGameIds.map(Number));
    const fresh=shuffle(data.games.filter(g=>!recent.has(Number(g.id))));
    const repeated=shuffle(data.games.filter(g=>recent.has(Number(g.id))));
    return [...fresh,...repeated];
  }

  async function startSession(config) {
    stopTicker(); closeAllOverlays();
    const finalConfig={...config};
    showScreen('loadingScreen'); setApiStatus('','Conectando à IGDB...');
    $('loadingTitle').textContent=MODES[finalConfig.mode].title;
    $('loadingText').textContent=finalConfig.category==='brazil'?'Montando uma seleção de jogos muito lembrados no Brasil para o console escolhido...':'Sorteando jogos, screenshots e posições para esta sessão...';
    qsa('.loading-steps span').forEach((el,i)=>el.classList.toggle('active',i===0));
    try {
      const games=await fetchSessionGames(finalConfig);
      if(!games.length) throw new Error('Nenhum jogo elegível foi encontrado com esses filtros. Tente outra plataforma, época ou categoria.');
      qsa('.loading-steps span').forEach((el,i)=>el.classList.toggle('active',i===1));
      session={
        config:finalConfig,games,index:0,score:0,wins:0,losses:0,streak:0,lives:finalConfig.mode==='survival'?3:null,
        currentGame:null,currentDifficulty:null,attemptsLeft:0,hintsUsed:new Set(),assistsUsed:new Set(),revealed:new Set(),pieceOrder:[],
        roundResolved:false,roundStart:0,roundDeadline:null,blitzEndsAt:null,blitzStarted:false,roundErrors:0,purchases:0,
        lastHotCold:null,ended:false,imageSkips:0,totalRounds:finalConfig.mode==='quick'?1:['survival','blitz'].includes(finalConfig.mode)?games.length:Math.min(30,games.length)
      };
      showScreen('gameScreen'); await loadRound(); startTicker();
    } catch(e) {
      console.error(e); setApiStatus('error','Falha na IGDB'); toast('Não consegui iniciar',e?.name==='AbortError'?'A IGDB demorou demais para responder.':(e.message||'Erro desconhecido'),'error');
      showScreen(finalConfig.mode && MODES[finalConfig.mode].setup?'setupScreen':'homeScreen');
    }
  }

  function getRoundDifficulty() {
    if(session.config.dynamicDifficulty) return randomChoice(['easy','normal','hard']);
    return session.config.difficulty || 'normal';
  }

  async function loadRound() {
    if(!session || isResolving) return;
    if(session.index>=session.games.length || (session.config.mode!=='survival' && session.config.mode!=='blitz' && session.index>=session.totalRounds)) return endSession('complete');
    const game=session.games[session.index]; session.currentGame=game; session.currentDifficulty=getRoundDifficulty();
    const diff=DIFFICULTIES[session.currentDifficulty];
    session.attemptsLeft=diff.attempts; session.hintsUsed=new Set(); session.assistsUsed=new Set(); session.revealed=new Set(); session.pieceOrder=shuffle([0,1,2,3,4,5]);
    session.roundResolved=false; session.roundErrors=0; session.purchases=0; session.lastHotCold=null; isResolving=false; isGuessing=false;
    resetRoundUI();

    if(!game._puzzleImage) game._puzzleImage=await choosePuzzleImage(game);
    if(!game._puzzleImage) {
      session.index++; session.imageSkips=(session.imageSkips||0)+1;
      // Não empilha dezenas de avisos se um lote raro da IGDB vier com mídia quebrada.
      if(session.imageSkips===1) toast('Procurando outra imagem','Encontrei um registro sem mídia utilizável e já estou tentando o próximo.');
      if(session.imageSkips>=12) {
        toast('Não consegui carregar as imagens','A API encontrou jogos, mas as imagens não responderam. Tente atualizar a página ou iniciar outra sessão.','error');
        return endSession('images');
      }
      return loadRound();
    }
    session.imageSkips=0;
    setupImageGrid(game._puzzleImage,diff.zoom);
    for(let i=0;i<diff.initialPieces;i++) revealNextPiece(false);
    setupHints();
    session.roundStart=Date.now();
    if(session.config.timed && session.config.mode!=='blitz') session.roundDeadline=Date.now()+30000; else session.roundDeadline=null;
    if(session.config.mode==='blitz' && !session.blitzStarted) { session.blitzStarted=true; session.blitzEndsAt=Date.now()+120000; }
    updateGameUI();
    $('guessInput').focus();
    preloadUpcoming();
  }

  function resetRoundUI() {
    $('hintDisplay').className='hint-display'; $('hintDisplay').innerHTML='<span class="hint-placeholder">💡 Use uma pista apenas quando precisar. Menos pistas = mais pontos.</span>';
    $('hotColdPanel').className='hotcold'; $('hotColdPanel').innerHTML='<b>🌡️ Quente ou frio</b><span>Erre um jogo conhecido e eu comparo console, gênero e época.</span>';
    $('assistResult').classList.add('hidden'); $('assistResult').innerHTML='';
    $('guessInput').value=''; $('suggestions').classList.remove('active'); $('suggestions').innerHTML='';
    qsa('.assist-btn').forEach(b=>b.disabled=false);
  }

  function igdbImage(image,size) {
    // As imagens também passam pela Vercel. Isso evita depender de o PC do
    // jogador conseguir acessar diretamente o CDN images.igdb.com.
    let id=String(image?.image_id||'').trim();
    if(!id) {
      const raw=String(image?.url||'').split('?')[0];
      const match=raw.match(/\/([^/]+)\.(?:jpg|jpeg|png|webp)$/i);
      if(match) id=match[1];
    }
    if(!/^[A-Za-z0-9_-]{3,120}$/.test(id)) return '';
    return `/api/image?id=${encodeURIComponent(id)}&size=${encodeURIComponent(size)}`;
  }

  function preloadImage(url,timeoutMs=5000) {
    return new Promise(resolve=>{ if(!url)return resolve(false); const img=new Image(); let done=false; const finish=ok=>{if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;resolve(ok);}; const timer=setTimeout(()=>finish(false),timeoutMs); img.onload=()=>finish(img.naturalWidth>80&&img.naturalHeight>80); img.onerror=()=>finish(false); img.src=url; });
  }

  async function choosePuzzleImage(game) {
    const shots=shuffle(game?.screenshots||[]);
    const candidates=[];
    for(const shot of shots.slice(0,8)) { candidates.push(igdbImage(shot,'screenshot_huge')); candidates.push(igdbImage(shot,'screenshot_big')); }
    if(game?.cover) candidates.push(igdbImage(game.cover,'cover_big_2x'));
    for(const url of [...new Set(candidates.filter(Boolean))]) if(await preloadImage(url,7500)) return url;
    return '';
  }

  async function preloadUpcoming() {
    if(!session) return; const next=session.games[session.index+1]; if(!next||next._puzzleImage||next._preloading)return;
    next._preloading=true; try{next._puzzleImage=await choosePuzzleImage(next);}finally{next._preloading=false;}
  }

  function setupImageGrid(url,zoom) {
    const grid=$('imageGrid'); grid.innerHTML='';
    for(let i=0;i<6;i++) {
      const p=document.createElement('div'); p.className='image-piece'; p.id=`piece-${i}`;
      const col=i%3,row=Math.floor(i/3); p.style.backgroundImage=`url("${url.replace(/"/g,'%22')}")`;
      p.style.backgroundSize=`${300*zoom}% ${200*zoom}%`; p.style.backgroundPosition=`${col*50}% ${row*100}%`; p.style.backgroundRepeat='no-repeat';
      grid.appendChild(p);
    }
  }

  function setupHints() {
    const defs=[
      {id:'description',icon:'📝',name:'Contexto'}, {id:'genres',icon:'🎭',name:'Estilo'},
      {id:'companies',icon:'🏢',name:'Estúdio'}, {id:'release',icon:'📅',name:'Época'}
    ];
    if(session.config.mode==='mystery') defs.push({id:'platformHint',icon:'🎮',name:'Plataforma'});
    $('hintsContainer').innerHTML='';
    shuffle(defs).forEach(h=>{const b=document.createElement('button');b.className='hint-btn';b.dataset.hint=h.id;b.innerHTML=`<span>${h.icon}</span>${h.name}`;b.onclick=()=>useHint(h.id,b);$('hintsContainer').appendChild(b);});
  }

  function mysteryDescription(game) {
    const diff=DIFFICULTIES[session.currentDifficulty];
    const mechanics=mechanicFlavor(game);
    const atmosphere=atmosphereFlavor(game);
    const perspective=perspectiveFlavor(game);
    const period=decadePhrase(game?.first_release_date);
    const genres=translatedGenres(game);
    const themes=translatedThemes(game);

    const easy=[
      `Este jogo combina <strong>${escapeHTML(genres.slice(0,2).join(' e ')||'mecânicas variadas')}</strong>. A experiência envolve ${escapeHTML(mechanics)}, com ${escapeHTML(atmosphere)}. Ele surgiu no <strong>${escapeHTML(period)}</strong>.`,
      `Pense em um título de <strong>${escapeHTML(genres[0]||'estilo variado')}</strong> em que a experiência gira em torno de ${escapeHTML(mechanics)}. ${escapeHTML(perspective)} e o clima remete a ${escapeHTML(atmosphere)}.`
    ];
    const normal=[
      `Sem citar nomes, a melhor pista é a estrutura do jogo: ${escapeHTML(mechanics)}. O clima gira em torno de ${escapeHTML(atmosphere)}. ${escapeHTML(perspective)}. Ele pertence ao <strong>${escapeHTML(period)}</strong>.`,
      `Observe a imagem pensando em ${escapeHTML(mechanics)}. A ambientação traz ${escapeHTML(atmosphere)}; quanto à apresentação, ${escapeHTML(perspective)}. A época é <strong>${escapeHTML(period)}</strong>.`
    ];
    const hard=[
      `A identidade deste título está menos nos personagens e mais em ${escapeHTML(mechanics)}. Como pano de fundo, há ${escapeHTML(atmosphere)}. A geração aproximada é <strong>${escapeHTML(period)}</strong>.`,
      `Pista de design: ${escapeHTML(mechanics)}. Pista de atmosfera: ${escapeHTML(atmosphere)}. O restante precisa vir da imagem e da sua memória gamer.`
    ];
    const insane=[
      `Pense apenas na sensação de jogo: ${escapeHTML(mechanics)}. O tom geral sugere ${escapeHTML(atmosphere)}.`,
      `Duas pistas abstratas: ${escapeHTML(mechanics)}; ${escapeHTML(atmosphere)}. Nenhum nome próprio foi usado.`
    ];
    const pools=[easy,normal,hard,insane];
    return `<strong>🧩 Contexto misterioso</strong><br>${randomChoice(pools[diff.clueLevel]||normal)}`;
  }

  function genreClue(game) {
    const list=shuffle(translatedGenres(game)); if(!list.length)return 'A IGDB não informou estilos para este jogo.';
    const lvl=DIFFICULTIES[session.currentDifficulty].clueLevel;
    if(lvl===0)return `<strong>Estilos principais:</strong><br>${escapeHTML(list.slice(0,3).join(' • '))}`;
    if(lvl===1)return `<strong>Uma categoria importante:</strong> ${escapeHTML(list[0])}${list.length>1?` <small>+${list.length-1} categoria(s) oculta(s)</small>`:''}`;
    if(lvl===2)return `<strong>Categoria cifrada:</strong> ${escapeHTML(list[0].split(/\s+/).map(w=>w[0]+'•'.repeat(Math.max(1,[...w].length-1))).join(' '))}`;
    return `<strong>Assinatura de estilo:</strong> ${escapeHTML(list.map(x=>x[0]?.toUpperCase()).filter(Boolean).slice(0,3).join(' / '))} — ${list.length} categoria(s).`;
  }

  function getDevelopers(game) {
    const arr=game?.involved_companies||[]; const dev=arr.filter(x=>x?.developer).map(x=>x?.company?.name).filter(Boolean); return [...new Set(dev.length?dev:arr.map(x=>x?.company?.name).filter(Boolean))];
  }

  function maskStudio(name) {
    const lvl=DIFFICULTIES[session.currentDifficulty].clueLevel;
    return String(name).split(/\s+/).map(part=>{
      const chars=[...part]; if(chars.length<=2)return '•'.repeat(chars.length); const visible=new Set([0]); if(lvl===0)visible.add(chars.length-1); if(lvl===1&&chars.length>5)visible.add(chars.length-1);
      if(lvl===0&&chars.length>6)visible.add(2); return chars.map((c,i)=>/[A-Za-zÀ-ÿ0-9]/.test(c)&&!visible.has(i)?'•':c).join('');
    }).join(' ');
  }

  function releaseClue(ts) {
    if(!ts)return 'Data de lançamento desconhecida.'; const y=new Date(ts*1000).getUTCFullYear(),dec=Math.floor(y/10)*10,pos=y-dec; const phase=pos<=2?'início':pos<=6?'meados':'fim'; const lvl=DIFFICULTIES[session.currentDifficulty].clueLevel;
    const variants=lvl===0?[`Foi lançado por volta de <strong>${y}</strong>.`,`Chegou ao mercado no <strong>${phase} dos anos ${dec}</strong>.`]:lvl===1?[`Pertence ao <strong>${phase} dos anos ${dec}</strong>.`,`Foi lançado entre <strong>${Math.max(dec,y-2)} e ${Math.min(dec+9,y+2)}</strong>.`]:lvl===2?[`Nasceu na década de <strong>${dec}</strong>.`,`É um jogo de aproximadamente <strong>${Math.floor(y/5)*5}–${Math.floor(y/5)*5+4}</strong>.`]:[`Sua geração temporal é: <strong>anos ${dec}</strong>.`,`O lançamento está a menos de 10 anos de <strong>${dec+5}</strong>.`]; return randomChoice(variants);
  }

  function platformClue(game) {
    const names=(game?.platforms||[]).map(p=>p?.name).filter(Boolean); return names.length?`<strong>Uma plataforma registrada para este jogo:</strong><br>${escapeHTML(randomChoice(names))}`:'Plataforma não informada.';
  }

  function useHint(id,button) {
    if(!session||session.roundResolved||session.hintsUsed.has(id))return; session.hintsUsed.add(id); button.disabled=true; revealNextPiece(true); playSound('hint');
    let html=''; if(id==='description')html=mysteryDescription(session.currentGame); if(id==='genres')html=genreClue(session.currentGame); if(id==='companies'){const dev=getDevelopers(session.currentGame);html=dev.length?`<strong>Assinatura do estúdio:</strong><br>${escapeHTML(dev.map(maskStudio).join(' • '))}`:'Estúdio não informado.';} if(id==='release')html=releaseClue(session.currentGame.first_release_date); if(id==='platformHint')html=platformClue(session.currentGame);
    $('hintDisplay').className='hint-display active'; $('hintDisplay').innerHTML=html; updateGameUI();
  }

  function revealPieceByIndex(index) { const el=$(`piece-${index}`); if(el&&!session.revealed.has(index)){session.revealed.add(index);el.classList.add('revealed');} }
  function revealNextPiece(animate=true) { const idx=session.pieceOrder.find(i=>!session.revealed.has(i)); if(idx===undefined)return false; revealPieceByIndex(idx); if(animate)playSound('reveal'); updateImageStatus(); return true; }
  function revealAllPieces(){session.pieceOrder.forEach(revealPieceByIndex);updateImageStatus();}
  function updateImageStatus(){if(!session)return;$('imageStatus').textContent=`${session.revealed.size} de 6 fragmentos revelados`;}

  function buyAssist(type) {
    if(!session||session.roundResolved)return; const cost=ASSIST_COSTS[type]; if(profile.coins<cost)return toast('Moedas insuficientes',`Você precisa de ${cost} moedas para essa ajuda.`,'error');
    if(type!=='piece'&&session.assistsUsed.has(type))return; if(type==='piece'&&session.revealed.size>=6)return toast('Imagem completa','Todos os fragmentos já foram revelados.');
    profile.coins-=cost; session.purchases++; if(type!=='piece')session.assistsUsed.add(type); playSound('coin');
    let text='';
    if(type==='piece'){revealNextPiece(true);text='🧩 Um novo fragmento foi revelado.';}
    if(type==='letters'){
      const title=normalizeStr(session.currentGame.name).replace(/[^a-z]/g,''); const used=new Set(title); const alphabet='abcdefghijklmnopqrstuvwxyz'.split('').filter(c=>!used.has(c)); const removed=shuffle(alphabet).slice(0,Math.min(8,alphabet.length)).map(c=>c.toUpperCase()); text=`🔤 Estas letras não aparecem no título: ${removed.join(' • ')}`;
    }
    if(type==='first'){const m=normalizeStr(session.currentGame.name).match(/[a-z0-9]/);text=`🔎 O título começa com: ${m?m[0].toUpperCase():'?'}`;}
    if(type==='platform'){const p=(session.currentGame.platforms||[]).map(x=>x.name).filter(Boolean);text=`🎮 Plataforma(s): ${p.length?p.join(' • '):'não informada'}`;}
    $('assistResult').textContent=text; $('assistResult').classList.remove('hidden');
    qsa(`.assist-btn[data-assist="${type}"]`).forEach(b=>{if(type!=='piece')b.disabled=true;}); saveProfile(); updateGameUI();
  }

  function levenshtein(a,b){const prev=Array.from({length:b.length+1},(_,i)=>i),cur=new Array(b.length+1);for(let i=1;i<=a.length;i++){cur[0]=i;for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));for(let j=0;j<=b.length;j++)prev[j]=cur[j];}return prev[b.length];}

  function isCorrectGuess(raw,name) {
    const a=normalizeStr(raw),b=normalizeStr(name); if(!a||!b)return false; if(a===b)return true; const tol=b.length>=20?2:b.length>=10?1:0; return a.length>=Math.max(4,b.length-2)&&levenshtein(a,b)<=tol;
  }

  async function makeGuess() {
    if(!session||session.roundResolved||isResolving||isGuessing)return; const raw=$('guessInput').value.trim(); if(raw.length<2)return toast('Digite um jogo','Escreva o nome do jogo antes de tentar.');
    isGuessing=true;
    try {
      if(isCorrectGuess(raw,session.currentGame.name)) { winRound(); return; }
      session.attemptsLeft--; session.roundErrors++; revealNextPiece(true); playSound('error');
      $('hintDisplay').className='hint-display error'; $('hintDisplay').innerHTML='<strong>❌ Não é esse.</strong> Um novo fragmento foi liberado. Use o Quente ou Frio para aproveitar o erro.';
      await updateHotCold(raw); if(!session||session.roundResolved)return; $('guessInput').value=''; updateGameUI();
      if(session.attemptsLeft<=0) loseRound('tentativas'); else $('guessInput').focus();
    } finally { isGuessing=false; }
  }

  async function lookupGuess(raw) {
    const n=normalizeStr(raw); if(searchCache.has(n))return searchCache.get(n);
    const local=session.games.find(g=>normalizeStr(g.name)===n); if(local){searchCache.set(n,local);return local;}
    try{const data=await apiPost({action:'search',query:raw},9000);const results=Array.isArray(data.results)?data.results:[];const best=results.find(g=>normalizeStr(g.name)===n)||results[0]||null;searchCache.set(n,best);return best;}catch{return null;}
  }

  function intersectNames(a,b){const x=new Set((a||[]).map(i=>normalizeStr(i?.name)));return (b||[]).some(i=>x.has(normalizeStr(i?.name)));}
  async function updateHotCold(raw) {
    const guessed=await lookupGuess(raw); if(!guessed){$('hotColdPanel').className='hotcold cold';$('hotColdPanel').innerHTML='<b>❄️ Frio</b><span>Não encontrei esse título com confiança na IGDB. Tente um nome mais completo.</span>';return;}
    const target=session.currentGame; let score=0; const reasons=[];
    if(intersectNames(guessed.platforms,target.platforms)){score+=2;reasons.push('mesma plataforma');}
    if(intersectNames(guessed.genres,target.genres)){score+=1;reasons.push('gênero em comum');}
    const gy=guessed.first_release_date?new Date(guessed.first_release_date*1000).getUTCFullYear():null,ty=target.first_release_date?new Date(target.first_release_date*1000).getUTCFullYear():null;
    if(gy&&ty){const delta=Math.abs(gy-ty);if(delta<=2){score+=2;reasons.push('época quase igual');}else if(delta<=6){score+=1;reasons.push('época próxima');}}
    let cls='cold',label='❄️ LONGE'; if(score>=4){cls='hot';label='🔥 MUITO PERTO';}else if(score>=2){cls='warm';label='🌡️ MORNO';}
    $('hotColdPanel').className=`hotcold ${cls}`;$('hotColdPanel').innerHTML=`<b>${label}</b><span>${reasons.length?escapeHTML(reasons.join(' • ')):'Pouca coisa em comum com o jogo secreto.'}</span>`;
  }

  function comboMultiplier(streak) { if(streak>=10)return 3;if(streak>=5)return 2;if(streak>=3)return 1.5;return 1; }
  function currentPotentialPoints() {
    if(!session)return 0; const d=DIFFICULTIES[session.currentDifficulty]; const base=Math.round(600*d.scoreMult); const penalty=session.roundErrors*85+session.hintsUsed.size*65+session.purchases*45; const raw=Math.max(80,base-penalty); return Math.round(raw*comboMultiplier(session.streak+1));
  }

  function winRound() {
    if(!session||session.roundResolved)return; session.roundResolved=true; isResolving=true; const elapsed=(Date.now()-session.roundStart)/1000; const nextStreak=session.streak+1; const points=currentPotentialPoints(); session.streak=nextStreak; session.wins++; profile.gamesPlayed++;profile.gamesWon++;profile.bestStreak=Math.max(profile.bestStreak,session.streak);
    const mult=comboMultiplier(session.streak); const speedBonus=elapsed<5?120:elapsed<10?60:elapsed<20?25:0; const finalPoints=points+Math.round(speedBonus*mult); const d=DIFFICULTIES[session.currentDifficulty]; const coinsEarned=35+d.coinBonus+(elapsed<10?15:0)+Math.min(40,session.streak*2);
    session.score+=finalPoints; profile.highScore=Math.max(profile.highScore,session.score); profile.coins+=coinsEarned; profile.modeWins[session.config.mode]=(profile.modeWins[session.config.mode]||0)+1;
    (session.currentGame.platforms||[]).forEach(p=>{if(p?.id)profile.platformWins[p.id]=(profile.platformWins[p.id]||0)+1;}); rememberCurrentGame(); saveProfile(); revealAllPieces(); playSound('win'); spawnConfetti(); checkAchievements({elapsed}); updateGameUI();
    if(session.config.mode==='blitz') { toast('✅ Acertou!',`+${finalPoints} pontos • +${coinsEarned} moedas`); setTimeout(()=>advanceRound(),520); isResolving=false; return; }
    showRoundResult(true,{points:finalPoints,coins:coinsEarned,elapsed}); isResolving=false;
  }

  function loseRound(reason='tentativas') {
    if(!session||session.roundResolved)return; session.roundResolved=true; isResolving=true; session.losses++; profile.gamesPlayed++; session.streak=0; if(session.config.mode==='survival')session.lives=Math.max(0,session.lives-1); rememberCurrentGame();saveProfile();revealAllPieces();playSound('lose');updateGameUI();
    if(session.config.mode==='blitz'){toast(reason==='tempo'?'⏱️ Tempo da rodada!':'❌ Passou',`Era ${session.currentGame.name}.`,'error');setTimeout(()=>advanceRound(),650);isResolving=false;return;}
    showRoundResult(false,{reason}); isResolving=false;
  }

  function skipRound(){if(!session||session.roundResolved)return;loseRound('pulo');}
  function rememberCurrentGame(){const id=Number(session?.currentGame?.id);if(!id)return;profile.recentGameIds=[id,...profile.recentGameIds.filter(x=>Number(x)!==id)].slice(0,100);}

  function getCover(game){return igdbImage(game?.cover,'cover_big_2x')||game?._puzzleImage||'';}
  function gameInfoHTML(game) {
    const genres=translatedGenres(game),themes=translatedThemes(game),dev=getDevelopers(game),plats=(game.platforms||[]).map(x=>x.name).filter(Boolean),year=game.first_release_date?new Date(game.first_release_date*1000).toLocaleDateString('pt-BR',{year:'numeric',month:'long',day:'numeric'}):'Não informado',rating=Number(game.total_rating||game.rating||0);
    return `${genres.length?`<div>🎭 ${escapeHTML(genres.join(', '))}</div>`:''}${themes.length?`<div>🌌 ${escapeHTML(themes.slice(0,3).join(', '))}</div>`:''}${dev.length?`<div>🏢 ${escapeHTML(dev.join(', '))}</div>`:''}<div>📅 ${escapeHTML(year)}</div>${plats.length?`<div>🎮 ${escapeHTML(plats.join(', '))}</div>`:''}${rating?`<div>⭐ Avaliação IGDB: ${Math.round(rating)}/100</div>`:''}`;
  }

  function showRoundResult(won,data) {
    const game=session.currentGame; const modal=$('resultModal'); modal.className=`result-modal ${won?'success':'fail'}`;
    $('resultIcon').textContent=won?'✅':'❌'; $('resultEyebrow').textContent=won?'VOCÊ ACERTOU!':data.reason==='tempo'?'TEMPO ESGOTADO':'RESPOSTA REVELADA'; $('resultGameName').textContent=game.name;
    const img=$('resultImage'); const url=getCover(game); if(url){img.src=url;img.style.display='block';img.onerror=()=>{img.src=game._puzzleImage||'';};}else img.style.display='none';
    $('resultInfo').innerHTML=gameInfoHTML(game);
    $('rewardLine').innerHTML=won?`⭐ <b>+${data.points} pontos</b> &nbsp; 🪙 <b>+${data.coins} moedas</b> &nbsp; 🔥 combo x${comboMultiplier(session.streak)}`:`A sequência foi zerada.${session.config.mode==='survival'?` Restam <b>${session.lives}</b> vida(s).`:''}`;
    $('learnButton').classList.toggle('hidden',!game.url); $('learnButton').onclick=()=>{if(game.url)window.open(game.url,'_blank','noopener,noreferrer');};
    $('nextButton').textContent=session.config.mode==='quick'?(won?'OUTRO JOGO ▶':'TENTAR OUTRO ▶'):(session.config.mode==='survival'&&session.lives===0?'VER RESULTADO ▶':'PRÓXIMO ▶');
    resultAction=()=>{closeOverlay('resultOverlay'); if(session.config.mode==='quick')startSession({...session.config}); else if(session.config.mode==='survival'&&session.lives===0)endSession('lives'); else advanceRound();};
    openOverlay('resultOverlay');
  }

  function advanceRound(){if(!session||session.ended)return;session.index++;isResolving=false;loadRound();}

  function endSession(reason) {
    if(!session||session.ended)return; stopTicker(); session.ended=true; session.roundResolved=true; profile.highScore=Math.max(profile.highScore,session.score);
    if(['survival','blitz'].includes(session.config.mode)) profile.modeRecords[session.config.mode]=Math.max(profile.modeRecords[session.config.mode]||0,session.wins);
    saveProfile();
    const mode=MODES[session.config.mode];$('resultModal').className='result-modal success';$('resultIcon').textContent=reason==='lives'?'💔':reason==='blitz'?'⏱️':'🏆';$('resultEyebrow').textContent=reason==='lives'?'GAME OVER':reason==='blitz'?'TEMPO!':'SESSÃO ENCERRADA';$('resultGameName').textContent=mode.title;
    const modeRecord=['survival','blitz'].includes(session.config.mode)?`<div>🎖️ Recorde do modo: <strong>${profile.modeRecords[session.config.mode]}</strong> acertos</div>`:'';
    $('resultImage').style.display='none';$('resultInfo').innerHTML=`<div>✅ Acertos: <strong>${session.wins}</strong></div><div>❌ Perdidos: <strong>${session.losses}</strong></div><div>⭐ Pontuação: <strong>${session.score}</strong></div><div>🏆 Recorde local: <strong>${profile.highScore}</strong></div>${modeRecord}`;
    $('rewardLine').innerHTML=`Você terminou com <b>${profile.coins} moedas</b>. Melhor sequência histórica: <b>${profile.bestStreak}</b>.`;$('learnButton').classList.add('hidden');$('nextButton').textContent='VOLTAR AO MENU';
    resultAction=()=>{closeOverlay('resultOverlay');session=null;showScreen('homeScreen');updatePersistentUI();};openOverlay('resultOverlay');
  }

  function updateAttempts(){const c=$('attempts');c.innerHTML='';const max=DIFFICULTIES[session.currentDifficulty].attempts;for(let i=0;i<max;i++){const d=document.createElement('span');d.className='attempt-dot '+(i<session.attemptsLeft?'left':'used');c.appendChild(d);}}
  function updateGameUI() {
    if(!session)return; const mode=MODES[session.config.mode],diff=DIFFICULTIES[session.currentDifficulty];
    $('modeBadge').textContent=mode.title.toUpperCase(); $('roundMetric').textContent=`🎮 ${session.index+1} / ${session.config.mode==='survival'||session.config.mode==='blitz'?'∞':session.totalRounds}`;
    $('livesMetric').classList.toggle('hidden',session.config.mode!=='survival'); if(session.config.mode==='survival')$('livesMetric').textContent='❤️'.repeat(session.lives)+'🖤'.repeat(3-session.lives);
    $('scoreMetric').textContent=session.score; $('coinsMetric').textContent=profile.coins; $('difficultyLabel').textContent=diff.title.toUpperCase();
    $('roundEyebrow').textContent=session.config.category==='brazil'?'🇧🇷 CLÁSSICO DO BRASIL • QUE JOGO É ESSE?':session.config.mode==='mystery'?'CONSOLE DESCONHECIDO • QUE JOGO É ESSE?':'QUE JOGO É ESSE?';
    $('roundTitle').textContent=session.config.mode==='blitz'?'Seja rápido. O relógio não para.':session.config.category==='brazil'?'Um jogo muito lembrado pelos brasileiros':'Observe a imagem e arrisque';
    const mult=comboMultiplier(session.streak); $('streakMetric').textContent=`🔥 x${mult}`; $('comboChip').textContent=`🔥 COMBO x${mult}`; $('comboChip').className='combo-chip'+(mult>=3?' combo-3':mult>=2?' combo-2':mult>=1.5?' combo-15':'');
    updateAttempts();updateImageStatus();const potential=currentPotentialPoints();$('roundScorePreview').querySelector('b').textContent=`+${potential}`;
    qsa('.assist-btn').forEach(b=>{const t=b.dataset.assist;if(t==='piece')b.disabled=session.revealed.size>=6;else b.disabled=session.assistsUsed.has(t);});
    updateTimerUI(); updatePersistentUI();
  }

  function updateTimerUI() {
    if(!session)return; const metric=$('timerMetric'); let seconds=null;
    if(session.config.mode==='blitz'&&session.blitzEndsAt)seconds=Math.max(0,Math.ceil((session.blitzEndsAt-Date.now())/1000));else if(session.roundDeadline)seconds=Math.max(0,Math.ceil((session.roundDeadline-Date.now())/1000));
    metric.classList.toggle('hidden',seconds===null);if(seconds!==null){metric.textContent=`⏱️ ${seconds}`;metric.classList.toggle('warning',seconds<=10);}
  }

  function startTicker(){stopTicker();ticker=setInterval(()=>{if(!session)return;updateTimerUI();if(session.config.mode==='blitz'&&session.blitzEndsAt&&Date.now()>=session.blitzEndsAt){session.blitzEndsAt=null;return endSession('blitz');}if(session.roundDeadline&&!session.roundResolved&&Date.now()>=session.roundDeadline){session.roundDeadline=null;loseRound('tempo');}},200);}
  function stopTicker(){if(ticker){clearInterval(ticker);ticker=null;}}

  function checkAchievements(context={}) {
    const unlock=(id)=>{if(profile.achievements[id])return;profile.achievements[id]=Date.now();const a=ACHIEVEMENTS[id];profile.coins+=a.reward;toast(`Conquista: ${a.title}`,`${a.desc} +${a.reward} moedas`,'achievement');playSound('achievement');};
    if(profile.gamesWon>=1)unlock('firstWin'); if((profile.platformWins[7]||0)>=10)unlock('nostalgia'); if(profile.bestStreak>=10)unlock('unstoppable'); if(Object.keys(profile.platformWins).filter(k=>profile.platformWins[k]>0).length>=10)unlock('encyclopedia'); if(context.elapsed&&context.elapsed<5)unlock('speedrunner'); if(session?.config.mode==='survival'&&session.wins>=10)unlock('survivor'); if(session?.config.mode==='blitz'&&session.wins>=10)unlock('blitzMaster'); if(session&&session.hintsUsed.size===0&&session.purchases===0)unlock('pureGuess'); if(profile.coins>=1000)unlock('rich'); saveProfile();
  }

  function renderAchievements(){const grid=$('achievementGrid');grid.innerHTML='';Object.entries(ACHIEVEMENTS).forEach(([id,a])=>{const unlocked=Boolean(profile.achievements[id]);const el=document.createElement('div');el.className='achievement-card'+(unlocked?' unlocked':'');el.innerHTML=`<div class="a-icon">${unlocked?a.icon:'🔒'}</div><h3>${escapeHTML(a.title)}</h3><p>${escapeHTML(a.desc)}</p><small>${unlocked?'DESBLOQUEADA':`Recompensa: ${a.reward} 🪙`}</small>`;grid.appendChild(el);});}

  function openOverlay(id){const el=$(id);el.classList.add('active');el.setAttribute('aria-hidden','false');}
  function closeOverlay(id){const el=$(id);el.classList.remove('active');el.setAttribute('aria-hidden','true');}
  function closeAllOverlays(){qsa('.overlay').forEach(el=>{el.classList.remove('active');el.setAttribute('aria-hidden','true');});}

  function shareResult(){if(!session)return;const text=`🎮 Game Guess Arcade\n⭐ ${session.score} pontos\n✅ ${session.wins} acertos\n🔥 Melhor sequência: ${Math.max(session.streak,profile.bestStreak)}\nConsegue superar?`;if(navigator.share)navigator.share({text}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>toast('Copiado','Resultado copiado para a área de transferência.'));}

  function spawnConfetti(){const c=$('confettiContainer');const colors=['#42e8ff','#ff54e8','#56f39a','#ffc857','#ff6277'];for(let i=0;i<70;i++){const el=document.createElement('i');el.className='confetti';el.style.left=Math.random()*100+'%';el.style.background=colors[Math.floor(Math.random()*colors.length)];el.style.animationDelay=Math.random()*.8+'s';el.style.animationDuration=2.2+Math.random()*1.8+'s';c.appendChild(el);setTimeout(()=>el.remove(),4300);}}

  let audioCtx=null;
  function playSound(type){if(!profile.sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!audioCtx)audioCtx=new AC();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.connect(gain);gain.connect(audioCtx.destination);const now=audioCtx.currentTime;gain.gain.setValueAtTime(.09,now);const configs={win:[523,784,.35,'sine'],lose:[260,110,.4,'sawtooth'],error:[240,170,.18,'square'],hint:[430,520,.16,'sine'],coin:[700,980,.15,'sine'],reveal:[330,450,.12,'triangle'],achievement:[660,1040,.55,'sine']};const [a,b,d,t]=configs[type]||configs.hint;osc.type=t;osc.frequency.setValueAtTime(a,now);osc.frequency.exponentialRampToValueAtTime(Math.max(40,b),now+d);gain.gain.exponentialRampToValueAtTime(.001,now+d);osc.start(now);osc.stop(now+d);}catch{}}

  function createParticles(){const c=$('particles');for(let i=0;i<28;i++){const p=document.createElement('i');p.className='particle';p.style.left=Math.random()*100+'%';p.style.animationDelay=-Math.random()*16+'s';p.style.animationDuration=12+Math.random()*14+'s';if(Math.random()>.5)p.style.background='#ff54e8';c.appendChild(p);}}

  function renderSuggestions(value){const sd=$('suggestions');sd.innerHTML='';const n=normalizeStr(value);if(n.length<2||!session){sd.classList.remove('active');return;}const matches=session.games.filter(g=>normalizeStr(g.name).includes(n)).sort((a,b)=>normalizeStr(a.name).indexOf(n)-normalizeStr(b.name).indexOf(n)).slice(0,7);matches.forEach(g=>{const item=document.createElement('div');item.className='suggestion-item';const year=g.first_release_date?new Date(g.first_release_date*1000).getUTCFullYear():'';item.innerHTML=`<b>${escapeHTML(g.name)}</b><small>${escapeHTML(year)}${g.platforms?.[0]?.name?` • ${escapeHTML(g.platforms[0].name)}`:''}</small>`;item.onclick=()=>{$('guessInput').value=g.name;sd.classList.remove('active');$('guessInput').focus();};sd.appendChild(item);});sd.classList.toggle('active',matches.length>0);}

  function requestQuit(){if(!session)return showScreen('homeScreen');openOverlay('confirmOverlay');}
  function quitSession(){stopTicker();session=null;closeOverlay('confirmOverlay');closeOverlay('resultOverlay');showScreen('homeScreen');updatePersistentUI();}

  function bindEvents(){
    $('brandButton').onclick=()=>session?requestQuit():showScreen('homeScreen'); qsa('[data-go-home]').forEach(b=>b.onclick=()=>showScreen('homeScreen'));
    $('timerToggle').addEventListener('change',e=>{setupConfig.timed=e.target.checked;updateSetupSummary();}); $('startButton').onclick=()=>startSession({...setupConfig});
    $('guessButton').onclick=makeGuess;$('skipButton').onclick=skipRound;$('guessInput').addEventListener('keydown',e=>{if(e.key==='Enter')makeGuess();});$('guessInput').addEventListener('input',e=>renderSuggestions(e.target.value));
    document.addEventListener('click',e=>{if(!e.target.closest('.input-wrapper'))$('suggestions').classList.remove('active');});qsa('.assist-btn').forEach(b=>b.onclick=()=>buyAssist(b.dataset.assist));
    $('quitButton').onclick=requestQuit;$('confirmQuit').onclick=quitSession;$('cancelQuit').onclick=()=>closeOverlay('confirmOverlay');
    $('nextButton').onclick=()=>{if(resultAction){const fn=resultAction;resultAction=null;fn();}};$('resultClose').onclick=()=>{if(resultAction){const fn=resultAction;resultAction=null;fn();}else closeOverlay('resultOverlay');};$('shareButton').onclick=shareResult;
    $('achievementsButton').onclick=()=>{renderAchievements();openOverlay('achievementsOverlay');};qsa('[data-close-achievements]').forEach(b=>b.onclick=()=>closeOverlay('achievementsOverlay'));
    $('tutorialButton').onclick=()=>openOverlay('tutorialOverlay');qsa('[data-close-tutorial]').forEach(b=>b.onclick=()=>{profile.tutorialSeen=true;saveProfile();closeOverlay('tutorialOverlay');});
    $('soundButton').onclick=()=>{profile.sound=!profile.sound;saveProfile();toast('Som',profile.sound?'Efeitos sonoros ativados.':'Efeitos sonoros desativados.');};
    window.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('confirmOverlay').classList.contains('active'))closeOverlay('confirmOverlay');else if($('achievementsOverlay').classList.contains('active'))closeOverlay('achievementsOverlay');else if($('tutorialOverlay').classList.contains('active'))closeOverlay('tutorialOverlay');}});
  }

  window.GameGuessCore={
    showScreen, toast, spawnConfetti, playSound,
    syncProfile(){profile=loadProfile();updatePersistentUI();},
    getProfile(){return JSON.parse(JSON.stringify(profile));}
  };
  function init(){renderModes();createParticles();bindEvents();updatePersistentUI();setApiStatus('','Pronto para jogar');if(!profile.tutorialSeen)setTimeout(()=>openOverlay('tutorialOverlay'),450);}
  init();
})();
