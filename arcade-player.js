(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const gameKey = String(params.get('game') || '').toLowerCase();
  const role = String(params.get('role') || 'local').toLowerCase();
  const online = role === 'host' || role === 'guest';
  const localPlayers = online ? 1 : (Number(params.get('players')) === 2 ? 2 : 1);
  const room = String(params.get('room') || 'LOCAL').toUpperCase();
  const gameId = Math.max(1, Number(params.get('gameId')) || 700000001);
  const launchToken = String(params.get('launch') || gameId).replace(/\D/g, '').slice(-5) || String(gameId).slice(-5);
  const playerName = String(params.get('name') || (role === 'host' ? 'HOST' : role === 'guest' ? 'CONVIDADO' : 'PLAYER')).trim().slice(0,20) || 'PLAYER';

  const GAMES = {
    kf2k2mp2: { title:'KOF 2002 Magic Plus II', icon:'🥊', system:'Neo Geo', core:'fbneo', url:'/roms/v178/kf2k2mp2.zip', size:86694745, profile:'neo4', localId:20020202 },
    neobombe: { title:'Neo Bomberman', icon:'💣', system:'Neo Geo', core:'fbneo', url:'/roms/neogeo/neobombe.zip', size:7431142, profile:'neo4', localId:19970501 },
    samsh5spho: { title:'Samurai Shodown V Special', icon:'⚔️', system:'Neo Geo', core:'fbneo', url:'/roms/arcade/samsh5spho.zip', size:83295234, profile:'neo4', localId:20040422 },
    mvsc: { title:'Marvel vs. Capcom', icon:'🦸', system:'CPS-2', core:'fbalpha2012_cps2', url:'/roms/arcade/mvsc.zip', size:21493122, profile:'cps6', localId:19980123 },
    xmvsfur1: { title:'X-Men vs. Street Fighter', icon:'✖️', system:'CPS-2', core:'fbalpha2012_cps2', url:'/roms/arcade/xmvsfur1.zip', size:18468916, profile:'cps6', localId:19961004 }
  };
  const game = GAMES[gameKey];
  const TRAINING_EJS_VERSION = '4.2.3';
  const ONLINE_EJS_VERSION = '4.3.0-pre';
  const EJS_VERSION = online ? ONLINE_EJS_VERSION : TRAINING_EJS_VERSION;
  // Use o domínio do próprio Game Guess como proxy para o CDN do EmulatorJS.
  // Isso evita falhas de DNS/bloqueio do cdn.emulatorjs.org em algumas redes móveis.
  const EJS_PROXY_DATA = `/ejs/${EJS_VERSION}/`;
  const EJS_DIRECT_DATA = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;
  let EJS_DATA = EJS_PROXY_DATA;
  const PUBLIC_NETPLAY_SERVER = 'https://netplay.emulatorjs.org';
  const rtcRoomName = `GG-${room}-${launchToken}`.slice(0,20);

  const INPUT = { SELECT:2, START:3, UP:4, DOWN:5, LEFT:6, RIGHT:7 };
  const PROFILES = {
    neo4: {
      buttons:[['A',0],['B',8],['C',1],['D',9]],
      p1Keys:{ KeyJ:0, KeyK:8, KeyU:1, KeyI:9 },
      p2Keys:{ Digit1:0, Numpad1:0, Digit2:8, Numpad2:8, Digit4:1, Numpad4:1, Digit5:9, Numpad5:9 },
      p1Text:'WASD mover • J/K/U/I = A/B/C/D • R moeda • T start',
      p2Text:'Setas mover • 1/2/4/5 = A/B/C/D • 0 moeda • Enter start',
      padButtons:[[0,0],[1,8],[2,1],[3,9]],
      touchClass:'four'
    },
    cps6: {
      buttons:[['LP',1],['MP',9],['HP',10],['LK',0],['MK',8],['HK',11]],
      p1Keys:{ KeyU:1, KeyI:9, KeyO:10, KeyJ:0, KeyK:8, KeyL:11 },
      p2Keys:{ Digit7:1, Numpad7:1, Digit8:9, Numpad8:9, Digit9:10, Numpad9:10, Digit4:0, Numpad4:0, Digit5:8, Numpad5:8, Digit6:11, Numpad6:11 },
      p1Text:'WASD mover • U/I/O socos • J/K/L chutes • R moeda • T start',
      p2Text:'Setas mover • 7/8/9 socos • 4/5/6 chutes • 0 moeda • Enter start',
      padButtons:[[2,1],[3,9],[4,10],[0,0],[1,8],[5,11],[6,10],[7,11]],
      touchClass:'six'
    }
  };
  const profile = game ? PROFILES[game.profile] : null;

  const $ = id => document.getElementById(id);
  const boot = $('boot'), bootText = $('bootText'), startButton = $('startButton'), status = $('status'), fullscreenButton = $('fullscreenButton'), helpButton = $('helpButton');
  let loading=false, started=false, directReady=false, padFrame=0, autoNetplayBusy=false, guestFindTimer=0, netplayWatchTimer=0;
  const held = new Map();

  function post(type,message,extra={}){ try{ parent.postMessage({type,message,game:gameKey,...extra},location.origin); }catch{} }
  function setStatus(message){ if(status) status.textContent=message; }
  function setBoot(message){ if(bootText) bootText.textContent=message; }
  function mb(n){ return `${(Number(n||0)/1024/1024).toFixed(1)} MB`; }
  function fail(message){ const msg=String(message||'Falha ao iniciar o Arcade.'); loading=false;started=false;directReady=false;if(boot)boot.style.display='grid';if(startButton){startButton.disabled=false;startButton.textContent='↻ TENTAR NOVAMENTE'}setBoot(msg);setStatus('❌ '+msg);post('arcade-player-error',msg); }
  async function head(url,timeout=6500){ const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);try{ const r=await fetch(url,{method:'HEAD',cache:'no-store',signal:ctrl.signal});return{ok:r.ok,status:r.status,size:Number(r.headers.get('content-length')||0)} }catch(e){return{ok:false,status:0,size:0,error:e?.name==='AbortError'?'timeout':'network'}}finally{clearTimeout(timer)} }
  async function json(url){ try{const r=await fetch(url,{cache:'no-store'});return r.ok?await r.json():null}catch{return null} }

  function setupUi(){
    if(!game){ fail('Jogo Arcade inválido.'); return; }
    document.title=`${game.title} • Game Guess`;
    $('gameTitle').textContent=game.title; $('gameIcon').textContent=game.icon; $('gameBadge').textContent=`${game.icon} ${game.title.toUpperCase()} • ${online?'ONLINE X1':localPlayers+'P LOCAL'}`;
    startButton.textContent=online?'▶ CARREGAR PARTIDA ONLINE':`▶ INICIAR ${localPlayers} PLAYER${localPlayers>1?'S':''}`;
    const cards=[`<div><b>🟡 PLAYER 1</b><small>${profile.p1Text}</small></div>`];
    if(!online&&localPlayers===2) cards.push(`<div><b>🔵 PLAYER 2</b><small>${profile.p2Text}</small></div>`);
    $('controlsSummary').classList.toggle('one',cards.length===1); $('controlsSummary').innerHTML=cards.join('');
    $('deviceHint').innerHTML=online?'<strong>Online:</strong> cada aparelho usa teclado, gamepad/joystick ou touchscreen para o seu jogador.':'<strong>Entradas:</strong> teclado, gamepads/joysticks e touchscreen podem ser usados ao mesmo tempo.';
    $('helpTitle').textContent=`Controles • ${game.title}`;
    $('helpBody').innerHTML=`<p><b>P1:</b> ${profile.p1Text}.</p>${(!online&&localPlayers===2)?`<p><b>P2:</b> ${profile.p2Text}.</p>`:''}<p><b>Gamepad/joystick:</b> direcional/analógico para mover; botões frontais/ombros são mapeados para os golpes; Select/Back insere moeda e Start inicia.</p><p><b>Touchscreen:</b> os controles aparecem automaticamente em celular/tablet. No 2P local a tela é dividida entre P1 e P2.</p>`;
    renderTouchControls();
  }

  function renderTouchControls(){
    const wrap=$('touchWrap'); if(!wrap||!profile)return;
    const count=online?1:localPlayers;
    wrap.innerHTML='';
    for(let p=0;p<count;p++){
      const player=document.createElement('div'); player.className=`touch-player ${count===1?'single':p===0?'p1':'p2'}`; player.dataset.player=String(p);
      const buttons=profile.buttons.map(([label,input],i)=>`<button class="b${i}" data-input="${input}">${label}</button>`).join('');
      player.innerHTML=`<span class="player-label">P${p+1}</span><div class="dpad"><button class="up" data-input="4">▲</button><button class="down" data-input="5">▼</button><button class="left" data-input="6">◀</button><button class="right" data-input="7">▶</button></div><div class="actions ${profile.touchClass}">${buttons}</div><div class="mini-actions"><button data-input="2">COIN</button><button data-input="3">START</button></div>`;
      wrap.appendChild(player);
    }
    bindTouch();
  }

  function gm(){ return window.EJS_emulator?.gameManager||null; }
  function emuPlayer(localPlayer){ return online?0:localPlayer; }
  function simulate(localPlayer,input,value){ const manager=gm();if(!manager||typeof manager.simulateInput!=='function')return false;try{manager.simulateInput(emuPlayer(localPlayer),Number(input),Number(value));return true}catch{return false} }
  function heldKey(player,input){ return `${player}:${input}`; }
  function setSource(player,input,source,pressed){
    if(!directReady||!Number.isFinite(player)||!Number.isFinite(input))return false;
    const key=heldKey(player,input);let sources=held.get(key);
    if(!pressed){if(!sources||!sources.has(source))return true;sources.delete(source);if(!sources.size){simulate(player,input,0);held.delete(key)}return true}
    if(!sources){sources=new Set();held.set(key,sources)}if(sources.has(source))return true;if(!sources.size&&!simulate(player,input,1))return false;sources.add(source);return true;
  }
  function releasePrefix(prefix){for(const [key,sources] of [...held.entries()]){const [p,input]=key.split(':').map(Number);for(const src of [...sources])if(src.startsWith(prefix))setSource(p,input,src,false)}}
  function releaseAll(){for(const key of [...held.keys()]){const [p,input]=key.split(':').map(Number);simulate(p,input,0)}held.clear()}
  async function waitDirect(timeout=6000){const end=performance.now()+timeout;while(performance.now()<end){if(typeof gm()?.simulateInput==='function'){directReady=true;return true}await new Promise(r=>setTimeout(r,30))}return false}

  function keyboardMapFor(player){
    const map=new Map();
    const dirs=player===0?{KeyW:INPUT.UP,KeyS:INPUT.DOWN,KeyA:INPUT.LEFT,KeyD:INPUT.RIGHT}:{ArrowUp:INPUT.UP,ArrowDown:INPUT.DOWN,ArrowLeft:INPUT.LEFT,ArrowRight:INPUT.RIGHT};
    const btns=player===0?profile.p1Keys:profile.p2Keys; Object.entries({...dirs,...btns}).forEach(([k,v])=>map.set(k,v));
    if(player===0){map.set('KeyR',INPUT.SELECT);map.set('KeyT',INPUT.START)} else {map.set('Digit0',INPUT.SELECT);map.set('Numpad0',INPUT.SELECT);map.set('Enter',INPUT.START);map.set('NumpadEnter',INPUT.START)}
    return map;
  }
  const keyboardMaps=[];
  function bindKeyboard(){
    keyboardMaps.push(keyboardMapFor(0)); if(!online&&localPlayers===2)keyboardMaps.push(keyboardMapFor(1));
    const apply=(e,pressed)=>{if(!started)return;for(let p=0;p<keyboardMaps.length;p++){const input=keyboardMaps[p].get(e.code);if(input===undefined)continue;e.preventDefault();e.stopPropagation();setSource(p,input,`key:${p}:${e.code}`,pressed);return}}
    addEventListener('keydown',e=>{if(!e.repeat)apply(e,true)},{capture:true});addEventListener('keyup',e=>apply(e,false),{capture:true});addEventListener('blur',()=>releasePrefix('key:'));
  }
  function bindTouch(){document.querySelectorAll('#touchWrap button[data-input]').forEach(button=>{const player=Number(button.closest('.touch-player')?.dataset.player||0),input=Number(button.dataset.input),base=`touch:${player}:${input}:`;const down=e=>{if(!started)return;e.preventDefault();e.stopPropagation();button.classList.add('pressed');try{button.setPointerCapture?.(e.pointerId)}catch{}setSource(player,input,base+e.pointerId,true)};const up=e=>{e.preventDefault();e.stopPropagation();button.classList.remove('pressed');setSource(player,input,base+e.pointerId,false)};button.addEventListener('pointerdown',down,{passive:false});['pointerup','pointercancel','lostpointercapture'].forEach(n=>button.addEventListener(n,up,{passive:false}))})}
  function buttonPressed(gp,idx){return !!gp?.buttons?.[idx]?.pressed}
  function updatePad(player,gp){const prefix=`pad:${player}:`;if(!gp){releasePrefix(prefix);return}const x=Math.abs(gp.axes?.[0]||0)>.3?(gp.axes[0]||0):0,y=Math.abs(gp.axes?.[1]||0)>.3?(gp.axes[1]||0):0;const states=new Map([[INPUT.UP,buttonPressed(gp,12)||y<-.3],[INPUT.DOWN,buttonPressed(gp,13)||y>.3],[INPUT.LEFT,buttonPressed(gp,14)||x<-.3],[INPUT.RIGHT,buttonPressed(gp,15)||x>.3],[INPUT.SELECT,buttonPressed(gp,8)],[INPUT.START,buttonPressed(gp,9)]]);for(const [physical,input] of profile.padButtons){if(!states.has(input))states.set(input,false);states.set(input,states.get(input)||buttonPressed(gp,physical))}for(const [input,pressed] of states)setSource(player,input,`${prefix}${input}`,pressed)}
  function padLoop(){const max=online?1:localPlayers,pads=[...(navigator.getGamepads?.()||[])].filter(Boolean).slice(0,max);for(let p=0;p<max;p++)updatePad(p,pads[p]);if(started){if(pads.length){const names=pads.map((g,i)=>`P${i+1}: ${String(g.id).split('(')[0].trim().slice(0,26)}`);setStatus(`🎮 ${names.join(' • ')}${online?' • PVP '+room:''}`)}padFrame=requestAnimationFrame(padLoop)}}

  function defaultControls(){return{0:{},1:{},2:{},3:{}}}
  function getNetplay(){return window.EJS_emulator?.netplay||null}
  function netplayQuery(){return`domain=${encodeURIComponent(location.host)}&game_id=${encodeURIComponent(gameId)}`}
  async function directRoomList(server,timeout=9000){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);try{const r=await fetch(`${String(server||'').replace(/\/+$/,'')}/list?${netplayQuery()}`,{cache:'no-store',mode:'cors',signal:ctrl.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);const rooms=await r.json();return rooms&&typeof rooms==='object'&&!Array.isArray(rooms)?rooms:{}}finally{clearTimeout(timer)}}
  async function proxyRoomList(timeout=9000){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);try{const r=await fetch(`/api/kof-netplay-rooms?${netplayQuery()}`,{cache:'no-store',signal:ctrl.signal});if(!r.ok)throw new Error(`proxy HTTP ${r.status}`);const rooms=await r.json();return rooms&&typeof rooms==='object'&&!Array.isArray(rooms)?rooms:{}}finally{clearTimeout(timer)}}
  function patchRoomDiscovery(np,server){if(!np||np.__ggArcadePatched)return;np.__ggArcadePatched=true;np.getOpenRooms=async()=>{try{const rooms=await proxyRoomList();delete rooms.__upstream;delete rooms.__ok;delete rooms.__domain;return rooms}catch{try{return await directRoomList(server)}catch{return{}}}}}
  async function waitForNetplay(timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){const np=getNetplay();if(np&&typeof np.getOpenRooms==='function'&&typeof np.openRoom==='function'&&typeof np.joinRoom==='function'){np.name=playerName;return np}await new Promise(r=>setTimeout(r,300))}throw new Error('O Netplay WebRTC não ficou disponível.')}
  function stopNetplayTimers(){if(guestFindTimer)clearInterval(guestFindTimer);if(netplayWatchTimer)clearInterval(netplayWatchTimer);guestFindTimer=netplayWatchTimer=0}
  function monitorNetplay(np){if(netplayWatchTimer)clearInterval(netplayWatchTimer);netplayWatchTimer=setInterval(()=>{try{const players=Object.keys(np.players||{}).length;if(np.emu?.isNetplay&&players>=2&&np.webRtcReady){setStatus(`✅ PVP conectado • ${role==='host'?'PLAYER 1':'PLAYER 2'} • ${game.title}`);post('arcade-netplay-status','PVP conectado',{state:'connected',role,room});clearInterval(netplayWatchTimer);netplayWatchTimer=0}else if(np.emu?.isNetplay&&role==='host')setStatus(`🟡 Sala ${rtcRoomName} criada • aguardando rival…`);else if(np.emu?.isNetplay)setStatus(`🟡 Entrando na sala ${rtcRoomName}…`)}catch{}},700)}
  async function hostNetplay(np){if(np.emu?.isNetplay&&np.owner){monitorNetplay(np);return}if(np.emu?.isNetplay&&!np.owner&&typeof np.leaveRoom==='function')np.leaveRoom();np.name=playerName;setStatus(`🟡 Criando sessão WebRTC ${rtcRoomName}…`);np.openRoom(rtcRoomName,2,'');monitorNetplay(np)}
  async function guestNetplay(np){if(np.emu?.isNetplay&&!np.owner){monitorNetplay(np);return}np.name=playerName;setStatus(`🔎 Procurando sessão ${rtcRoomName}…`);const deadline=Date.now()+90000;const findAndJoin=async()=>{if(Date.now()>deadline){if(guestFindTimer)clearInterval(guestFindTimer);guestFindTimer=0;setStatus('⚠️ Sala WebRTC não apareceu. Volte ao lobby e tente novamente.');return}try{const rooms=await np.getOpenRooms(),match=Object.entries(rooms||{}).find(([,r])=>r?.room_name===rtcRoomName&&Number(r?.current||0)<Number(r?.max||2));if(!match)return;if(guestFindTimer)clearInterval(guestFindTimer);guestFindTimer=0;const[id,r]=match;np.joinRoom(id,r.room_name,Number(r.max||2),null);monitorNetplay(np)}catch{}};await findAndJoin();if(!guestFindTimer&&!np.emu?.isNetplay)guestFindTimer=setInterval(findAndJoin,1000)}
  async function startAutomaticNetplay(){if(!online||autoNetplayBusy)return;autoNetplayBusy=true;try{const cfg=await json('/api/kof-config'),server=String(cfg?.netplayServer||PUBLIC_NETPLAY_SERVER).trim().replace(/\/+$/,'')||PUBLIC_NETPLAY_SERVER;setStatus('🔌 Preparando servidor PVP…');const np=await waitForNetplay();patchRoomDiscovery(np,server);np.name=playerName;if(role==='host')await hostNetplay(np);else await guestNetplay(np)}catch(e){setStatus(`⚠️ ${e?.message||String(e)}`);post('arcade-netplay-status',e?.message||String(e),{state:'error',role,room})}finally{autoNetplayBusy=false}}

  async function bootGame(){
    if(loading||started||!game)return;loading=true;startButton.disabled=true;startButton.textContent='CARREGANDO…';
    try{
      setBoot(`Validando ${game.url.split('/').pop()}…`);const rom=await head(game.url);if(rom.status===404||rom.status===410)throw new Error(`ROM não encontrada: ${game.url}`);if(rom.ok&&rom.size&&game.size&&rom.size!==game.size)throw new Error(`ROM diferente da validada: ${rom.size} bytes; esperado ${game.size}.`);
      setBoot(`ROM OK (${mb(rom.size||game.size)}). Carregando EmulatorJS ${EJS_VERSION} + ${game.core}…`);
      const cfg=online?await json('/api/kof-config'):null,server=String(cfg?.netplayServer||PUBLIC_NETPLAY_SERVER).trim().replace(/\/+$/,'')||PUBLIC_NETPLAY_SERVER,ice=Array.isArray(cfg?.iceServers)&&cfg.iceServers.length?cfg.iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
      window.EJS_player='#game';window.EJS_core=game.core;window.EJS_gameUrl=game.url;window.EJS_gameID=online?gameId:game.localId;window.EJS_pathtodata=EJS_DATA;window.EJS_language='pt-BR';window.EJS_disableAutoLang=true;window.EJS_startOnLoaded=true;window.EJS_noAutoFocus=true;window.EJS_threads=!!(window.crossOriginIsolated&&typeof SharedArrayBuffer!=='undefined');window.EJS_color='#42e8ff';window.EJS_backgroundColor='#050913';window.EJS_backgroundBlur=false;window.EJS_controlScheme='arcade';window.EJS_defaultControls=defaultControls();window.EJS_VirtualGamepadSettings=[];window.EJS_Buttons={playPause:false,restart:false,mute:false,settings:false,fullscreen:false,saveState:false,loadState:false,screenRecord:false,gamepad:false,cheat:false,volume:false,saveSavFiles:false,loadSavFiles:false,quickSave:false,quickLoad:false,screenshot:false,cacheManager:false,exitEmulation:false};window.EJS_AdTimer=-1;window.EJS_CacheLimit=512*1024*1024;
      if(online){window.EJS_netplayServer=server;window.EJS_netplayICEServers=ice}else{window.EJS_netplayServer='';window.EJS_netplayICEServers=[]}
      window.EJS_ready=()=>setBoot(`${game.core} carregado. Preparando ${game.title}…`);
      window.EJS_onGameStart=async()=>{const ok=await waitDirect();if(!ok){fail('A entrada direta do emulador não ficou disponível.');return}started=true;loading=false;boot.style.display='none';setStatus(online?'🟡 Jogo carregado • conectando PVP…':`✅ ${localPlayers}P local ativo • COIN + START para entrar`);cancelAnimationFrame(padFrame);padLoop();if(online)startAutomaticNetplay();post('arcade-player-ready',`${game.title} carregado.`,{online,players:online?2:localPlayers,role,room})};
      const loadLoader=(dataPath,label)=>new Promise((resolve,reject)=>{
        EJS_DATA=dataPath;
        window.EJS_pathtodata=dataPath;
        const script=document.createElement('script');
        script.src=`${dataPath}loader.js`;
        script.async=true;
        script.onload=()=>resolve(label);
        script.onerror=()=>{script.remove();reject(new Error(label));};
        document.body.appendChild(script);
      });
      try{
        await loadLoader(EJS_PROXY_DATA,'proxy da Vercel');
      }catch{
        setBoot(`Proxy indisponível. Tentando CDN direto do EmulatorJS ${EJS_VERSION}…`);
        try{
          await loadLoader(EJS_DIRECT_DATA,'CDN direto');
        }catch{
          throw new Error(`Não foi possível carregar EmulatorJS ${EJS_VERSION} pelo proxy da Vercel nem pelo CDN direto.`);
        }
      }
    }catch(e){fail(e?.message||String(e))}
  }

  setupUi();bindKeyboard();startButton?.addEventListener('click',bootGame);helpButton?.addEventListener('click',()=>document.body.classList.toggle('help-open'));$('help')?.addEventListener('click',e=>{if(e.target===$('help'))document.body.classList.remove('help-open')});fullscreenButton?.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{}});document.addEventListener('fullscreenchange',()=>{if(fullscreenButton)fullscreenButton.textContent=document.fullscreenElement?'↙ SAIR':'⛶ CHEIA'});addEventListener('pagehide',()=>{releaseAll();stopNetplayTimers();cancelAnimationFrame(padFrame)});addEventListener('unhandledrejection',e=>{if(!started&&e?.reason)fail(e.reason?.message||String(e.reason))});

  // O clique no modo no lobby já representa a intenção de jogar. Tentamos iniciar
  // automaticamente; se o navegador bloquear áudio/autoplay, o botão permanece disponível.
  setTimeout(()=>{ if(game&&!started&&!loading) bootGame(); },220);
})();
