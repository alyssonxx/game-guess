(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const boot = document.getElementById('boot');
  const text = document.getElementById('bootText');
  const startButton = document.getElementById('startKofButton');
  const fullscreenButton = document.getElementById('kofFullscreenButton');
  const portraitButton = document.getElementById('kofPortraitButton');
  const landscapeButton = document.getElementById('kofLandscapeButton');
  const netplayStatus = document.getElementById('kofNetplayStatus');
  const netplayRetryButton = document.getElementById('kofNetplayRetry');
  const netplayMenuButton = document.getElementById('kofNetplayMenuButton');

  const role = String(params.get('role') || 'training').toLowerCase();
  const room = String(params.get('room') || 'TREINO').toUpperCase();
  const online = role !== 'training' && room !== 'TREINO';
  // Treino permanece na build já validada. O online usa 4.3.0-pre porque essa
  // é a primeira linha oficial do EmulatorJS com Netplay WebRTC novo.
  const EJS_VERSION = online ? '4.3.0-pre' : '4.2.1';
  const PATCH_VERSION = '18.6.0';
  const EJS_DATA = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;

  const GAME_URL = '/roms/v178/kf2k2mp2.zip';
  const EXPECTED_GAME_SIZE = 86694745;
  const EXPECTED_SHA256 = '2cb16b649819f8168701f01ddd4642dc3678283c112cd89e79103ed45f4a1a4d';
  const TRAINING_FBN_BUILD = '2025-01-07T14:59:35Z';
  const gameId = Math.max(1, Number(params.get('gameId')) || 20020202);
  const launchToken = String(params.get('launch') || gameId).replace(/\D/g, '').slice(-5) || String(gameId).slice(-5);
  const playerName = String(params.get('name') || (role === 'host' ? 'HOST' : role === 'guest' ? 'CONVIDADO' : 'PLAYER')).trim().slice(0, 20) || 'PLAYER';
  const rtcRoomName = `GG-${room}-${launchToken}`.slice(0, 20);

  let started = false;
  let loading = false;
  let autoNetplayBusy = false;
  let netplayWatchTimer = 0;
  let guestFindTimer = 0;

  function post(type, message, extra = {}) {
    try { window.parent?.postMessage({ type, message, ...extra }, location.origin); } catch {}
  }
  function setText(message) { if (text) text.textContent = message; }
  function setNetplayState(message, kind = 'info') {
    if (netplayStatus) {
      netplayStatus.hidden = false;
      netplayStatus.dataset.kind = kind;
      const span = netplayStatus.querySelector('[data-netplay-text]');
      if (span) span.textContent = message;
    }
    post('kof-netplay-status', message, { role, room, state: kind, rtcRoomName });
  }
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
    if (game.size && game.size !== EXPECTED_GAME_SIZE) {
      throw new Error(`O deploy está servindo um kf2k2mp2.zip diferente do validado: ${mb(game.size)} (${game.size} bytes). Esperado: ${EXPECTED_GAME_SIZE} bytes. Faça novo deploy e Ctrl+F5.`);
    }
    return { game };
  }

  function getNetplay() { return window.EJS_emulator?.netplay || null; }

  function prepareRoleAwareMenu(np) {
    if (!np || np.__ggRolePatched) return;
    np.__ggRolePatched = true;
    const original = typeof np.createNetplayMenu === 'function' ? np.createNetplayMenu.bind(np) : null;
    if (!original) return;
    np.createNetplayMenu = (...args) => {
      const result = original(...args);
      queueMicrotask(() => {
        try {
          np.name = playerName;
          if (role === 'guest' && np.createButton) {
            np.createButton.style.display = 'none';
            np.createButton.setAttribute('aria-hidden', 'true');
          }
        } catch {}
      });
      return result;
    };
  }

  async function waitForNetplay(timeout = 18000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const np = getNetplay();
      if (np && typeof np.getOpenRooms === 'function' && typeof np.openRoom === 'function' && typeof np.joinRoom === 'function') {
        np.name = playerName;
        prepareRoleAwareMenu(np);
        return np;
      }
      await new Promise(r => setTimeout(r, 300));
    }
    throw new Error('O Netplay WebRTC não ficou disponível. Atualize a página e tente novamente.');
  }

  function stopNetplayTimers() {
    if (netplayWatchTimer) clearInterval(netplayWatchTimer);
    if (guestFindTimer) clearInterval(guestFindTimer);
    netplayWatchTimer = 0;
    guestFindTimer = 0;
  }

  function monitorNetplay(np) {
    if (netplayWatchTimer) clearInterval(netplayWatchTimer);
    netplayWatchTimer = setInterval(() => {
      try {
        const players = Object.keys(np.players || {}).length;
        if (np.emu?.isNetplay && players >= 2 && np.webRtcReady) {
          setNetplayState(`✅ PVP CONECTADO • ${playerName} • ${role === 'host' ? 'PLAYER 1' : 'PLAYER 2'}`, 'connected');
          if (netplayRetryButton) netplayRetryButton.hidden = true;
          clearInterval(netplayWatchTimer);
          netplayWatchTimer = 0;
          return;
        }
        if (np.emu?.isNetplay && role === 'host' && players < 2) {
          setNetplayState(`🟡 Sala WebRTC ${rtcRoomName} criada • aguardando o convidado…`, 'waiting');
        } else if (np.emu?.isNetplay && role === 'guest') {
          setNetplayState(`🟡 Entrou na sala ${rtcRoomName} • conectando vídeo e controles…`, 'waiting');
        }
      } catch {}
    }, 700);
  }

  async function hostNetplay(np) {
    if (np.emu?.isNetplay && np.owner) { monitorNetplay(np); return; }
    if (np.emu?.isNetplay && !np.owner && typeof np.leaveRoom === 'function') np.leaveRoom();
    np.name = playerName;
    setNetplayState(`🟡 HOST criando automaticamente a sessão ${rtcRoomName}…`, 'waiting');
    np.openRoom(rtcRoomName, 2, '');
    monitorNetplay(np);
  }

  async function guestNetplay(np) {
    if (np.emu?.isNetplay && !np.owner) { monitorNetplay(np); return; }
    np.name = playerName;
    setNetplayState(`🔎 CONVIDADO procurando a sessão ${rtcRoomName}…`, 'waiting');
    const deadline = Date.now() + 30000;
    const findAndJoin = async () => {
      if (Date.now() > deadline) {
        if (guestFindTimer) clearInterval(guestFindTimer);
        guestFindTimer = 0;
        setNetplayState('⚠️ A sala WebRTC do HOST ainda não apareceu. Toque em RECONECTAR ONLINE.', 'error');
        if (netplayRetryButton) netplayRetryButton.hidden = false;
        return;
      }
      try {
        const rooms = await np.getOpenRooms();
        const match = Object.entries(rooms || {}).find(([, r]) => r?.room_name === rtcRoomName && Number(r?.current || 0) < Number(r?.max || 2));
        if (!match) return;
        if (guestFindTimer) clearInterval(guestFindTimer);
        guestFindTimer = 0;
        const [id, r] = match;
        setNetplayState(`🟡 Sala ${rtcRoomName} encontrada • entrando automaticamente…`, 'waiting');
        np.joinRoom(id, r.room_name, Number(r.max || 2), null);
        monitorNetplay(np);
      } catch (e) {
        console.warn('Game Guess: busca de sala Netplay falhou.', e);
      }
    };
    await findAndJoin();
    if (!guestFindTimer && !(np.emu?.isNetplay)) guestFindTimer = setInterval(findAndJoin, 1000);
  }

  async function startAutomaticNetplay(force = false) {
    if (!online || (autoNetplayBusy && !force)) return;
    autoNetplayBusy = true;
    if (force) stopNetplayTimers();
    try {
      const np = await waitForNetplay();
      np.name = playerName; // evita o popup "Set Player Name"
      if (role === 'host') await hostNetplay(np);
      else await guestNetplay(np);
    } catch (e) {
      setNetplayState(`⚠️ ${e?.message || String(e)}`, 'error');
      if (netplayRetryButton) netplayRetryButton.hidden = false;
    } finally {
      autoNetplayBusy = false;
    }
  }

  function openNetplayMenu() {
    const np = getNetplay();
    if (!np) return false;
    try {
      np.name = playerName;
      if (!np.isMenuCreated?.()) np.createNetplayMenu?.();
      if (role === 'guest' && np.createButton) np.createButton.style.display = 'none';
      np.openMenu?.();
      return true;
    } catch (e) {
      console.warn('Game Guess: menu Netplay indisponível.', e);
      return false;
    }
  }

  async function requestFullscreen() {
    const target = document.documentElement;
    try {
      if (!document.fullscreenElement) {
        const fn = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
        if (fn) await fn.call(target);
      }
      return true;
    } catch (e) {
      setNetplayState('O navegador bloqueou a tela cheia. Toque novamente no botão ⛶.', 'error');
      return false;
    }
  }

  async function exitFullscreen() {
    try {
      const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (document.fullscreenElement && fn) await fn.call(document);
    } catch {}
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await exitFullscreen();
    else await requestFullscreen();
  }

  async function setOrientation(mode) {
    const ok = await requestFullscreen();
    if (!ok) return;
    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock(mode === 'landscape' ? 'landscape' : 'portrait');
        post('kof-fullscreen-status', `Tela cheia em ${mode === 'landscape' ? 'horizontal' : 'vertical'}.`);
      } else {
        post('kof-fullscreen-status', `Tela cheia ativada. Gire o aparelho para ${mode === 'landscape' ? 'horizontal' : 'vertical'}.`);
      }
    } catch {
      post('kof-fullscreen-status', `Tela cheia ativada. Se a rotação não travar, gire o aparelho manualmente para ${mode === 'landscape' ? 'horizontal' : 'vertical'}.`);
    }
    setTimeout(() => window.EJS_emulator?.handleResize?.(), 250);
  }

  function updateFullscreenUi() {
    if (fullscreenButton) fullscreenButton.textContent = document.fullscreenElement ? '↙ SAIR' : '⛶ CHEIA';
    setTimeout(() => window.EJS_emulator?.handleResize?.(), 120);
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
      const server = String(params.get('server') || cfg?.netplayServer || 'https://netplay.emulatorjs.org/').trim();
      const ice = Array.isArray(cfg?.iceServers) && cfg.iceServers.length
        ? cfg.iceServers
        : [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

      window.EJS_player = '#game';
      window.EJS_core = 'fbneo';
      window.EJS_gameUrl = GAME_URL;
      window.EJS_gameID = gameId;
      window.EJS_pathtodata = EJS_DATA;
      window.EJS_language = 'pt-BR';
      window.EJS_startOnLoaded = true;
      window.EJS_noAutoFocus = matchMedia('(hover:none) and (pointer:coarse)').matches;
      window.EJS_threads = false;
      window.EJS_color = '#42e8ff';
      window.EJS_backgroundColor = '#050913';
      window.EJS_controlScheme = 'arcade';

      // Layout touch compacto 2x2 para evitar C/D fora da tela em celulares.
      // Neo Geo clássico no RetroPad: A->B(0), B->A(8), C->Y(1), D->X(9).
      window.EJS_VirtualGamepadSettings = [
        { type: 'dpad', location: 'left', left: '50%', top: '50%', joystickInput: false, inputValues: [4, 5, 6, 7] },
        { type: 'button', text: 'C', id: 'gg-neo-c', location: 'right', left: 0,  top: 0,  bold: true, fontSize: 25, input_value: 1 },
        { type: 'button', text: 'D', id: 'gg-neo-d', location: 'right', left: 62, top: 0,  bold: true, fontSize: 25, input_value: 9 },
        { type: 'button', text: 'A', id: 'gg-neo-a', location: 'right', left: 0,  top: 64, bold: true, fontSize: 25, input_value: 0 },
        { type: 'button', text: 'B', id: 'gg-neo-b', location: 'right', left: 62, top: 64, bold: true, fontSize: 25, input_value: 8 },
        { type: 'button', text: 'COIN', id: 'gg-neo-coin', location: 'center', left: -54, top: 0, bold: true, fontSize: 12, block: true, input_value: 2 },
        { type: 'button', text: 'START', id: 'gg-neo-start', location: 'center', left: 54, top: 0, bold: true, fontSize: 12, block: true, input_value: 3 }
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
        const coreInfo = online ? 'FBNeo da linha WebRTC' : `FBNeo build ${TRAINING_FBN_BUILD}`;
        setText(`EmulatorJS ${EJS_VERSION} + ${coreInfo} carregado. Entregando o Full Non-Merged…`);
        post('kof-player-core-ready', `EmulatorJS ${EJS_VERSION} / FBNeo carregado.`, {
          version: EJS_VERSION, gameId, online, layout: 'full-non-merged', controls: 'neo-geo-abcd'
        });
      };

      window.EJS_onGameStart = () => {
        started = true;
        loading = false;
        if (boot) boot.style.display = 'none';
        post('kof-player-ready', `KOF iniciado • EmulatorJS ${EJS_VERSION} • FBNeo • Game ID ${gameId}`, {
          gameId, version: EJS_VERSION, online, role, room, rtcRoomName, layout: 'full-non-merged', controls: 'neo-geo-abcd'
        });
        if (online) setTimeout(() => startAutomaticNetplay(), 600);
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

  startButton?.addEventListener('click', bootGame);

  const arcadeHelpButton = document.getElementById('arcadeHelpButton');
  const arcadeHelpModal = document.getElementById('arcadeHelpModal');
  const arcadeHelpClose = document.getElementById('arcadeHelpClose');
  const setArcadeHelp = open => { if (arcadeHelpModal) arcadeHelpModal.hidden = !open; };
  arcadeHelpButton?.addEventListener('click', () => setArcadeHelp(true));
  arcadeHelpClose?.addEventListener('click', () => setArcadeHelp(false));
  arcadeHelpModal?.addEventListener('click', e => { if (e.target === arcadeHelpModal) setArcadeHelp(false); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setArcadeHelp(false); });

  fullscreenButton?.addEventListener('click', toggleFullscreen);
  portraitButton?.addEventListener('click', () => setOrientation('portrait'));
  landscapeButton?.addEventListener('click', () => setOrientation('landscape'));
  document.addEventListener('fullscreenchange', updateFullscreenUi);
  window.addEventListener('orientationchange', () => setTimeout(() => window.EJS_emulator?.handleResize?.(), 250));

  netplayRetryButton?.addEventListener('click', () => startAutomaticNetplay(true));
  netplayMenuButton?.addEventListener('click', () => {
    if (!openNetplayMenu()) setNetplayState('O menu Netplay ainda não está pronto. Tente novamente em alguns segundos.', 'error');
  });

  if (online) {
    if (startButton) startButton.textContent = role === 'host' ? 'CONECTAR HOST' : 'CONECTAR CONVIDADO';
    setText(`PVP ${role === 'host' ? 'HOST' : 'CONVIDADO'} • sessão ${rtcRoomName}. Carregando KOF e conectando o Netplay automaticamente.`);
    if (netplayStatus) netplayStatus.hidden = false;
    setTimeout(() => bootGame(), 180);
  } else {
    if (netplayStatus) netplayStatus.hidden = true;
    setText('Clique em INICIAR KOF. Use ⛶ CHEIA, ↕ VERTICAL ou ↔ HORIZONTAL para jogar melhor no celular.');
  }
})();
