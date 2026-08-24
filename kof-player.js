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
  const TRAINING_EJS_VERSION = '4.2.3';
  const ONLINE_EJS_VERSION = '4.3.0-pre';
  const PUBLIC_NETPLAY_SERVER = 'https://netplay.emulatorjs.org';
  const EJS_VERSION = online ? ONLINE_EJS_VERSION : TRAINING_EJS_VERSION;
  const PATCH_VERSION = '19.10.3';
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
    tl: { left: 8, top: 34 },
    tr: { left: 76, top: 30 },
    bl: { left: 0, top: 98 },
    br: { left: 68, top: 102 }
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
  const SPECIAL_BUTTONS_STATE_KEY = 'gg_kof_special_buttons_state_v1';
  const SPECIAL_FACING_KEY = 'gg_kof_special_facing_v1';
  const TOUCH_POSITION_KEY = 'gg_kof_touch_positions_v8';
  const TOUCH_SIZE_KEY = 'gg_kof_touch_sizes_v8';
  const QUICK_GUIDE_ENABLED_KEY = 'gg_kof_quick_guide_enabled_v1';
  const QUICK_GUIDE_CHARACTER_KEY = 'gg_kof_quick_guide_character_v1';
  const DEFAULT_TOUCH_POSITIONS = {
    landscape: {
      stick: { x: .14, y: .70 },
      c: { x: .84, y: .65 }, d: { x: .93, y: .65 },
      a: { x: .82, y: .82 }, b: { x: .91, y: .82 },
      max: { x: .82, y: .49 }, dodge: { x: .91, y: .49 }, dm: { x: .77, y: .34 }, sdm: { x: .86, y: .34 }, hsdm: { x: .95, y: .34 }, facing: { x: .55, y: .10 },
      coin: { x: .42, y: .89 }, start: { x: .53, y: .89 }
    },
    // Portrait coordinates are normalized INSIDE the lower arcade deck (not the full viewport).
    portrait: {
      coin: { x: .14, y: .14 }, start: { x: .33, y: .14 },
      stick: { x: .23, y: .60 },
      c: { x: .67, y: .43 }, d: { x: .84, y: .43 },
      a: { x: .64, y: .68 }, b: { x: .82, y: .68 },
      max: { x: .65, y: .88 }, dodge: { x: .83, y: .88 }, dm: { x: .66, y: .24 }, sdm: { x: .79, y: .24 }, hsdm: { x: .91, y: .24 }, facing: { x: .51, y: .11 }
    }
  };
  const DEFAULT_TOUCH_SIZES = {
    landscape: { stick: 104, a: 54, b: 54, c: 54, d: 54, max: 48, dodge: 48, dm: 44, sdm: 46, hsdm: 50, facing: 42, coin: 42, start: 42 },
    portrait: { stick: 118, a: 58, b: 58, c: 58, d: 58, max: 46, dodge: 46, dm: 44, sdm: 48, hsdm: 50, facing: 42, coin: 42, start: 42 }
  };

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
  // Every physical source owns its hold. An input is released only when the last source lets go.
  const heldInputSources = new Map();
  const gamepadPressedActions = new Set();
  let emulatorResizeTimer = 0;
  let directInputReady = false;
  let gamepadLoopActive = false;
  let lastGamepadStatusKey = '';
  let lastGamepadIdentity = '';
  let touchPositions = loadTouchPositions();
  let touchSizes = loadTouchSizes();
  let specialButtonsState = loadSpecialButtonsState();
  let specialFacing = loadSpecialFacing();
  let sdmMacroRunning = false;
  let touchLayoutEditing = false;
  let touchLayoutDraft = null;
  let touchLayoutSnapshot = null;
  let touchSizeDraft = null;
  let touchSizeSnapshot = null;
  let selectedTouchControl = 'stick';
  let dragState = null;
  let customStickPointer = null;
  let customStickMetrics = null;
  const touchActionPointers = new Map();
  const keyboardPressedActions = new Set();
  const keyboardDirections = { up: false, down: false, left: false, right: false };

  if (coarsePointer) {
    document.body.classList.add('gg-mobile-coarse');
    syncTouchOrientationClass();
  }
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
  function touchOrientation() { return innerWidth >= innerHeight ? 'landscape' : 'portrait'; }
  function syncTouchOrientationClass() {
    const orientation = touchOrientation();
    document.body.classList.toggle('gg-touch-landscape', orientation === 'landscape');
    document.body.classList.toggle('gg-touch-portrait', orientation === 'portrait');
    return orientation;
  }
  function clonePositionSet(value) { return JSON.parse(JSON.stringify(value || {})); }
  function normalizeTouchPoint(value, fallback) {
    const x = Number(value?.x), y = Number(value?.y);
    return {
      x: Number.isFinite(x) ? Math.max(.035, Math.min(.965, x)) : fallback.x,
      y: Number.isFinite(y) ? Math.max(.05, Math.min(.95, y)) : fallback.y
    };
  }
  function clampTouchPointForOrientation(key, point, orientation = touchOrientation()) {
    // V19.6: positions are relative to the active control surface. Keep editor freedom,
    // but never let a control escape the surface that owns it.
    return {
      x: Math.max(.035, Math.min(.965, Number(point?.x) || .5)),
      y: Math.max(.05, Math.min(.95, Number(point?.y) || .5))
    };
  }
  function normalizeTouchPositions(value) {
    const out = {};
    for (const orientation of ['landscape','portrait']) {
      out[orientation] = {};
      const defaults = DEFAULT_TOUCH_POSITIONS[orientation];
      for (const key of Object.keys(defaults)) out[orientation][key] = normalizeTouchPoint(value?.[orientation]?.[key], defaults[key]);
    }
    return out;
  }
  function loadTouchPositions() {
    try { return normalizeTouchPositions(JSON.parse(localStorage.getItem(TOUCH_POSITION_KEY) || 'null') || DEFAULT_TOUCH_POSITIONS); }
    catch { return normalizeTouchPositions(DEFAULT_TOUCH_POSITIONS); }
  }
  function saveTouchPositions(value) {
    touchPositions = normalizeTouchPositions(value);
    try { localStorage.setItem(TOUCH_POSITION_KEY, JSON.stringify(touchPositions)); } catch {}
    return touchPositions;
  }
  function resetTouchPositions(orientation = touchOrientation()) {
    touchPositions = loadTouchPositions();
    touchPositions[orientation] = clonePositionSet(DEFAULT_TOUCH_POSITIONS[orientation]);
    saveTouchPositions(touchPositions);
    return touchPositions[orientation];
  }
  function normalizeTouchSizes(value) {
    const out = {};
    for (const orientation of ['landscape','portrait']) {
      out[orientation] = {};
      for (const [key, fallback] of Object.entries(DEFAULT_TOUCH_SIZES[orientation])) {
        const n = Number(value?.[orientation]?.[key]);
        const min = key === 'stick' ? 82 : 42;
        const max = key === 'stick' ? 190 : 112;
        out[orientation][key] = Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
      }
    }
    return out;
  }
  function loadTouchSizes() {
    try { return normalizeTouchSizes(JSON.parse(localStorage.getItem(TOUCH_SIZE_KEY) || 'null') || DEFAULT_TOUCH_SIZES); }
    catch { return normalizeTouchSizes(DEFAULT_TOUCH_SIZES); }
  }
  function saveTouchSizes(value) {
    touchSizes = normalizeTouchSizes(value);
    try { localStorage.setItem(TOUCH_SIZE_KEY, JSON.stringify(touchSizes)); } catch {}
    return touchSizes;
  }

  function loadSpecialButtonsState() {
    const fallback = { dm:true, sdm:true, hsdm:true };
    try { return Object.assign({}, fallback, JSON.parse(localStorage.getItem(SPECIAL_BUTTONS_STATE_KEY) || 'null') || {}); } catch { return fallback; }
  }
  function saveSpecialButtonsState(next) {
    specialButtonsState = Object.assign({ dm:true, sdm:true, hsdm:true }, specialButtonsState || {}, next || {});
    try { localStorage.setItem(SPECIAL_BUTTONS_STATE_KEY, JSON.stringify(specialButtonsState)); } catch {}
    syncSpecialButtonVisibility();
    return specialButtonsState;
  }
  function loadSpecialFacing() {
    const fallback = role === 'guest' ? 'left' : 'right';
    try { const v = localStorage.getItem(SPECIAL_FACING_KEY); return v === 'left' || v === 'right' ? v : fallback; } catch { return fallback; }
  }
  function saveSpecialFacing(value) {
    specialFacing = value === 'left' ? 'left' : 'right';
    try { localStorage.setItem(SPECIAL_FACING_KEY, specialFacing); } catch {}
    syncSpecialFacingUi();
    return specialFacing;
  }
  function getPortraitGameHeightPx() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--gg-portrait-game-h').trim();
    const px = Number.parseFloat(raw);
    return Number.isFinite(px) && raw.endsWith('px') ? px : innerHeight * .54;
  }
  function syncPortraitLayoutVars() {
    const aspectGame = Math.round(innerWidth * 0.75);
    const minGame = Math.round(innerHeight * 0.38);
    const maxGame = Math.round(innerHeight * 0.54);
    const gameH = Math.max(minGame, Math.min(maxGame, aspectGame + 8));
    const deckH = Math.max(260, innerHeight - gameH);
    document.documentElement.style.setProperty('--gg-portrait-game-h', `${gameH}px`);
    document.documentElement.style.setProperty('--gg-portrait-deck-h', `${deckH}px`);
  }
  function resetTouchSizes(orientation = touchOrientation()) {
    touchSizes = loadTouchSizes();
    touchSizes[orientation] = clonePositionSet(DEFAULT_TOUCH_SIZES[orientation]);
    saveTouchSizes(touchSizes);
    return touchSizes[orientation];
  }
  function controlForTouchKey(key) {
    const custom = {
      stick: 'ggCustomStick', a: 'ggCustomA', b: 'ggCustomB', c: 'ggCustomC', d: 'ggCustomD',
      max: 'ggCustomMax', dodge: 'ggCustomDodge', dm: 'ggCustomDm', sdm: 'ggCustomSdm', hsdm: 'ggCustomHsdm', facing: 'ggFacingToggle', coin: 'ggCustomCoin', start: 'ggCustomStart'
    };
    const own = document.getElementById(custom[key]);
    if (own) return own;
    if (key === 'stick') return document.getElementById('gg-neo-stick');
    if (key === 'coin') return document.getElementById('gg-neo-coin');
    if (key === 'start') return document.getElementById('gg-neo-start');
    if (key === 'max') return document.getElementById('ggKofBurstButton');
    if (key === 'dodge') return document.getElementById('ggKofDodgeButton');
    return findArcadeButton(String(key).toUpperCase());
  }
  function touchControlEntries() {
    return ['stick','a','b','c','d','max','dodge','dm','sdm','hsdm','facing','coin','start']
      .map(key => [key, controlForTouchKey(key)])
      .filter(([,el]) => !!el);
  }
  function actionButtonSize() {
    const rects = ['A','B','C','D'].map(findArcadeButton).filter(Boolean).map(el => el.getBoundingClientRect()).filter(r => r.width > 20 && r.height > 20);
    if (!rects.length) return innerWidth > innerHeight ? 62 : 58;
    const values = rects.map(r => Math.min(r.width,r.height)).sort((a,b)=>a-b);
    return Math.max(48, Math.min(78, values[Math.floor(values.length/2)] || 62));
  }
  function sizeForTouchKey(key, orientation = touchOrientation()) {
    const source = touchLayoutEditing ? touchSizeDraft : touchSizes[orientation];
    return Number(source?.[key] || DEFAULT_TOUCH_SIZES[orientation][key] || 60);
  }
  function controlSurfaceRect() {
    const rect = mobileControls?.getBoundingClientRect?.();
    if (rect && rect.width > 1 && rect.height > 1) return rect;
    if (touchOrientation() === 'portrait') {
      const top = getPortraitGameHeightPx();
      return { left:0, top, width:innerWidth, height:Math.max(1, innerHeight - top), right:innerWidth, bottom:innerHeight };
    }
    return { left:0, top:0, width:innerWidth, height:innerHeight, right:innerWidth, bottom:innerHeight };
  }
  function effectiveTouchSize(key, orientation = touchOrientation()) {
    const wanted = sizeForTouchKey(key, orientation);
    const surface = controlSurfaceRect();
    // Keep controls usable on small embedded portrait players without consuming the game area.
    const cap = key === 'stick'
      ? Math.max(82, Math.min(surface.width * .34, surface.height * .52))
      : Math.max(40, Math.min(surface.width * .18, surface.height * .28));
    return Math.max(key === 'stick' ? 82 : 40, Math.min(wanted, cap));
  }
  function applyTouchSize(key, el = controlForTouchKey(key), orientation = touchOrientation()) {
    if (!coarsePointer || !el) return;
    const size = effectiveTouchSize(key, orientation);
    if (key === 'stick') {
      el.style.setProperty('width', `${size}px`, 'important');
      el.style.setProperty('height', `${size}px`, 'important');
    } else if (key === 'coin' || key === 'start' || key === 'facing') {
      el.style.setProperty('width', `${Math.round(size * 1.28)}px`, 'important');
      el.style.setProperty('min-width', `${Math.round(size * 1.28)}px`, 'important');
      el.style.setProperty('height', `${Math.round(size * .72)}px`, 'important');
      el.style.setProperty('font-size', `${Math.max(10, Math.round(size * .22))}px`, 'important');
    } else {
      el.style.setProperty('width', `${size}px`, 'important');
      el.style.setProperty('height', `${size}px`, 'important');
      el.style.setProperty('min-width', `${size}px`, 'important');
      el.style.setProperty('font-size', `${key === 'max' || key === 'dodge' || key === 'dm' || key === 'sdm' || key === 'hsdm' ? Math.max(9, Math.round(size * .19)) : Math.max(16, Math.round(size * .34))}px`, 'important');
    }
  }
  function applyTouchPoint(key, point, el = controlForTouchKey(key)) {
    if (!coarsePointer || !el || !point) return;
    const orientation = touchOrientation();
    point = clampTouchPointForOrientation(key, point, orientation);
    applyTouchSize(key, el, orientation);
    const surface = controlSurfaceRect();
    const rect = el.getBoundingClientRect();
    const width = Math.max(28, rect.width || effectiveTouchSize(key, orientation));
    const height = Math.max(28, rect.height || effectiveTouchSize(key, orientation));
    const cx = Math.max(width / 2 + 3, Math.min(surface.width - width / 2 - 3, point.x * surface.width));
    const cy = Math.max(height / 2 + 3, Math.min(surface.height - height / 2 - 3, point.y * surface.height));
    el.style.setProperty('position','absolute','important');
    el.style.setProperty('left', `${Math.round(cx - width / 2)}px`, 'important');
    el.style.setProperty('top', `${Math.round(cy - height / 2)}px`, 'important');
    el.style.setProperty('right','auto','important');
    el.style.setProperty('bottom','auto','important');
    el.style.setProperty('margin','0','important');
    el.style.setProperty('transform','none','important');
    el.style.setProperty('z-index', key === 'max' || key === 'dodge' || key === 'dm' || key === 'sdm' || key === 'hsdm' ? '75' : '73', 'important');
    el.dataset.ggDragKey = key;
  }
  function applyTouchPositions(source = null) {
    if (!coarsePointer || !gameplayStarted) return;
    const orientation = syncTouchOrientationClass();
    const positions = source || (touchLayoutEditing ? touchLayoutDraft : touchPositions[orientation]) || DEFAULT_TOUCH_POSITIONS[orientation];
    customStickMetrics = null;
    for (const [key, el] of touchControlEntries()) applyTouchPoint(key, positions[key] || DEFAULT_TOUCH_POSITIONS[orientation][key], el);
  }
  function markTouchControlsEditable(enabled) {
    for (const [key,el] of touchControlEntries()) {
      if (enabled) el.dataset.ggDragKey = key;
      else if (el.dataset.ggDragKey) delete el.dataset.ggDragKey;
    }
  }
  function startTouchLayoutEditor() {
    if (!coarsePointer || !gameplayStarted) {
      setNetplayState('⚠️ Inicie o KOF no celular antes de editar posição e tamanho.', 'error');
      return;
    }
    releaseAllPhysicalInputs();
    const orientation = touchOrientation();
    touchLayoutSnapshot = clonePositionSet(touchPositions[orientation]);
    touchLayoutDraft = clonePositionSet(touchPositions[orientation]);
    touchSizeSnapshot = clonePositionSet(touchSizes[orientation]);
    touchSizeDraft = clonePositionSet(touchSizes[orientation]);
    selectedTouchControl = 'stick';
    touchLayoutEditing = true;
    renderQuickGuide(false);
    closeLayoutModal();
    document.body.classList.add('gg-layout-editing');
    if (hudEditor) hudEditor.hidden = false;
    markTouchControlsEditable(true);
    applyTouchPositions(touchLayoutDraft);
    updateHudEditorSelection();
  }
  function finishTouchLayoutEditor(save) {
    if (!touchLayoutEditing) return;
    const orientation = touchOrientation();
    if (save && touchLayoutDraft && touchSizeDraft) {
      touchPositions[orientation] = clonePositionSet(touchLayoutDraft);
      touchSizes[orientation] = clonePositionSet(touchSizeDraft);
      saveTouchPositions(touchPositions);
      saveTouchSizes(touchSizes);
      setNetplayState('✅ Posição e tamanho dos controles salvos neste aparelho.', 'connected');
    } else {
      if (touchLayoutSnapshot) touchPositions[orientation] = clonePositionSet(touchLayoutSnapshot);
      if (touchSizeSnapshot) touchSizes[orientation] = clonePositionSet(touchSizeSnapshot);
    }
    touchLayoutEditing = false;
    dragState = null;
    document.body.classList.remove('gg-layout-editing');
    document.querySelectorAll('.gg-editor-selected').forEach(el => el.classList.remove('gg-editor-selected'));
    if (hudEditor) hudEditor.hidden = true;
    markTouchControlsEditable(false);
    applyTouchPositions(touchPositions[orientation]);
    showHudTemporarily(1800);
    renderQuickGuide();
  }
  function resetTouchLayoutEditor() {
    const orientation = touchOrientation();
    const defaults = clonePositionSet(DEFAULT_TOUCH_POSITIONS[orientation]);
    const defaultSizes = clonePositionSet(DEFAULT_TOUCH_SIZES[orientation]);
    if (touchLayoutEditing) {
      touchLayoutDraft = defaults;
      touchSizeDraft = defaultSizes;
      applyTouchPositions(touchLayoutDraft);
      updateHudEditorSelection();
    } else {
      touchPositions[orientation] = defaults;
      touchSizes[orientation] = defaultSizes;
      saveTouchPositions(touchPositions);
      saveTouchSizes(touchSizes);
      applyTouchPositions(touchPositions[orientation]);
      setNetplayState('↺ Posição e tamanho padrão restaurados para esta orientação.', 'info');
    }
  }

  function findArcadeButton(label) {
    const slot = SLOT_KEYS.find(key => currentControlLayout[key] === label);
    return slot ? document.getElementById(`gg-neo-${String(label).toLowerCase()}-${slot}`) : null;
  }
  function syncSpecialButtonVisibility() {
    [['dm','dm'],['sdm','sdm'],['hsdm','hsdm']].forEach(([key,stateKey]) => { const el = controlForTouchKey(key); if (el) el.hidden = !specialButtonsState?.[stateKey]; });
  }
  function syncSpecialFacingUi() {
    if (specialFacingSelect) specialFacingSelect.value = specialFacing;
    if (facingToggleButton) {
      facingToggleButton.textContent = specialFacing === 'left' ? 'LADO ←' : 'LADO →';
      facingToggleButton.setAttribute('aria-label', `Direção dos especiais: personagem olhando para ${specialFacing === 'left' ? 'esquerda' : 'direita'}`);
    }
  }

  function forceGameFill() {
    const root = document.getElementById('game');
    if (!root) return;
    const canvas = root.querySelector('canvas');
    if (canvas) {
      canvas.style.setProperty('max-width','100%','important');
      canvas.style.setProperty('max-height','100%','important');
      canvas.style.setProperty('touch-action','none','important');
    }
  }
  function scheduleEmulatorResize(delay = 120) {
    if (emulatorResizeTimer) clearTimeout(emulatorResizeTimer);
    emulatorResizeTimer = setTimeout(() => {
      emulatorResizeTimer = 0;
      try { window.EJS_emulator?.handleResize?.(); } catch {}
      forceGameFill();
      syncPortraitLayoutVars();
      syncSpecialButtonVisibility();
      if (gameplayStarted) applyTouchPositions();
    }, delay);
  }
  function installVirtualControlObserver() {
    // V19.6: no MutationObserver. Custom mobile controls are independent of EmulatorJS DOM.
    // This avoids continuous DOM work/reflow while the game is running.
    forceGameFill();
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
      { type: 'zone', id: 'gg-neo-stick', location: 'left', left: '72%', top: '62%', color: 'cyan', joystickInput: false, inputValues: [4, 5, 6, 7] },
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
  async function wakeNetplayServer(server, maxWait = 26000) {
    const startedAt = Date.now();
    let attempt = 0;
    let lastReason = 'sem resposta';
    while (Date.now() - startedAt < maxWait) {
      attempt += 1;
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      setNetplayState(`⏳ Preparando servidor PVP… tentativa ${attempt} • ${elapsed}s`, 'waiting');
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
      const server = String(cfg?.netplayServer || PUBLIC_NETPLAY_SERVER).trim().replace(/\/+$/, '') || PUBLIC_NETPLAY_SERVER;
      const source = cfg?.netplaySource === 'dedicated' ? 'dedicado' : 'público de compatibilidade';
      setNetplayState(`🔌 Verificando servidor PVP ${source}…`, 'waiting');
      const wake = await wakeNetplayServer(server, cfg?.netplaySource === 'dedicated' ? 52000 : 22000);
      if (!wake.ok) {
        // A listagem HTTP pode falhar por CORS/proxy mesmo quando o Socket.IO/WebRTC funciona.
        // A versão que funcionava anteriormente tratava esse teste como diagnóstico, não como bloqueio.
        setNetplayState(`🟡 Teste HTTP do servidor não respondeu (${wake.reason}). Tentando Socket.IO/WebRTC mesmo assim…`, 'waiting');
      } else {
        setNetplayState(`🟢 Servidor PVP disponível • ${wake.via === 'proxy' ? 'proxy Game Guess' : 'conexão direta'} • preparando WebRTC…`, 'waiting');
      }
      await waitForSocketIo();
      const np = await waitForNetplay(32000);
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

  function applyFullscreenPerformanceMode(active) {
    document.body.classList.toggle('gg-fullscreen-performance', !!active);
    if (coarsePointer && active) {
      setHudVisible(false, 0);
      setNetplayToastVisible(false);
    }
    // Não fica recalculando layout durante a partida. Uma atualização é suficiente
    // depois que o navegador termina a transição para/da tela cheia.
    scheduleEmulatorResize(active ? 320 : 220);
  }
  async function requestFullscreen() {
    const target = document.documentElement;
    try {
      if (!document.fullscreenElement) {
        const fn = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
        if (fn) await fn.call(target, { navigationUI: 'hide' });
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
    scheduleEmulatorResize(340);
  }
  function updateFullscreenUi() {
    const active = !!document.fullscreenElement;
    if (fullscreenButton) fullscreenButton.textContent = active ? '↙ SAIR' : '⛶ CHEIA';
    applyFullscreenPerformanceMode(active);
  }

  function buildEjsDefaultControls() {
    // Fallback map only. V19.7 captures keyboard before EmulatorJS and feeds simulateInput directly,
    // using the same source-aware path as touch and gamepad to avoid duplicate or mismatched input.
    return {
      0: {
        0: { value: '4', value2: '' },
        1: { value: '6', value2: '' },
        2: { value: '0', value2: '' },
        3: { value: 'enter', value2: '' },
        4: { value: 'up arrow', value2: '' },
        5: { value: 'down arrow', value2: '' },
        6: { value: 'left arrow', value2: '' },
        7: { value: 'right arrow', value2: '' },
        8: { value: '5', value2: '' },
        9: { value: '1', value2: '' }
      },
      1: {}, 2: {}, 3: {}
    };
  }

  async function waitForDirectInput(timeout = 4000) {
    const until = performance.now() + timeout;
    while (performance.now() < until) {
      if (typeof window.EJS_emulator?.gameManager?.simulateInput === 'function') {
        directInputReady = true;
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    directInputReady = false;
    return false;
  }

  async function bootGame() {
    if (loading || started) return;
    loading = true;
    if (startButton) { startButton.disabled = true; startButton.textContent = 'CARREGANDO…'; }
    try {
      const files = await validateArcadeFiles();
      setText(`Romset Full Non-Merged OK: ${mb(files.game.size)}.`);
      const cfg = await json('/api/kof-config');
      const server = String(cfg?.netplayServer || PUBLIC_NETPLAY_SERVER).trim().replace(/\/+$/, '') || PUBLIC_NETPLAY_SERVER;
      const ice = Array.isArray(cfg?.iceServers) && cfg.iceServers.length ? cfg.iceServers : [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

      window.EJS_player = '#game';
      window.EJS_core = 'fbneo';
      window.EJS_gameUrl = GAME_URL;
      window.EJS_gameID = gameId;
      window.EJS_pathtodata = EJS_DATA;
      window.EJS_language = 'pt-BR';
      window.EJS_disableAutoLang = true;
      window.EJS_startOnLoaded = true;
      window.EJS_noAutoFocus = matchMedia('(hover:none) and (pointer:coarse)').matches;
      window.EJS_threads = !!(window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined');
      window.EJS_color = '#42e8ff';
      window.EJS_backgroundColor = '#050913';
      window.EJS_backgroundBlur = false;
      window.EJS_controlScheme = 'arcade';
      window.EJS_browserMode = coarsePointer ? 'mobile' : 'desktop';
      window.EJS_defaultControls = buildEjsDefaultControls();
      // Mobile uses one input layer only: our direct overlay. The native EJS virtual pad is disabled.
      window.EJS_VirtualGamepadSettings = coarsePointer ? [] : buildVirtualGamepadSettings(currentControlLayout);
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
          version: EJS_VERSION, gameId, online, patch: PATCH_VERSION, layout: 'full-non-merged', controls: 'single-direct-input-layer'
        });
      };
      window.EJS_onGameStart = async () => {
        started = true; loading = false; gameplayStarted = true;
        renderQuickGuide();
        document.body.classList.add('gameplay-active');
        if (boot) boot.style.display = 'none';
        forceGameFill();
        const inputOk = await waitForDirectInput();
        if (coarsePointer) {
          if (inputOk) showOwnMobileControls();
          showHudTemporarily(1600);
          setTimeout(() => setNetplayToastVisible(false), 1300);
        }
        if (firstConnectedGamepad()) startGamepadLoop();
        post('kof-player-ready', `KOF iniciado • EmulatorJS ${EJS_VERSION} • FBNeo • Game ID ${gameId}`, {
          gameId, version: EJS_VERSION, patch: PATCH_VERSION, online, role, room, rtcRoomName, layout: 'full-non-merged', controls: 'single-direct-input-layer'
        });
        if (!inputOk) setNetplayState('⚠️ Entrada direta não ficou pronta. Recarregue a página.', 'error');
        if (online) setTimeout(() => startAutomaticNetplay(), 450);
      };

      setText(`Carregando EmulatorJS ${EJS_VERSION} + FBNeo…`);
      const script = document.createElement('script');
      script.src = `${EJS_DATA}loader.js`;
      script.onerror = () => fail(`Não consegui carregar o EmulatorJS ${EJS_VERSION}. Verifique a conexão.`);
      script.onload = () => { if (online) waitForSocketIo().catch(() => {}); };
      document.body.appendChild(script);
      setTimeout(() => { if (!started) setText('FBNeo está preparando o romset Full Non-Merged. No primeiro carregamento isso pode demorar.'); }, 8000);
      setTimeout(() => {
        if (!started) post('kof-player-slow', 'O KOF ainda está preparando o romset Full Non-Merged.', { version: EJS_VERSION, patch: PATCH_VERSION, online, layout: 'full-non-merged', controls: 'single-direct-input-layer' });
      }, 20000);
    } catch (e) { fail(e?.message || String(e)); }
  }

  window.addEventListener('unhandledrejection', e => { if (!started && e?.reason) post('kof-player-debug', String(e.reason?.message || e.reason)); });
  startButton?.addEventListener('click', bootGame);

  const comboShell = document.getElementById('ggKofCombos');
  const burstButton = document.getElementById('ggKofBurstButton');
  const dodgeButton = document.getElementById('ggKofDodgeButton');
  const mobileControls = document.getElementById('ggMobileArcadeControls');
  const customStick = document.getElementById('ggCustomStick');
  const customStickKnob = customStick?.querySelector('.gg-custom-stick-knob');
  const portraitOptionButton = document.getElementById('ggPortraitOption');
  const portraitMenuButton = document.getElementById('ggPortraitMenu');
  const hudHotspot = document.getElementById('kofHudHotspot');
  const hudEditor = document.getElementById('hudEditor');
  const hudEditorSave = document.getElementById('hudEditorSave');
  const hudEditorReset = document.getElementById('hudEditorReset');
  const hudEditorCancel = document.getElementById('hudEditorCancel');
  const hudEditorSelected = document.getElementById('hudEditorSelected');
  const hudSizeDown = document.getElementById('hudSizeDown');
  const hudSizeUp = document.getElementById('hudSizeUp');
  const dmButton = document.getElementById('ggCustomDm');
  const sdmButton = document.getElementById('ggCustomSdm');
  const hsdmButton = document.getElementById('ggCustomHsdm');
  const dmButtonEnabledToggle = document.getElementById('dmButtonEnabled');
  const sdmButtonEnabledToggle = document.getElementById('sdmButtonEnabled');
  const hsdmButtonEnabledToggle = document.getElementById('hsdmButtonEnabled');
  const specialFacingSelect = document.getElementById('specialFacingSelect');
  const facingToggleButton = document.getElementById('ggFacingToggle');

  function getButtonElementByLabel(label) {
    const slot = SLOT_KEYS.find(key => currentControlLayout[key] === label);
    if (!slot) return null;
    return document.getElementById(`gg-neo-${String(label).toLowerCase()}-${slot}`);
  }
  function getGameManager() { return window.EJS_emulator?.gameManager || null; }
  function simulateInput(index, value) {
    const gm = getGameManager();
    if (!gm || typeof gm.simulateInput !== 'function') return false;
    try { gm.simulateInput(0, Number(index), Number(value)); return true; } catch { return false; }
  }
  function ensureDirectInput() {
    if (!directInputReady && typeof getGameManager()?.simulateInput === 'function') directInputReady = true;
    return directInputReady;
  }
  function setInputSource(index, source, pressed) {
    if (!Number.isFinite(index) || !source || !ensureDirectInput()) return false;
    let sources = heldInputSources.get(index);
    if (!pressed) {
      if (!sources || !sources.has(source)) return true;
      sources.delete(source);
      if (sources.size === 0) {
        simulateInput(index, 0);
        heldInputSources.delete(index);
      }
      return true;
    }
    if (!sources) { sources = new Set(); heldInputSources.set(index, sources); }
    if (sources.has(source)) return true;
    if (sources.size === 0 && !simulateInput(index, 1)) {
      heldInputSources.delete(index);
      return false;
    }
    sources.add(source);
    return true;
  }
  function setVectorSource(source, x = 0, y = 0, threshold = .28) {
    const next = {
      up: y < -threshold, down: y > threshold,
      left: x < -threshold, right: x > threshold
    };
    for (const [name,index] of Object.entries(DIRECTION_INPUTS)) {
      setInputSource(index, `${source}:${name}`, next[name]);
    }
  }
  function releaseAllDirectInputs() {
    for (const index of heldInputSources.keys()) simulateInput(index, 0);
    heldInputSources.clear();
  }
  function setPhysicalDirection(x = 0, y = 0, source = 'physical') {
    setVectorSource(source, x, y);
  }
  function bindComboShortcut(button, combo) {
    if (!button || !combo) return;
    const indices = combo.labels.map(label => BUTTON_INPUTS[label]).filter(Number.isFinite);
    const source = `shortcut:${button.id || combo.title}`;
    const release = event => {
      if (event) { event.preventDefault(); event.stopPropagation(); }
      button.classList.remove('active');
      indices.forEach(index => setInputSource(index, source, false));
    };
    const press = () => {
      button.classList.add('active');
      let ok = false;
      indices.forEach(index => { ok = setInputSource(index, source, true) || ok; });
      if (ok) return true;
      button.classList.remove('active');
      return false;
    };
    button.__ggPress = press;
    button.__ggRelease = release;
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation();
      try { button.setPointerCapture?.(event.pointerId); } catch {}
      press();
    }, { passive:false });
    ['pointerup','pointercancel','lostpointercapture'].forEach(evt => button.addEventListener(evt, release, { passive:false }));
  }
  function pressComboShortcut(button, combo) {
    if (!button || !combo) return false;
    if (!button.__ggPress) bindComboShortcut(button, combo);
    return !!button.__ggPress?.();
  }
  function releaseComboShortcut(button) { button?.__ggRelease?.(); }
  const SPECIAL_BUTTON_GROUPS = { ac:['a','c'], bd:['b','d'], abc:['a','b','c'], abcd:['a','b','c','d'], ab:['a','b'], bc:['b','c'], ad:['a','d'], bcd:['b','c','d'], a:['a'], b:['b'], c:['c'], d:['d'] };
  function activeSdmFighter() {
    const roster = quickGuideRoster();
    const settings = loadQuickGuideSettings();
    return roster.find(c => c.id === settings.character) || roster[0] || null;
  }
  const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
  async function waitFrames(count = 1) { for (let i = 0; i < count; i++) await nextFrame(); }
  function relativeDirectionVector(token) {
    const forward = specialFacing === 'left' ? -1 : 1;
    const backward = -forward;
    const map = {
      f:[forward,0], b:[backward,0], d:[0,1], u:[0,-1],
      df:[forward,1], db:[backward,1], uf:[forward,-1], ub:[backward,-1]
    };
    return map[String(token || '').toLowerCase()] || null;
  }
  function setMacroButtons(group, source, pressed) {
    for (const action of (SPECIAL_BUTTON_GROUPS[String(group || '').toLowerCase()] || [])) {
      if (pressed) pressAction(action, `${source}:${action}`);
      else releaseAction(action, `${source}:${action}`);
    }
  }
  async function pulseMacroButtons(group, source, holdFrames = 3, gapFrames = 1) {
    if (!group) return;
    setMacroButtons(group, source, true);
    await waitFrames(holdFrames);
    setMacroButtons(group, source, false);
    if (gapFrames) await waitFrames(gapFrames);
  }
  function releaseManualDirectionsForMacro() {
    for (const src of ['touch-stick','keyboard','gamepad']) setVectorSource(src, 0, 0);
  }
  async function activateMaxForMacro(source) {
    releaseManualDirectionsForMacro();
    await pulseMacroButtons('bc', `${source}:max`, 3, 0); // Magic Plus II / KOF 2002: MAX = B+C
    await waitFrames(12);
  }
  async function setRelativeDirection(token, source, frames=2) {
    const vector = relativeDirectionVector(token);
    if (!vector) return;
    setVectorSource(source, vector[0], vector[1]);
    await waitFrames(frames);
  }
  async function runDirectionalCommand(steps, button, source) {
    const dirSource = `${source}:dir`;
    const sequence = Array.isArray(steps) ? steps : [];
    for (const token of sequence) await setRelativeDirection(token, dirSource, 2);
    // O botão final entra enquanto a última direção ainda está ativa; isso é crítico no FBNeo.
    if (button) await pulseMacroButtons(button, `${source}:finish`, 3, 0);
    setVectorSource(dirSource, 0, 0);
    await waitFrames(2);
  }
  async function runScriptCommand(script, source) {
    const dirSource = `${source}:scriptdir`;
    let directionHeld = false;
    for (let i = 0; i < (script || []).length; i++) {
      const token = script[i];
      if (token && typeof token === 'object') {
        if (token.dir) {
          const vector = relativeDirectionVector(token.dir);
          if (vector) {
            setVectorSource(dirSource, vector[0], vector[1]);
            directionHeld = true;
            await waitFrames(Math.max(1, Number(token.frames) || 2));
          }
          continue;
        }
        if (token.btn) {
          // Se uma sequência direcional terminou imediatamente antes deste botão,
          // mantenha a última direção DURANTE o botão (como no arcade), depois solte-a.
          await pulseMacroButtons(token.btn, `${source}:script:${i}`, Math.max(1, Number(token.frames) || 3), Number.isFinite(token.gap) ? token.gap : 1);
          if (directionHeld) {
            setVectorSource(dirSource, 0, 0);
            directionHeld = false;
            await waitFrames(1);
          }
          continue;
        }
        if (token.holdBtn) {
          setMacroButtons(token.holdBtn, `${source}:hold:${i}`, true);
          await waitFrames(Math.max(1, Number(token.frames) || 12));
          setMacroButtons(token.holdBtn, `${source}:hold:${i}`, false);
          if (directionHeld) {
            setVectorSource(dirSource, 0, 0);
            directionHeld = false;
          }
          await waitFrames(1);
          continue;
        }
        if (token.wait) { await waitFrames(Math.max(1, Number(token.wait) || 1)); continue; }
      }
    }
    if (directionHeld) setVectorSource(dirSource, 0, 0);
    await waitFrames(2);
  }
  async function runMacroPayload(macro, source) {
    if (Array.isArray(macro?.preScript)) await runScriptCommand(macro.preScript, `${source}:pre`);
    if (macro?.air) {
      setVectorSource(`${source}:jump`, 0, -1);
      await waitFrames(4);
      setVectorSource(`${source}:jump`, 0, 0);
      await waitFrames(5);
    }
    if (Array.isArray(macro?.script)) await runScriptCommand(macro.script, source);
    else await runDirectionalCommand(macro?.steps || [], macro?.button || null, source);
    if (Array.isArray(macro?.postScript)) await runScriptCommand(macro.postScript, `${source}:post`);
  }
  function specialProfileFor(fighter, kind) {
    if (!fighter) return null;
    return kind === 'dm' ? fighter.dm : kind === 'hsdm' ? fighter.hsdm : fighter.sdm;
  }
  function specialLabel(kind) { return kind === 'dm' ? 'DM' : kind === 'hsdm' ? 'HSDM/MAX2' : 'SDM/MAX'; }
  function specialButtonEnabled(kind) { return !!specialButtonsState?.[kind]; }
  function specialButtonEl(kind) { return kind === 'dm' ? dmButton : kind === 'hsdm' ? hsdmButton : sdmButton; }
  async function triggerSpecialMacro(kind) {
    if (sdmMacroRunning || !gameplayStarted) return false;
    const fighter = activeSdmFighter();
    const profile = specialProfileFor(fighter, kind);
    const label = specialLabel(kind);
    if (!fighter || !profile) { setNetplayState(`Escolha um personagem na guia azul para usar ${label}.`, 'error'); return false; }
    if (!specialButtonEnabled(kind)) { setNetplayState(`Ative ${label} em LAYOUT para usar este atalho.`, 'error'); return false; }
    if (!profile.macro) { setNetplayState(`${label} de ${fighter.name} não tem macro disponível.`, 'error'); return false; }
    sdmMacroRunning = true;
    specialButtonEl(kind)?.classList.add('gg-pressed');
    releaseManualDirectionsForMacro();
    const source = `special:${kind}:${fighter.id}:${Date.now()}`;
    try {
      // Magic Plus II libera HSDM/MAX2 sem a preparação de MAX do KOF 2002 original.
      // Para DM/SDM preservamos o perfil; para HSDM nunca injetamos B+C antes do comando.
      if (kind !== 'hsdm' && profile.macro.activateMax) await activateMaxForMacro(source);
      await runMacroPayload(profile.macro, source);
      const warnings = [];
      if (profile.macro.close) warnings.push('use perto');
      if (profile.macro.air) warnings.push('execução aérea');
      if (profile.macro.conditional) warnings.push(profile.macro.conditional);
      const suffix = warnings.length ? ` • ${warnings.join(' • ')}` : '';
      setNetplayState(`${label} • ${fighter.name}: ${profile.name}${suffix}`, 'connected');
      return true;
    } finally {
      for (const suffix of ['dir','scriptdir','jump','pre:scriptdir','post:scriptdir']) setVectorSource(`${source}:${suffix}`, 0, 0);
      specialButtonEl(kind)?.classList.remove('gg-pressed');
      sdmMacroRunning = false;
    }
  }
  function updateHudEditorSelection() {
    document.querySelectorAll('#ggMobileArcadeControls .gg-editor-selected').forEach(el => el.classList.remove('gg-editor-selected'));
    const el = controlForTouchKey(selectedTouchControl);
    el?.classList.add('gg-editor-selected');
    const label = { stick:'ALAVANCA',a:'A',b:'B',c:'C',d:'D',max:'MAX',dodge:'ESQUIVA',dm:'DM',sdm:'SDM',hsdm:'HSDM',facing:'LADO',coin:'COIN',start:'START' }[selectedTouchControl] || selectedTouchControl.toUpperCase();
    const size = touchSizeDraft?.[selectedTouchControl] || sizeForTouchKey(selectedTouchControl);
    if (hudEditorSelected) hudEditorSelected.textContent = `${label} • ${Math.round(size)}px`;
  }
  function changeSelectedTouchSize(delta) {
    if (!touchLayoutEditing || !touchSizeDraft || !selectedTouchControl) return;
    const key = selectedTouchControl;
    const min = key === 'stick' ? 82 : 42;
    const max = key === 'stick' ? 190 : 112;
    touchSizeDraft[key] = Math.max(min, Math.min(max, Number(touchSizeDraft[key] || DEFAULT_TOUCH_SIZES[touchOrientation()][key]) + delta));
    applyTouchPositions(touchLayoutDraft);
    updateHudEditorSelection();
  }
  function showOwnMobileControls() {
    if (!coarsePointer || !mobileControls || !gameplayStarted) return;
    mobileControls.hidden = false;
    document.body.classList.add('gg-own-mobile-controls');
    if (comboShell) comboShell.hidden = true;
    applyTouchPositions();
  }
  function actionIndices(action) {
    if (action === 'max') return [BUTTON_INPUTS.B, BUTTON_INPUTS.C];
    if (action === 'dodge') return [BUTTON_INPUTS.A, BUTTON_INPUTS.B];
    const index = ACTION_INPUTS[action];
    return Number.isFinite(index) ? [index] : [];
  }
  function pressAction(action, source = `action:${action}`) {
    let ok = false;
    for (const index of actionIndices(action)) ok = setInputSource(index, source, true) || ok;
    return ok;
  }
  function releaseAction(action, source = `action:${action}`) {
    for (const index of actionIndices(action)) setInputSource(index, source, false);
  }
  function refreshTouchButtonPressed(button) {
    if (!button) return;
    const stillHeld = [...touchActionPointers.values()].some(entry => entry.button === button);
    button.classList.toggle('gg-pressed', stillHeld);
  }
  function releaseTouchPointer(pointerId, fallbackButton = null) {
    const entry = touchActionPointers.get(pointerId);
    if (!entry) { refreshTouchButtonPressed(fallbackButton); return; }
    releaseAction(entry.action, entry.source);
    touchActionPointers.delete(pointerId);
    refreshTouchButtonPressed(entry.button);
  }
  function bindOwnMobileControls() {
    if (!mobileControls) return;
    mobileControls.querySelectorAll('[data-gg-action]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        if (touchLayoutEditing) return;
        event.preventDefault(); event.stopImmediatePropagation();
        const action = button.dataset.ggAction;
        if (!action) return;
        if (['dm','sdm','hsdm'].includes(action)) {
          try { button.setPointerCapture?.(event.pointerId); } catch {}
          triggerSpecialMacro(action);
          return;
        }
        const source = `touch:${action}:${event.pointerId}`;
        touchActionPointers.set(event.pointerId, { button, action, source });
        button.classList.add('gg-pressed');
        try { button.setPointerCapture?.(event.pointerId); } catch {}
        pressAction(action, source);
      }, { passive:false });
      ['pointerup','pointercancel','lostpointercapture'].forEach(type => button.addEventListener(type, event => {
        if (touchLayoutEditing) return;
        event.preventDefault(); event.stopImmediatePropagation();
        releaseTouchPointer(event.pointerId, button);
      }, { passive:false }));
    });

    const updateStickFromPointer = event => {
      if (!customStick || touchLayoutEditing || customStickPointer !== event.pointerId) return;
      const rect = customStickMetrics || customStick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      let x = (event.clientX - cx) / Math.max(1, rect.width * .34);
      let y = (event.clientY - cy) / Math.max(1, rect.height * .34);
      const length = Math.hypot(x,y);
      if (length > 1) { x /= length; y /= length; }
      if (customStickKnob) customStickKnob.style.transform = `translate3d(${x * rect.width * .20}px,${y * rect.height * .20}px,0)`;
      setPhysicalDirection(x, y, 'touch-stick');
    };
    customStick?.addEventListener('pointerdown', event => {
      if (touchLayoutEditing) return;
      event.preventDefault(); event.stopImmediatePropagation();
      customStickPointer = event.pointerId;
      customStickMetrics = customStick.getBoundingClientRect();
      try { customStick.setPointerCapture?.(event.pointerId); } catch {}
      updateStickFromPointer(event);
    }, { passive:false });
    const moveEvent = 'onpointerrawupdate' in window ? 'pointerrawupdate' : 'pointermove';
    customStick?.addEventListener(moveEvent, event => {
      if (touchLayoutEditing || customStickPointer !== event.pointerId) return;
      event.preventDefault(); event.stopImmediatePropagation();
      updateStickFromPointer(event);
    }, { passive:false });
    const releaseStick = event => {
      if (touchLayoutEditing || customStickPointer == null || (event.pointerId != null && customStickPointer !== event.pointerId)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      setPhysicalDirection(0, 0, 'touch-stick');
      if (customStickKnob) customStickKnob.style.transform = 'translate3d(0,0,0)';
      try { customStick?.releasePointerCapture?.(customStickPointer); } catch {}
      customStickPointer = null;
      customStickMetrics = null;
    };
    customStick?.addEventListener('pointerup', releaseStick, { passive:false });
    customStick?.addEventListener('pointercancel', releaseStick, { passive:false });
    customStick?.addEventListener('lostpointercapture', releaseStick, { passive:false });
  }

  function setupMobileComboButtons() {
    if (comboShell) comboShell.hidden = true;
    // V19.7: macros are part of the same source-aware direct-input path.
    if (!coarsePointer) return;
    bindComboShortcut(burstButton, COMBO_BUTTONS.burst);
    bindComboShortcut(dodgeButton, COMBO_BUTTONS.dodge);
  }

  function releaseAllPhysicalInputs() {
    keyboardPressedActions.clear();
    gamepadPressedActions.clear();
    for (const key of Object.keys(keyboardDirections)) keyboardDirections[key] = false;
    touchActionPointers.clear();
    document.querySelectorAll('#ggMobileArcadeControls .gg-pressed').forEach(el => el.classList.remove('gg-pressed'));
    customStickPointer = null;
    customStickMetrics = null;
    if (customStickKnob) customStickKnob.style.transform = 'translate3d(0,0,0)';
    releaseAllDirectInputs();
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
  const layoutPositionEdit = document.getElementById('layoutPositionEdit');
  const layoutPositionReset = document.getElementById('layoutPositionReset');
  const layoutSizeControl = document.getElementById('layoutSizeControl');
  const layoutSizeRange = document.getElementById('layoutSizeRange');
  const layoutSizeValue = document.getElementById('layoutSizeValue');
  const layoutSizeMinus = document.getElementById('layoutSizeMinus');
  const layoutSizePlus = document.getElementById('layoutSizePlus');
  const quickGuideEnabled = document.getElementById('quickGuideEnabled');
  const quickGuideCharacter = document.getElementById('quickGuideCharacter');
  const quickGuidePanel = document.getElementById('ggCharacterQuickGuide');
  const quickGuideName = document.getElementById('ggGuideName');
  const quickGuideMoves = document.getElementById('ggGuideMoves');
  const quickGuideCombo = document.getElementById('ggGuideCombo');
  const quickGuideTip = document.getElementById('ggGuideTip');
  const quickGuideClose = document.getElementById('ggGuideClose');
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

  function quickGuideRoster() { return Array.isArray(window.GG_KOF_CATALOG?.roster) ? window.GG_KOF_CATALOG.roster : []; }
  function loadQuickGuideSettings() {
    const roster = quickGuideRoster();
    const fallback = roster[0]?.id || 'kyo';
    let enabled = false, character = fallback;
    try { enabled = localStorage.getItem(QUICK_GUIDE_ENABLED_KEY) === '1'; } catch {}
    try { character = localStorage.getItem(QUICK_GUIDE_CHARACTER_KEY) || fallback; } catch {}
    if (!roster.some(c => c.id === character)) character = fallback;
    return { enabled, character };
  }
  function saveQuickGuideSettings(enabled, character) {
    try { localStorage.setItem(QUICK_GUIDE_ENABLED_KEY, enabled ? '1' : '0'); localStorage.setItem(QUICK_GUIDE_CHARACTER_KEY, character || 'kyo'); } catch {}
  }
  function renderQuickGuide(forceVisible = null) {
    const settings = loadQuickGuideSettings();
    if (quickGuideEnabled) quickGuideEnabled.checked = settings.enabled;
    if (quickGuideCharacter) quickGuideCharacter.value = settings.character;
    const fighter = quickGuideRoster().find(c => c.id === settings.character);
    const visible = forceVisible == null ? (settings.enabled && gameplayStarted && !!fighter && !touchLayoutEditing) : !!forceVisible;
    if (!quickGuidePanel) return;
    quickGuidePanel.hidden = !visible;
    if (!fighter) return;
    if (quickGuideName) quickGuideName.textContent = `🔵 ${fighter.name}`;
    if (quickGuideMoves) quickGuideMoves.innerHTML = (fighter.moves || []).slice(0,4).map(m => `<div class="gg-guide-move"><span><b>${escapeHtml(m.name)}</b>${m.note ? `<small> • ${escapeHtml(m.note)}</small>` : ''}</span><code>${escapeHtml(m.command)}</code></div>`).join('');
    const dmMode = fighter.dm?.macro?.inputMode === 'magic-plus-ii-shortcut' ? 'ATALHO MP2' : 'MP2 OK';
    const sdmMode = fighter.sdm?.macro?.inputMode === 'magic-plus-ii-shortcut' ? 'ATALHO MP2' : 'MP2 OK';
    const dmLine = fighter.dm ? `<div style="margin-top:6px"><b>DM • ${dmMode}:</b> ${escapeHtml(fighter.dm.name)} <code style="margin-left:6px">${escapeHtml(fighter.dm.command || '—')}</code></div>` : '';
    const sdmLine = fighter.sdm ? `<div style="margin-top:6px"><b>SDM/MAX • ${sdmMode}:</b> ${escapeHtml(fighter.sdm.name)} <code style="margin-left:6px">${escapeHtml(fighter.sdm.command || '—')}</code></div>` : '';
    const hsdmMode = fighter.hsdm?.macro?.inputMode === 'native-reviewed' ? 'NATIVO' : 'ATALHO MP2';
    const hsdmLine = fighter.hsdm ? `<div style="margin-top:6px"><b>HSDM/MAX2 • ${hsdmMode}:</b> ${escapeHtml(fighter.hsdm.name)} <code style="margin-left:6px">${escapeHtml(fighter.hsdm.command || '—')}</code></div>` : '';
    if (quickGuideCombo) quickGuideCombo.innerHTML = `<b>COMBO:</b> ${escapeHtml(fighter.combo || '—')}${dmLine}${sdmLine}${hsdmLine}`;
    if (quickGuideTip) quickGuideTip.textContent = `${fighter.tip || ''}${fighter.magicPlusPage ? ` • Magic Plus II: pág. ${fighter.magicPlusPage}/51` : ''}`;
  }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function setupQuickGuideControls() {
    const roster = quickGuideRoster();
    if (quickGuideCharacter && !quickGuideCharacter.options.length) {
      const groups = new Map();
      for (const f of roster) { if (!groups.has(f.team)) groups.set(f.team, []); groups.get(f.team).push(f); }
      quickGuideCharacter.innerHTML = [...groups.entries()].map(([team,list]) => `<optgroup label="${escapeHtml(team)}">${list.map(f => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)}</option>`).join('')}</optgroup>`).join('');
    }
    const settings = loadQuickGuideSettings();
    if (quickGuideEnabled) quickGuideEnabled.checked = settings.enabled;
    if (quickGuideCharacter) quickGuideCharacter.value = settings.character;
    if (dmButtonEnabledToggle) dmButtonEnabledToggle.checked = !!specialButtonsState.dm;
    if (sdmButtonEnabledToggle) sdmButtonEnabledToggle.checked = !!specialButtonsState.sdm;
    if (hsdmButtonEnabledToggle) hsdmButtonEnabledToggle.checked = !!specialButtonsState.hsdm;
    syncSpecialButtonVisibility();
    syncSpecialFacingUi();
    renderQuickGuide();
  }
  function layoutSizeBounds(key) { return key === 'stick' ? {min:82,max:190} : {min:42,max:112}; }
  function syncLayoutSizeUi() {
    const key = layoutSizeControl?.value || 'stick';
    const orientation = touchOrientation();
    const bounds = layoutSizeBounds(key);
    const size = Number(touchSizes?.[orientation]?.[key] || DEFAULT_TOUCH_SIZES[orientation][key]);
    if (layoutSizeRange) { layoutSizeRange.min = String(bounds.min); layoutSizeRange.max = String(bounds.max); layoutSizeRange.value = String(size); }
    if (layoutSizeValue) layoutSizeValue.textContent = `${Math.round(size)} px • ${orientation === 'portrait' ? 'vertical' : 'horizontal'}`;
  }
  function setDirectLayoutSize(value) {
    const key = layoutSizeControl?.value || 'stick';
    const orientation = touchOrientation();
    const bounds = layoutSizeBounds(key);
    const next = Math.max(bounds.min, Math.min(bounds.max, Number(value) || DEFAULT_TOUCH_SIZES[orientation][key]));
    touchSizes[orientation][key] = next;
    saveTouchSizes(touchSizes);
    applyTouchPositions();
    syncLayoutSizeUi();
  }

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
  function openLayoutModal() { fillLayoutForm(currentControlLayout); setupQuickGuideControls(); syncLayoutSizeUi(); if (layoutModal) { layoutModal.hidden = false; layoutModal.querySelector('.layout-card')?.scrollTo?.({top:0,behavior:'instant'}); } setHudVisible(true, 0); }
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
    if (firstConnectedGamepad()) startGamepadLoop();
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
  function releaseGamepadInputs() {
    setPhysicalDirection(0, 0, 'gamepad');
    for (const action of gamepadPressedActions) releaseAction(action, `gamepad:${action}`);
    gamepadPressedActions.clear();
  }
  function syncGamepadLoop() {
    if (!gamepadLoopActive) { gamepadFrame = 0; return; }
    const pad = firstConnectedGamepad();
    if (!pad) {
      activeGamepadIndex = -1;
      releaseGamepadInputs();
      lastGamepadButtons = [];
      gamepadLoopActive = false;
      gamepadFrame = 0;
      if (lastGamepadStatusKey !== 'none') {
        lastGamepadStatusKey = 'none';
        setPadStatus('<span class="pad-warn">Nenhum controle detectado.</span> Conecte um controle USB/Bluetooth no Android ou PC.', 'Nenhum controle detectado.');
      }
      return;
    }
    activeGamepadIndex = pad.index;
    const identity = `${pad.index}|${pad.id || 'Gamepad'}`;
    if (identity !== lastGamepadIdentity) {
      lastGamepadIdentity = identity;
      lastGamepadStatusKey = 'connected';
      setPadStatus('<span class="pad-ok">Controle detectado.</span> Entrada direta ativa; remapeie os botões abaixo se quiser.', `${pad.id || 'Gamepad genérico'} • slot ${pad.index}`);
    }
    processCapture(pad);

    const axisX = Number(pad.axes?.[0] || 0), axisY = Number(pad.axes?.[1] || 0);
    const dpadX = (buttonPressed(pad, 15) ? 1 : 0) + (buttonPressed(pad, 14) ? -1 : 0);
    const dpadY = (buttonPressed(pad, 13) ? 1 : 0) + (buttonPressed(pad, 12) ? -1 : 0);
    const mx = Math.abs(axisX) > 0.24 ? axisX : dpadX;
    const my = Math.abs(axisY) > 0.24 ? axisY : dpadY;
    setPhysicalDirection(mx, my, 'gamepad');

    for (const action of ['a','b','c','d','coin','start','max','dodge']) {
      const isPressed = !captureGamepadAction && mappingPressed(pad, action);
      const isActive = gamepadPressedActions.has(action);
      if (isPressed && !isActive) {
        gamepadPressedActions.add(action);
        pressAction(action, `gamepad:${action}`);
      } else if (!isPressed && isActive) {
        gamepadPressedActions.delete(action);
        releaseAction(action, `gamepad:${action}`);
      }
    }
    lastGamepadButtons = (pad.buttons || []).map(btn => !!btn?.pressed || Number(btn?.value || 0) > 0.5);
    gamepadFrame = requestAnimationFrame(syncGamepadLoop);
  }
  function startGamepadLoop() {
    if (gamepadFrame) cancelAnimationFrame(gamepadFrame);
    gamepadLoopActive = !!firstConnectedGamepad();
    if (!gamepadLoopActive) { gamepadFrame = 0; return; }
    gamepadFrame = requestAnimationFrame(syncGamepadLoop);
  }
  function stopGamepadLoop() {
    gamepadLoopActive = false;
    if (gamepadFrame) cancelAnimationFrame(gamepadFrame);
    gamepadFrame = 0;
    releaseGamepadInputs();
  }

  function keyboardAction(code) {
    for (const [action, codes] of Object.entries(KEYBOARD_MAPPING)) {
      if (codes.includes(code)) return action;
    }
    return '';
  }
  function keyboardDirection(code) {
    return ({ ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' })[code] || '';
  }
  function applyKeyboardDirections() {
    const x = (keyboardDirections.right ? 1 : 0) - (keyboardDirections.left ? 1 : 0);
    const y = (keyboardDirections.down ? 1 : 0) - (keyboardDirections.up ? 1 : 0);
    setPhysicalDirection(x, y, 'keyboard');
  }
  function onKeyboardDown(e) {
    if (!gameplayStarted) return;
    const tag = String(e.target?.tagName || '').toLowerCase();
    if (['input','textarea','select'].includes(tag)) return;
    const direction = keyboardDirection(e.code);
    const action = keyboardAction(e.code);
    if (!direction && !action) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (direction) {
      if (!keyboardDirections[direction]) { keyboardDirections[direction] = true; applyKeyboardDirections(); }
      return;
    }
    if (keyboardPressedActions.has(e.code)) return;
    keyboardPressedActions.add(e.code);
    pressAction(action, `keyboard:${e.code}`);
  }
  function onKeyboardUp(e) {
    if (!gameplayStarted) return;
    const direction = keyboardDirection(e.code);
    const action = keyboardAction(e.code);
    if (!direction && !action) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (direction) {
      if (keyboardDirections[direction]) { keyboardDirections[direction] = false; applyKeyboardDirections(); }
      return;
    }
    keyboardPressedActions.delete(e.code);
    releaseAction(action, `keyboard:${e.code}`);
  }

  SLOT_KEYS.forEach(slot => layoutInputs[slot]?.addEventListener('change', () => refreshLayoutPreview(readLayoutForm())));
  layoutButton?.addEventListener('click', openLayoutModal);
  layoutClose?.addEventListener('click', closeLayoutModal);
  layoutModal?.addEventListener('click', e => { if (e.target === layoutModal) closeLayoutModal(); });
  layoutSave?.addEventListener('click', () => {
    const previous = { ...currentControlLayout };
    const nextRaw = readLayoutForm();
    const orientation = touchOrientation();
    const beforePos = clonePositionSet(touchPositions[orientation]);
    const beforeSizes = clonePositionSet(touchSizes[orientation]);
    for (const slot of SLOT_KEYS) {
      const oldKey = String(previous[slot] || '').toLowerCase();
      const newKey = String(nextRaw[slot] || '').toLowerCase();
      if (oldKey && newKey && beforePos[oldKey]) touchPositions[orientation][newKey] = clonePositionSet(beforePos[oldKey]);
      if (oldKey && newKey && beforeSizes[oldKey]) touchSizes[orientation][newKey] = beforeSizes[oldKey];
    }
    saveTouchPositions(touchPositions); saveTouchSizes(touchSizes);
    const next = saveControlLayout(nextRaw);
    fillLayoutForm(next); closeLayoutModal();
    applyTouchPositions();
    setNetplayState(`🕹 Layout salvo: ${next.tl}-${next.tr}-${next.bl}-${next.br}. Posição e tamanho preservados.`, 'info');
    setText('Layout do celular salvo. No mobile a mudança é aplicada imediatamente; posição e tamanho continuam editáveis.');
    if (!coarsePointer && (started || loading)) setTimeout(() => location.reload(), 450);
  });
  layoutReset?.addEventListener('click', () => {
    const next = saveControlLayout(DEFAULT_CONTROL_LAYOUT);
    fillLayoutForm(next); closeLayoutModal();
    setNetplayState('🕹 Layout padrão restaurado.', 'info');
    if (started || loading) setTimeout(() => location.reload(), 450);
  });

  layoutSizeControl?.addEventListener('change', syncLayoutSizeUi);
  layoutSizeRange?.addEventListener('input', () => setDirectLayoutSize(layoutSizeRange.value));
  layoutSizeMinus?.addEventListener('click', () => setDirectLayoutSize(Number(layoutSizeRange?.value || 0) - 6));
  layoutSizePlus?.addEventListener('click', () => setDirectLayoutSize(Number(layoutSizeRange?.value || 0) + 6));
  quickGuideEnabled?.addEventListener('change', () => { saveQuickGuideSettings(quickGuideEnabled.checked, quickGuideCharacter?.value); renderQuickGuide(); });
  quickGuideCharacter?.addEventListener('change', () => { saveQuickGuideSettings(!!quickGuideEnabled?.checked, quickGuideCharacter.value); renderQuickGuide(); });
  quickGuideClose?.addEventListener('click', () => { saveQuickGuideSettings(false, quickGuideCharacter?.value); if (quickGuideEnabled) quickGuideEnabled.checked = false; renderQuickGuide(false); });
  dmButtonEnabledToggle?.addEventListener('change', () => { saveSpecialButtonsState({ dm: dmButtonEnabledToggle.checked }); });
  sdmButtonEnabledToggle?.addEventListener('change', () => { saveSpecialButtonsState({ sdm: sdmButtonEnabledToggle.checked }); });
  hsdmButtonEnabledToggle?.addEventListener('change', () => { saveSpecialButtonsState({ hsdm: hsdmButtonEnabledToggle.checked }); });
  specialFacingSelect?.addEventListener('change', () => saveSpecialFacing(specialFacingSelect.value));
  facingToggleButton?.addEventListener('pointerdown', event => {
    if (touchLayoutEditing) return;
    event.preventDefault(); event.stopImmediatePropagation();
    saveSpecialFacing(specialFacing === 'left' ? 'right' : 'left');
    setNetplayState(`↔ Especiais espelhados: personagem olhando para ${specialFacing === 'left' ? '← esquerda' : '→ direita'}.`, 'info');
  }, {passive:false});
  layoutPositionEdit?.addEventListener('click', startTouchLayoutEditor);
  layoutPositionReset?.addEventListener('click', resetTouchLayoutEditor);
  hudEditorSave?.addEventListener('click', () => finishTouchLayoutEditor(true));
  hudEditorCancel?.addEventListener('click', () => finishTouchLayoutEditor(false));
  hudEditorReset?.addEventListener('click', resetTouchLayoutEditor);
  hudSizeDown?.addEventListener('click', () => changeSelectedTouchSize(-6));
  hudSizeUp?.addEventListener('click', () => changeSelectedTouchSize(6));

  document.addEventListener('pointerdown', event => {
    if (!touchLayoutEditing) return;
    const target = event.target?.closest?.('[data-gg-drag-key]');
    if (!target) return;
    const key = target.dataset.ggDragKey;
    const point = touchLayoutDraft?.[key];
    if (!key || !point) return;
    event.preventDefault(); event.stopPropagation();
    selectedTouchControl = key;
    updateHudEditorSelection();
    const rect = target.getBoundingClientRect();
    dragState = { key, target, dx: event.clientX - (rect.left + rect.width / 2), dy: event.clientY - (rect.top + rect.height / 2), pointerId: event.pointerId };
    try { target.setPointerCapture?.(event.pointerId); } catch {}
  }, true);
  document.addEventListener('pointermove', event => {
    if (!touchLayoutEditing || !dragState || dragState.pointerId !== event.pointerId) return;
    event.preventDefault(); event.stopPropagation();
    const surface = controlSurfaceRect();
    const x = Math.max(.035, Math.min(.965, (event.clientX - dragState.dx - surface.left) / Math.max(1, surface.width)));
    const y = Math.max(.05, Math.min(.95, (event.clientY - dragState.dy - surface.top) / Math.max(1, surface.height)));
    touchLayoutDraft[dragState.key] = { x, y };
    applyTouchPoint(dragState.key, touchLayoutDraft[dragState.key], dragState.target);
  }, true);
  const endTouchDrag = event => {
    if (!dragState || (event.pointerId != null && dragState.pointerId !== event.pointerId)) return;
    try { dragState.target?.releasePointerCapture?.(dragState.pointerId); } catch {}
    dragState = null;
  };
  document.addEventListener('pointerup', endTouchDrag, true);
  document.addEventListener('pointercancel', endTouchDrag, true);

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

  portraitOptionButton?.addEventListener('click', () => {
    showHudTemporarily(5200);
    openLayoutModal();
  });
  portraitMenuButton?.addEventListener('click', async () => {
    if (document.fullscreenElement) await exitFullscreen();
    else showHudTemporarily(5200);
  });

  fullscreenButton?.addEventListener('click', toggleFullscreen);
  portraitButton?.addEventListener('click', () => setOrientation('portrait'));
  landscapeButton?.addEventListener('click', () => setOrientation('landscape'));
  document.addEventListener('fullscreenchange', () => { updateFullscreenUi(); setTimeout(() => { showOwnMobileControls(); applyTouchPositions(); }, 180); });
  document.addEventListener('webkitfullscreenchange', updateFullscreenUi);
  window.addEventListener('orientationchange', () => { syncPortraitLayoutVars(); scheduleEmulatorResize(360); setTimeout(() => { showOwnMobileControls(); applyTouchPositions(); syncLayoutSizeUi(); renderQuickGuide(); syncSpecialButtonVisibility(); syncSpecialFacingUi(); }, 520); }, { passive: true });
  window.addEventListener('gamepadconnected', e => { activeGamepadIndex = e.gamepad?.index ?? activeGamepadIndex; lastGamepadIdentity = ''; if (gameplayStarted || (padModal && !padModal.hidden)) startGamepadLoop(); });
  window.addEventListener('gamepaddisconnected', () => { lastGamepadIdentity = ''; if (firstConnectedGamepad()) startGamepadLoop(); else stopGamepadLoop(); });
  window.addEventListener('keydown', onKeyboardDown, { passive:false, capture:true });
  window.addEventListener('keyup', onKeyboardUp, { passive:false, capture:true });
  window.addEventListener('blur', releaseAllPhysicalInputs);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAllPhysicalInputs(); });
  window.addEventListener('resize', () => {
    customStickMetrics = null;
    if (!coarsePointer || !gameplayStarted) return;
    clearTimeout(window.__ggTouchLayoutResizeTimer);
    window.__ggTouchLayoutResizeTimer = setTimeout(() => applyTouchPositions(), 90);
  }, { passive:true });

  netplayRetryButton?.addEventListener('click', () => startAutomaticNetplay(true));
  netplayMenuButton?.addEventListener('click', () => { if (!openNetplayMenu()) setNetplayState('O menu Netplay ainda não está pronto. Tente novamente em alguns segundos.', 'error'); });

  fillLayoutForm(currentControlLayout);
  renderPadMapping(currentGamepadMapping);
  setupMobileComboButtons();
  syncPortraitLayoutVars();
  setupQuickGuideControls();
  syncSpecialButtonVisibility();
  syncSpecialFacingUi();
  bindOwnMobileControls();
  installVirtualControlObserver();
  if (coarsePointer) { setHudVisible(true, 0); setTimeout(() => { syncPortraitLayoutVars(); applyTouchPositions(); syncSpecialButtonVisibility(); }, 500); }

  if (online) {
    if (startButton) startButton.textContent = role === 'host' ? 'CONECTAR HOST' : 'CONECTAR CONVIDADO';
    setText(`PVP ${role === 'host' ? 'HOST' : 'CONVIDADO'} • sessão ${rtcRoomName}. Carregando KOF e conectando o Netplay automaticamente. No celular, o HUD some durante a luta e reaparece ao tocar no topo da tela. Use 🕹 LAYOUT para salvar a ordem dos botões e 🎮 CONTROLE para mapear gamepad.`);
    if (netplayStatus) netplayStatus.hidden = false;
    setTimeout(() => bootGame(), 180);
  } else {
    if (netplayStatus) netplayStatus.hidden = true;
    setText('Clique em INICIAR KOF. No celular, toque no topo para mostrar o HUD. Em 🕹 LAYOUT você pode trocar a ordem A/B/C/D e também arrastar individualmente alavanca, A/B/C/D, MAX, ESQUIVA, DM, SDM/MAX, HSDM/MAX2, LADO, COIN e START; a posição é salva separadamente para vertical e horizontal. Os botões especiais seguem o personagem da guia azul e o botão LADO espelha os comandos quando o personagem troca de lado.');
  }

  window.addEventListener('resize', () => { syncPortraitLayoutVars(); scheduleEmulatorResize(180); }, { passive:true });
})();
