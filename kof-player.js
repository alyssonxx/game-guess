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
  const PATCH_VERSION = '19.2.0';
  const EJS_DATA = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;

  const GAME_URL = '/roms/v178/kf2k2mp2.zip';
  const EXPECTED_GAME_SIZE = 86694745;
  const EXPECTED_SHA256 = '2cb16b649819f8168701f01ddd4642dc3678283c112cd89e79103ed45f4a1a4d';
  const TRAINING_FBN_BUILD = '2025-01-07T14:59:35Z';
  const gameId = Math.max(1, Number(params.get('gameId')) || 20020202);
  const launchToken = String(params.get('launch') || gameId).replace(/\D/g, '').slice(-5) || String(gameId).slice(-5);
  const playerName = String(params.get('name') || (role === 'host' ? 'HOST' : role === 'guest' ? 'CONVIDADO' : 'PLAYER')).trim().slice(0, 20) || 'PLAYER';
  const rtcRoomName = `GG-${room}-${launchToken}`.slice(0, 20);

  const CONTROL_LAYOUT_KEY = 'gg_kof_mobile_layout_v2';
  const DEFAULT_CONTROL_LAYOUT = { tl: 'C', tr: 'D', bl: 'A', br: 'B' };
  const SLOT_KEYS = ['tl', 'tr', 'bl', 'br'];
  const SLOT_COORDS = {
    tl: { left: 0, top: 0 },
    tr: { left: 62, top: 0 },
    bl: { left: 0, top: 64 },
    br: { left: 62, top: 64 }
  };
  const BUTTON_INPUTS = { A: 0, B: 8, C: 1, D: 9 };
  const BUTTON_CLASSES = { A: 'slot-a', B: 'slot-b', C: 'slot-c', D: 'slot-d' };
  const COMBO_BUTTONS = {
    burst: { labels: ['B', 'C'], title: 'MAX (B+C)' },
    dodge: { labels: ['A', 'B'], title: 'ESQUIVA (A+B)' }
  };

  let started = false;
  let loading = false;
  let autoNetplayBusy = false;
  let netplayWatchTimer = 0;
  let guestFindTimer = 0;
  let currentControlLayout = loadControlLayout();

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

  function normalizeControlLayout(input) {
    const result = {};
    const values = [];
    for (const slot of SLOT_KEYS) {
      const value = String(input?.[slot] || '').toUpperCase();
      if (!BUTTON_INPUTS.hasOwnProperty(value) || values.includes(value)) return { ...DEFAULT_CONTROL_LAYOUT };
      result[slot] = value;
      values.push(value);
    }
    return values.length === 4 ? result : { ...DEFAULT_CONTROL_LAYOUT };
  }

  function loadControlLayout() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONTROL_LAYOUT_KEY) || 'null');
      return normalizeControlLayout(parsed || DEFAULT_CONTROL_LAYOUT);
    } catch {
      return { ...DEFAULT_CONTROL_LAYOUT };
    }
  }

  function saveControlLayout(layout) {
    const normalized = normalizeControlLayout(layout);
    currentControlLayout = normalized;
    try { localStorage.setItem(CONTROL_LAYOUT_KEY, JSON.stringify(normalized)); } catch {}
    return normalized;
  }

  function buildVirtualGamepadSettings(layout) {
    const normalized = normalizeControlLayout(layout || DEFAULT_CONTROL_LAYOUT);
    const buttons = SLOT_KEYS.map(slot => {
      const label = normalized[slot];
      const pos = SLOT_COORDS[slot];
      return {
        type: 'button',
        text: label,
        id: `gg-neo-${label.toLowerCase()}-${slot}`,
        location: 'right',
        left: pos.left,
        top: pos.top,
        bold: true,
        fontSize: 25,
        input_value: BUTTON_INPUTS[label]
      };
    });
    return [
      { type: 'zone', location: 'left', left: '50%', top: '50%', color: 'cyan', joystickInput: false, inputValues: [4, 5, 6, 7] },
      ...buttons,
      { type: 'button', text: 'COIN', id: 'gg-neo-coin', location: 'center', left: -54, top: 0, bold: true, fontSize: 12, block: true, input_value: 2 },
      { type: 'button', text: 'START', id: 'gg-neo-start', location: 'center', left: 54, top: 0, bold: true, fontSize: 12, block: true, input_value: 3 }
    ];
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

  // V19.1: não forçamos mais um transporte específico do Socket.IO.
  // O servidor dedicado oficial negocia polling -> WebSocket sozinho, que é
  // mais robusto em redes móveis, proxies e no cold-start do Render.
  async function waitForSocketIo(timeout = 15000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      if (typeof window.io === 'function') return true;
      await new Promise(r => setTimeout(r, 150));
    }
    return false;
  }

  function netplayQuery() {
    return `domain=${encodeURIComponent(location.host)}&game_id=${encodeURIComponent(gameId)}`;
  }

  async function directRoomList(server, timeout = 10000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const url = `${String(server || '').replace(/\/+$/, '')}/list?${netplayQuery()}`;
      const r = await fetch(url, { cache: 'no-store', mode: 'cors', signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const rooms = await r.json();
      return rooms && typeof rooms === 'object' && !Array.isArray(rooms) ? rooms : {};
    } finally {
      clearTimeout(timer);
    }
  }

  async function proxyRoomList(timeout = 9000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(`/api/kof-netplay-rooms?${netplayQuery()}`, { cache: 'no-store', signal: ctrl.signal });
      if (!r.ok) throw new Error(`proxy HTTP ${r.status}`);
      const rooms = await r.json();
      return rooms && typeof rooms === 'object' && !Array.isArray(rooms) ? rooms : {};
    } finally {
      clearTimeout(timer);
    }
  }

  async function wakeNetplayServer(server, maxWait = 75000) {
    const startedAt = Date.now();
    let attempt = 0;
    let lastReason = 'sem resposta';
    while (Date.now() - startedAt < maxWait) {
      attempt += 1;
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      setNetplayState(`⏳ Preparando servidor PVP dedicado… tentativa ${attempt} • ${elapsed}s`, 'waiting');
      try {
        await directRoomList(server, 10000);
        return { ok: true, via: 'direct' };
      } catch (e) {
        lastReason = e?.name === 'AbortError' ? 'timeout' : (e?.message || 'network');
        try {
          await proxyRoomList(9000);
          return { ok: true, via: 'proxy' };
        } catch (proxyError) {
          lastReason = `${lastReason} / ${proxyError?.message || 'proxy'}`;
        }
      }
      await new Promise(r => setTimeout(r, 3500));
    }
    return { ok: false, reason: lastReason };
  }

  function patchRoomDiscovery(np, server) {
    if (!np || np.__ggRoomDiscoveryPatched) return;
    np.__ggRoomDiscoveryPatched = true;
    np.getOpenRooms = async () => {
      try {
        const rooms = await proxyRoomList();
        delete rooms.__upstream;
        delete rooms.__ok;
        delete rooms.__domain;
        return rooms;
      } catch (proxyError) {
        console.warn('Game Guess: proxy da lista Netplay falhou; tentando direto.', proxyError);
        try {
          return await directRoomList(server);
        } catch (directError) {
          console.warn('Game Guess: consulta direta da lista Netplay falhou.', directError);
          setNetplayState('⚠️ Servidor PVP temporariamente indisponível. Tentando novamente…', 'error');
          return {};
        }
      }
    };
  }

  function observeNetplaySocket(np, server) {
    if (!np || np.__ggSocketObserved) return;
    np.__ggSocketObserved = true;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const socket = np.socket;
      if (!socket) {
        if (Date.now() - startedAt > 20000) clearInterval(timer);
        return;
      }
      clearInterval(timer);
      if (socket.__ggObserved) return;
      socket.__ggObserved = true;
      try {
        socket.on?.('connect', () => {
          const transport = socket.io?.engine?.transport?.name || 'Socket.IO';
          setNetplayState(`🟢 Sinalização conectada • ${transport} • ${new URL(server).host}`, 'waiting');
        });
        socket.on?.('connect_error', err => {
          const msg = String(err?.message || err || 'falha de conexão');
          setNetplayState(`⚠️ Servidor PVP não conectou: ${msg}. Reconectando…`, 'error');
          post('kof-netplay-connect-error', msg, { server, transport: 'auto' });
        });
        socket.io?.on?.('reconnect_attempt', n => {
          setNetplayState(`🟡 Reconectando ao servidor PVP • tentativa ${n}…`, 'waiting');
        });
      } catch {}
    }, 120);
  }

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
        patchRoomDiscovery(np, window.EJS_netplayServer || "");
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
    const deadline = Date.now() + 90000;
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
      const cfg = await json('/api/kof-config');
      const server = String(cfg?.netplayServer || '').trim().replace(/\/+$/, '');
      if (!cfg?.netplayConfigured || !server) {
        throw new Error('Servidor PVP dedicado ainda não está configurado. Defina KOF_NETPLAY_SERVER no Vercel com a URL HTTPS do seu EmulatorJS-Netplay.');
      }

      setNetplayState('🔌 Verificando servidor PVP dedicado…', 'waiting');
      const wake = await wakeNetplayServer(server);
      if (!wake.ok) {
        throw new Error(`Servidor PVP dedicado não respondeu (${wake.reason}). Se estiver no plano gratuito, confira se o serviço terminou de iniciar.`);
      }

      setNetplayState(`🟢 Servidor PVP disponível • ${wake.via === 'proxy' ? 'proxy Game Guess' : 'conexão direta'}. Preparando Socket.IO…`, 'waiting');
      await waitForSocketIo();
      const np = await waitForNetplay(25000);
      patchRoomDiscovery(np, server);
      np.name = playerName;
      if (role === 'host') await hostNetplay(np);
      else await guestNetplay(np);
      observeNetplaySocket(np, server);
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
      const server = String(cfg?.netplayServer || '').trim().replace(/\/+$/, '');
      if (online && (!cfg?.netplayConfigured || !server)) {
        throw new Error('Online indisponível: configure KOF_NETPLAY_SERVER no Vercel com a URL HTTPS do servidor EmulatorJS-Netplay dedicado.');
      }
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

      // V19.2: alavanca virtual 360° + ordem A/B/C/D personalizada por aparelho + atalhos de combo.
      window.EJS_VirtualGamepadSettings = buildVirtualGamepadSettings(currentControlLayout);

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
          version: EJS_VERSION, gameId, online, layout: 'full-non-merged', controls: 'neo-geo-abcd-custom-layout+combo-shortcuts'
        });
      };

      window.EJS_onGameStart = () => {
        started = true;
        loading = false;
        if (boot) boot.style.display = 'none';
        post('kof-player-ready', `KOF iniciado • EmulatorJS ${EJS_VERSION} • FBNeo • Game ID ${gameId}`, {
          gameId, version: EJS_VERSION, online, role, room, rtcRoomName, layout: 'full-non-merged', controls: 'neo-geo-abcd-custom-layout+combo-shortcuts'
        });
        if (online) setTimeout(() => startAutomaticNetplay(), 600);
      };

      setText(`Carregando EmulatorJS ${EJS_VERSION} + FBNeo…`);
      const script = document.createElement('script');
      script.src = `${EJS_DATA}loader.js`;
      script.onerror = () => fail(`Não consegui carregar o EmulatorJS ${EJS_VERSION}. Verifique a conexão.`);
      script.onload = () => { if (online) waitForSocketIo().catch(() => {}); };
      document.body.appendChild(script);

      setTimeout(() => {
        if (!started) setText('FBNeo está preparando o romset Full Non-Merged. No primeiro carregamento isso pode demorar.');
      }, 8000);
      setTimeout(() => {
        if (!started) post('kof-player-slow', 'O KOF ainda está preparando o romset Full Non-Merged.', { version: EJS_VERSION, online, layout: 'full-non-merged', controls: 'neo-geo-abcd-custom-layout+combo-shortcuts' });
      }, 20000);
    } catch (e) {
      fail(e?.message || String(e));
    }
  }

  window.addEventListener('unhandledrejection', e => {
    if (!started && e?.reason) post('kof-player-debug', String(e.reason?.message || e.reason));
  });

  startButton?.addEventListener('click', bootGame);

  const comboShell = document.getElementById('ggKofCombos');
  const burstButton = document.getElementById('ggKofBurstButton');
  const dodgeButton = document.getElementById('ggKofDodgeButton');

  function getButtonElementByLabel(label) {
    const slot = SLOT_KEYS.find(key => currentControlLayout[key] === label);
    if (!slot) return null;
    return document.getElementById(`gg-neo-${String(label).toLowerCase()}-${slot}`);
  }

  function emitSyntheticInput(target, type) {
    if (!target) return;
    const init = { bubbles: true, cancelable: true, composed: true };
    try {
      if (type.startsWith('pointer') && typeof PointerEvent === 'function') {
        target.dispatchEvent(new PointerEvent(type, { ...init, pointerId: 77, pointerType: 'touch', isPrimary: true, buttons: type === 'pointerdown' ? 1 : 0 }));
        return;
      }
      if (type.startsWith('mouse') && typeof MouseEvent === 'function') {
        target.dispatchEvent(new MouseEvent(type, { ...init, buttons: type === 'mousedown' ? 1 : 0 }));
        return;
      }
      target.dispatchEvent(new Event(type, init));
    } catch {
      try { target.dispatchEvent(new Event(type, init)); } catch {}
    }
  }

  function pressVirtualButton(target) {
    emitSyntheticInput(target, 'pointerdown');
    emitSyntheticInput(target, 'touchstart');
    emitSyntheticInput(target, 'mousedown');
  }

  function releaseVirtualButton(target) {
    emitSyntheticInput(target, 'pointerup');
    emitSyntheticInput(target, 'touchend');
    emitSyntheticInput(target, 'mouseup');
  }

  function bindComboShortcut(button, combo) {
    if (!button || !combo) return;
    let pressedTargets = [];
    const release = event => {
      if (event) event.preventDefault();
      button.classList.remove('active');
      pressedTargets.forEach(releaseVirtualButton);
      pressedTargets = [];
    };
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      const targets = combo.labels.map(getButtonElementByLabel).filter(Boolean);
      if (!targets.length) {
        setNetplayState(`⚠️ O atalho ${combo.title} ainda não está pronto. Aguarde o controle virtual aparecer.`, 'error');
        return;
      }
      pressedTargets = targets;
      button.classList.add('active');
      pressedTargets.forEach(pressVirtualButton);
    });
    ['pointerup','pointercancel','pointerleave'].forEach(evt => button.addEventListener(evt, release));
  }

  function setupMobileComboButtons() {
    const coarse = matchMedia('(hover:none) and (pointer:coarse)').matches || 'ontouchstart' in window;
    if (comboShell) comboShell.hidden = !coarse;
    if (!coarse) return;
    bindComboShortcut(burstButton, COMBO_BUTTONS.burst);
    bindComboShortcut(dodgeButton, COMBO_BUTTONS.dodge);
  }

  const arcadeHelpButton = document.getElementById('arcadeHelpButton');
  const arcadeHelpModal = document.getElementById('arcadeHelpModal');
  const arcadeHelpClose = document.getElementById('arcadeHelpClose');
  const setArcadeHelp = open => { if (arcadeHelpModal) arcadeHelpModal.hidden = !open; };
  arcadeHelpButton?.addEventListener('click', () => setArcadeHelp(true));
  arcadeHelpClose?.addEventListener('click', () => setArcadeHelp(false));
  arcadeHelpModal?.addEventListener('click', e => { if (e.target === arcadeHelpModal) setArcadeHelp(false); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setArcadeHelp(false); });

  const layoutButton = document.getElementById('kofLayoutButton');
  const layoutModal = document.getElementById('layoutModal');
  const layoutClose = document.getElementById('layoutClose');
  const layoutSave = document.getElementById('layoutSave');
  const layoutReset = document.getElementById('layoutReset');
  const layoutInputs = {
    tl: document.getElementById('layoutSlotTL'),
    tr: document.getElementById('layoutSlotTR'),
    bl: document.getElementById('layoutSlotBL'),
    br: document.getElementById('layoutSlotBR')
  };
  const layoutPreview = {
    tl: document.querySelector('[data-layout-slot="tl"]'),
    tr: document.querySelector('[data-layout-slot="tr"]'),
    bl: document.querySelector('[data-layout-slot="bl"]'),
    br: document.querySelector('[data-layout-slot="br"]')
  };

  function refreshLayoutPreview(layout) {
    const normalized = normalizeControlLayout(layout || currentControlLayout);
    for (const slot of SLOT_KEYS) {
      const el = layoutPreview[slot];
      if (!el) continue;
      const label = normalized[slot];
      el.textContent = label;
      el.className = `layout-preview-slot ${BUTTON_CLASSES[label] || ''}`;
    }
  }

  function fillLayoutForm(layout) {
    const normalized = normalizeControlLayout(layout || currentControlLayout);
    for (const slot of SLOT_KEYS) {
      if (layoutInputs[slot]) layoutInputs[slot].value = normalized[slot];
    }
    refreshLayoutPreview(normalized);
  }

  function readLayoutForm() {
    return normalizeControlLayout({
      tl: layoutInputs.tl?.value,
      tr: layoutInputs.tr?.value,
      bl: layoutInputs.bl?.value,
      br: layoutInputs.br?.value
    });
  }

  function openLayoutModal() {
    fillLayoutForm(currentControlLayout);
    if (layoutModal) layoutModal.hidden = false;
  }

  function closeLayoutModal() {
    if (layoutModal) layoutModal.hidden = true;
  }

  SLOT_KEYS.forEach(slot => {
    layoutInputs[slot]?.addEventListener('change', () => refreshLayoutPreview(readLayoutForm()));
  });

  layoutButton?.addEventListener('click', openLayoutModal);
  layoutClose?.addEventListener('click', closeLayoutModal);
  layoutModal?.addEventListener('click', e => { if (e.target === layoutModal) closeLayoutModal(); });

  layoutSave?.addEventListener('click', () => {
    const next = saveControlLayout(readLayoutForm());
    fillLayoutForm(next);
    closeLayoutModal();
    setNetplayState(`🕹 Layout salvo: ${next.tl}-${next.tr}-${next.bl}-${next.br}. Atalhos: MAX=B+C • ESQUIVA=A+B.`, 'info');
    setText('Layout do celular salvo. Se o KOF já estava aberto, a página será recarregada para aplicar o novo joystick e a nova ordem.');
    if (started || loading) {
      setTimeout(() => location.reload(), 450);
    }
  });

  layoutReset?.addEventListener('click', () => {
    const next = saveControlLayout(DEFAULT_CONTROL_LAYOUT);
    fillLayoutForm(next);
    closeLayoutModal();
    setNetplayState('🕹 Layout padrão restaurado.', 'info');
    if (started || loading) setTimeout(() => location.reload(), 450);
  });

  fullscreenButton?.addEventListener('click', toggleFullscreen);
  portraitButton?.addEventListener('click', () => setOrientation('portrait'));
  landscapeButton?.addEventListener('click', () => setOrientation('landscape'));
  document.addEventListener('fullscreenchange', updateFullscreenUi);
  window.addEventListener('orientationchange', () => setTimeout(() => window.EJS_emulator?.handleResize?.(), 250));

  netplayRetryButton?.addEventListener('click', () => startAutomaticNetplay(true));
  netplayMenuButton?.addEventListener('click', () => {
    if (!openNetplayMenu()) setNetplayState('O menu Netplay ainda não está pronto. Tente novamente em alguns segundos.', 'error');
  });

  fillLayoutForm(currentControlLayout);
  setupMobileComboButtons();

  if (online) {
    if (startButton) startButton.textContent = role === 'host' ? 'CONECTAR HOST' : 'CONECTAR CONVIDADO';
    setText(`PVP ${role === 'host' ? 'HOST' : 'CONVIDADO'} • sessão ${rtcRoomName}. Carregando KOF e conectando o Netplay automaticamente. Use 🕹 LAYOUT para salvar a ordem dos botões deste aparelho. Atalhos fixos: MAX = B+C e ESQUIVA = A+B.`);
    if (netplayStatus) netplayStatus.hidden = false;
    setTimeout(() => bootGame(), 180);
  } else {
    if (netplayStatus) netplayStatus.hidden = true;
    setText('Clique em INICIAR KOF. Use ⛶ CHEIA, ↕ VERTICAL, ↔ HORIZONTAL e 🕹 LAYOUT para jogar melhor no celular. Atalhos fixos: MAX = B+C e ESQUIVA = A+B.');
  }
})();
