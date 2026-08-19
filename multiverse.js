(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const qsa=s=>[...document.querySelectorAll(s)];
  const CORE=()=>window.GameGuessCore;
  const PROFILE_KEY='gameGuessArcadeV4';
  const UNIVERSE_API='/api/universe';

  const UNIVERSES={
    random:{title:'Caos Multiverso',icon:'🎲',color:'#73f5ff',source:'Curadoria misturada',desc:'Dragon Ball, Yu-Gi-Oh!, Naruto, Cavaleiros, desenhos e TV Globinho na mesma partida.',eyebrow:'🎲 QUEM CAIU NO MULTIVERSO?',theme:'random',roundTitle:'A qualquer momento o universo pode mudar.',filters:{title:'🌌 Mistura',help:'Cada rodada pode vir de uma franquia diferente',items:{all:'Tudo misturado'}}},
    lol:{title:'League of Legends',icon:'⚔️',color:'#c99b3b',source:'Riot Data Dragon',desc:'Descubra o campeão pela splash art, função e atributos.',eyebrow:'⚔️ QUAL É O CAMPEÃO?',filters:{title:'⚔️ Função',help:'Filtre pela função principal',items:{all:'Todos',fighter:'Lutador',tank:'Tanque',mage:'Mago',assassin:'Assassino',marksman:'Atirador',support:'Suporte'}}},
    pokemon:{title:'Pokémon',icon:'🔴',color:'#ffcf3f',source:'PokéAPI',desc:'Adivinhe o Pokémon pela arte oficial, tipo, geração e habilidades.',eyebrow:'🔴 QUAL É O POKÉMON?',filters:{title:'🧬 Geração',help:'Escolha uma geração ou misture todas',items:{all:'Todas',gen1:'Geração I',gen2:'Geração II',gen3:'Geração III',gen4:'Geração IV',gen5:'Geração V',gen6:'Geração VI',gen7:'Geração VII',gen8:'Geração VIII',gen9:'Geração IX',silhouette:'👤 Silhueta • todas'}}},
    digimon:{title:'Digimon',icon:'🔵',color:'#62a9ff',source:'DAPI',desc:'Descubra o Digimon pela imagem, nível, atributo, tipo e habilidades.',eyebrow:'🔵 QUAL É O DIGIMON?',filters:{title:'🧬 Nível',help:'A DAPI filtra por nível',items:{all:'Todos',Rookie:'Rookie',Champion:'Champion',Ultimate:'Ultimate',Mega:'Mega',Armor:'Armor'}}},
    dragonball:{title:'Dragon Ball',icon:'🐉',color:'#ff8b29',source:'126 personagens/variações',desc:'Do clássico ao Super, com transformações, fusões, heróis, rivais e vilões.',eyebrow:'🐉 QUEM É O PERSONAGEM?',theme:'dragonball',roundTitle:'Do clássico ao Super: reconhece quem é?',filters:{title:'🔥 Série',help:'Escolha a fase de Dragon Ball',items:{all:'Todas',classic:'Dragon Ball clássico',z:'Dragon Ball Z',gt:'Dragon Ball GT',super:'Dragon Ball Super',variants:'✨ Transformações e fusões'}}},
    yugioh:{title:'Yu-Gi-Oh!',icon:'🃏',color:'#9b6dff',source:'72 personagens/variações',desc:'Duel Monsters e GX com duelistas, vilões, formas e estilos de deck.',eyebrow:'🃏 QUEM É O DUELISTA?',theme:'yugioh',roundTitle:'É hora do duelo. Quem é?',filters:{title:'🧿 Geração',help:'Do clássico até GX',items:{all:'Todas',classic:'Clássico • Duel Monsters',gx:'Yu-Gi-Oh! GX',variants:'✨ Formas e decks especiais'}}},
    naruto:{title:'Naruto',icon:'🍥',color:'#ff9b42',source:'113 personagens/variações',desc:'Clássico e Shippuden com vilas, clãs, Akatsuki, Kages e formas especiais.',eyebrow:'🍥 QUE NINJA É ESSE?',theme:'naruto',roundTitle:'Habilidade, vila ou imagem: reconheça o ninja.',filters:{title:'🍃 Fase',help:'Escolha a fase da história',items:{all:'Todas',classic:'Naruto clássico',shippuden:'Naruto Shippuden',variants:'✨ Modos e formas especiais'}}},
    saintseiya:{title:'Cavaleiros do Zodíaco',icon:'♈',color:'#f7d66d',source:'115 personagens/variações',desc:'Clássico, Ouro, Poseidon, Hades e The Lost Canvas em um universo próprio.',eyebrow:'♈ ELEVE O COSMO!',theme:'saintseiya',roundTitle:'Armadura, técnica, origem ou imagem: quem é?',filters:{title:'✨ Saga / grupo',help:'Escolha a era ou misture tudo',items:{all:'Todos',classic:'Clássico • Bronze e Prata',gold:'Cavaleiros de Ouro',asgard:'Saga de Asgard',poseidon:'Saga de Poseidon',hades:'Saga de Hades',lostcanvas:'The Lost Canvas',variants:'✨ Armaduras/formas especiais'}}},
    cartoons:{title:'Desenhos clássicos',icon:'📺',color:'#ff72d6',source:'Curadoria + Wikipedia',desc:'Personagens que marcaram a TV e a infância no Brasil.',eyebrow:'📺 QUEM É O PERSONAGEM?',filters:{title:'🧩 Seleção',help:'Curadoria de personagens clássicos no Brasil',items:{all:'Todos'}}},
    globinho:{title:'TV Globinho',icon:'☀️',color:'#68c6ff',source:'Especial TV Globinho',desc:'Tema exclusivo inspirado nas manhãs da TV Globinho.',eyebrow:'☀️ ESPECIAL TV GLOBINHO',globinho:true,theme:'globinho',roundTitle:'Quanto você lembra das manhãs da Globo?',filters:{title:'📡 Especial',help:'Personagens de atrações associadas à TV Globinho',items:{all:'Maratona TV Globinho'}}},
    termo:{title:'Termo Arcade ∞',icon:'🔤',color:'#63e6a5',source:'Palavras PT-BR • infinito',desc:'Jogue com 1 palavra, Dueto ou Quarteto. Sem vidas: o Game Over acontece quando as tentativas terminam.',eyebrow:'♾️ TERMO ARCADE',custom:'termo',theme:'termo'}
  };

  const MODES={
    classic:{title:'Clássico',icon:'🧠',rounds:30,desc:'30 rodadas • vidas só no Difícil/Insano'},
    survival:{title:'Survival',icon:'❤️',rounds:80,desc:'vidas no Difícil/Insano • tentativas nos demais'},
    blitz:{title:'Blitz',icon:'⏱️',rounds:80,desc:'2 minutos • vidas só no Difícil/Insano'},
    chaos:{title:'Caos',icon:'🎲',rounds:50,desc:'dificuldade e estilo mudam • vidas só quando ficar difícil'},
    ladder:{title:'Escalada',icon:'📈',rounds:40,desc:'fica mais difícil • vidas entram nas fases Difícil/Insano'},
    endless:{title:'Maratona ∞',icon:'♾️',rounds:80,desc:'sem fim • 3 vidas somente no Difícil/Insano'}
  };
  const DIFF={
    easy:{title:'Fácil',icon:'🌱',attempts:6,pieces:2,mult:.85,mask:.0},
    normal:{title:'Normal',icon:'🎯',attempts:5,pieces:1,mult:1,mask:.08},
    hard:{title:'Difícil',icon:'🔥',attempts:3,pieces:0,mult:1.35,mask:.22},
    insane:{title:'Insano',icon:'💀',attempts:3,pieces:0,mult:1.8,mask:.38}
  };
  const CHALLENGES={
    random:{title:'Aleatório',icon:'🎲',desc:'muda a cada rodada'},
    image:{title:'Mosaico',icon:'🧩',desc:'descubra pela imagem'},
    ability:{title:'Habilidade',icon:'💥',desc:'começa pela técnica/poder'},
    origin:{title:'Origem/Nação',icon:'🌍',desc:'começa pela origem, vila ou universo'},
    dossier:{title:'Dossiê',icon:'🕵️',desc:'duas pistas iniciais'},
    group:{title:'Grupo/Afiliação',icon:'🛡️',desc:'começa pelo time, clã ou facção'},
    era:{title:'Saga/Geração',icon:'🕰️',desc:'começa pela época, saga ou geração'},
    role:{title:'Classe/Papel',icon:'🎭',desc:'começa pela função ou classe'},
    silhouette:{title:'Silhueta',icon:'👤',desc:'imagem escura + poucas pistas'},
    blind:{title:'Só pistas',icon:'🧠',desc:'imagem bloqueada até o resultado'}
  };

  const QUESTION_TEMPLATES={
    dragonball:{
      image:['Qual guerreiro de Dragon Ball está escondido no mosaico?','Reconhece este personagem pelo visual?'],
      ability:['Quem é conhecido por esta técnica ou transformação?','Esta habilidade pertence a qual personagem de Dragon Ball?'],
      origin:['De quem é esta origem dentro do universo Dragon Ball?','Qual personagem combina com esta raça, planeta ou origem?'],
      group:['Quem pertence a este grupo, família ou exército?'],era:['Quem aparece nesta fase ou saga de Dragon Ball?'],role:['Quem exerce este papel na história?'],dossier:['Junte as informações do dossiê e descubra o personagem.'],silhouette:['Reconheça a silhueta deste guerreiro.'],blind:['Sem imagem: quem é pelas pistas de Dragon Ball?']
    },
    naruto:{
      image:['Qual ninja está escondido no mosaico?'],ability:['Quem usa este jutsu, kekkei genkai ou modo?'],origin:['Qual ninja vem desta vila, clã ou nação?'],group:['Quem faz parte deste time, clã ou organização?'],era:['Quem se encaixa nesta fase de Naruto?'],role:['Qual ninja ocupa esta função ou patente?'],dossier:['Cruze jutsu, vila e afiliação para encontrar o ninja.'],silhouette:['Que shinobi é este apenas pela silhueta?'],blind:['Sem imagem: descubra o ninja pelas informações do mundo shinobi.']
    },
    yugioh:{
      image:['Qual duelista está escondido na imagem?'],ability:['Quem é associado a este deck, carta ou estilo de duelo?'],origin:['De qual duelista esta origem ou academia combina?'],group:['Quem pertence a esta escola, grupo ou facção?'],era:['Quem duelou nesta geração ou arco?'],role:['Quem ocupa este papel no mundo dos duelos?'],dossier:['Use geração, deck e personalidade para descobrir o duelista.'],silhouette:['Reconhece este duelista pela silhueta?'],blind:['Sem imagem: quem é o duelista pelas pistas?']
    },
    saintseiya:{
      image:['Qual cavaleiro, deus ou espectro está no mosaico?'],ability:['De quem é esta técnica ou manifestação de Cosmo?'],origin:['Quem vem deste local, reino ou exército?'],group:['Quem pertence a esta ordem, exército ou grupo de cavaleiros?'],era:['Quem aparece nesta saga de Cavaleiros do Zodíaco?'],role:['Qual personagem corresponde a esta armadura, classe ou papel?'],dossier:['Armadura, técnica e saga: descubra quem é.'],silhouette:['Que guerreiro do Cosmo é este pela silhueta?'],blind:['Sem imagem: eleve o Cosmo e descubra pelas pistas.']
    },
    pokemon:{
      image:['Qual Pokémon está escondido na arte?'],ability:['Que Pokémon combina com estas habilidades?'],origin:['Qual Pokémon combina com este tipo ou característica de origem?'],group:['Use tipo e categoria para descobrir o Pokémon.'],era:['De qual geração é este Pokémon? Agora diga quem é.'],role:['Qual Pokémon corresponde a este tipo e perfil?'],dossier:['Geração, tipo e corpo: qual é o Pokémon?'],silhouette:['Quem é esse Pokémon pela silhueta?'],blind:['Sem arte: qual Pokémon é descrito pelas pistas?']
    },
    digimon:{
      image:['Qual Digimon está escondido na imagem?'],ability:['Qual Digimon possui estas técnicas ou habilidades?'],origin:['Que Digimon combina com este atributo?'],group:['Use nível, tipo e atributo para descobrir o Digimon.'],era:['Qual Digimon se encaixa neste nível evolutivo?'],role:['Qual Digimon corresponde a este nível ou tipo?'],dossier:['Nível, atributo e habilidades: descubra o Digimon.'],silhouette:['Qual Digimon é este pela silhueta?'],blind:['Sem imagem: quem é o Digimon pelas pistas?']
    },
    lol:{
      image:['Qual campeão de League of Legends está na splash?'],ability:['Que campeão combina com este estilo de combate?'],origin:['De qual campeão esta região ou característica poderia ser?'],group:['Qual campeão pertence a esta função ou grupo?'],era:['Qual campeão combina com este perfil?'],role:['Quem joga nesta função? Descubra o campeão.'],dossier:['Função, título e atributos: qual é o campeão?'],silhouette:['Qual campeão está por trás da silhueta?'],blind:['Sem splash art: descubra o campeão pelas pistas.']
    },
    cartoons:{
      image:['Qual personagem clássico está escondido na imagem?'],ability:['Que personagem combina com esta característica marcante?'],origin:['De qual desenho ou universo vem este personagem?'],group:['Qual personagem faz parte deste desenho ou grupo?'],era:['Quem marcou esta época da TV?'],role:['Qual personagem exerce este papel no desenho?'],dossier:['Desenho, época e características: quem é?'],silhouette:['Reconhece este clássico pela silhueta?'],blind:['Sem imagem: descubra o personagem clássico pelas pistas.']
    },
    globinho:{
      image:['Quem aparecia nas manhãs da TV Globinho?'],ability:['Qual personagem da TV Globinho combina com esta característica?'],origin:['De qual atração da TV Globinho vem este personagem?'],group:['Quem fazia parte deste desenho ou grupo?'],era:['Quem marcou esta fase das manhãs da Globo?'],role:['Qual personagem corresponde a este papel?'],dossier:['Ative a memória: programa, época e característica. Quem é?'],silhouette:['Quem é esta silhueta da nostalgia?'],blind:['Sem imagem: quanto você lembra da TV Globinho?']
    }
  };
  function questionForRound(){
    const real=underlyingUniverse(session?.current),ch=session?.roundChallenge||'image';
    const pool=QUESTION_TEMPLATES[real]?.[ch]||['Observe as pistas e descubra a resposta.'];
    return pick(pool);
  }
  function eyebrowForRound(){
    const real=underlyingUniverse(session?.current),map={dragonball:'🐉 DESAFIO DRAGON BALL',naruto:'🍥 MISSÃO SHINOBI',yugioh:'🃏 HORA DO DUELO',saintseiya:'♈ QUEIME O COSMO',pokemon:'🔴 DESAFIO POKÉMON',digimon:'🔵 MUNDO DIGITAL',lol:'⚔️ SUMMONER CHALLENGE',cartoons:'📺 MEMÓRIA DA TV',globinho:'☀️ TV GLOBINHO'};
    return map[real]||'🎲 DESAFIO MULTIVERSO';
  }

  let setup={universe:'random',mode:'classic',difficulty:'normal',filter:'all',challenge:'random'};
  let session=null,ticker=null,resultAction=null,loadingToken=0;

  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');}
  function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  function show(id){CORE()?.showScreen?.(id)||qsa('.screen').forEach(x=>x.classList.toggle('active',x.id===id));window.scrollTo({top:0,behavior:'smooth'});}
  function toast(a,b,t=''){CORE()?.toast?.(a,b,t);}
  function sound(t){CORE()?.playSound?.(t);}
  function confetti(){CORE()?.spawnConfetti?.();}
  function readProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}catch{return {}}}
  function saveProfile(p){localStorage.setItem(PROFILE_KEY,JSON.stringify(p));CORE()?.syncProfile?.();window.GameGuessFirebase?.syncLocalProfile?.(p);}
  function underlyingUniverse(item){return item?.meta?.universeKey||session?.config?.universe||'random';}

  function updateProfileWin(points,streak,item){
    const p=readProfile();
    p.coins=Number(p.coins||0)+Math.max(8,Math.round(points/65));
    p.highScore=Math.max(Number(p.highScore||0),Number(points||0));
    p.gamesPlayed=Number(p.gamesPlayed||0)+1;
    p.gamesWon=Number(p.gamesWon||0)+1;
    p.bestStreak=Math.max(Number(p.bestStreak||0),streak);
    p.multiverseWins={...(p.multiverseWins||{})};
    const real=underlyingUniverse(item);
    p.multiverseWins[real]=Number(p.multiverseWins[real]||0)+1;
    if(session?.config?.universe==='random')p.multiverseWins.random=Number(p.multiverseWins.random||0)+1;
    p.achievements={...(p.achievements||{})};
    const wins=p.multiverseWins;
    const rewards={challenger:160,pokemonMaster:220,digichosen:160,cartoonMemory:160,globinhoKid:180,zWarrior:180,duelKing:180,hokage:180,cosmoBurning:200,chaosWalker:220,multiverse:350};
    const labels={challenger:'⚔️ Challenger',pokemonMaster:'🔴 Mestre Pokémon',digichosen:'🔵 DigiEscolhido',cartoonMemory:'📺 Memória de Elefante',globinhoKid:'☀️ Filho da Globinho',zWarrior:'🐉 Guerreiro Z',duelKing:'🃏 Rei dos Duelos',hokage:'🍥 Caminho do Hokage',cosmoBurning:'♈ Queime o Cosmo',chaosWalker:'🎲 Senhor do Caos',multiverse:'🌌 Viajante do Multiverso'};
    const unlock=k=>{if(!p.achievements[k]){p.achievements[k]=Date.now();p.coins+=rewards[k]||0;toast('Conquista desbloqueada!',`${labels[k]||k} • +${rewards[k]||0} moedas`,'achievement');}};
    if((wins.lol||0)>=20)unlock('challenger');
    if((wins.pokemon||0)>=50)unlock('pokemonMaster');
    if((wins.digimon||0)>=20)unlock('digichosen');
    if((wins.cartoons||0)>=20)unlock('cartoonMemory');
    if((wins.globinho||0)>=15)unlock('globinhoKid');
    if((wins.dragonball||0)>=20)unlock('zWarrior');
    if((wins.yugioh||0)>=20)unlock('duelKing');
    if((wins.naruto||0)>=20)unlock('hokage');
    if((wins.saintseiya||0)>=20)unlock('cosmoBurning');
    if((wins.random||0)>=20)unlock('chaosWalker');
    if(['lol','pokemon','digimon','dragonball','yugioh','naruto','saintseiya','cartoons','globinho'].every(k=>(wins[k]||0)>0))unlock('multiverse');
    saveProfile(p);
  }
  function updateProfileLoss(){const p=readProfile();p.gamesPlayed=Number(p.gamesPlayed||0)+1;saveProfile(p);}

  function renderCards(){
    const grid=$('universeGrid');if(!grid)return;grid.innerHTML='';
    Object.entries(UNIVERSES).forEach(([key,u])=>{
      const b=document.createElement('button');
      b.className='universe-card'+(u.theme?` ${u.theme}`:'');
      b.style.setProperty('--u-color',u.color);
      b.innerHTML=`<span class="u-icon">${u.icon}</span><h3>${esc(u.title)}</h3><p>${esc(u.desc)}</p><small>${esc(u.source)} →</small>`;
      b.onclick=()=>u.custom==='termo'?window.GameGuessTermo?.open?.():openSetup(key);
      grid.appendChild(b);
    });
  }
  function applyTheme(el,key){['globinho','dragonball','yugioh','naruto','saintseiya','random'].forEach(t=>el.classList.toggle(`${t}-theme`,key===t));}
  function openSetup(key){setup={universe:key,mode:'classic',difficulty:'normal',filter:'all',challenge:key==='random'?'random':'image'};applyTheme($('universeSetupScreen'),key);renderSetup();show('universeSetupScreen');}

  function renderSetup(){
    const u=UNIVERSES[setup.universe];
    $('universeSetupEyebrow').textContent=`${u.icon} GAME GUESS MULTIVERSO`;
    $('universeSetupTitle').textContent=u.title;
    $('universeSetupDesc').textContent=u.desc;
    $('universeSetupIcon').textContent=u.icon;
    $('universeSummaryTitle').textContent=u.title;

    $('universeModeChoices').innerHTML='';
    Object.entries(MODES).forEach(([k,m])=>{
      const b=document.createElement('button');b.className='choice-btn'+(setup.mode===k?' active':'');
      b.innerHTML=`<b>${m.icon} ${m.title}</b><small>${esc(m.desc)}</small>`;
      b.onclick=()=>{setup.mode=k;if(k==='chaos')setup.challenge='random';renderSetup()};$('universeModeChoices').appendChild(b);
    });

    $('universeDifficultyChoices').innerHTML='';
    Object.entries(DIFF).forEach(([k,d])=>{
      const b=document.createElement('button');b.className='choice-btn'+(setup.difficulty===k?' active':'');
      b.innerHTML=`<b>${d.icon} ${d.title}</b><small>${d.attempts} tentativas</small>`;
      b.onclick=()=>{setup.difficulty=k;renderSetup()};$('universeDifficultyChoices').appendChild(b);
    });

    $('universeFilterTitle').textContent=u.filters.title;
    $('universeFilterHelp').textContent=u.filters.help;
    $('universeFilterChoices').innerHTML='';
    Object.entries(u.filters.items).forEach(([k,label])=>{
      const b=document.createElement('button');b.className='choice-btn'+(String(setup.filter).toLowerCase()===String(k).toLowerCase()?' active':'');
      b.textContent=label;b.onclick=()=>{setup.filter=k;renderSetup()};$('universeFilterChoices').appendChild(b);
    });

    const cc=$('universeChallengeChoices'); if(cc){cc.innerHTML='';Object.entries(CHALLENGES).forEach(([k,c])=>{
      const b=document.createElement('button');b.className='choice-btn'+(setup.challenge===k?' active':'');
      b.innerHTML=`<b>${c.icon} ${c.title}</b><small>${esc(c.desc)}</small>`;
      b.onclick=()=>{setup.challenge=k;renderSetup()};cc.appendChild(b);
    });}

    const mode=MODES[setup.mode],diff=DIFF[setup.difficulty],ch=CHALLENGES[setup.challenge];
    $('universeSummaryList').innerHTML=`<div><span>Universo</span><b>${u.icon} ${esc(u.title)}</b></div><div><span>Modo</span><b>${mode.icon} ${mode.title}</b></div><div><span>Dificuldade</span><b>${diff.icon} ${diff.title}${setup.mode==='chaos'?' (base)':''}</b></div><div><span>Desafio</span><b>${ch.icon} ${ch.title}</b></div><div><span>Seleção</span><b>${esc(u.filters.items[setup.filter]||setup.filter)}</b></div>`;
  }

  async function post(body){const r=await fetch(UNIVERSE_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||d.error||`HTTP ${r.status}`);return d;}
  async function start(){
    const token=++loadingToken,u=UNIVERSES[setup.universe],mode=MODES[setup.mode];
    show('loadingScreen');$('loadingTitle').textContent=`Abrindo ${u.title}...`;
    $('loadingText').textContent=setup.universe==='random'?'Embaralhando vários universos, personagens e estilos de pista...':`Montando uma seleção aleatória em ${u.source}...`;
    try{
      const d=await post({universe:setup.universe,filter:setup.filter,limit:mode.rounds});
      if(token!==loadingToken)return;
      if(!Array.isArray(d.items)||!d.items.length)throw new Error('Nenhum personagem retornado.');
      session={config:{...setup},items:shuffle(d.items),index:0,wins:0,losses:0,score:0,streak:0,lives:3,roundResolved:false,hintsUsed:0,wrong:0,revealed:0,revealOrder:[],attempts:0,current:null,activeDifficulty:setup.difficulty,roundChallenge:setup.challenge,shownClues:new Set(),blitzEnds:setup.mode==='blitz'?Date.now()+120000:null};
      show('universeGameScreen');applyTheme($('universeGameScreen'),setup.universe);await loadRound();startTicker();
    }catch(e){toast('Não consegui iniciar',e.message,'error');show('homeScreen');}
  }

  function difficultyUsesLives(key){return key==='hard'||key==='insane'}
  function roundUsesLives(){return Boolean(session&&difficultyUsesLives(session.activeDifficulty))}

  function selectRoundStyle(){
    if(session.config.mode==='chaos')session.activeDifficulty=pick(Object.keys(DIFF));
    else if(session.config.mode==='ladder'){const steps=['easy','normal','hard','insane'];session.activeDifficulty=steps[Math.min(3,Math.floor(session.index/10))];}
    else session.activeDifficulty=session.config.difficulty;
    const pool=['image','ability','origin','dossier','group','era','role','silhouette','blind'];
    session.roundChallenge=(session.config.mode==='chaos'||session.config.challenge==='random')?pick(pool):session.config.challenge;
  }
  function maxRounds(){if(session.config.mode==='endless')return Infinity;if(session.config.mode==='classic')return Math.min(30,session.items.length);if(session.config.mode==='chaos')return Math.min(50,session.items.length);if(session.config.mode==='ladder')return Math.min(40,session.items.length);return session.items.length;}
  async function probeAsset(url){if(!url)return false;try{const h=await fetch(url,{method:'HEAD',cache:'force-cache'});if(!h.ok||h.headers.get('X-GameGuess-Fallback')==='1')return false;}catch{}return new Promise(r=>{const i=new Image();let done=false;const f=x=>{if(done)return;done=true;clearTimeout(t);i.onload=i.onerror=null;r(x)};const t=setTimeout(()=>f(false),8500);i.onload=()=>f(i.naturalWidth>60&&i.naturalHeight>60);i.onerror=()=>f(false);i.src=url})}

  async function loadRound(){
    if(!session)return;
    if(Number(session.lives||0)<=0)return endSession('lives');
    if(session.config.mode==='blitz'&&Date.now()>=session.blitzEnds)return endSession('blitz');
    if(session.config.mode==='endless'&&session.index>=session.items.length){session.items=shuffle(session.items);session.index=0;session.cycle=Number(session.cycle||0)+1;toast('♾️ Nova volta',`Banco embaralhado novamente • ciclo ${session.cycle+1}`);}
    if(session.index>=maxRounds())return endSession('complete');

    const item=session.items[session.index];if(!item)return endSession('complete');
    session.current=item;selectRoundStyle();
    session.questionTitle=questionForRound();session.questionEyebrow=eyebrowForRound();
    item._imageAvailable=await probeAsset(item.image);
    if(!item._imageAvailable&&['image','silhouette'].includes(session.roundChallenge)){session.roundChallenge='dossier';toast('Imagem não encontrada','Rodada convertida automaticamente para Dossiê — você não perde a questão.');}
    const diff=DIFF[session.activeDifficulty];
    session.roundResolved=false;session.hintsUsed=0;session.wrong=0;session.revealed=0;session.attempts=diff.attempts;session.revealOrder=shuffle([0,1,2,3,4,5]);session.shownClues=new Set();

    setupImage(item.image,item._imageAvailable);
    let initial=diff.pieces;
    if(['ability','origin','dossier','group','era','role','silhouette','blind'].includes(session.roundChallenge))initial=Math.min(initial,1);
    if(session.roundChallenge==='blind')initial=0;
    for(let i=0;i<initial;i++)revealPiece(false);

    renderAttempts();renderHints();
    $('universeHintDisplay').className='hint-display';
    $('universeHintDisplay').innerHTML='<span class="hint-placeholder">💡 Use uma pista quando precisar. Cada pista manual reduz um pouco o valor da rodada.</span>';
    applyAutomaticChallengeClue();
    $('universeGuessInput').value='';$('universeSuggestions').classList.remove('active');
    updateUI();setTimeout(()=>$('universeGuessInput').focus(),50);
  }

  function setupImage(url,available=true){
    const g=$('universeImageGrid');g.innerHTML='';g.classList.toggle('no-asset',!available);
    for(let i=0;i<6;i++){
      const row=Math.floor(i/3),col=i%3,p=document.createElement('div');p.className='image-piece universe-piece';p.id=`u-piece-${i}`;
      const img=document.createElement('img');img.src=url;img.alt='';img.style.cssText=`width:300%;height:200%;object-fit:cover;left:${-col*100}%;top:${-row*100}%;${(session?.roundChallenge==='silhouette'||(session?.config?.universe==='pokemon'&&session?.config?.filter==='silhouette'))?'filter:brightness(0) contrast(1.2);':''}`;
      if(available)p.appendChild(img);g.appendChild(p);
    }
    if(!available){const note=document.createElement('div');note.className='universe-no-asset-note';note.innerHTML='<b>🧠 Rodada por pistas</b><span>A imagem externa não foi localizada. O desafio continua normalmente.</span>';g.appendChild(note);}
    g.classList.toggle('blind-challenge',session.roundChallenge==='blind');
  }
  function revealPiece(play=true){
    if(!session||session.revealed>=6)return;
    const idx=session.revealOrder[session.revealed++];
    if(session.roundChallenge!=='blind'&&session.current?._imageAvailable!==false)$(`u-piece-${idx}`)?.classList.add('revealed');
    $('universeImageStatus').textContent=session.current?._imageAvailable===false?'Sem imagem • rodada convertida para pistas':session.roundChallenge==='blind'?'Imagem bloqueada • modo Só pistas':`${session.revealed} fragmento${session.revealed===1?'':'s'} revelado${session.revealed===1?'':'s'}`;
    if(play)sound('reveal');
  }

  function renderAttempts(){
    const g=$('universeAttempts');g.innerHTML='';
    const max=DIFF[session.activeDifficulty].attempts;
    for(let i=0;i<max;i++){const d=document.createElement('i');d.className='attempt-dot '+(i<session.attempts?'left':'used');g.appendChild(d);}
  }
  function maskText(text,ratio){if(!ratio)return text;return String(text).split(/(\s+)/).map(w=>{if(w.trim().length<5||Math.random()>ratio)return w;return w[0]+'•'.repeat(Math.max(2,w.length-2))+w.at(-1)}).join('')}
  function clues(){return [...(session.current.clues||[])];}
  function clueOf(kind){return clues().find(c=>c.kind===kind&&!session.shownClues.has(c.label))||null;}
  function nextUnseenClue(){return shuffle(clues()).find(c=>!session.shownClues.has(c.label)&&c.kind!=='name')||shuffle(clues()).find(c=>!session.shownClues.has(c.label))||null;}
  function displayClue(c,{penalty=true,combine=false}={}){
    if(!c)return;
    session.shownClues.add(c.label);
    if(penalty){session.hintsUsed++;revealPiece();}
    const ratio=DIFF[session.activeDifficulty].mask;
    $('universeHintDisplay').className='hint-display active';
    const text=maskText(c.text,ratio);
    $('universeHintDisplay').innerHTML=combine?$('universeHintDisplay').innerHTML+`<hr><strong>${esc(c.label)}</strong>&nbsp; ${esc(text)}`:`<strong>${esc(c.label)}</strong>&nbsp; ${esc(text)}`;
    updateUI();if(penalty)sound('hint');
  }
  function applyAutomaticChallengeClue(){
    if(session.roundChallenge==='image')return;
    if(session.roundChallenge==='ability')return displayClue(clueOf('ability')||nextUnseenClue(),{penalty:false});
    if(session.roundChallenge==='origin')return displayClue(clueOf('origin')||clueOf('group')||nextUnseenClue(),{penalty:false});
    if(session.roundChallenge==='group')return displayClue(clueOf('group')||clueOf('origin')||nextUnseenClue(),{penalty:false});
    if(session.roundChallenge==='era')return displayClue(clueOf('era')||nextUnseenClue(),{penalty:false});
    if(session.roundChallenge==='role')return displayClue(clueOf('role')||clueOf('armor')||nextUnseenClue(),{penalty:false});
    if(session.roundChallenge==='silhouette')return displayClue(clueOf('era')||nextUnseenClue(),{penalty:false});
    if(session.roundChallenge==='dossier'){
      const a=nextUnseenClue();if(a)displayClue(a,{penalty:false});
      const b=nextUnseenClue();if(b)displayClue(b,{penalty:false,combine:true});
      return;
    }
    if(session.roundChallenge==='blind')return displayClue(nextUnseenClue(),{penalty:false});
  }
  function renderHints(){
    const g=$('universeHintsContainer');g.innerHTML='';
    let list=clues();
    if(session.activeDifficulty==='insane')list=list.filter(c=>c.kind!=='name').slice(0,5);
    shuffle(list).forEach((c,i)=>{
      const b=document.createElement('button');b.className='hint-btn';
      const icons={ability:'💥',origin:'🌍',group:'🛡️',era:'🕰️',role:'🎭',armor:'♈',variant:'✨',trait:'🧩',name:'🔤',title:'🏷️'};
      b.innerHTML=`<span>${icons[c.kind]||['🧩','🔎','📌','✨'][i%4]}</span>${esc(c.label.replace(/^\S+\s*/,''))}`;
      b.onclick=()=>{if(b.disabled||session.roundResolved)return;b.disabled=true;displayClue(c,{penalty:true});};g.appendChild(b);
    });
  }

  function challengeLabel(){const c=CHALLENGES[session.roundChallenge]||CHALLENGES.image;return `${c.icon} ${c.title}`;}
  function currentUniverseLabel(){const key=underlyingUniverse(session.current);return UNIVERSES[key]?.title||session.current?.source||UNIVERSES[session.config.universe].title;}
  function updateUI(){
    if(!session)return;
    const u=UNIVERSES[session.config.universe],d=DIFF[session.activeDifficulty],m=MODES[session.config.mode];
    $('universeModeBadge').textContent=`${u.icon} ${m.title.toUpperCase()}`;
    $('universeSourceBadge').textContent=session.config.universe==='random'?`🌌 ${currentUniverseLabel()}`:u.source;
    $('universeRoundMetric').textContent=`🎯 ${session.index+1} / ${['classic','chaos','ladder'].includes(session.config.mode)?maxRounds():'∞'}`;
    $('universeLivesMetric').classList.toggle('hidden',!roundUsesLives());
    if(roundUsesLives())$('universeLivesMetric').textContent='❤️'.repeat(session.lives)+'🖤'.repeat(Math.max(0,3-session.lives));
    $('universeTimerMetric').classList.toggle('hidden',session.config.mode!=='blitz');
    $('universeScoreMetric').textContent=session.score;
    $('universeStreakMetric').textContent=`🔥 x${combo(session.streak)}`;
    $('universeComboChip').textContent=`🔥 COMBO x${combo(session.streak)}`;
    $('universeRoundEyebrow').textContent=session.questionEyebrow||eyebrowForRound();
    $('universeRoundTitle').textContent=session.questionTitle||questionForRound();
    $('universeDifficultyLabel').textContent=d.title.toUpperCase();
    const cm=$('universeChallengeMetric');if(cm)cm.textContent=challengeLabel();
    $('universeRoundValue').textContent=`+${roundValue()}`;
    renderAttempts();
  }

  function combo(s){return s>=10?3:s>=5?2:s>=3?1.5:1}
  function roundValue(){if(!session)return 0;const d=DIFF[session.activeDifficulty];const challengeBonus={image:1,ability:1.05,origin:1.05,dossier:.95,group:1.05,era:1.05,role:1.05,silhouette:1.15,blind:1.25}[session.roundChallenge]||1;return Math.max(80,Math.round((600-session.hintsUsed*70-session.wrong*85)*d.mult*challengeBonus*combo(session.streak)))}
  function answerNames(){const x=session.current;return [x.name,...(x.aliases||[])].map(norm).filter(Boolean)}
  function levenshtein(a,b){const m=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=m[0];m[0]=i;for(let j=1;j<=b.length;j++){const t=m[j];m[j]=Math.min(m[j]+1,m[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=t}}return m[b.length]}
  function isCorrect(v){const n=norm(v);if(!n)return false;return answerNames().some(a=>n===a||(Math.min(n.length,a.length)>=5&&1-levenshtein(n,a)/Math.max(n.length,a.length)>=.88))}
  function guess(){
    if(!session||session.roundResolved)return;
    const val=$('universeGuessInput').value.trim();if(!val)return;
    if(isCorrect(val))return win();
    session.wrong++;session.attempts--;const withLives=roundUsesLives();if(withLives)session.lives=Math.max(0,Number(session.lives||0)-1);
    if(session.roundChallenge==='blind'){const c=nextUnseenClue();if(c)displayClue(c,{penalty:false});}else revealPiece();
    renderAttempts();sound('error');
    $('universeHintDisplay').className='hint-display error';
    const extra=session.roundChallenge==='blind'?' Uma nova pista foi liberada.':' Um novo fragmento foi revelado.';
    $('universeHintDisplay').innerHTML=withLives?`❌ <strong>${esc(val)}</strong> não é a resposta. <b>-1 ❤️</b> • ${session.lives} vida(s) restante(s).${extra}`:`❌ <strong>${esc(val)}</strong> não é a resposta. Restam <b>${session.attempts}</b> tentativa(s).${extra}`;
    if(withLives&&session.lives<=0)lose('vidas',false);else if(session.attempts<=0)lose('tentativas',false);else updateUI();
  }
  function win(){
    if(session.roundResolved)return;session.roundResolved=true;
    const pts=roundValue();session.score+=pts;session.wins++;session.streak++;
    updateProfileWin(pts,session.streak,session.current);
    if(session.roundChallenge!=='blind')for(let i=session.revealed;i<6;i++)revealPiece(false);
    sound('win');
    if(session.config.mode==='blitz'){toast('✅ Acertou!',`+${pts} pontos • ${session.current.name}`);session.index++;setTimeout(()=>loadRound(),420);return;}
    confetti();showResult(true,pts);
  }
  function lose(reason='pulo',consumeLife=true){
    if(session.roundResolved)return;const withLives=roundUsesLives();if(consumeLife&&withLives)session.lives=Math.max(0,Number(session.lives||0)-1);session.roundResolved=true;session.losses++;session.streak=0;
    updateProfileLoss();
    if(session.roundChallenge!=='blind')for(let i=session.revealed;i<6;i++)revealPiece(false);
    sound('lose');
    if(session.config.mode==='blitz'&&(!withLives||session.lives>0)){toast(withLives?'❌ Rodada perdida -1 ❤️':'❌ Rodada perdida',`Era ${session.current.name}.`,'error');session.index++;setTimeout(()=>loadRound(),520);return;}
    showResult(false,0,reason);
  }
  function showResult(won,pts){
    const u=UNIVERSES[session.config.universe],x=session.current;
    $('universeResultModal').className='result-modal '+(won?'success':'fail');
    $('universeResultIcon').textContent=won?'✅':'❌';
    $('universeResultEyebrow').textContent=won?'VOCÊ ACERTOU!':'ERA ESTE:';
    $('universeResultName').textContent=x.name;
    const ri=$('universeResultImage');ri.classList.toggle('hidden',x._imageAvailable===false);if(x._imageAvailable!==false)ri.src=x.image;
    $('universeResultInfo').innerHTML=(x.result||[]).filter(Boolean).map(t=>`<div>${esc(t)}</div>`).join('')+`<div>🎲 Desafio: ${esc(CHALLENGES[session.roundChallenge]?.title||'Mosaico')}</div><div>🌌 ${esc(currentUniverseLabel())}</div>`;
    $('universeRewardLine').innerHTML=won?`⭐ <b>+${pts} pontos</b> • 🔥 sequência ${session.streak}`:(roundUsesLives()?`A sequência foi zerada. Restam <b>${session.lives}</b> vida(s).`:'A sequência foi zerada. A próxima rodada começa com novas tentativas.');
    $('universeResultOverlay').classList.add('active');$('universeResultOverlay').setAttribute('aria-hidden','false');
    resultAction=()=>{closeResult();if(roundUsesLives()&&session.lives<=0)return endSession('lives');session.index++;loadRound();};
  }
  function closeResult(){$('universeResultOverlay').classList.remove('active');$('universeResultOverlay').setAttribute('aria-hidden','true')}
  function endSession(reason){
    stopTicker();if(!session)return;
    const s=session,u=UNIVERSES[s.config.universe],p=readProfile();
    p.highScore=Math.max(Number(p.highScore||0),s.score);
    window.GameGuessRanked?.record?.(p,{kind:'multiverse',score:s.score,mode:s.config.mode||'classic',universe:s.config.universe||'random',challenge:s.config.challenge||s.roundChallenge||'random',difficulty:s.config.difficulty||'normal',correct:s.wins,wrong:s.losses,won:s.wins>0});
    saveProfile(p);
    toast(reason==='images'?'Imagens externas instáveis — use novamente':'Sessão encerrada',`${u.title}: ${s.wins} acertos • ${s.score} pontos.`);
    session=null;closeResult();show('homeScreen');
  }
  function startTicker(){stopTicker();ticker=setInterval(()=>{if(!session)return;if(session.config.mode==='blitz'){const left=Math.max(0,Math.ceil((session.blitzEnds-Date.now())/1000));$('universeTimerMetric').textContent=`⏱️ ${left}`;if(left<=0)endSession('blitz')}},250)}
  function stopTicker(){if(ticker){clearInterval(ticker);ticker=null}}
  function renderSuggestions(){
    const box=$('universeSuggestions'),n=norm($('universeGuessInput').value);box.innerHTML='';
    if(!session||n.length<2){box.classList.remove('active');return}
    const m=session.items.filter(x=>norm(x.name).includes(n)||(x.aliases||[]).some(a=>norm(a).includes(n))).slice(0,8);
    m.forEach(x=>{const d=document.createElement('div');d.className='suggestion-item';const k=x.meta?.universeKey||session.config.universe;d.innerHTML=`<b>${esc(x.name)}</b><small>${esc(UNIVERSES[k]?.title||x.source||'Multiverso')}</small>`;d.onclick=()=>{$('universeGuessInput').value=x.name;box.classList.remove('active')};box.appendChild(d)});
    box.classList.toggle('active',m.length>0);
  }
  function quit(){loadingToken++;stopTicker();session=null;closeResult();show('homeScreen')}

  function bind(){
    renderCards();
    $('universeBackHome').onclick=()=>show('homeScreen');
    $('universeStartButton').onclick=start;
    $('universeGuessButton').onclick=guess;
    $('universeSkipButton').onclick=()=>lose('pulo');
    $('universeQuitButton').onclick=quit;
    $('universeGuessInput').addEventListener('keydown',e=>{if(e.key==='Enter')guess()});
    $('universeGuessInput').addEventListener('input',renderSuggestions);
    $('universeNextButton').onclick=()=>{if(resultAction){const f=resultAction;resultAction=null;f()}};
    $('universeResultClose').onclick=()=>{if(resultAction){const f=resultAction;resultAction=null;f()}else closeResult()};
    const old=$('brandButton').onclick;$('brandButton').onclick=e=>{if(session)return quit();old?.call($('brandButton'),e)};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
