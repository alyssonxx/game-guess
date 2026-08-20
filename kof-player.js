(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const boot = document.getElementById('boot');
  const text = document.getElementById('bootText');
  const startButton = document.getElementById('startKofButton');
  const EJS_VERSION = '4.2.1';
  const PATCH_VERSION = '18.4.0';
  const EJS_DATA = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;

  // V17.7: FBNeo full non-merged. Libretro recommends this format when using
  // only a few arcade sets: the single game archive contains clone + parent +
  // BIOS ROMs. This avoids EmulatorJS 4.2.1 extracting EJS_gameParentUrl and
  // EJS_biosUrl into loose files while FBNeo searches for the related romsets.
  const GAME_URL = '/roms/v178/kf2k2mp2.zip';
  const EXPECTED_GAME_SIZE = 86694745;
  const EXPECTED_SHA256 = '2cb16b649819f8168701f01ddd4642dc3678283c112cd89e79103ed45f4a1a4d';
  const FBN_CORE_BUILD = '2025-01-07T14:59:35Z';

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
    setText('Verificando romset Full Non-Merged do KOF…');
    const game = await head(GAME_URL);
    if (!game.ok) throw new Error('Arquivo ausente neste deploy: kf2k2mp2.zip.');
    // Full Non-Merged is large because it embeds the clone, parent and Neo Geo BIOS.
    if (game.size && game.size !== EXPECTED_GAME_SIZE) {
      throw new Error(`O deploy está servindo um kf2k2mp2.zip diferente do validado: ${mb(game.size)} (${game.size} bytes). Esperado: ${EXPECTED_GAME_SIZE} bytes. Faça novo deploy e Ctrl+F5.`);
    }
    return { game };
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
      setText(`Romset Full Non-Merged OK: ${mb(files.game.size)}.`);

      const cfg = await json('/api/kof-config');
      const gameId = Math.max(1, Number(params.get('gameId')) || 20020202);
      const server = String(params.get('server') || cfg?.netplayServer || 'https://netplay.emulatorjs.org/').trim();
      const ice = Array.isArray(cfg?.iceServers) && cfg.iceServers.length
        ? cfg.iceServers
        : [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

      window.EJS_player = '#game';
      window.EJS_core = 'fbneo';
      window.EJS_gameUrl = GAME_URL;
      // Full Non-Merged: do not define EJS_gameParentUrl or EJS_biosUrl.
      // FBNeo receives one archive whose basename remains kf2k2mp2.zip.
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

      // V18.4 — painel virtual Neo Geo / KOF.
      // Mantemos os IDs Libretro que o FBNeo já entende, alterando apenas a
      // apresentação do controle touch para o padrão de fliperama A/B/C/D.
      // Mapeamento clássico Neo Geo no RetroPad:
      // A -> B(0), B -> A(8), C -> Y(1), D -> X(9).
      window.EJS_VirtualGamepadSettings = [
        {
          type: 'dpad',
          location: 'left',
          left: '50%',
          top: '50%',
          joystickInput: false,
          inputValues: [4, 5, 6, 7]
        },
        {
          type: 'button', text: 'A', id: 'gg-neo-a', location: 'right',
          left: 0, top: 46, bold: true, fontSize: 28, input_value: 0
        },
        {
          type: 'button', text: 'B', id: 'gg-neo-b', location: 'right',
          left: 58, top: 34, bold: true, fontSize: 28, input_value: 8
        },
        {
          type: 'button', text: 'C', id: 'gg-neo-c', location: 'right',
          left: 116, top: 22, bold: true, fontSize: 28, input_value: 1
        },
        {
          type: 'button', text: 'D', id: 'gg-neo-d', location: 'right',
          left: 174, top: 10, bold: true, fontSize: 28, input_value: 9
        },
        {
          type: 'button', text: 'COIN', id: 'gg-neo-coin', location: 'center',
          left: -54, top: 0, bold: true, fontSize: 13, block: true, input_value: 2
        },
        {
          type: 'button', text: 'START', id: 'gg-neo-start', location: 'center',
          left: 54, top: 0, bold: true, fontSize: 13, block: true, input_value: 3
        }
      ];

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
        setText(`EmulatorJS ${EJS_VERSION} + FBNeo build ${FBN_CORE_BUILD} carregado. Entregando o Full Non-Merged…`);
        post('kof-player-core-ready', `EmulatorJS ${EJS_VERSION} / FBNeo explícito carregado.`, {
          version: EJS_VERSION, gameId, online, layout: 'full-non-merged', controls: 'neo-geo-abcd'
        });
      };

      window.EJS_onGameStart = () => {
        started = true;
        loading = false;
        if (boot) boot.style.display = 'none';
        post('kof-player-ready', `KOF iniciado • EmulatorJS ${EJS_VERSION} • FBNeo • Game ID ${gameId}`, {
          gameId, version: EJS_VERSION, online, role, room, layout: 'full-non-merged', controls: 'neo-geo-abcd'
        });
        scheduleNetplayMenu();
      };

      setText(`Carregando EmulatorJS ${EJS_VERSION} + FBNeo…`);
      const script = document.createElement('script');
      script.src = `${EJS_DATA}loader.js`;
      script.onerror = () => fail(`Não consegui carregar o EmulatorJS ${EJS_VERSION}. Verifique a conexão.`);
      document.body.appendChild(script);

      setTimeout(() => {
        if (!started) setText('FBNeo está preparando o romset Full Non-Merged. No primeiro carregamento isso pode demorar.');
      }, 8000);
      setTimeout(() => {
        if (!started) post('kof-player-slow', 'O KOF ainda está preparando o romset Full Non-Merged.', { version: EJS_VERSION, online, layout: 'full-non-merged', controls: 'neo-geo-abcd' });
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

  const arcadeHelpButton = document.getElementById('arcadeHelpButton');
  const arcadeHelpModal = document.getElementById('arcadeHelpModal');
  const arcadeHelpClose = document.getElementById('arcadeHelpClose');
  const setArcadeHelp = open => { if (arcadeHelpModal) arcadeHelpModal.hidden = !open; };
  arcadeHelpButton?.addEventListener('click', () => setArcadeHelp(true));
  arcadeHelpClose?.addEventListener('click', () => setArcadeHelp(false));
  arcadeHelpModal?.addEventListener('click', e => { if (e.target === arcadeHelpModal) setArcadeHelp(false); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setArcadeHelp(false); });
  if(online){
    if(startButton)startButton.textContent=role==='host'?'CONECTAR HOST':'CONECTAR CONVIDADO';
    setText('Partida online liberada. Tentando carregar o FBNeo automaticamente; se o navegador exigir interação, clique no botão abaixo.');
    setTimeout(()=>bootGame(),180);
  }else{
    setText('Clique em INICIAR KOF. A V17.9 usa o FBNeo explicitamente e um único kf2k2mp2.zip Full Non-Merged em uma URL nova para eliminar cache antigo do Vercel/navegador.');
  }
})();
