(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const boot = document.getElementById('boot');
  const text = document.getElementById('bootText');
  const startButton = document.getElementById('startKofButton');
  const EJS_VERSION = '4.2.1';
  const PATCH_VERSION = '17.5.0';
  const EJS_DATA = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;

  // Layout split: clone + parent + BIOS. This is intentionally different from
  // the previous Full Non-Merged experiment. EmulatorJS 4.2.1 fixed placement
  // of BIOS/parent files, so we let the arcade core receive each archive in the
  // role it expects.
  const GAME_URL = '/roms/kf2k2mp2.zip';
  const PARENT_URL = '/roms/kof2002.zip';
  const BIOS_URL = '/roms/neogeo.zip';

  const role = String(params.get('role') || 'training').toLowerCase();
  const room = String(params.get('room') || 'TREINO').toUpperCase();
  const online = role !== 'training' && room !== 'TREINO';
  let started = false;
  let loading = false;
  let menuOpened = false;

  function post(type, message, extra = {}) {
    try { window.parent?.postMessage({ type, message, ...extra }, location.origin); } catch {}
  }
  function setText(message) { if (text) text.textContent = message; }
  function fail(message) {
    loading = false;
    if (startButton) {
      startButton.disabled = false;
      startButton.textContent = 'TENTAR NOVAMENTE';
    }
    setText(message);
    post('kof-player-error', message);
  }

  async function json(url) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  }

  async function head(url) {
    try {
      const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      return {
        ok: r.ok,
        status: r.status,
        size: Number(r.headers.get('content-length') || 0),
        type: r.headers.get('content-type') || ''
      };
    } catch {
      return { ok: false, status: 0, size: 0, type: '' };
    }
  }

  function mb(value) { return value ? `${(value / 1024 / 1024).toFixed(1)} MB` : 'tamanho não informado'; }

  async function validateArcadeFiles() {
    setText('Verificando clone, parent e BIOS do Neo Geo…');
    const [game, parent, bios] = await Promise.all([
      head(GAME_URL),
      head(PARENT_URL),
      head(BIOS_URL)
    ]);

    const missing = [];
    if (!game.ok) missing.push('kf2k2mp2.zip');
    if (!parent.ok) missing.push('kof2002.zip');
    if (!bios.ok) missing.push('neogeo.zip');
    if (missing.length) throw new Error(`Arquivos ausentes neste deploy: ${missing.join(', ')}.`);

    // Catch the common mistake of leaving the old ~83 MB merged ROM under the
    // clone filename. The clone itself should be only a few MB compressed.
    if (game.size && game.size > 20 * 1024 * 1024) {
      throw new Error(`kf2k2mp2.zip ainda parece ser o Full Non-Merged antigo (${mb(game.size)}). Nesta versão ele precisa ser o clone pequeno; kof2002.zip e neogeo.zip ficam separados.`);
    }
    if (parent.size && parent.size < 40 * 1024 * 1024) {
      throw new Error(`kof2002.zip parece incompleto (${mb(parent.size)}).`);
    }
    if (bios.size && bios.size < 1024 * 1024) {
      throw new Error(`neogeo.zip parece incompleto (${mb(bios.size)}).`);
    }

    return { game, parent, bios };
  }

  function openNetplayMenu() {
    if (!online || menuOpened) return false;
    const emu = window.EJS_emulator;
    if (!emu) return false;
    try {
      if (typeof emu?.netplay?.openMenu === 'function') {
        emu.netplay.openMenu();
        menuOpened = true;
      } else if (typeof emu?.openNetplayMenu === 'function') {
        emu.openNetplayMenu();
        menuOpened = true;
      }
    } catch (e) {
      console.warn('Game Guess: menu Netplay automático indisponível.', e);
    }
    if (menuOpened) {
      post('kof-netplay-menu', role === 'host'
        ? 'Netplay aberto: HOST deve criar a sessão.'
        : 'Netplay aberto: CONVIDADO deve entrar na sessão.', { role, room });
    }
    return menuOpened;
  }

  function scheduleNetplayMenu() {
    if (!online) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (openNetplayMenu() || tries >= 20) clearInterval(timer);
    }, 500);
  }

  async function bootGame() {
    if (loading || started) return;
    loading = true;
    if (startButton) {
      startButton.disabled = true;
      startButton.textContent = 'CARREGANDO…';
    }

    try {
      const files = await validateArcadeFiles();
      setText(`Arquivos OK: clone ${mb(files.game.size)} • parent ${mb(files.parent.size)} • BIOS ${mb(files.bios.size)}.`);

      const cfg = await json('/api/kof-config');
      const gameId = Math.max(1, Number(params.get('gameId')) || 20020202);
      const server = String(params.get('server') || cfg?.netplayServer || 'https://netplay.emulatorjs.org/').trim();
      const ice = Array.isArray(cfg?.iceServers) && cfg.iceServers.length
        ? cfg.iceServers
        : [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

      window.EJS_player = '#game';
      window.EJS_core = 'arcade';
      window.EJS_gameUrl = GAME_URL;
      window.EJS_gameParentUrl = PARENT_URL;
      window.EJS_biosUrl = BIOS_URL;
      // Não definimos EJS_gameName aqui: para arcade, preservamos o nome real
      // do arquivo kf2k2mp2.zip para o FBNeo identificar o romset sem ambiguidade.
      window.EJS_gameID = gameId;
      window.EJS_pathtodata = EJS_DATA;
      window.EJS_language = 'pt-BR';
      window.EJS_startOnLoaded = true;
      window.EJS_noAutoFocus = matchMedia('(hover:none) and (pointer:coarse)').matches;
      window.EJS_threads = false;
      window.EJS_color = '#42e8ff';
      window.EJS_backgroundColor = '#050913';
      window.EJS_controlScheme = 'arcade';
      window.EJS_AdTimer = -1;
      window.EJS_CacheLimit = 1024 * 1024 * 1024;
      window.EJS_DEBUG_XX = params.get('debug') === '1';

      if (online) {
        window.EJS_netplayServer = server;
        window.EJS_netplayICEServers = ice;
      } else {
        window.EJS_netplayServer = '';
        window.EJS_netplayICEServers = [];
      }

      window.EJS_ready = () => {
        setText(`EmulatorJS ${EJS_VERSION} carregado. Entregando clone + parent + BIOS ao FBNeo…`);
        post('kof-player-core-ready', `EmulatorJS ${EJS_VERSION} / arcade→FBNeo carregado.`, {
          version: EJS_VERSION, gameId, online, layout: 'split'
        });
      };

      window.EJS_onGameStart = () => {
        started = true;
        loading = false;
        if (boot) boot.style.display = 'none';
        post('kof-player-ready', `KOF iniciado • EmulatorJS ${EJS_VERSION} • FBNeo • Game ID ${gameId}`, {
          gameId, version: EJS_VERSION, online, role, room, layout: 'split'
        });
        scheduleNetplayMenu();
      };

      setText(`Carregando EmulatorJS ${EJS_VERSION} + FBNeo…`);
      const script = document.createElement('script');
      script.src = `${EJS_DATA}loader.js`;
      script.onerror = () => fail(`Não consegui carregar o EmulatorJS ${EJS_VERSION}. Verifique a conexão.`);
      document.body.appendChild(script);

      setTimeout(() => {
        if (!started) setText('FBNeo está preparando o clone, o parent e a BIOS FBNeo repacotada. No primeiro carregamento isso pode demorar.');
      }, 8000);
      setTimeout(() => {
        if (!started) post('kof-player-slow', 'O KOF ainda está preparando os três romsets.', { version: EJS_VERSION, online, layout: 'split' });
      }, 20000);
    } catch (e) {
      fail(e?.message || String(e));
    }
  }

  window.addEventListener('unhandledrejection', e => {
    if (!started && e?.reason) post('kof-player-debug', String(e.reason?.message || e.reason));
  });

  // A click inside the iframe guarantees a real user gesture before WebAudio /
  // game startup, which is more reliable than auto-booting as soon as the
  // iframe is created.
  startButton?.addEventListener('click', bootGame);
  setText('Clique em INICIAR KOF. Esta versão usa o core arcade (FBNeo), clone + parent separados e a BIOS FBNeo enviada por você, repacotada com arquivos na raiz do ZIP.');
})();
