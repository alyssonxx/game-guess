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
  const playerName = String(params.get('name') || (role === 'host' ? 'HOST' : role === 'guest' ? 'CONVIDADO' : 'PLAYER')).trim().slice(0, 20) || 'PLAYER';

  const GAMES = {
    kf2k2mp2: { title: 'KOF 2002 Magic Plus II', icon: '🥊', system: 'Neo Geo', core: 'fbneo', url: '/roms/v178/kf2k2mp2.zip', size: 86694745, profile: 'neo4', localId: 20020202 },
    neobombe: { title: 'Neo Bomberman', icon: '💣', system: 'Neo Geo', core: 'fbneo', url: '/roms/neogeo/neobombe.zip', size: 7431142, profile: 'neo4', localId: 19970501 },
    samsh5spho: { title: 'Samurai Shodown V Special', icon: '⚔️', system: 'Neo Geo', core: 'fbneo', url: '/roms/arcade/samsh5spho.zip', size: 83295234, profile: 'neo4', localId: 20040422 },
    mvsc: { title: 'Marvel vs. Capcom', icon: '🦸', system: 'CPS-2', core: 'fbalpha2012_cps2', url: '/roms/arcade/mvsc.zip', size: 21493122, profile: 'cps6', localId: 19980123 },
    xmvsfur1: { title: 'X-Men vs. Street Fighter', icon: '✖️', system: 'CPS-2', core: 'fbalpha2012_cps2', url: '/roms/arcade/xmvsfur1.zip', size: 18468916, profile: 'cps6', localId: 19961004 }
  };

  const INPUT = { SELECT: 2, START: 3, UP: 4, DOWN: 5, LEFT: 6, RIGHT: 7 };
  const PROFILES = {
    neo4: {
      buttons: [['A', 0], ['B', 8], ['C', 1], ['D', 9]],
      p1Keys: { KeyJ: 0, KeyK: 8, KeyU: 1, KeyI: 9 },
      p2Keys: { Digit1: 0, Numpad1: 0, Digit2: 8, Numpad2: 8, Digit4: 1, Numpad4: 1, Digit5: 9, Numpad5: 9 },
      p1Text: 'WASD mover • J/K/U/I = A/B/C/D • R moeda • T start',
      p2Text: 'Setas mover • 1/2/4/5 = A/B/C/D • 0 moeda • Enter start',
      padButtons: [[0, 0], [1, 8], [2, 1], [3, 9]]
    },
    cps6: {
      buttons: [['LP', 1], ['MP', 9], ['HP', 10], ['LK', 0], ['MK', 8], ['HK', 11]],
      p1Keys: { KeyU: 1, KeyI: 9, KeyO: 10, KeyJ: 0, KeyK: 8, KeyL: 11 },
      p2Keys: { Digit7: 1, Numpad7: 1, Digit8: 9, Numpad8: 9, Digit9: 10, Numpad9: 10, Digit4: 0, Numpad4: 0, Digit5: 8, Numpad5: 8, Digit6: 11, Numpad6: 11 },
      p1Text: 'WASD mover • U/I/O socos • J/K/L chutes • R moeda • T start',
      p2Text: 'Setas mover • 7/8/9 socos • 4/5/6 chutes • 0 moeda • Enter start',
      padButtons: [[2, 1], [3, 9], [4, 10], [0, 0], [1, 8], [5, 11], [6, 10], [7, 11]]
    }
  };

  const game = GAMES[gameKey];
  const profile = game ? PROFILES[game.profile] : null;
  const isKof = gameKey === 'kf2k2mp2';
  const MACRO_INPUT = { DODGE: -101, MAX: -102 };
  const KOF_MACROS = {
    [MACRO_INPUT.DODGE]: [0, 8], // ESQUIVA = A+B
    [MACRO_INPUT.MAX]: [8, 1]    // MAX = B+C
  };
  const TRAINING_EJS_VERSION = '4.2.3';
  const ONLINE_EJS_VERSION = '4.3.0-pre';
  const EJS_VERSION = online ? ONLINE_EJS_VERSION : TRAINING_EJS_VERSION;
  const EJS_PROXY_DATA = `/ejs/${EJS_VERSION}/`;
  const EJS_DIRECT_DATA = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;
  let EJS_DATA = EJS_PROXY_DATA;
  const PUBLIC_NETPLAY_SERVER = 'https://netplay.emulatorjs.org';
  const rtcRoomName = `GG-${room}-${launchToken}`.slice(0, 20);

  const $ = id => document.getElementById(id);
  const boot = $('boot');
  const bootText = $('bootText');
  const startButton = $('startButton');
  const status = $('status');
  const fullscreenButton = $('fullscreenButton');
  const helpButton = $('helpButton');
  const customizeButton = $('customizeButton');
  const exitButton = $('exitButton');
  const topbar = $('topbar');
  const topHotspot = $('topHotspot');
  const overlay = $('overlay');
  const overlayTitle = $('overlayTitle');
  const overlayBody = $('overlayBody');
  const overlayClose = $('overlayClose');
  const editDock = $('editDock');
  const editSelectedName = $('editSelectedName');
  const editSize = $('editSize');
  const editSizeOut = $('editSizeOut');
  const editOpacity = $('editOpacity');
  const editOpacityOut = $('editOpacityOut');
  const editReset = $('editReset');
  const editCancel = $('editCancel');
  const editDone = $('editDone');

  let loading = false;
  let started = false;
  let directReady = false;
  let padFrame = 0;
  let autoNetplayBusy = false;
  let guestFindTimer = 0;
  let netplayWatchTimer = 0;
  let pendingKeyCapture = null;
  let editMode = false;
  let editSnapshot = null;
  let selectedControl = null;
  let foreignTouchObserver = null;
  let topbarHideTimer = 0;
  const held = new Map();
  const keyboardMaps = [];
  const stickHeld = new Map();

  const storageMode = online ? 'online' : localPlayers === 2 ? '2p' : '1p';
  const LS_TOUCH = `gg_arcade_touch_v230_${gameKey}_${storageMode}`;
  const LS_KEYS = `gg_arcade_keys_v230_${game ? game.profile : 'default'}`;

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || 0)); }
  function post(type, message, extra = {}) { try { parent.postMessage({ type, message, game: gameKey, ...extra }, location.origin); } catch {} }
  function mb(n) { return `${(Number(n || 0) / 1024 / 1024).toFixed(1)} MB`; }
  function setBoot(message) { if (bootText) bootText.textContent = message; }
  function showStatus(message) { if (!status) return; status.textContent = message; status.classList.remove('status-hidden'); }
  function hideStatus() { if (!status) return; status.textContent = ''; status.classList.add('status-hidden'); }
  function fail(message) {
    const msg = String(message || 'Falha ao iniciar o Arcade.');
    loading = false; started = false; directReady = false;
    if (boot) boot.style.display = 'grid';
    if (startButton) { startButton.disabled = false; startButton.textContent = '↻ TENTAR NOVAMENTE'; }
    setBoot(msg);
    showStatus('❌ ' + msg);
    post('arcade-player-error', msg);
  }
  async function head(url, timeout = 6500) {
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: ctrl.signal });
      return { ok: r.ok, status: r.status, size: Number(r.headers.get('content-length') || 0) };
    } catch (e) {
      return { ok: false, status: 0, size: 0, error: e?.name === 'AbortError' ? 'timeout' : 'network' };
    } finally { clearTimeout(timer); }
  }
  async function json(url) { try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; } }

  function inputOptions() {
    const base = [
      ['COIN', INPUT.SELECT], ['START', INPUT.START], ['↑', INPUT.UP], ['↓', INPUT.DOWN], ['←', INPUT.LEFT], ['→', INPUT.RIGHT]
    ];
    profile.buttons.forEach(([label, input]) => base.push([label, input]));
    if (isKof) base.push(['ESQUIVA (A+B)', MACRO_INPUT.DODGE], ['MAX (B+C)', MACRO_INPUT.MAX]);
    return base;
  }
  function inputLabel(input) {
    return inputOptions().find(([, value]) => Number(value) === Number(input))?.[0] || `BTN ${input}`;
  }

  function defaultPlayerLayout(playerIndex) {
    const isP2 = playerIndex === 1;
    const actionCount = profile.buttons.length;
    const yBase = localPlayers === 2 ? (isP2 ? 37 : 79) : 78;
    const moveX = isP2 ? 21 : 18;
    const actionX = isP2 ? 78 : 82;
    const size = localPlayers === 2 ? 50 : 58;

    const controls = {
      up: { kind: 'button', label: '▲', input: INPUT.UP, x: moveX, y: yBase - 12, size, opacity: .88 },
      down: { kind: 'button', label: '▼', input: INPUT.DOWN, x: moveX, y: yBase + 12, size, opacity: .88 },
      left: { kind: 'button', label: '◀', input: INPUT.LEFT, x: moveX - 12, y: yBase, size, opacity: .88 },
      right: { kind: 'button', label: '▶', input: INPUT.RIGHT, x: moveX + 12, y: yBase, size, opacity: .88 },
      stick: { kind: 'stick', label: 'ALAVANCA', x: moveX, y: yBase, size: localPlayers === 2 ? 118 : 142, opacity: .9 },
      coin: { kind: 'button', label: 'COIN', input: INPUT.SELECT, x: 48, y: yBase - 15, size: localPlayers === 2 ? 50 : 58, opacity: .94, system: true },
      start: { kind: 'button', label: 'START', input: INPUT.START, x: 59, y: yBase - 15, size: localPlayers === 2 ? 50 : 58, opacity: .94, system: true }
    };

    const actionPositions4 = [
      [actionX - 9, yBase + 4], [actionX + 3, yBase + 10], [actionX + 3, yBase - 7], [actionX + 15, yBase]
    ];
    const actionPositions6 = [
      [actionX - 12, yBase - 7], [actionX, yBase - 9], [actionX + 12, yBase - 7],
      [actionX - 12, yBase + 8], [actionX, yBase + 10], [actionX + 12, yBase + 8]
    ];
    const positions = actionCount === 6 ? actionPositions6 : actionPositions4;
    profile.buttons.forEach(([label, input], i) => {
      controls[`action${i}`] = { kind: 'button', label, input, x: positions[i][0], y: positions[i][1], size: localPlayers === 2 ? 48 : 60, opacity: .9, action: true };
    });

    if (isKof) {
      controls.dodge = { kind: 'button', label: 'ESQ', input: MACRO_INPUT.DODGE, x: actionX - 7, y: yBase - 21, size: localPlayers === 2 ? 46 : 54, opacity: .94, action: true, special: true };
      controls.max = { kind: 'button', label: 'MAX', input: MACRO_INPUT.MAX, x: actionX + 8, y: yBase - 21, size: localPlayers === 2 ? 46 : 54, opacity: .94, action: true, special: true };
    }

    return { moveStyle: 'dpad', controls };
  }

  function defaultTouchLayout() {
    return { players: [defaultPlayerLayout(0), defaultPlayerLayout(1)] };
  }
  function loadTouchLayout() {
    const base = defaultTouchLayout();
    try {
      const raw = JSON.parse(localStorage.getItem(LS_TOUCH) || 'null');
      if (!raw?.players) return base;
      [0, 1].forEach(p => {
        if (!raw.players[p]) return;
        if (raw.players[p].moveStyle) base.players[p].moveStyle = raw.players[p].moveStyle;
        if (raw.players[p].controls) {
          Object.entries(raw.players[p].controls).forEach(([id, cfg]) => {
            if (base.players[p].controls[id]) Object.assign(base.players[p].controls[id], cfg);
          });
        }
      });
      return base;
    } catch { return base; }
  }
  let touchLayout = loadTouchLayout();
  function saveTouchLayout() { localStorage.setItem(LS_TOUCH, JSON.stringify(touchLayout)); }
  function resetTouchLayout() { touchLayout = defaultTouchLayout(); saveTouchLayout(); selectedControl = null; renderTouchControls(); }

  function getDefaultKeyCode(input, playerIndex) {
    const inverted = {};
    const src = playerIndex === 0 ? profile.p1Keys : profile.p2Keys;
    Object.entries(src).forEach(([code, value]) => { if (inverted[value] === undefined) inverted[value] = code; });
    const dirs = playerIndex === 0
      ? { [INPUT.UP]: 'KeyW', [INPUT.DOWN]: 'KeyS', [INPUT.LEFT]: 'KeyA', [INPUT.RIGHT]: 'KeyD' }
      : { [INPUT.UP]: 'ArrowUp', [INPUT.DOWN]: 'ArrowDown', [INPUT.LEFT]: 'ArrowLeft', [INPUT.RIGHT]: 'ArrowRight' };
    const sys = playerIndex === 0
      ? { [INPUT.SELECT]: 'KeyR', [INPUT.START]: 'KeyT' }
      : { [INPUT.SELECT]: 'Digit0', [INPUT.START]: 'Enter' };
    const kofSpecial = playerIndex === 0
      ? { [MACRO_INPUT.DODGE]: 'KeyQ', [MACRO_INPUT.MAX]: 'KeyE' }
      : { [MACRO_INPUT.DODGE]: 'BracketLeft', [MACRO_INPUT.MAX]: 'BracketRight' };
    return dirs[input] || sys[input] || (isKof ? kofSpecial[input] : '') || inverted[input] || '';
  }
  function actionDefs(playerIndex) {
    const defs = [
      { input: INPUT.UP, label: 'Mover para cima' }, { input: INPUT.DOWN, label: 'Mover para baixo' },
      { input: INPUT.LEFT, label: 'Mover para a esquerda' }, { input: INPUT.RIGHT, label: 'Mover para a direita' },
      { input: INPUT.SELECT, label: 'Inserir moeda' }, { input: INPUT.START, label: 'Start' }
    ];
    profile.buttons.forEach(([label, input]) => defs.push({ input, label: `Botão ${label}` }));
    if (isKof) {
      defs.push({ input: MACRO_INPUT.DODGE, label: 'Esquiva (A+B)' });
      defs.push({ input: MACRO_INPUT.MAX, label: 'MAX (B+C)' });
    }
    return defs;
  }
  function defaultKeyConfig() {
    return {
      0: Object.fromEntries(actionDefs(0).map(a => [a.input, getDefaultKeyCode(a.input, 0)])),
      1: Object.fromEntries(actionDefs(1).map(a => [a.input, getDefaultKeyCode(a.input, 1)]))
    };
  }
  function loadKeyConfig() {
    const base = defaultKeyConfig();
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEYS) || 'null');
      if (!raw) return base;
      ['0', '1'].forEach(p => { if (raw[p]) Object.assign(base[p], raw[p]); });
      return base;
    } catch { return base; }
  }
  let keyConfig = loadKeyConfig();
  function saveKeyConfig() { localStorage.setItem(LS_KEYS, JSON.stringify(keyConfig)); rebuildKeyboardMaps(); }
  function resetKeyConfig(playerIndex) { keyConfig[String(playerIndex)] = defaultKeyConfig()[String(playerIndex)]; saveKeyConfig(); }
  function codeLabel(code) {
    if (!code) return '—';
    return String(code).replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'Num ').replace('ArrowUp', '↑').replace('ArrowDown', '↓').replace('ArrowLeft', '←').replace('ArrowRight', '→');
  }
  function rebuildKeyboardMaps() {
    keyboardMaps.length = 0;
    const players = (!online && localPlayers === 2) ? [0, 1] : [0];
    players.forEach(p => {
      const map = new Map();
      Object.entries(keyConfig[String(p)] || {}).forEach(([input, code]) => { if (code) map.set(code, Number(input)); });
      keyboardMaps[p] = map;
    });
  }

  function clearTopbarTimer() { if (topbarHideTimer) clearTimeout(topbarHideTimer); topbarHideTimer = 0; }
  function hideTopbar() {
    if (!started || editMode || overlay?.classList.contains('open')) return;
    topbar?.classList.add('auto-hidden');
  }
  function showTopbar(autoHideMs = 8000) {
    topbar?.classList.remove('auto-hidden');
    clearTopbarTimer();
    if (started && autoHideMs > 0) topbarHideTimer = setTimeout(hideTopbar, autoHideMs);
  }
  function startTopbarMinuteCountdown() {
    showTopbar(0);
    clearTopbarTimer();
    topbarHideTimer = setTimeout(hideTopbar, 60000);
  }

  function openOverlay(title, html) {
    showTopbar(0);
    overlayTitle.textContent = title;
    overlayBody.innerHTML = html;
    overlay.classList.add('open');
  }
  function closeOverlay() { overlay.classList.remove('open'); pendingKeyCapture = null; if (started) showTopbar(8000); }

  function renderHelp() {
    openOverlay(`Controles • ${game.title}`, `
      <p class="hint">No celular você pode escolher <b>setas</b> ou <b>alavanca arcade</b>. Em <b>PERSONALIZAR</b> é possível arrastar cada controle livremente, alterar o tamanho, opacidade e também remapear botões touch e teclas do PC.${isKof ? ' No KOF, <b>ESQ</b> envia A+B e <b>MAX</b> envia B+C.' : ''}</p>
      <div class="cards">
        <div class="card"><h3>PLAYER 1</h3><p>${profile.p1Text}</p></div>
        ${(!online && localPlayers === 2) ? `<div class="card"><h3>PLAYER 2</h3><p>${profile.p2Text}</p></div>` : ''}
      </div>
      <div class="btn-row"><button class="small-btn primary" data-go-custom>🎛 PERSONALIZAR AGORA</button></div>
    `);
    overlayBody.querySelector('[data-go-custom]')?.addEventListener('click', () => renderCustomize('layout'));
  }

  function tabs(active) {
    return `<div class="tabs">
      <button class="tab ${active === 'layout' ? 'active' : ''}" data-tab="layout">🎛 Layout</button>
      <button class="tab ${active === 'touchmap' ? 'active' : ''}" data-tab="touchmap">🎮 Botões touch</button>
      <button class="tab ${active === 'keys' ? 'active' : ''}" data-tab="keys">⌨ Teclado PC</button>
    </div>`;
  }

  function renderCustomize(tab = 'layout') {
    const players = (!online && localPlayers === 2) ? [0, 1] : [0];
    let body = tabs(tab);

    if (tab === 'layout') {
      body += `<p class="hint">Escolha o tipo de movimento e entre no modo de edição livre. Depois você pode <b>arrastar qualquer botão para qualquer ponto da tela</b> e definir o tamanho individual de cada um.</p>`;
      body += `<div class="cards">` + players.map(p => {
        const style = touchLayout.players[p].moveStyle;
        return `<div class="card"><h3>PLAYER ${p + 1}</h3><p>Tipo de movimento</p><div class="choice-row">
          <button class="choice ${style === 'dpad' ? 'active' : ''}" data-move-style="dpad" data-player="${p}">⬆️ Setas</button>
          <button class="choice ${style === 'stick' ? 'active' : ''}" data-move-style="stick" data-player="${p}">🕹 Alavanca arcade</button>
        </div></div>`;
      }).join('') + `</div>`;
      body += `<div class="btn-row"><button class="small-btn primary" data-free-edit>✋ EDITAR POSIÇÃO / TAMANHO LIVREMENTE</button><button class="small-btn warn" data-reset-layout>↺ Restaurar layout padrão</button></div>`;
    }

    if (tab === 'touchmap') {
      body += `<p class="hint">Cada botão touch pode ser remapeado. O texto do botão acompanha a função escolhida.</p><div class="cards">`;
      body += players.map(p => {
        const controls = touchLayout.players[p].controls;
        const actionIds = Object.keys(controls).filter(id => id.startsWith('action') || id === 'coin' || id === 'start' || id === 'dodge' || id === 'max');
        return `<div class="card"><h3>PLAYER ${p + 1}</h3>${actionIds.map(id => {
          const c = controls[id];
          const opts = inputOptions().map(([label, val]) => `<option value="${val}" ${Number(c.input) === Number(val) ? 'selected' : ''}>${label}</option>`).join('');
          return `<div class="map-row"><span>${id === 'coin' ? 'Botão COIN' : id === 'start' ? 'Botão START' : id === 'dodge' ? 'Botão ESQUIVA' : id === 'max' ? 'Botão MAX' : `Botão ${id.replace('action', '')}`}</span><select data-touch-map data-player="${p}" data-control="${id}">${opts}</select><code>${inputLabel(c.input)}</code></div>`;
        }).join('')}<div class="btn-row"><button class="small-btn warn" data-reset-touch-map="${p}">↺ Resetar mapeamento</button></div></div>`;
      }).join('');
      body += `</div>`;
    }

    if (tab === 'keys') {
      body += `<p class="hint">Clique em <b>Alterar</b> e pressione a nova tecla. O mapeamento fica salvo neste navegador.</p><div class="cards">`;
      const keyPlayers = (!online && localPlayers === 2) ? [0, 1] : [0, 1];
      body += keyPlayers.map(p => `<div class="card"><h3>PLAYER ${p + 1}</h3>${actionDefs(p).map(def => {
        const code = keyConfig[String(p)]?.[def.input] || '';
        const waiting = pendingKeyCapture && pendingKeyCapture.player === p && pendingKeyCapture.input === def.input;
        return `<div class="map-row"><span>${def.label}</span><code>${codeLabel(code)}</code><button class="small-btn" data-capture-key data-player="${p}" data-input="${def.input}">${waiting ? 'Pressione...' : 'Alterar'}</button></div>`;
      }).join('')}<div class="btn-row"><button class="small-btn warn" data-reset-keys="${p}">↺ Resetar P${p + 1}</button></div></div>`).join('');
      body += `</div>`;
    }

    openOverlay(`Personalizar • ${game.title}`, body);

    overlayBody.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => renderCustomize(btn.dataset.tab)));
    overlayBody.querySelectorAll('[data-move-style]').forEach(btn => btn.addEventListener('click', () => {
      const p = Number(btn.dataset.player);
      touchLayout.players[p].moveStyle = btn.dataset.moveStyle;
      saveTouchLayout(); renderTouchControls(); renderCustomize('layout');
    }));
    overlayBody.querySelector('[data-free-edit]')?.addEventListener('click', enterEditMode);
    overlayBody.querySelector('[data-reset-layout]')?.addEventListener('click', () => { resetTouchLayout(); renderCustomize('layout'); });

    overlayBody.querySelectorAll('[data-touch-map]').forEach(sel => sel.addEventListener('change', () => {
      const p = Number(sel.dataset.player), id = sel.dataset.control;
      const c = touchLayout.players[p].controls[id];
      c.input = Number(sel.value); c.label = inputLabel(c.input);
      saveTouchLayout(); renderTouchControls(); renderCustomize('touchmap');
    }));
    overlayBody.querySelectorAll('[data-reset-touch-map]').forEach(btn => btn.addEventListener('click', () => {
      const p = Number(btn.dataset.resetTouchMap);
      const fresh = defaultPlayerLayout(p);
      Object.keys(touchLayout.players[p].controls).forEach(id => {
        if (id.startsWith('action') || id === 'coin' || id === 'start' || id === 'dodge' || id === 'max') {
          touchLayout.players[p].controls[id].input = fresh.controls[id].input;
          touchLayout.players[p].controls[id].label = fresh.controls[id].label;
        }
      });
      saveTouchLayout(); renderTouchControls(); renderCustomize('touchmap');
    }));

    overlayBody.querySelectorAll('[data-capture-key]').forEach(btn => btn.addEventListener('click', () => {
      pendingKeyCapture = { player: Number(btn.dataset.player), input: Number(btn.dataset.input) };
      renderCustomize('keys');
    }));
    overlayBody.querySelectorAll('[data-reset-keys]').forEach(btn => btn.addEventListener('click', () => {
      resetKeyConfig(Number(btn.dataset.resetKeys)); renderCustomize('keys');
    }));
  }

  function setupUi() {
    if (!game) { fail('Jogo Arcade inválido.'); return; }
    document.title = `${game.title} • Game Guess`;
    $('gameTitle').textContent = game.title;
    $('gameIcon').textContent = game.icon;
    $('gameBadge').textContent = `${game.icon} ${game.title.toUpperCase()} • ${online ? 'ONLINE X1' : `${localPlayers}P LOCAL`}`;
    startButton.textContent = online ? '▶ CARREGAR PARTIDA ONLINE' : `▶ INICIAR ${localPlayers} PLAYER${localPlayers > 1 ? 'S' : ''}`;
    const p1Text = profile.p1Text + (isKof ? ' • Q esquiva • E MAX' : '');
    const p2Text = profile.p2Text + (isKof ? ' • [ esquiva • ] MAX' : '');
    const cards = [`<div><b>🟡 PLAYER 1</b><small>${p1Text}</small></div>`];
    if (!online && localPlayers === 2) cards.push(`<div><b>🔵 PLAYER 2</b><small>${p2Text}</small></div>`);
    $('controlsSummary').classList.toggle('one', cards.length === 1);
    $('controlsSummary').innerHTML = cards.join('');
    $('deviceHint').innerHTML = online
      ? '<strong>Online:</strong> cada aparelho usa teclado, gamepad/joystick ou touchscreen para o seu jogador.'
      : '<strong>Entradas:</strong> teclado, gamepads/joysticks e touchscreen podem ser usados ao mesmo tempo.';
    renderTouchControls();
  }

  function controlHtml(p, id, c) {
    const style = `--x:${clamp(c.x, 1, 99)}%;--y:${clamp(c.y, 1, 99)}%;--size:${clamp(c.size, 28, 220)}px;--opacity:${clamp(c.opacity, .2, 1)};`;
    const label = c.label || inputLabel(c.input);
    if (c.kind === 'stick') {
      return `<div class="touch-control arcade-stick" data-player="${p}" data-control="${id}" style="${style}"><span class="edit-label">P${p + 1} • ALAVANCA</span><span class="stick-base-dot"></span><span class="stick-knob"></span></div>`;
    }
    const isSpecial = id === 'dodge' || id === 'max' || Number(c.input) === MACRO_INPUT.DODGE || Number(c.input) === MACRO_INPUT.MAX;
    const kindClass = (id.startsWith('action') || isSpecial) ? `action${isSpecial ? ' special' : ''}` : (id === 'coin' || id === 'start') ? 'system' : 'arrow';
    return `<div class="touch-control ${kindClass}" data-player="${p}" data-control="${id}" style="${style}"><span class="edit-label">P${p + 1} • ${label}</span><button type="button" data-input="${c.input}">${label}</button></div>`;
  }

  function renderTouchControls() {
    const wrap = $('touchWrap');
    if (!wrap || !profile) return;
    const count = (!online && localPlayers === 2) ? 2 : 1;
    wrap.innerHTML = '';
    for (let p = 0; p < count; p++) {
      const player = document.createElement('div');
      player.className = 'touch-player';
      player.dataset.player = String(p);
      const cfg = touchLayout.players[p];
      const ids = Object.keys(cfg.controls).filter(id => {
        if (id === 'stick') return cfg.moveStyle === 'stick';
        if (['up', 'down', 'left', 'right'].includes(id)) return cfg.moveStyle === 'dpad';
        return true;
      });
      player.innerHTML = ids.map(id => controlHtml(p, id, cfg.controls[id])).join('');
      wrap.appendChild(player);
    }
    if (editMode) wrap.querySelectorAll('.touch-control').forEach(el => el.classList.add('editing'));
    bindTouchButtons();
    bindSticks();
    bindEditDrag();
    if (selectedControl) selectControl(selectedControl.player, selectedControl.id, false);
  }

  function gm() { return window.EJS_emulator?.gameManager || null; }
  function emuPlayer(localPlayer) { return online ? 0 : localPlayer; }
  function simulate(localPlayer, input, value) {
    const manager = gm();
    if (!manager || typeof manager.simulateInput !== 'function') return false;
    try { manager.simulateInput(emuPlayer(localPlayer), Number(input), Number(value)); return true; } catch { return false; }
  }
  function heldKey(player, input) { return `${player}:${input}`; }
  function setSource(player, input, source, pressed) {
    if (!directReady || !Number.isFinite(player) || !Number.isFinite(input)) return false;
    const key = heldKey(player, input); let sources = held.get(key);
    if (!pressed) {
      if (!sources || !sources.has(source)) return true;
      sources.delete(source);
      if (!sources.size) { simulate(player, input, 0); held.delete(key); }
      return true;
    }
    if (!sources) { sources = new Set(); held.set(key, sources); }
    if (sources.has(source)) return true;
    if (!sources.size && !simulate(player, input, 1)) return false;
    sources.add(source); return true;
  }
  function setActionSource(player, input, source, pressed) {
    const combo = KOF_MACROS[Number(input)];
    if (isKof && combo) {
      let ok = true;
      for (const realInput of combo) ok = setSource(player, realInput, `${source}:macro:${realInput}`, pressed) && ok;
      return ok;
    }
    return setSource(player, input, source, pressed);
  }
  function releasePrefix(prefix) {
    for (const [key, sources] of [...held.entries()]) {
      const [p, input] = key.split(':').map(Number);
      for (const src of [...sources]) if (src.startsWith(prefix)) setSource(p, input, src, false);
    }
  }
  function releaseAll() { for (const key of [...held.keys()]) { const [p, input] = key.split(':').map(Number); simulate(p, input, 0); } held.clear(); }
  async function waitDirect(timeout = 6000) {
    const end = performance.now() + timeout;
    while (performance.now() < end) {
      if (typeof gm()?.simulateInput === 'function') { directReady = true; return true; }
      await new Promise(r => setTimeout(r, 30));
    }
    return false;
  }

  function bindKeyboard() {
    rebuildKeyboardMaps();
    addEventListener('keydown', e => {
      if (pendingKeyCapture) {
        e.preventDefault(); e.stopPropagation();
        keyConfig[String(pendingKeyCapture.player)][pendingKeyCapture.input] = e.code;
        pendingKeyCapture = null; saveKeyConfig(); renderCustomize('keys'); return;
      }
      if (!started || e.repeat) return;
      const players = (!online && localPlayers === 2) ? [0, 1] : [0];
      for (const p of players) {
        const input = keyboardMaps[p]?.get(e.code);
        if (input === undefined) continue;
        e.preventDefault(); e.stopPropagation(); setActionSource(p, input, `key:${p}:${e.code}`, true); return;
      }
    }, { capture: true });
    addEventListener('keyup', e => {
      if (pendingKeyCapture) return;
      const players = (!online && localPlayers === 2) ? [0, 1] : [0];
      for (const p of players) {
        const input = keyboardMaps[p]?.get(e.code);
        if (input === undefined) continue;
        e.preventDefault(); e.stopPropagation(); setActionSource(p, input, `key:${p}:${e.code}`, false); return;
      }
    }, { capture: true });
    addEventListener('blur', () => releasePrefix('key:'));
  }

  function bindTouchButtons() {
    document.querySelectorAll('#touchWrap .touch-control button[data-input]').forEach(button => {
      const holder = button.closest('.touch-control');
      const player = Number(holder?.dataset.player || 0);
      const input = Number(button.dataset.input);
      const base = `touch:${player}:${input}:`;
      const down = e => {
        if (editMode || !started) return;
        e.preventDefault(); e.stopPropagation(); button.classList.add('pressed');
        try { button.setPointerCapture?.(e.pointerId); } catch {}
        setActionSource(player, input, base + e.pointerId, true);
      };
      const up = e => {
        if (editMode) return;
        e.preventDefault(); e.stopPropagation(); button.classList.remove('pressed');
        setActionSource(player, input, base + e.pointerId, false);
      };
      button.addEventListener('pointerdown', down, { passive: false });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => button.addEventListener(n, up, { passive: false }));
    });
  }

  const STICK_DIRECTIONS = [
    [INPUT.RIGHT], [INPUT.RIGHT, INPUT.DOWN], [INPUT.DOWN], [INPUT.LEFT, INPUT.DOWN],
    [INPUT.LEFT], [INPUT.LEFT, INPUT.UP], [INPUT.UP], [INPUT.RIGHT, INPUT.UP]
  ];
  function angleDistance(a, b) {
    let d = Math.abs(a - b) % (Math.PI * 2);
    return d > Math.PI ? (Math.PI * 2 - d) : d;
  }
  function stickSector(dx, dy, previousSector = -1, wasActive = false) {
    const mag = Math.hypot(dx, dy);
    const threshold = wasActive ? 0.12 : 0.18;
    if (mag < threshold) return -1;
    const angle = Math.atan2(dy, dx);
    let raw = Math.round(angle / (Math.PI / 4));
    raw = ((raw % 8) + 8) % 8;
    if (previousSector >= 0 && raw !== previousSector) {
      const center = previousSector * (Math.PI / 4);
      if (angleDistance(angle, center) < (27 * Math.PI / 180)) return previousSector;
    }
    return raw;
  }
  function updateStickSector(player, source, sector) {
    const prev = stickHeld.get(source) || new Set();
    const next = new Set(sector >= 0 ? STICK_DIRECTIONS[sector] : []);
    for (const input of prev) if (!next.has(input)) setSource(player, input, `${source}:${input}`, false);
    for (const input of next) if (!prev.has(input)) setSource(player, input, `${source}:${input}`, true);
    stickHeld.set(source, next);
  }

  function bindSticks() {
    document.querySelectorAll('#touchWrap .arcade-stick').forEach(stick => {
      const player = Number(stick.dataset.player || 0);
      const knob = stick.querySelector('.stick-knob');
      const source = `stick:${player}:${stick.dataset.control}`;
      let pointerId = null;
      let lastSector = -1;
      let active = false;

      const processPoint = point => {
        const rect = stick.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        let dx = (point.clientX - cx) / (rect.width / 2), dy = (point.clientY - cy) / (rect.height / 2);
        const rawMag = Math.hypot(dx, dy);
        if (rawMag > 1) { dx /= rawMag; dy /= rawMag; }
        const sector = stickSector(dx, dy, lastSector, active);
        const mag = Math.min(1, Math.hypot(dx, dy));
        const travel = mag * rect.width * .30;
        const unit = Math.hypot(dx, dy) || 1;
        knob.style.transform = `translate(calc(-50% + ${(dx / unit) * travel}px),calc(-50% + ${(dy / unit) * travel}px))`;
        if (!editMode && started && sector !== lastSector) updateStickSector(player, source, sector);
        lastSector = sector;
        active = sector >= 0;
      };

      const move = e => {
        if (pointerId !== e.pointerId) return;
        e.preventDefault(); e.stopPropagation();
        const points = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
        if (points.length) points.forEach(processPoint); else processPoint(e);
      };
      const down = e => {
        if (editMode || !started) return;
        e.preventDefault(); e.stopPropagation(); pointerId = e.pointerId;
        try { stick.setPointerCapture?.(e.pointerId); } catch {}
        processPoint(e);
      };
      const up = e => {
        if (pointerId !== e.pointerId) return;
        e.preventDefault(); e.stopPropagation(); pointerId = null;
        knob.style.transform = 'translate(-50%,-50%)';
        lastSector = -1; active = false;
        updateStickSector(player, source, -1);
      };
      stick.addEventListener('pointerdown', down, { passive: false });
      stick.addEventListener('pointermove', move, { passive: false });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => stick.addEventListener(n, up, { passive: false }));
    });
  }

  function selectControl(player, id, updateDock = true) {
    selectedControl = { player, id };
    document.querySelectorAll('.touch-control').forEach(el => el.classList.toggle('edit-selected', Number(el.dataset.player) === player && el.dataset.control === id));
    const c = touchLayout.players[player].controls[id];
    if (!c) return;
    if (updateDock) {
      editSelectedName.textContent = `P${player + 1} • ${id === 'stick' ? 'ALAVANCA' : c.label || inputLabel(c.input)}`;
      editSize.value = String(Math.round(c.size)); editSizeOut.textContent = `${Math.round(c.size)}px`;
      editOpacity.value = String(Math.round(c.opacity * 100)); editOpacityOut.textContent = `${Math.round(c.opacity * 100)}%`;
    }
  }

  function bindEditDrag() {
    if (!editMode) return;
    document.querySelectorAll('#touchWrap .touch-control').forEach(el => {
      const player = Number(el.dataset.player), id = el.dataset.control;
      let pointer = null;
      const move = e => {
        if (pointer !== e.pointerId) return;
        e.preventDefault();
        const x = clamp((e.clientX / innerWidth) * 100, 1, 99);
        const y = clamp((e.clientY / innerHeight) * 100, 1, 99);
        const c = touchLayout.players[player].controls[id]; c.x = x; c.y = y;
        el.style.setProperty('--x', `${x}%`); el.style.setProperty('--y', `${y}%`);
      };
      const down = e => {
        e.preventDefault(); e.stopPropagation(); pointer = e.pointerId;
        selectControl(player, id);
        try { el.setPointerCapture?.(e.pointerId); } catch {}
        move(e);
      };
      const up = e => {
        if (pointer !== e.pointerId) return;
        e.preventDefault(); e.stopPropagation(); pointer = null; saveTouchLayout();
      };
      el.addEventListener('pointerdown', down, { passive: false });
      el.addEventListener('pointermove', move, { passive: false });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => el.addEventListener(n, up, { passive: false }));
    });
  }

  function enterEditMode() {
    closeOverlay();
    showTopbar(0);
    editSnapshot = clone(touchLayout);
    editMode = true;
    document.body.classList.add('edit-mode');
    renderTouchControls();
    const first = document.querySelector('#touchWrap .touch-control');
    if (first) selectControl(Number(first.dataset.player), first.dataset.control);
  }
  function exitEditMode(save) {
    if (!save && editSnapshot) touchLayout = clone(editSnapshot);
    if (save) saveTouchLayout();
    editMode = false; editSnapshot = null; selectedControl = null;
    document.body.classList.remove('edit-mode'); renderTouchControls();
    if (started) showTopbar(8000);
  }

  function buttonPressed(gp, idx) { return !!gp?.buttons?.[idx]?.pressed; }
  function updatePad(player, gp) {
    const prefix = `pad:${player}:`;
    if (!gp) { releasePrefix(prefix); return; }
    const x = Math.abs(gp.axes?.[0] || 0) > .3 ? (gp.axes[0] || 0) : 0;
    const y = Math.abs(gp.axes?.[1] || 0) > .3 ? (gp.axes[1] || 0) : 0;
    const states = new Map([[INPUT.UP, buttonPressed(gp, 12) || y < -.3], [INPUT.DOWN, buttonPressed(gp, 13) || y > .3], [INPUT.LEFT, buttonPressed(gp, 14) || x < -.3], [INPUT.RIGHT, buttonPressed(gp, 15) || x > .3], [INPUT.SELECT, buttonPressed(gp, 8)], [INPUT.START, buttonPressed(gp, 9)]]);
    for (const [physical, input] of profile.padButtons) {
      if (!states.has(input)) states.set(input, false);
      states.set(input, states.get(input) || buttonPressed(gp, physical));
    }
    if (isKof) {
      states.set(MACRO_INPUT.DODGE, buttonPressed(gp, 4)); // L1 = ESQUIVA (A+B)
      states.set(MACRO_INPUT.MAX, buttonPressed(gp, 5));   // R1 = MAX (B+C)
    }
    for (const [input, pressed] of states) setActionSource(player, input, `${prefix}${input}`, pressed);
  }
  function padLoop() {
    const max = online ? 1 : localPlayers;
    const pads = [...(navigator.getGamepads?.() || [])].filter(Boolean).slice(0, max);
    for (let p = 0; p < max; p++) updatePad(p, pads[p]);
    if (started) {
      if (pads.length) {
        const names = pads.map((g, i) => `P${i + 1}: ${String(g.id).split('(')[0].trim().slice(0, 24)}`);
        if (online) showStatus(`🎮 ${names.join(' • ')} • PVP ${room}`);
      }
      padFrame = requestAnimationFrame(padLoop);
    }
  }

  function defaultControls() { return { 0: {}, 1: {}, 2: {}, 3: {} }; }
  function getNetplay() { return window.EJS_emulator?.netplay || null; }
  function netplayQuery() { return `domain=${encodeURIComponent(location.host)}&game_id=${encodeURIComponent(gameId)}`; }
  async function directRoomList(server, timeout = 9000) {
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(`${String(server || '').replace(/\/+$/, '')}/list?${netplayQuery()}`, { cache: 'no-store', mode: 'cors', signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const rooms = await r.json();
      return rooms && typeof rooms === 'object' && !Array.isArray(rooms) ? rooms : {};
    } finally { clearTimeout(timer); }
  }
  async function proxyRoomList(timeout = 9000) {
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(`/api/kof-netplay-rooms?${netplayQuery()}`, { cache: 'no-store', signal: ctrl.signal });
      if (!r.ok) throw new Error(`proxy HTTP ${r.status}`);
      const rooms = await r.json();
      return rooms && typeof rooms === 'object' && !Array.isArray(rooms) ? rooms : {};
    } finally { clearTimeout(timer); }
  }
  function patchRoomDiscovery(np, server) {
    if (!np || np.__ggArcadePatched) return;
    np.__ggArcadePatched = true;
    np.getOpenRooms = async () => {
      try { const rooms = await proxyRoomList(); delete rooms.__upstream; delete rooms.__ok; delete rooms.__domain; return rooms; }
      catch { try { return await directRoomList(server); } catch { return {}; } }
    };
  }
  async function waitForNetplay(timeout = 30000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const np = getNetplay();
      if (np && typeof np.getOpenRooms === 'function' && typeof np.openRoom === 'function' && typeof np.joinRoom === 'function') { np.name = playerName; return np; }
      await new Promise(r => setTimeout(r, 300));
    }
    throw new Error('O Netplay WebRTC não ficou disponível.');
  }
  function stopNetplayTimers() { if (guestFindTimer) clearInterval(guestFindTimer); if (netplayWatchTimer) clearInterval(netplayWatchTimer); guestFindTimer = netplayWatchTimer = 0; }
  function monitorNetplay(np) {
    if (netplayWatchTimer) clearInterval(netplayWatchTimer);
    netplayWatchTimer = setInterval(() => {
      try {
        const players = Object.keys(np.players || {}).length;
        if (np.emu?.isNetplay && players >= 2 && np.webRtcReady) {
          showStatus(`✅ PVP conectado • ${role === 'host' ? 'PLAYER 1' : 'PLAYER 2'} • ${game.title}`);
          post('arcade-netplay-status', 'PVP conectado', { state: 'connected', role, room });
          clearInterval(netplayWatchTimer); netplayWatchTimer = 0;
        } else if (np.emu?.isNetplay && role === 'host') showStatus(`🟡 Sala ${rtcRoomName} criada • aguardando rival…`);
        else if (np.emu?.isNetplay) showStatus(`🟡 Entrando na sala ${rtcRoomName}…`);
      } catch {}
    }, 700);
  }
  async function hostNetplay(np) { if (np.emu?.isNetplay && np.owner) { monitorNetplay(np); return; } if (np.emu?.isNetplay && !np.owner && typeof np.leaveRoom === 'function') np.leaveRoom(); np.name = playerName; showStatus(`🟡 Criando sessão WebRTC ${rtcRoomName}…`); np.openRoom(rtcRoomName, 2, ''); monitorNetplay(np); }
  async function guestNetplay(np) {
    if (np.emu?.isNetplay && !np.owner) { monitorNetplay(np); return; }
    np.name = playerName; showStatus(`🔎 Procurando sessão ${rtcRoomName}…`);
    const deadline = Date.now() + 90000;
    const findAndJoin = async () => {
      if (Date.now() > deadline) { if (guestFindTimer) clearInterval(guestFindTimer); guestFindTimer = 0; showStatus('⚠️ Sala WebRTC não apareceu. Volte ao lobby e tente novamente.'); return; }
      try {
        const rooms = await np.getOpenRooms();
        const match = Object.entries(rooms || {}).find(([, r]) => r?.room_name === rtcRoomName && Number(r?.current || 0) < Number(r?.max || 2));
        if (!match) return;
        if (guestFindTimer) clearInterval(guestFindTimer); guestFindTimer = 0;
        const [id, r] = match; np.joinRoom(id, r.room_name, Number(r.max || 2), null); monitorNetplay(np);
      } catch {}
    };
    await findAndJoin();
    if (!guestFindTimer && !np.emu?.isNetplay) guestFindTimer = setInterval(findAndJoin, 1000);
  }
  async function startAutomaticNetplay() {
    if (!online || autoNetplayBusy) return;
    autoNetplayBusy = true;
    try {
      const cfg = await json('/api/kof-config');
      const server = String(cfg?.netplayServer || PUBLIC_NETPLAY_SERVER).trim().replace(/\/+$/, '') || PUBLIC_NETPLAY_SERVER;
      showStatus('🔌 Preparando servidor PVP…');
      const np = await waitForNetplay(); patchRoomDiscovery(np, server); np.name = playerName;
      if (role === 'host') await hostNetplay(np); else await guestNetplay(np);
    } catch (e) {
      showStatus(`⚠️ ${e?.message || String(e)}`);
      post('arcade-netplay-status', e?.message || String(e), { state: 'error', role, room });
    } finally { autoNetplayBusy = false; }
  }

  function hideForeignTouchUI() {
    const root = $('game'); if (!root) return;
    const scan = () => {
      root.querySelectorAll('*').forEach(el => {
        const txt = (el.textContent || '').trim().toLowerCase();
        const sig = `${String(el.className || '')} ${String(el.id || '')}`;
        const maybe = ['select', 'rápido', 'lento', 'slow', 'fast forward'].includes(txt) || /gamepad|virtual.?pad|touch-controls|mobile-controls|screen-controls/i.test(sig);
        if (maybe) { el.style.display = 'none'; el.style.pointerEvents = 'none'; }
      });
    };
    scan();
    if (!foreignTouchObserver) { foreignTouchObserver = new MutationObserver(scan); foreignTouchObserver.observe(root, { subtree: true, childList: true }); }
  }

  // ----- Replay local em vídeo (beta) -----
  // Grava somente o canvas do emulador. O arquivo fica no IndexedDB deste navegador
  // e não usa Firebase Storage nem cria custo/Serverless Function na Vercel.
  const REPLAY_DB = 'GameGuessArcadeReplays';
  const REPLAY_STORE = 'replays';
  const REPLAY_MAX_MS = 8 * 60 * 1000;
  const REPLAY_MAX_BYTES = 80 * 1024 * 1024;
  let replayRecorder = null;
  let replayStream = null;
  let replayChunks = [];
  let replayBytes = 0;
  let replayStartedAt = 0;
  let replayLimitTimer = 0;
  let replayStopMeta = {};

  function openReplayDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponível.'));
      const req = indexedDB.open(REPLAY_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(REPLAY_STORE)) {
          const store = db.createObjectStore(REPLAY_STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('game', 'game');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Falha ao abrir banco de replays.'));
    });
  }

  async function saveReplayRecord(record) {
    const db = await openReplayDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(REPLAY_STORE, 'readwrite');
      tx.objectStore(REPLAY_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Falha ao salvar replay.'));
      tx.onabort = () => reject(tx.error || new Error('Gravação abortada pelo navegador.'));
    });
    // Mantém os 12 replays mais recentes para não lotar o armazenamento do celular.
    const all = await new Promise((resolve, reject) => {
      const tx = db.transaction(REPLAY_STORE, 'readonly');
      const req = tx.objectStore(REPLAY_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    const old = all.sort((a,b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(12);
    if (old.length) {
      await new Promise(resolve => {
        const tx = db.transaction(REPLAY_STORE, 'readwrite'), store = tx.objectStore(REPLAY_STORE);
        old.forEach(item => store.delete(item.id));
        tx.oncomplete = () => resolve(); tx.onerror = () => resolve(); tx.onabort = () => resolve();
      });
    }
    try { db.close(); } catch {}
  }

  function bestReplayMime() {
    if (!window.MediaRecorder) return '';
    const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    return types.find(t => !MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(t)) || '';
  }

  function bestReplayCanvas() {
    const list = [...document.querySelectorAll('#game canvas')].filter(c => Number(c.width || c.clientWidth) > 0 && Number(c.height || c.clientHeight) > 0);
    return list.sort((a,b) => ((b.width || b.clientWidth) * (b.height || b.clientHeight)) - ((a.width || a.clientWidth) * (a.height || a.clientHeight)))[0] || null;
  }

  async function waitReplayCanvas(timeout = 8000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const canvas = bestReplayCanvas();
      if (canvas?.captureStream) return canvas;
      await new Promise(r => setTimeout(r, 120));
    }
    return null;
  }

  function resetReplayState() {
    clearTimeout(replayLimitTimer); replayLimitTimer = 0;
    try { replayStream?.getTracks?.().forEach(t => t.stop()); } catch {}
    replayStream = null; replayRecorder = null; replayChunks = []; replayBytes = 0; replayStartedAt = 0; replayStopMeta = {};
  }

  async function startReplayRecording() {
    if (replayRecorder || !game) return;
    if (localStorage.getItem('gg_arcade_replay_enabled') === '0') {
      post('arcade-replay-status', 'Replay automático desativado nas configurações.', { state:'disabled' });
      return;
    }
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      post('arcade-replay-status', 'Replay automático não é suportado neste navegador.', { state:'error' });
      return;
    }
    try {
      const canvas = await waitReplayCanvas();
      if (!canvas) throw new Error('Canvas do emulador não ficou disponível para gravação.');
      replayStream = canvas.captureStream(24);
      const mimeType = bestReplayMime();
      const options = { videoBitsPerSecond: 1000000 };
      if (mimeType) options.mimeType = mimeType;
      replayChunks = []; replayBytes = 0; replayStopMeta = {}; replayStartedAt = Date.now();
      const recorder = new MediaRecorder(replayStream, options);
      replayRecorder = recorder;
      recorder.ondataavailable = event => {
        if (!event.data || !event.data.size) return;
        replayChunks.push(event.data); replayBytes += event.data.size;
        if (replayBytes >= REPLAY_MAX_BYTES && recorder.state !== 'inactive') stopReplayRecording({ reason:'size-limit' });
      };
      recorder.onerror = event => post('arcade-replay-status', event?.error?.message || 'Falha ao gravar replay.', { state:'error' });
      recorder.onstop = async () => {
        const chunks = replayChunks.slice();
        const startedAt = replayStartedAt || Date.now();
        const meta = { ...replayStopMeta };
        const finalMime = recorder.mimeType || mimeType || 'video/webm';
        const durationMs = Math.max(0, Date.now() - startedAt);
        try {
          if (chunks.length) {
            const blob = new Blob(chunks, { type: finalMime });
            if (blob.size > 1024) {
              const createdAt = Date.now();
              const id = `arcade-${gameKey}-${createdAt}-${Math.random().toString(36).slice(2,8)}`;
              await saveReplayRecord({
                id, game:gameKey, title:game.title, online, role, room:online ? room : 'LOCAL',
                players:online ? 2 : localPlayers, createdAt, startedAt, durationMs, size:blob.size,
                mimeType:blob.type || finalMime, version:'2.5.0', meta, blob
              });
              post('arcade-replay-saved', 'Replay salvo neste dispositivo.', { state:'saved', replayId:id, size:blob.size, durationMs, room:online ? room : 'LOCAL' });
            }
          }
        } catch (e) {
          post('arcade-replay-status', e?.message || 'Não foi possível salvar o replay.', { state:'error' });
        } finally { resetReplayState(); }
      };
      recorder.start(1000);
      replayLimitTimer = setTimeout(() => stopReplayRecording({ reason:'time-limit' }), REPLAY_MAX_MS);
      post('arcade-replay-status', 'Replay em vídeo sendo gravado localmente.', { state:'recording' });
    } catch (e) {
      resetReplayState();
      post('arcade-replay-status', e?.message || 'Replay indisponível.', { state:'error' });
    }
  }

  function stopReplayRecording(meta = {}) {
    if (!replayRecorder) return;
    replayStopMeta = { ...replayStopMeta, ...(meta && typeof meta === 'object' ? meta : {}) };
    clearTimeout(replayLimitTimer); replayLimitTimer = 0;
    try {
      if (replayRecorder.state !== 'inactive') {
        try { replayRecorder.requestData(); } catch {}
        replayRecorder.stop();
      }
    } catch { resetReplayState(); }
  }

  async function bootGame() {
    if (loading || started || !game) return;
    loading = true; startButton.disabled = true; startButton.textContent = 'CARREGANDO…';
    try {
      setBoot(`Validando ${game.url.split('/').pop()}…`);
      const rom = await head(game.url);
      if (rom.status === 404 || rom.status === 410) throw new Error(`ROM não encontrada: ${game.url}`);
      if (rom.ok && rom.size && game.size && rom.size !== game.size) throw new Error(`ROM diferente da validada: ${rom.size} bytes; esperado ${game.size}.`);
      setBoot(`ROM OK (${mb(rom.size || game.size)}). Carregando EmulatorJS ${EJS_VERSION} + ${game.core}…`);

      const cfg = online ? await json('/api/kof-config') : null;
      const server = String(cfg?.netplayServer || PUBLIC_NETPLAY_SERVER).trim().replace(/\/+$/, '') || PUBLIC_NETPLAY_SERVER;
      const ice = Array.isArray(cfg?.iceServers) && cfg.iceServers.length ? cfg.iceServers : [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

      window.EJS_player = '#game'; window.EJS_core = game.core; window.EJS_gameUrl = game.url; window.EJS_gameID = online ? gameId : game.localId;
      window.EJS_pathtodata = EJS_DATA; window.EJS_language = 'pt-BR'; window.EJS_disableAutoLang = true; window.EJS_startOnLoaded = true; window.EJS_noAutoFocus = true;
      window.EJS_threads = !!(window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined'); window.EJS_color = '#42e8ff'; window.EJS_backgroundColor = '#050913'; window.EJS_backgroundBlur = false;
      window.EJS_controlScheme = 'arcade'; window.EJS_defaultControls = defaultControls(); window.EJS_VirtualGamepadSettings = []; window.EJS_disableVirtualGamepad = true;
      window.EJS_Buttons = { playPause: false, restart: false, mute: false, settings: false, fullscreen: false, saveState: false, loadState: false, screenRecord: false, gamepad: false, cheat: false, volume: false, saveSavFiles: false, loadSavFiles: false, quickSave: false, quickLoad: false, screenshot: false, cacheManager: false, exitEmulation: false };
      window.EJS_AdTimer = -1; window.EJS_CacheLimit = 512 * 1024 * 1024;
      if (online) { window.EJS_netplayServer = server; window.EJS_netplayICEServers = ice; } else { window.EJS_netplayServer = ''; window.EJS_netplayICEServers = []; }

      window.EJS_ready = () => setBoot(`${game.core} carregado. Preparando ${game.title}…`);
      window.EJS_onGameStart = async () => {
        const ok = await waitDirect(); if (!ok) { fail('A entrada direta do emulador não ficou disponível.'); return; }
        started = true; loading = false; boot.style.display = 'none'; hideForeignTouchUI();
        startTopbarMinuteCountdown();
        if (online) showStatus('🟡 Jogo carregado • conectando PVP…'); else hideStatus();
        cancelAnimationFrame(padFrame); padLoop(); if (online) startAutomaticNetplay();
        startReplayRecording();
        post('arcade-player-ready', `${game.title} carregado.`, { online, players: online ? 2 : localPlayers, role, room });
      };

      const loadLoader = (dataPath, label) => new Promise((resolve, reject) => {
        EJS_DATA = dataPath; window.EJS_pathtodata = dataPath;
        const script = document.createElement('script'); script.src = `${dataPath}loader.js`; script.async = true;
        script.onload = () => resolve(label); script.onerror = () => { script.remove(); reject(new Error(label)); };
        document.body.appendChild(script);
      });
      try { await loadLoader(EJS_PROXY_DATA, 'proxy da Vercel'); }
      catch {
        setBoot(`Proxy indisponível. Tentando CDN direto do EmulatorJS ${EJS_VERSION}…`);
        try { await loadLoader(EJS_DIRECT_DATA, 'CDN direto'); }
        catch { throw new Error(`Não foi possível carregar EmulatorJS ${EJS_VERSION} pelo proxy da Vercel nem pelo CDN direto.`); }
      }
    } catch (e) { fail(e?.message || String(e)); }
  }

  setupUi(); bindKeyboard();
  startButton?.addEventListener('click', bootGame);
  helpButton?.addEventListener('click', () => { showTopbar(0); renderHelp(); });
  customizeButton?.addEventListener('click', () => { showTopbar(0); renderCustomize('layout'); });
  topHotspot?.addEventListener('pointerdown', e => { e.preventDefault(); showTopbar(8000); }, { passive: false });
  addEventListener('mousemove', e => { if (started && e.clientY <= 48) showTopbar(8000); }, { passive: true });
  overlayClose?.addEventListener('click', closeOverlay);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
  fullscreenButton?.addEventListener('click', async () => { showTopbar(8000); try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch {} });
  document.addEventListener('fullscreenchange', () => { if (fullscreenButton) fullscreenButton.innerHTML = document.fullscreenElement ? '↙ <span class="txt">SAIR CHEIA</span>' : '⛶ <span class="txt">CHEIA</span>'; });
  exitButton?.addEventListener('click', () => { showTopbar(8000); try { if (history.length > 1) history.back(); else location.href = '/'; } catch { location.href = '/'; } });

  editSize?.addEventListener('input', () => {
    if (!selectedControl) return;
    const c = touchLayout.players[selectedControl.player].controls[selectedControl.id]; c.size = Number(editSize.value); editSizeOut.textContent = `${c.size}px`; renderTouchControls();
  });
  editOpacity?.addEventListener('input', () => {
    if (!selectedControl) return;
    const c = touchLayout.players[selectedControl.player].controls[selectedControl.id]; c.opacity = Number(editOpacity.value) / 100; editOpacityOut.textContent = `${editOpacity.value}%`; renderTouchControls();
  });
  editReset?.addEventListener('click', () => { resetTouchLayout(); if (editMode) { editSnapshot = clone(touchLayout); const first = document.querySelector('#touchWrap .touch-control'); if (first) selectControl(Number(first.dataset.player), first.dataset.control); } });
  editCancel?.addEventListener('click', () => exitEditMode(false));
  editDone?.addEventListener('click', () => exitEditMode(true));

  addEventListener('message', e => {
    if (e.origin !== location.origin) return;
    const d = e.data || {};
    if (d.type === 'arcade-replay-stop') stopReplayRecording(d.meta || {});
  });
  addEventListener('pagehide', () => { stopReplayRecording({ reason:'pagehide' }); releaseAll(); stopNetplayTimers(); clearTopbarTimer(); cancelAnimationFrame(padFrame); });
  addEventListener('unhandledrejection', e => { if (!started && e?.reason) fail(e.reason?.message || String(e.reason)); });
  setTimeout(() => { if (game && !started && !loading) bootGame(); }, 220);
})();
