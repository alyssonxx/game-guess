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
  const EJS_VERSION = online ? '4.3.0-pre' : '4.2.1';
  const PATCH_VERSION = '19.4.2';
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
    tl: { left: 12, top: 6 },
    tr: { left: 82, top: 0 },
    bl: { left: 0, top: 72 },
    br: { left: 70, top: 78 }
  };
  const BUTTON_INPUTS = { A: 0, B: 8, C: 1, D: 9 };
  const ACTION_INPUTS = { a: 0, b: 8, c: 1, d: 9, coin: 2, start: 3 };
  const DIRECTION_INPUTS = { up: 4, down: 5, left: 6, right: 7 };
  const BUTTON_CLASSES = { A: 'slot-a', B: 'slot-b', C: 'slot-c', D: 'slot-d' };
  const COMBO_BUTTONS = {
    burst: { labels: ['B', 'C'], title: 'MAX (B+C)' },
    dodge: { labels: ['A', 'B'], title: 'ESQUIVA (A+B)' }
  };
  const GAMEPAD_MAPPING_KEY = 'gg_kof_gamepad_map_v1';
  const DEFAULT_GAMEPAD_MAPPING = {
    a: [4],
    b: [5],
    c: [6],
    d: [1],
    coin: [8],
    start: [9],
    max: [7],
    dodge: [0]
  };
  const KEYBOARD_MAPPING = {
    a: ['Digit4', 'Numpad4'],
    b: ['Digit5', 'Numpad5'],
    c: ['Digit6', 'Numpad6'],
    d: ['Digit1', 'Numpad1', 'Digit3', 'Numpad3'],
    coin: ['Digit0', 'Numpad0'],
    start: ['Enter'],
    max: ['KeyQ'],
    dodge: ['KeyW']
  };
  const GAMEPAD_ACTION_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D', coin: 'COIN', start: 'START', max: 'MAX', dodge: 'ESQUIVA' };

  let started = false;
  let loading = false;
  let autoNetplayBusy = false;
  let netplayWatchTimer = 0;
  let guestFindTimer = 0;
  let currentControlLayout = loadControlLayout();
  let currentGamepadMapping = loadGamepadMapping();
  let captureGamepadAction = '';
  let activeGamepadIndex = -1;
  let gamepadFrame = 0;
  let lastGamepadButtons = [];
  let stickPointerActive = false;
  const coarsePointer = matchMedia('(hover:none) and (pointer:coarse)').matches || 'ontouchstart' in window;
  let hudHideTimer = 0;
  let netplayToastTimer = 0;
  let gameplayStarted = false;
  const activePhysicalButtons = new Map();
  const activeDirectDirections = { up: false, down: false, left: false, right: false };
  let comboPositionTimer = 0;
  const keyboardPressedActions = new Set();
  const keyboardDirections = { up: false, down: false, left: false, right: false };

  if (coarsePointer) document.body.classList.add('gg-mobile-coarse');
  document.body.classList.add('gg-toast-hidden');

  function clearHudHideTimer() { if (hudHideTimer) clearTimeout(hudHideTimer); hudHideTimer = 0; }
  function clearNetplayToastTimer() { if (netplayToastTimer) clearTimeout(netplayToastTimer); netplayToastTimer = 0; }
  function hasOpenModal() {
    return [document.getElementById('arcadeHelpModal'), document.getElementById('layoutModal'), document.getElementById('padModal')].some(el => el && !el.hidden);
  }
  function setHudVisible(visible, autoHideMs = 0) {
    if (!coarsePointer) return;
    if (visible) document.body.classList.add('gg-hud-visible');
    else document.body.classList.remove('gg-hud-visible');
    clearHudHideTimer();
    if (visible && autoHideMs > 0) {
      hudHideTimer = setTimeout(() => { if (!hasOpenModal()) setHudVisible(false, 0); }, autoHideMs);
    }
  }
  function showHudTemporarily(ms = 2200) { setHudVisible(true, ms); }
  function setNetplayToastVisible(visible) {
    if (visible) document.body.classList.remove('gg-toast-hidden');
    else document.body.classList.add('gg-toast-hidden');
  }
  function showTransientNetplay(message, kind = 'info', ms = 2200) {
    if (!netplayStatus) return;
    const span = netplayStatus.querySelector('[data-netplay-text]');
    if (span) span.textContent = message;
    netplayStatus.dataset.kind = kind;
    netplayStatus.hidden = false;
    setNetplayToastVisible(true);
    clearNetplayToastTimer();
    if (coarsePointer && gameplayStarted) {
      netplayToastTimer = setTimeout(() => setNetplayToastVisible(false), ms);
    }
  }
  function findArcadeButton(label) {
    const exactId = getButtonElementByLabel?.(label);
    if (exactId) return exactId;
    const candidates = [...document.querySelectorAll('#game button,#game [role="button"],#game div,#game span')]
      .filter(el => {
        const t = String(el.textContent || '').trim();
        if (t !== label) return false;
        const r = el.getBoundingClientRect();
        return r.width >= 34 && r.width <= 150 && r.height >= 34 && r.height <= 150 && r.right > innerWidth * .52;
      })
      .sort((a,b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left);
    return candidates[0] || null;
  }
  function forceGameFill() {
    const root = document.getElementById('game');
    if (!root) return;
    const canvas = root.querySelector('canvas');
    if (canvas) {
      canvas.style.removeProperty('width');
      canvas.style.removeProperty('height');
      canvas.style.removeProperty('inset');
      canvas.style.removeProperty('position');
      canvas.style.removeProperty('object-fit');
      canvas.style.setProperty('max-width','100%','important');
      canvas.style.setProperty('max-height','100%','important');
      canvas.style.setProperty('touch-action','none','important');
    }
    root.querySelectorAll('.ejs_virtualGamepad_parent,.ejs_virtual_gamepad_parent,[class*="virtualGamepad"]').forEach(el => {
      el.style.setProperty('background','transparent','important');
      el.style.setProperty('box-shadow','none','important');
      el.style.setProperty('border','0','important');
    });
  }
  function positionComboButtons() {
    if (!coarsePointer || !comboShell || comboShell.hidden) return;
    const buttons = ['A','B','C','D'].map(findArcadeButton).filter(Boolean);
    if (buttons.length < 2) return;
    const rects = buttons.map(el => el.getBoundingClientRect()).filter(r => r.width > 20 && r.height > 20);
    if (!rects.length) return;
    const left = Math.min(...rects.map(r => r.left));
    const right = Math.max(...rects.map(r => r.right));
    const top = Math.min(...rects.map(r => r.top));
    const sizes = rects.map(r => Math.min(r.width,r.height)).sort((a,b)=>a-b);
    const actionSize = Math.max(42, Math.min(82, sizes[Math.floor(sizes.length/2)] || 60));
    const clusterWidth = right - left;
    const gap = Math.max(6, Math.round(actionSize * .12));
    comboShell.style.setProperty('--gg-action-size', `${actionSize}px`);
    comboShell.style.left = `${Math.max(6, Math.min(innerWidth - clusterWidth - 6, left))}px`;
    comboShell.style.top = `${Math.max(6, top - actionSize - gap)}px`;
    comboShell.style.width = `${Math.max(actionSize * 2 + gap, clusterWidth)}px`;
    comboShell.style.right = 'auto';
    comboShell.style.bottom = 'auto';
  }
  function restyleVirtualControls() {
    const stick = document.getElementById('gg-neo-stick');
    if (stick) {
      stick.style.setProperty('opacity','.42','important');
      stick.style.setProperty('filter','saturate(.9)','important');
      stick.style.removeProperty('transform');
      stick.style.setProperty('pointer-events','auto','important');
      stick.style.setProperty('touch-action','none','important');
    }
    ['A','B','C','D'].forEach(label => {
      const el = findArcadeButton(label);
      if (!el) return;
      el.style.setProperty('opacity','.48','important');
      el.style.setProperty('filter','saturate(.92)','important');
      el.style.removeProperty('transform');
      el.style.setProperty('border-radius','999px','important');
      el.style.setProperty('pointer-events','auto','important');
      el.style.setProperty('touch-action','none','important');
    });
    ['gg-neo-coin','gg-neo-start'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.setProperty('opacity','.58','important');
      el.style.removeProperty('transform');
      el.style.setProperty('pointer-events','auto','important');
      el.style.setProperty('touch-action','none','important');
    });
    forceGameFill();
    positionComboButtons();
  }
  function installVirtualControlObserver() {
    restyleVirtualControls();
    const obs = new MutationObserver(() => restyleVirtualControls());
    obs.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', () => setTimeout(() => { forceGameFill(); positionComboButtons(); }, 120), { passive: true });
    if (comboPositionTimer) clearInterval(comboPositionTimer);
    comboPositionTimer = setInterval(() => { if (gameplayStarted) { forceGameFill(); positionComboButtons(); } }, 900);
  }

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
      if (coarsePointer && gameplayStarted) {
        const duration = kind === 'error' ? 2200 : kind === 'connected' ? 1400 : 1600;
        setNetplayToastVisible(true);
        clearNetplayToastTimer();
        netplayToastTimer = setTimeout(() => setNetplayToastVisible(false), duration);
      } else {
        setNetplayToastVisible(true);
      }
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
  function normalizeGamepadMapping(input) {
    const out = {};
    for (const key of Object.keys(DEFAULT_GAMEPAD_MAPPING)) {
      const raw = Array.isArray(input?.[key]) ? input[key] : [input?.[key]];
      const clean = raw.map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 0 && v <= 31);
      out[key] = clean.length ? [...new Set(clean)].slice(0, 4) : [...DEFAULT_GAMEPAD_MAPPING[key]];
    }
    return out;
  }
  function loadGamepadMapping() {
    try {
      const parsed = JSON.parse(localStorage.getItem(GAMEPAD_MAPPING_KEY) || 'null');
      return normalizeGamepadMapping(parsed || DEFAULT_GAMEPAD_MAPPING);
    } catch {
      return normalizeGamepadMapping(DEFAULT_GAMEPAD_MAPPING);
    }
  }
  function saveGamepadMapping(mapping) {
    const normalized = normalizeGamepadMapping(mapping);
    currentGamepadMapping = normalized;
    try { localStorage.setItem(GAMEPAD_MAPPING_KEY, JSON.stringify(normalized)); } catch {}
    return normalized;
  }
  function gamepadLabel(indices) {
    const arr = Array.isArray(indices) ? indices : [indices];
    return arr.map(v => Number(v)).filter(Number.isFinite).map(v => `Botão ${v}`).join(' / ') || 'Não definido';
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
        fontSize: 24,
        input_value: BUTTON_INPUTS[label]
      };
    });
    return [
      { type: 'zone', id: 'gg-neo-stick', location: 'left', left: '48%', top: '54%', color: 'cyan', joystickInput: false, inputValues: [4, 5, 6, 7] },
      ...buttons,
      { type: 'button', text: 'COIN', id: 'gg-neo-coin', location: 'center', left: -54, top: 18, bold: true, fontSize: 11, block: true, input_value: 2 },
      { type: 'button', text: 'START', id: 'gg-neo-start', location: 'center', left: 54, top: 18, bold: true, fontSize: 11, block: true, input_value: 3 }
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
      return { ok: r.ok, status: r.status, size: Number(r.headers.get('content-length') || 0), type: r.headers.get('content-type') || '' };
    } catch { return { ok: false, status: 0, size: 0, type: '' }; }
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

  async function waitForSocketIo(timeout = 15000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      if (typeof window.io === 'function') return true;
      await new Promise(r => setTimeout(r, 150));
    }
    return false;
  }
  function netplayQuery() { return `domain=${encodeURIComponent(location.host)}&game_id=${encodeURIComponent(gameId)}`; }
  async function directRoomList(server, timeout = 10000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const url = `${String(server || '').replace(/\/+$/, '')}/list?${netplayQuery()}`;
      const r = await fetch(url, { cache: 'no-store', mode: 'cors', signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const rooms = await r.json();
      return rooms && typeof rooms === 'object' && !Array.isArray(rooms) ? rooms : {};
    } finally { clearTimeout(timer); }
  }
  async function proxyRoomList(timeout = 9000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(`/api/kof-netplay-rooms?${netplayQuery()}`, { cache: 'no-store', signal: ctrl.signal });
      if (!r.ok) throw new Error(`proxy HTTP ${r.status}`);
      const rooms = await r.json();
      return rooms && typeof rooms === 'object' && !Array.isArray(rooms) ? rooms : {};
    } finally { clearTimeout(timer); }
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
        delete rooms.__upstream; delete rooms.__ok; delete rooms.__domain;
        return rooms;
      } catch (proxyError) {
        console.warn('Game Guess: proxy da lista Netplay falhou; tentando direto.', proxyError);
        try { return await directRoomList(server); }
        catch (directError) {
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
      if (!socket) { if (Date.now() - startedAt > 20000) clearInterval(timer); return; }
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
        socket.io?.on?.('reconnect_attempt', n => { setNetplayState(`🟡 Reconectando ao servidor PVP • tentativa ${n}…`, 'waiting'); });
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
        patchRoomDiscovery(np, window.EJS_netplayServer || '');
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
    netplayWatchTimer = 0; guestFindTimer = 0;
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
        if (np.emu?.isNetplay && role === 'host' && players < 2) setNetplayState(`🟡 Sala WebRTC ${rtcRoomName} criada • aguardando o convidado…`, 'waiting');
        else if (np.emu?.isNetplay && role === 'guest') setNetplayState(`🟡 Entrou na sala ${rtcRoomName} • conectando vídeo e controles…`, 'waiting');
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
      } catch (e) { console.warn('Game Guess: busca de sala Netplay falhou.', e); }
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
      if (!cfg?.netplayConfigured || !server) throw new Error('Servidor PVP dedicado ainda não está configurado. Defina KOF_NETPLAY_SERVER no Vercel com a URL HTTPS do seu EmulatorJS-Netplay.');
      setNetplayState('🔌 Verificando servidor PVP dedicado…', 'waiting');
      const wake = await wakeNetplayServer(server);
      if (!wake.ok) throw new Error(`Servidor PVP dedicado não respondeu (${wake.reason}). Se estiver no plano gratuito, confira se o serviço terminou de iniciar.`);
      setNetplayState(`🟢 Servidor PVP disponível • ${wake.via === 'proxy' ? 'proxy Game Guess' : 'conexão direta'}. Preparando Socket.IO…`, 'waiting');
      await waitForSocketIo();
      const np = await waitForNetplay(25000);
      patchRoomDiscovery(np, server);
      np.name = playerName;
      if (role === 'host') await hostNetplay(np); else await guestNetplay(np);
      observeNetplaySocket(np, server);
    } catch (e) {
      setNetplayState(`⚠️ ${e?.message || String(e)}`, 'error');
      if (netplayRetryButton) netplayRetryButton.hidden = false;
    } finally { autoNetplayBusy = false; }
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
    } catch {
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
  async function toggleFullscreen() { if (document.fullscreenElement) await exitFullscreen(); else await requestFullscreen(); }
  async function setOrientation(mode) {
    const ok = await requestFullscreen(); if (!ok) return;
    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock(mode === 'landscape' ? 'landscape' : 'portrait');
        post('kof-fullscreen-status', `Tela cheia em ${mode === 'landscape' ? 'horizontal' : 'vertical'}.`);
      } else post('kof-fullscreen-status', `Tela cheia ativada. Gire o aparelho para ${mode === 'landscape' ? 'horizontal' : 'vertical'}.`);
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
    if (startButton) { startButton.disabled = true; startButton.textContent = 'CARREGANDO…'; }
    try {
      const files = await validateArcadeFiles();
      setText(`Romset Full Non-Merged OK: ${mb(files.game.size)}.`);
      const cfg = await json('/api/kof-config');
      const server = String(cfg?.netplayServer || '').trim().replace(/\/+$/, '');
      if (online && (!cfg?.netplayConfigured || !server)) throw new Error('Online indisponível: configure KOF_NETPLAY_SERVER no Vercel com a URL HTTPS do servidor EmulatorJS-Netplay dedicado.');
      const ice = Array.isArray(cfg?.iceServers) && cfg.iceServers.length ? cfg.iceServers : [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

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
      window.EJS_VirtualGamepadSettings = buildVirtualGamepadSettings(currentControlLayout);
      if (coarsePointer) {
        window.EJS_Buttons = { playPause:false, restart:false, mute:false, settings:false, fullscreen:false, saveState:false, loadState:false, screenRecord:false, gamepad:false, cheat:false, volume:false, saveSavFiles:false, loadSavFiles:false, quickSave:false, quickLoad:false, screenshot:false, cacheManager:false, exitEmulation:false };
      }
      window.EJS_AdTimer = -1;
      window.EJS_CacheLimit = 1024 * 1024 * 1024;
      window.EJS_DEBUG_XX = params.get('debug') === '1';
      if (online) { window.EJS_netplayServer = server; window.EJS_netplayICEServers = ice; }
      else { window.EJS_netplayServer = ''; window.EJS_netplayICEServers = []; }

      window.EJS_ready = () => {
        const coreInfo = online ? 'FBNeo da linha WebRTC' : `FBNeo build ${TRAINING_FBN_BUILD}`;
        setText(`EmulatorJS ${EJS_VERSION} + ${coreInfo} carregado. Entregando o Full Non-Merged…`);
        post('kof-player-core-ready', `EmulatorJS ${EJS_VERSION} / FBNeo carregado.`, {
          version: EJS_VERSION, gameId, online, patch: PATCH_VERSION, layout: 'full-non-merged', controls: 'neo-geo-abcd-custom-layout+combo-shortcuts+gamepad-support'
        });
      };
      window.EJS_onGameStart = () => {
        started = true; loading = false; gameplayStarted = true;
        document.body.classList.add('gameplay-active');
        if (boot) boot.style.display = 'none';
        restyleVirtualControls();
        forceGameFill();
        setTimeout(() => { forceGameFill(); positionComboButtons(); restyleVirtualControls(); }, 450);
        setTimeout(() => { forceGameFill(); positionComboButtons(); }, 1400);
        if (coarsePointer) {
          showHudTemporarily(2200);
          setTimeout(() => setNetplayToastVisible(false), 1900);
        }
        post('kof-player-ready', `KOF iniciado • EmulatorJS ${EJS_VERSION} • FBNeo • Game ID ${gameId}`, {
          gameId, version: EJS_VERSION, patch: PATCH_VERSION, online, role, room, rtcRoomName, layout: 'full-non-merged', controls: 'neo-geo-abcd-custom-layout+combo-shortcuts+gamepad-support'
        });
        if (online) setTimeout(() => startAutomaticNetplay(), 600);
      };

      setText(`Carregando EmulatorJS ${EJS_VERSION} + FBNeo…`);
      const script = document.createElement('script');
      script.src = `${EJS_DATA}loader.js`;
      script.onerror = () => fail(`Não consegui carregar o EmulatorJS ${EJS_VERSION}. Verifique a conexão.`);
      script.onload = () => { if (online) waitForSocketIo().catch(() => {}); };
      document.body.appendChild(script);
      setTimeout(() => { if (!started) setText('FBNeo está preparando o romset Full Non-Merged. No primeiro carregamento isso pode demorar.'); }, 8000);
      setTimeout(() => {
        if (!started) post('kof-player-slow', 'O KOF ainda está preparando o romset Full Non-Merged.', { version: EJS_VERSION, patch: PATCH_VERSION, online, layout: 'full-non-merged', controls: 'neo-geo-abcd-custom-layout+combo-shortcuts+gamepad-support' });
      }, 20000);
    } catch (e) { fail(e?.message || String(e)); }
  }

  window.addEventListener('unhandledrejection', e => { if (!started && e?.reason) post('kof-player-debug', String(e.reason?.message || e.reason)); });
  startButton?.addEventListener('click', bootGame);

  const comboShell = document.getElementById('ggKofCombos');
  const burstButton = document.getElementById('ggKofBurstButton');
  const dodgeButton = document.getElementById('ggKofDodgeButton');
  const hudHotspot = document.getElementById('kofHudHotspot');

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
    } catch { try { target.dispatchEvent(new Event(type, init)); } catch {} }
  }
  function getGameManager() { return window.EJS_emulator?.gameManager || null; }
  function simulateInput(index, value) {
    const gm = getGameManager();
    if (!gm || typeof gm.simulateInput !== 'function') return false;
    try { gm.simulateInput(0, Number(index), Number(value)); return true; } catch { return false; }
  }
  function simulateCombo(indices, value) {
    let ok = false;
    indices.forEach(index => { ok = simulateInput(index, value) || ok; });
    return ok;
  }
  function applyDirectDirection(x = 0, y = 0) {
    const next = {
      up: y < -0.28,
      down: y > 0.28,
      left: x < -0.28,
      right: x > 0.28
    };
    for (const [name,index] of Object.entries(DIRECTION_INPUTS)) {
      if (next[name] !== activeDirectDirections[name]) {
        simulateInput(index, next[name] ? 1 : 0);
        activeDirectDirections[name] = next[name];
      }
    }
  }
  function pressVirtualButton(target) { emitSyntheticInput(target, 'pointerdown'); emitSyntheticInput(target, 'touchstart'); emitSyntheticInput(target, 'mousedown'); }
  function releaseVirtualButton(target) { emitSyntheticInput(target, 'pointerup'); emitSyntheticInput(target, 'touchend'); emitSyntheticInput(target, 'mouseup'); }
  function getStickElement() { return document.getElementById('gg-neo-stick'); }
  function stickPoint(target, xFactor = 0, yFactor = 0) {
    const rect = target?.getBoundingClientRect?.();
    if (!rect) return { clientX: 0, clientY: 0 };
    const radius = Math.max(22, Math.min(rect.width, rect.height) * 0.34);
    return { clientX: rect.left + rect.width / 2 + xFactor * radius, clientY: rect.top + rect.height / 2 + yFactor * radius };
  }
  function emitStick(type, xFactor = 0, yFactor = 0) {
    const target = getStickElement();
    if (!target) return false;
    const point = stickPoint(target, xFactor, yFactor);
    const init = { bubbles: true, cancelable: true, composed: true, pointerId: 78, pointerType: 'touch', isPrimary: true, buttons: type === 'pointerup' ? 0 : 1, clientX: point.clientX, clientY: point.clientY };
    try {
      if (typeof PointerEvent === 'function') { target.dispatchEvent(new PointerEvent(type, init)); return true; }
    } catch {}
    try {
      const mouseType = type === 'pointerdown' ? 'mousedown' : type === 'pointermove' ? 'mousemove' : 'mouseup';
      target.dispatchEvent(new MouseEvent(mouseType, { bubbles: true, cancelable: true, clientX: point.clientX, clientY: point.clientY, buttons: type === 'pointerup' ? 0 : 1 }));
      return true;
    } catch { return false; }
  }
  function setStickDirection(x = 0, y = 0) {
    const hasDir = Math.abs(x) > 0.12 || Math.abs(y) > 0.12;
    if (!hasDir) {
      if (stickPointerActive) emitStick('pointerup', 0, 0);
      stickPointerActive = false;
      return;
    }
    const len = Math.max(1, Math.hypot(x, y));
    const nx = Math.max(-1, Math.min(1, x / len));
    const ny = Math.max(-1, Math.min(1, y / len));
    if (!stickPointerActive) { emitStick('pointerdown', nx, ny); stickPointerActive = true; }
    else emitStick('pointermove', nx, ny);
  }


  function setPhysicalDirection(x = 0, y = 0) {
    if (getGameManager()?.simulateInput) {
      applyDirectDirection(x, y);
      return;
    }
    setStickDirection(x, y);
  }

  function bindComboShortcut(button, combo) {
    if (!button || !combo) return;
    const indices = combo.labels.map(label => BUTTON_INPUTS[label]).filter(Number.isFinite);
    let pressedTargets = [];
    const release = event => {
      if (event) event.preventDefault();
      button.classList.remove('active');
      if (pressedTargets.length) {
        pressedTargets.forEach(releaseVirtualButton);
        pressedTargets = [];
      } else {
        simulateCombo(indices, 0);
      }
    };
    const press = () => {
      button.classList.add('active');
      const targets = combo.labels.map(getButtonElementByLabel).filter(Boolean);
      if (targets.length === combo.labels.length) {
        pressedTargets = targets;
        pressedTargets.forEach(pressVirtualButton);
        return true;
      }
      pressedTargets = [];
      if (simulateCombo(indices, 1)) return true;
      button.classList.remove('active');
      return false;
    };
    button.__ggPress = press;
    button.__ggRelease = release;
    button.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); press(); });
    ['pointerup','pointercancel','pointerleave'].forEach(evt => button.addEventListener(evt, event => { event.stopPropagation(); release(event); }));
  }
  function pressComboShortcut(button, combo) {
    if (!button || !combo) return false;
    if (!button.__ggPress) bindComboShortcut(button, combo);
    return !!button.__ggPress?.();
  }
  function releaseComboShortcut(button) { button?.__ggRelease?.(); }
  function setupMobileComboButtons() {
    if (comboShell) comboShell.hidden = !coarsePointer;
    if (!coarsePointer) return;
    bindComboShortcut(burstButton, COMBO_BUTTONS.burst);
    bindComboShortcut(dodgeButton, COMBO_BUTTONS.dodge);
    setTimeout(positionComboButtons, 700);
  }

  function getVirtualTarget(action) {
    if (action === 'coin') return document.getElementById('gg-neo-coin');
    if (action === 'start') return document.getElementById('gg-neo-start');
    if (action === 'max') return burstButton;
    if (action === 'dodge') return dodgeButton;
    return getButtonElementByLabel(String(action).toUpperCase());
  }
  function pressAction(action) {
    if (activePhysicalButtons.has(action)) return;
    if (action === 'max') { if (pressComboShortcut(burstButton, COMBO_BUTTONS.burst)) activePhysicalButtons.set(action, true); return; }
    if (action === 'dodge') { if (pressComboShortcut(dodgeButton, COMBO_BUTTONS.dodge)) activePhysicalButtons.set(action, true); return; }
    const inputIndex = ACTION_INPUTS[action];
    if (Number.isFinite(inputIndex) && simulateInput(inputIndex, 1)) {
      activePhysicalButtons.set(action, inputIndex);
      return;
    }
    const target = getVirtualTarget(action);
    if (!target) return;
    pressVirtualButton(target);
    activePhysicalButtons.set(action, target);
  }
  function releaseAction(action) {
    const target = activePhysicalButtons.get(action);
    if (target == null) return;
    if (action === 'max') { releaseComboShortcut(burstButton); activePhysicalButtons.delete(action); return; }
    if (action === 'dodge') { releaseComboShortcut(dodgeButton); activePhysicalButtons.delete(action); return; }
    const inputIndex = ACTION_INPUTS[action];
    if (Number.isFinite(inputIndex) && simulateInput(inputIndex, 0)) {
      activePhysicalButtons.delete(action);
      return;
    }
    if (target && typeof target === 'object') releaseVirtualButton(target);
    activePhysicalButtons.delete(action);
  }
  function releaseAllPhysicalInputs() {
    [...activePhysicalButtons.keys()].forEach(releaseAction);
    applyDirectDirection(0, 0);
    if (stickPointerActive) setStickDirection(0, 0);
  }

  const arcadeHelpButton = document.getElementById('arcadeHelpButton');
  const arcadeHelpModal = document.getElementById('arcadeHelpModal');
  const arcadeHelpClose = document.getElementById('arcadeHelpClose');
  const setArcadeHelp = open => { if (arcadeHelpModal) arcadeHelpModal.hidden = !open; if (open) setHudVisible(true, 0); else if (gameplayStarted) showHudTemporarily(); };
  arcadeHelpButton?.addEventListener('click', () => setArcadeHelp(true));
  arcadeHelpClose?.addEventListener('click', () => setArcadeHelp(false));
  arcadeHelpModal?.addEventListener('click', e => { if (e.target === arcadeHelpModal) setArcadeHelp(false); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') { setArcadeHelp(false); } });

  const layoutButton = document.getElementById('kofLayoutButton');
  const layoutModal = document.getElementById('layoutModal');
  const layoutClose = document.getElementById('layoutClose');
  const layoutSave = document.getElementById('layoutSave');
  const layoutReset = document.getElementById('layoutReset');
  const layoutInputs = { tl: document.getElementById('layoutSlotTL'), tr: document.getElementById('layoutSlotTR'), bl: document.getElementById('layoutSlotBL'), br: document.getElementById('layoutSlotBR') };
  const layoutPreview = { tl: document.querySelector('[data-layout-slot="tl"]'), tr: document.querySelector('[data-layout-slot="tr"]'), bl: document.querySelector('[data-layout-slot="bl"]'), br: document.querySelector('[data-layout-slot="br"]') };

  const padButton = document.getElementById('kofPadButton');
  const padModal = document.getElementById('padModal');
  const padClose = document.getElementById('padClose');
  const padSave = document.getElementById('padSave');
  const padReset = document.getElementById('padReset');
  const padStatusText = document.getElementById('padStatusText');
  const padDeviceName = document.getElementById('padDeviceName');
  const padCaptureHint = document.getElementById('padCaptureHint');
  const padMapEls = { a: document.getElementById('mapValueA'), b: document.getElementById('mapValueB'), c: document.getElementById('mapValueC'), d: document.getElementById('mapValueD'), coin: document.getElementById('mapValueCoin'), start: document.getElementById('mapValueStart'), max: document.getElementById('mapValueMax'), dodge: document.getElementById('mapValueDodge') };

  function refreshLayoutPreview(layout) {
    const normalized = normalizeControlLayout(layout || currentControlLayout);
    for (const slot of SLOT_KEYS) {
      const el = layoutPreview[slot]; if (!el) continue;
      const label = normalized[slot];
      el.textContent = label;
      el.className = `layout-preview-slot ${BUTTON_CLASSES[label] || ''}`;
    }
  }
  function fillLayoutForm(layout) {
    const normalized = normalizeControlLayout(layout || currentControlLayout);
    for (const slot of SLOT_KEYS) if (layoutInputs[slot]) layoutInputs[slot].value = normalized[slot];
    refreshLayoutPreview(normalized);
  }
  function readLayoutForm() { return normalizeControlLayout({ tl: layoutInputs.tl?.value, tr: layoutInputs.tr?.value, bl: layoutInputs.bl?.value, br: layoutInputs.br?.value }); }
  function openLayoutModal() { fillLayoutForm(currentControlLayout); if (layoutModal) layoutModal.hidden = false; setHudVisible(true, 0); }
  function closeLayoutModal() { if (layoutModal) layoutModal.hidden = true; if (gameplayStarted) showHudTemporarily(); }

  function setPadStatus(message, device) {
    if (padStatusText) padStatusText.innerHTML = message;
    if (padDeviceName) padDeviceName.textContent = device || 'Nenhum controle detectado.';
  }
  function renderPadMapping(mapping = currentGamepadMapping) {
    for (const key of Object.keys(padMapEls)) if (padMapEls[key]) padMapEls[key].textContent = gamepadLabel(mapping[key]);
    if (padCaptureHint) padCaptureHint.innerHTML = captureGamepadAction ? `<span class="pad-capture">Capturando ${GAMEPAD_ACTION_LABELS[captureGamepadAction]}… pressione agora um botão do controle.</span>` : 'Clique em <b>CAPTURAR</b> e pressione o botão físico do controle para salvar.';
  }
  function firstConnectedGamepad() {
    const pads = navigator.getGamepads?.() || [];
    const preferred = pads[activeGamepadIndex];
    if (preferred && preferred.connected) return preferred;
    for (const pad of pads) if (pad && pad.connected) return pad;
    return null;
  }
  function openPadModal() {
    renderPadMapping(currentGamepadMapping);
    if (padModal) padModal.hidden = false;
    setHudVisible(true, 0);
    const pad = firstConnectedGamepad();
    if (pad) setPadStatus('<span class="pad-ok">Controle detectado.</span> Movimento pelo direcional ou analógico esquerdo. Você pode remapear os botões abaixo.', `${pad.id || 'Gamepad genérico'} • slot ${pad.index}`);
    else setPadStatus('<span class="pad-warn">Nenhum controle detectado.</span> Conecte um controle USB/Bluetooth no Android ou PC.', 'Nenhum controle detectado.');
  }
  function closePadModal() { if (padModal) padModal.hidden = true; captureGamepadAction = ''; renderPadMapping(currentGamepadMapping); if (gameplayStarted) showHudTemporarily(); }
  function startCapture(action) { captureGamepadAction = action; renderPadMapping(currentGamepadMapping); }
  function buttonPressed(pad, index) { const btn = pad?.buttons?.[index]; return !!btn && (!!btn.pressed || Number(btn.value || 0) > 0.5); }
  function mappingPressed(pad, action) { return (currentGamepadMapping[action] || []).some(index => buttonPressed(pad, index)); }
  function processCapture(pad) {
    if (!captureGamepadAction || !pad) return;
    const buttons = pad.buttons || [];
    for (let i = 0; i < buttons.length; i++) {
      const pressed = !!buttons[i]?.pressed || Number(buttons[i]?.value || 0) > 0.5;
      if (pressed && !lastGamepadButtons[i]) {
        currentGamepadMapping[captureGamepadAction] = [i];
        renderPadMapping(currentGamepadMapping);
        captureGamepadAction = '';
        setNetplayState('🎮 Mapeamento do controle atualizado. Toque em SALVAR MAPEAMENTO para gravar neste aparelho.', 'info');
        return;
      }
    }
  }
  function syncGamepadLoop() {
    const pad = firstConnectedGamepad();
    if (!pad) {
      activeGamepadIndex = -1;
      if (lastGamepadButtons.length) { releaseAllPhysicalInputs(); lastGamepadButtons = []; }
      setPadStatus('<span class="pad-warn">Nenhum controle detectado.</span> Conecte um controle USB/Bluetooth no Android ou PC.', 'Nenhum controle detectado.');
      gamepadFrame = requestAnimationFrame(syncGamepadLoop);
      return;
    }
    activeGamepadIndex = pad.index;
    setPadStatus('<span class="pad-ok">Controle detectado.</span> Movimento pelo direcional ou analógico esquerdo. Você pode remapear os botões abaixo.', `${pad.id || 'Gamepad genérico'} • slot ${pad.index}`);
    processCapture(pad);

    const axisX = Number(pad.axes?.[0] || 0), axisY = Number(pad.axes?.[1] || 0);
    const dpadX = (buttonPressed(pad, 15) ? 1 : 0) + (buttonPressed(pad, 14) ? -1 : 0);
    const dpadY = (buttonPressed(pad, 13) ? 1 : 0) + (buttonPressed(pad, 12) ? -1 : 0);
    const mx = Math.abs(axisX) > 0.28 ? axisX : dpadX;
    const my = Math.abs(axisY) > 0.28 ? axisY : dpadY;
    setPhysicalDirection(mx, my);

    for (const action of ['a','b','c','d','coin','start','max','dodge']) {
      const isPressed = !captureGamepadAction && mappingPressed(pad, action);
      const isActive = activePhysicalButtons.has(action);
      if (isPressed && !isActive) pressAction(action);
      if (!isPressed && isActive) releaseAction(action);
    }
    lastGamepadButtons = (pad.buttons || []).map(btn => !!btn?.pressed || Number(btn?.value || 0) > 0.5);
    gamepadFrame = requestAnimationFrame(syncGamepadLoop);
  }
  function startGamepadLoop() { if (gamepadFrame) cancelAnimationFrame(gamepadFrame); gamepadFrame = requestAnimationFrame(syncGamepadLoop); }

  function keyboardAction(code) {
    for (const [action, codes] of Object.entries(KEYBOARD_MAPPING)) if (codes.includes(code)) return action;
    return '';
  }
  function syncKeyboardStick() {
    const x = (keyboardDirections.right ? 1 : 0) + (keyboardDirections.left ? -1 : 0);
    const y = (keyboardDirections.down ? 1 : 0) + (keyboardDirections.up ? -1 : 0);
    setPhysicalDirection(x, y);
  }
  function onKeyboardDown(e) {
    if (e.repeat) return;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      e.preventDefault();
      if (e.code === 'ArrowUp') keyboardDirections.up = true;
      if (e.code === 'ArrowDown') keyboardDirections.down = true;
      if (e.code === 'ArrowLeft') keyboardDirections.left = true;
      if (e.code === 'ArrowRight') keyboardDirections.right = true;
      syncKeyboardStick();
      return;
    }
    const action = keyboardAction(e.code);
    if (!action) return;
    e.preventDefault();
    if (keyboardPressedActions.has(action)) return;
    keyboardPressedActions.add(action);
    pressAction(action);
  }
  function onKeyboardUp(e) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      e.preventDefault();
      if (e.code === 'ArrowUp') keyboardDirections.up = false;
      if (e.code === 'ArrowDown') keyboardDirections.down = false;
      if (e.code === 'ArrowLeft') keyboardDirections.left = false;
      if (e.code === 'ArrowRight') keyboardDirections.right = false;
      syncKeyboardStick();
      return;
    }
    const action = keyboardAction(e.code);
    if (!action) return;
    e.preventDefault();
    keyboardPressedActions.delete(action);
    releaseAction(action);
  }

  SLOT_KEYS.forEach(slot => layoutInputs[slot]?.addEventListener('change', () => refreshLayoutPreview(readLayoutForm())));
  layoutButton?.addEventListener('click', openLayoutModal);
  layoutClose?.addEventListener('click', closeLayoutModal);
  layoutModal?.addEventListener('click', e => { if (e.target === layoutModal) closeLayoutModal(); });
  layoutSave?.addEventListener('click', () => {
    const next = saveControlLayout(readLayoutForm());
    fillLayoutForm(next); closeLayoutModal();
    setNetplayState(`🕹 Layout salvo: ${next.tl}-${next.tr}-${next.bl}-${next.br}. Atalhos: MAX=B+C • ESQUIVA=A+B.`, 'info');
    setText('Layout do celular salvo. Se o KOF já estava aberto, a página será recarregada para aplicar o novo joystick e a nova ordem.');
    if (started || loading) setTimeout(() => location.reload(), 450);
  });
  layoutReset?.addEventListener('click', () => {
    const next = saveControlLayout(DEFAULT_CONTROL_LAYOUT);
    fillLayoutForm(next); closeLayoutModal();
    setNetplayState('🕹 Layout padrão restaurado.', 'info');
    if (started || loading) setTimeout(() => location.reload(), 450);
  });

  padButton?.addEventListener('click', openPadModal);
  padClose?.addEventListener('click', closePadModal);
  padModal?.addEventListener('click', e => { if (e.target === padModal) closePadModal(); });
  document.querySelectorAll('[data-map-action]').forEach(btn => btn.addEventListener('click', () => startCapture(btn.dataset.mapAction || '')));
  padSave?.addEventListener('click', () => {
    saveGamepadMapping(currentGamepadMapping);
    renderPadMapping(currentGamepadMapping);
    setNetplayState('🎮 Mapeamento do controle salvo neste aparelho.', 'info');
    closePadModal();
  });
  padReset?.addEventListener('click', () => {
    currentGamepadMapping = saveGamepadMapping(DEFAULT_GAMEPAD_MAPPING);
    renderPadMapping(currentGamepadMapping);
    setNetplayState('🎮 Mapeamento padrão do controle restaurado.', 'info');
  });

  hudHotspot?.addEventListener('click', () => showHudTemporarily(3000));
  document.addEventListener('pointerdown', event => {
    if (!coarsePointer || !gameplayStarted) return;
    const target = event.target;
    if (target && (target.closest?.('.gg-kof-toolbar') || target.closest?.('#ggKofCombos') || target.closest?.('#kofNetplayStatus') || target.closest?.('#arcadeHelpModal') || target.closest?.('#layoutModal') || target.closest?.('#padModal'))) {
      showHudTemporarily(3000);
      return;
    }
    if (event.clientY <= 40) showHudTemporarily(3000);
  }, { passive: true });

  fullscreenButton?.addEventListener('click', toggleFullscreen);
  portraitButton?.addEventListener('click', () => setOrientation('portrait'));
  landscapeButton?.addEventListener('click', () => setOrientation('landscape'));
  document.addEventListener('fullscreenchange', updateFullscreenUi);
  window.addEventListener('orientationchange', () => setTimeout(() => { window.EJS_emulator?.handleResize?.(); forceGameFill(); positionComboButtons(); }, 250));
  window.addEventListener('gamepadconnected', e => { activeGamepadIndex = e.gamepad?.index ?? activeGamepadIndex; setPadStatus('<span class="pad-ok">Controle conectado.</span> O mapeamento externo está pronto para uso.', `${e.gamepad?.id || 'Gamepad'} • slot ${e.gamepad?.index ?? 0}`); startGamepadLoop(); });
  window.addEventListener('gamepaddisconnected', () => { setPadStatus('<span class="pad-warn">Controle desconectado.</span> Conecte um controle USB/Bluetooth no Android ou PC.', 'Nenhum controle detectado.'); releaseAllPhysicalInputs(); });
  window.addEventListener('keydown', onKeyboardDown, { passive: false });
  window.addEventListener('keyup', onKeyboardUp, { passive: false });

  netplayRetryButton?.addEventListener('click', () => startAutomaticNetplay(true));
  netplayMenuButton?.addEventListener('click', () => { if (!openNetplayMenu()) setNetplayState('O menu Netplay ainda não está pronto. Tente novamente em alguns segundos.', 'error'); });

  fillLayoutForm(currentControlLayout);
  renderPadMapping(currentGamepadMapping);
  setupMobileComboButtons();
  installVirtualControlObserver();
  if (coarsePointer) setHudVisible(true, 0);
  startGamepadLoop();

  if (online) {
    if (startButton) startButton.textContent = role === 'host' ? 'CONECTAR HOST' : 'CONECTAR CONVIDADO';
    setText(`PVP ${role === 'host' ? 'HOST' : 'CONVIDADO'} • sessão ${rtcRoomName}. Carregando KOF e conectando o Netplay automaticamente. No celular, o HUD some durante a luta e reaparece ao tocar no topo da tela. Use 🕹 LAYOUT para salvar a ordem dos botões e 🎮 CONTROLE para mapear gamepad.`);
    if (netplayStatus) netplayStatus.hidden = false;
    setTimeout(() => bootGame(), 180);
  } else {
    if (netplayStatus) netplayStatus.hidden = true;
    setText('Clique em INICIAR KOF. No celular, toque no topo da tela para mostrar o HUD, use 🕹 LAYOUT para trocar a ordem A/B/C/D e 🎮 CONTROLE para mapear gamepad USB/Bluetooth. Atalhos fixos: MAX = B+C e ESQUIVA = A+B.');
  }
})();
