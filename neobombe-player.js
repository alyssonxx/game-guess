(() => {
  'use strict';

  const EJS_VERSION = '4.2.3';
  const EJS_DATA = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;
  const GAME_URL = '/roms/neogeo/neobombe.zip';
  const EXPECTED_SIZE = 7431142;
  const GAME_ID = 19970501;
  const INPUT = { A:0, B:8, COIN:2, START:3, UP:4, DOWN:5, LEFT:6, RIGHT:7 };

  const boot = document.getElementById('boot');
  const bootText = document.getElementById('bootText');
  const startButton = document.getElementById('startButton');
  const status = document.getElementById('status');
  const fullscreenButton = document.getElementById('fullscreenButton');
  const helpButton = document.getElementById('helpButton');

  let loading = false;
  let started = false;
  let directReady = false;
  let padFrame = 0;
  const held = new Map();

  const keyboard = new Map([
    ['KeyW',[0,INPUT.UP]], ['KeyS',[0,INPUT.DOWN]], ['KeyA',[0,INPUT.LEFT]], ['KeyD',[0,INPUT.RIGHT]],
    ['KeyF',[0,INPUT.A]], ['KeyG',[0,INPUT.B]], ['KeyR',[0,INPUT.COIN]], ['KeyT',[0,INPUT.START]],
    ['ArrowUp',[1,INPUT.UP]], ['ArrowDown',[1,INPUT.DOWN]], ['ArrowLeft',[1,INPUT.LEFT]], ['ArrowRight',[1,INPUT.RIGHT]],
    ['KeyK',[1,INPUT.A]], ['KeyL',[1,INPUT.B]], ['KeyO',[1,INPUT.COIN]], ['KeyP',[1,INPUT.START]]
  ]);

  function post(type, message, extra = {}) {
    try { parent.postMessage({ type, message, ...extra }, location.origin); } catch {}
  }
  function setStatus(message) { if (status) status.textContent = message; }
  function setBoot(message) { if (bootText) bootText.textContent = message; }
  function fail(message) {
    const msg = String(message || 'Falha ao iniciar Neo Bomberman.');
    loading = false; started = false; directReady = false;
    if (boot) boot.style.display = 'grid';
    if (startButton) { startButton.disabled = false; startButton.textContent = '↻ TENTAR NOVAMENTE'; }
    setBoot(msg); setStatus('❌ ' + msg);
    post('neobombe-player-error', msg);
  }
  function mb(n) { return `${(Number(n || 0) / 1024 / 1024).toFixed(1)} MB`; }
  async function head(url) {
    try {
      const r = await fetch(url, { method:'HEAD', cache:'no-store' });
      return { ok:r.ok, status:r.status, size:Number(r.headers.get('content-length') || 0) };
    } catch { return { ok:false, status:0, size:0 }; }
  }

  function gm() { return window.EJS_emulator?.gameManager || null; }
  function simulate(player, input, value) {
    const manager = gm();
    if (!manager || typeof manager.simulateInput !== 'function') return false;
    try { manager.simulateInput(Number(player), Number(input), Number(value)); return true; }
    catch { return false; }
  }
  function heldKey(player, input) { return `${player}:${input}`; }
  function setSource(player, input, source, pressed) {
    if (!directReady || !Number.isFinite(player) || !Number.isFinite(input)) return false;
    const key = heldKey(player, input);
    let sources = held.get(key);
    if (!pressed) {
      if (!sources || !sources.has(source)) return true;
      sources.delete(source);
      if (!sources.size) { simulate(player, input, 0); held.delete(key); }
      return true;
    }
    if (!sources) { sources = new Set(); held.set(key, sources); }
    if (sources.has(source)) return true;
    if (!sources.size && !simulate(player, input, 1)) return false;
    sources.add(source);
    return true;
  }
  function releasePrefix(prefix) {
    for (const [key,sources] of [...held.entries()]) {
      const [player,input] = key.split(':').map(Number);
      for (const src of [...sources]) if (src.startsWith(prefix)) setSource(player,input,src,false);
    }
  }
  function releaseAll() {
    for (const key of [...held.keys()]) {
      const [player,input] = key.split(':').map(Number);
      simulate(player,input,0);
    }
    held.clear();
  }

  async function waitDirect(timeout=5000) {
    const end = performance.now() + timeout;
    while (performance.now() < end) {
      if (typeof gm()?.simulateInput === 'function') { directReady = true; return true; }
      await new Promise(r => setTimeout(r,30));
    }
    return false;
  }

  function bindKeyboard() {
    const apply = (e, pressed) => {
      const map = keyboard.get(e.code);
      if (!map || !started) return;
      e.preventDefault(); e.stopPropagation();
      setSource(map[0], map[1], `key:${e.code}`, pressed);
    };
    addEventListener('keydown', e => { if (!e.repeat) apply(e,true); }, { capture:true });
    addEventListener('keyup', e => apply(e,false), { capture:true });
    addEventListener('blur', () => releasePrefix('key:'));
  }

  function bindTouch() {
    document.querySelectorAll('.touch-player button[data-input]').forEach(button => {
      const holder = button.closest('.touch-player');
      const player = Number(holder?.dataset.player || 0);
      const input = Number(button.dataset.input);
      const sourceBase = `touch:${player}:${input}:`;
      const down = e => {
        if (!started) return;
        e.preventDefault(); e.stopPropagation();
        button.classList.add('active');
        try { button.setPointerCapture?.(e.pointerId); } catch {}
        setSource(player,input,`${sourceBase}${e.pointerId}`,true);
      };
      const up = e => {
        e.preventDefault(); e.stopPropagation();
        button.classList.remove('active');
        setSource(player,input,`${sourceBase}${e.pointerId}`,false);
      };
      button.addEventListener('pointerdown',down,{passive:false});
      ['pointerup','pointercancel','lostpointercapture'].forEach(name => button.addEventListener(name,up,{passive:false}));
    });
  }

  function buttonPressed(gp, idx) { return !!gp?.buttons?.[idx]?.pressed; }
  function updatePad(player, gp) {
    const prefix = `pad:${player}:`;
    if (!gp) { releasePrefix(prefix); return; }
    const x = Math.abs(gp.axes?.[0] || 0) > .32 ? (gp.axes[0] || 0) : 0;
    const y = Math.abs(gp.axes?.[1] || 0) > .32 ? (gp.axes[1] || 0) : 0;
    const states = new Map([
      [INPUT.UP, buttonPressed(gp,12) || y < -.32],
      [INPUT.DOWN, buttonPressed(gp,13) || y > .32],
      [INPUT.LEFT, buttonPressed(gp,14) || x < -.32],
      [INPUT.RIGHT, buttonPressed(gp,15) || x > .32],
      [INPUT.A, buttonPressed(gp,0)],
      [INPUT.B, buttonPressed(gp,1)],
      [INPUT.COIN, buttonPressed(gp,8)],
      [INPUT.START, buttonPressed(gp,9)]
    ]);
    for (const [input,pressed] of states) setSource(player,input,`${prefix}${input}`,pressed);
  }
  function padLoop() {
    const pads = [...(navigator.getGamepads?.() || [])].filter(Boolean).slice(0,2);
    updatePad(0,pads[0]); updatePad(1,pads[1]);
    if (started) {
      const names = pads.map((p,i)=>`P${i+1}: ${p.id.split('(')[0].trim().slice(0,28)}`);
      if (names.length) setStatus(`🎮 ${names.join(' • ')} • teclado e touch continuam ativos`);
      padFrame = requestAnimationFrame(padLoop);
    }
  }

  function defaultControls() {
    // Fallback nativo. O caminho principal usa simulateInput para separar P1 e P2 sem duplicar entradas.
    return { 0:{}, 1:{}, 2:{}, 3:{} };
  }

  async function bootGame() {
    if (loading || started) return;
    loading = true;
    startButton.disabled = true;
    startButton.textContent = 'CARREGANDO…';
    try {
      setBoot('Validando neobombe.zip…');
      const rom = await head(GAME_URL);
      if (!rom.ok) throw new Error('neobombe.zip não foi encontrado em /roms/neogeo/.');
      if (rom.size && rom.size !== EXPECTED_SIZE) throw new Error(`ROM diferente da validada: ${rom.size} bytes; esperado ${EXPECTED_SIZE}.`);
      setBoot(`ROM OK (${mb(rom.size || EXPECTED_SIZE)}). Carregando EmulatorJS ${EJS_VERSION} + FBNeo…`);

      window.EJS_player = '#game';
      window.EJS_core = 'fbneo';
      window.EJS_gameUrl = GAME_URL;
      window.EJS_gameID = GAME_ID;
      window.EJS_pathtodata = EJS_DATA;
      window.EJS_language = 'pt-BR';
      window.EJS_disableAutoLang = true;
      window.EJS_startOnLoaded = true;
      window.EJS_noAutoFocus = true;
      window.EJS_threads = !!(window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined');
      window.EJS_color = '#ffd740';
      window.EJS_backgroundColor = '#050913';
      window.EJS_backgroundBlur = false;
      window.EJS_controlScheme = 'arcade';
      window.EJS_defaultControls = defaultControls();
      window.EJS_VirtualGamepadSettings = [];
      window.EJS_Buttons = { playPause:false,restart:false,mute:false,settings:false,fullscreen:false,saveState:false,loadState:false,screenRecord:false,gamepad:false,cheat:false,volume:false,saveSavFiles:false,loadSavFiles:false,quickSave:false,quickLoad:false,screenshot:false,cacheManager:false,exitEmulation:false };
      window.EJS_AdTimer = -1;
      window.EJS_CacheLimit = 256 * 1024 * 1024;

      window.EJS_ready = () => setBoot('FBNeo carregado. Preparando Neo Bomberman…');
      window.EJS_onGameStart = async () => {
        const ok = await waitDirect();
        if (!ok) { fail('A entrada direta P1/P2 do FBNeo não ficou disponível.'); return; }
        started = true; loading = false;
        boot.style.display = 'none';
        setStatus('✅ P1 + P2 ativos • pressione COIN e depois START para entrar');
        cancelAnimationFrame(padFrame); padLoop();
        post('neobombe-player-ready','Neo Bomberman carregado • multiplayer local P1/P2 ativo.',{game:'neobombe',players:2});
      };

      const script = document.createElement('script');
      script.src = `${EJS_DATA}loader.js`;
      script.onerror = () => fail(`Não foi possível carregar EmulatorJS ${EJS_VERSION}.`);
      document.body.appendChild(script);
    } catch (e) {
      fail(e?.message || String(e));
    }
  }

  bindKeyboard();
  bindTouch();
  startButton.addEventListener('click',bootGame);
  helpButton.addEventListener('click',()=>document.body.classList.toggle('help-open'));
  document.getElementById('help').addEventListener('click',()=>document.body.classList.remove('help-open'));
  fullscreenButton.addEventListener('click',async()=>{
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen();
    } catch {}
  });
  document.addEventListener('fullscreenchange',()=>{fullscreenButton.textContent=document.fullscreenElement?'↙ SAIR':'⛶ CHEIA';});
  addEventListener('unhandledrejection',e=>{ if(!started && e?.reason) fail(e.reason?.message || String(e.reason)); });
  addEventListener('pagehide',()=>{releaseAll();cancelAnimationFrame(padFrame);});
})();
