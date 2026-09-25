(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const CORE = () => window.GameGuessCore;
  const FB = () => window.GameGuessFirebase;
  const VERSION = '2.0.1';

  const GAMES = {
    kf2k2mp2: {
      title: 'KOF 2002 Magic Plus II', icon: '🥊', system: 'Neo Geo', core: 'fbneo',
      url: '/roms/v178/kf2k2mp2.zip', size: 86694745
    },
    neobombe: {
      title: 'Neo Bomberman', icon: '💣', system: 'Neo Geo', core: 'fbneo',
      url: '/roms/neogeo/neobombe.zip', size: 7431142
    },
    samsh5spho: {
      title: 'Samurai Shodown V Special', icon: '⚔️', system: 'Neo Geo', core: 'fbneo',
      url: '/roms/arcade/samsh5spho.zip', size: 83295234
    },
    mvsc: {
      title: 'Marvel vs. Capcom', icon: '🦸', system: 'CPS-2', core: 'fbalpha2012_cps2',
      url: '/roms/arcade/mvsc.zip', size: 21493122
    },
    xmvsfur1: {
      title: 'X-Men vs. Street Fighter', icon: '✖️', system: 'CPS-2', core: 'fbalpha2012_cps2',
      url: '/roms/arcade/xmvsfur1.zip', size: 18468916
    }
  };

  let selected = '';
  let roomCode = '';
  let room = null;
  let unsub = null;
  let sessionArmed = false;
  let launched = false;
  let launching = false;
  let lastLaunchAt = 0;
  let readyRoom = '';

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  function toast(title, message, type='') { CORE()?.toast?.(title, message, type); }
  function show(id) { CORE()?.showScreen?.(id); }
  function user() { return FB()?.getUser?.() || null; }
  function game(key=selected) { return GAMES[key] || null; }
  function playerName() {
    const u = user(), p = CORE()?.getProfile?.() || {};
    return String(p.nickname || u?.displayName || u?.email?.split('@')[0] || 'PLAYER').trim().slice(0,20) || 'PLAYER';
  }

  function setHubStatus(message, kind='info') {
    const el = $('arcadeActionStatus');
    if (!el) return;
    el.dataset.kind = kind;
    const dot = el.querySelector('.arcade-v2-status-dot');
    if (dot) dot.textContent = kind === 'error' ? '!' : kind === 'loading' ? '…' : kind === 'ok' ? '✓' : '';
    const b = el.querySelector('b');
    const span = el.querySelector('span:last-child');
    if (b) b.textContent = kind === 'error' ? 'Atenção.' : kind === 'loading' ? 'Carregando.' : kind === 'ok' ? 'Pronto.' : 'Arcade.';
    if (span) span.textContent = message;
  }

  function setOnlineStatus(message, kind='info') {
    const el = $('arcadeOnlineStatus');
    if (!el) return;
    el.dataset.kind = kind;
    const bullet = el.querySelector('span');
    if (bullet) bullet.textContent = kind === 'error' ? '!' : kind === 'ok' ? '✓' : kind === 'loading' ? '…' : '●';
    const b = el.querySelector('b');
    if (b) b.textContent = message;
  }

  function setPlayStatus(message, kind='info') {
    const el = $('arcadePlayConnection');
    if (!el) return;
    el.dataset.kind = kind;
    el.textContent = message;
  }

  async function head(url, timeout=4500) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(url, { method:'HEAD', cache:'no-store', signal:ctrl.signal });
      return { ok:r.ok, status:r.status, size:Number(r.headers.get('content-length') || 0) };
    } catch (e) {
      return { ok:false, status:0, error:e?.name === 'AbortError' ? 'timeout' : 'network' };
    } finally { clearTimeout(timer); }
  }

  // Não bloqueia a jogabilidade quando o host não responde HEAD. Só barra 404/410
  // ou tamanho comprovadamente incompatível.
  async function validate(key=selected, { quiet=false }={}) {
    const g = game(key);
    if (!g) return false;
    const r = await head(g.url);
    if (r.status === 404 || r.status === 410) {
      if (!quiet) {
        setHubStatus(`A ROM de ${g.title} não está no deploy: ${g.url}`, 'error');
        setOnlineStatus(`ROM ausente no deploy: ${g.url}`, 'error');
        toast(g.title, `ROM não encontrada: ${g.url}`, 'error');
      }
      return false;
    }
    if (r.ok && r.size && g.size && r.size !== g.size) {
      if (!quiet) {
        const msg = `ROM com tamanho diferente: ${r.size} bytes; esperado ${g.size}.`;
        setHubStatus(msg, 'error'); setOnlineStatus(msg, 'error'); toast(g.title, msg, 'error');
      }
      return false;
    }
    // Em Vercel/CDNs, HEAD pode falhar mesmo com GET funcionando. O player faz a
    // validação definitiva e mostra erro dentro da própria tela.
    return true;
  }

  function playUrl(mode, launchAt=0) {
    const g = game();
    if (!g) return '';
    const name = playerName();
    if (mode === 'online') {
      const role = room?.hostUid === user()?.uid ? 'host' : 'guest';
      return `/arcade-player.html?v=${VERSION}&game=${encodeURIComponent(selected)}&role=${role}&room=${encodeURIComponent(roomCode)}&gameId=${encodeURIComponent(room?.gameId || 1)}&launch=${encodeURIComponent(launchAt || room?.launchAt || Date.now())}&name=${encodeURIComponent(name)}`;
    }
    const players = mode === 'local2' ? 2 : 1;
    return `/arcade-player.html?v=${VERSION}&game=${encodeURIComponent(selected)}&role=local&players=${players}&name=${encodeURIComponent(name)}`;
  }

  function markBusy(button, busy, text='') {
    if (!button) return;
    if (busy) {
      if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.classList.add('is-busy');
      if (text) button.innerHTML = text;
    } else {
      button.disabled = false;
      button.classList.remove('is-busy');
      if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    }
  }

  async function launchLocal(key, players, button=null) {
    selected = key;
    const g = game();
    if (!g) return;
    markBusy(button, true, '⏳ ABRINDO…');
    setHubStatus(`Abrindo ${g.title} para ${players} jogador${players > 1 ? 'es' : ''}…`, 'loading');

    // A navegação é imediata; a validação final acontece no player e nunca deixa o
    // botão parecer “morto”.
    const frame = $('arcadePlayFrame');
    $('arcadePlayTitle').textContent = `${g.icon} ${g.title.toUpperCase()}`;
    $('arcadePlayMode').textContent = players === 2 ? '2 PLAYERS LOCAL' : '1 PLAYER LOCAL';
    frame.title = `${g.title} • ${players}P local`;
    frame.src = playUrl(players === 2 ? 'local2' : 'local1');
    setPlayStatus('Carregando ROM e emulador…', 'loading');
    show('arcadePlayScreen');
    setTimeout(() => markBusy(button, false), 450);
  }

  function playerOnline(uid, r=room) { return Boolean(uid && Object.keys(r?.presence?.[uid] || {}).length); }
  function playerCount() { return room ? Object.keys(room.players || {}).length : 0; }
  function connectedCount() { return room ? Object.keys(room.players || {}).filter(uid => playerOnline(uid)).length : 0; }
  function readyCount() { return Object.values(room?.clientReady || {}).filter(x => x?.ready).length; }
  function isHost() { return Boolean(user() && room?.hostUid === user().uid); }

  async function ensureReady() {
    if (!roomCode || !user() || !selected) return false;
    if (room?.clientReady?.[user().uid]?.ready) { readyRoom = roomCode; return true; }
    if (readyRoom === roomCode) return true;
    setOnlineStatus('Validando ROM neste aparelho…', 'loading');
    if (!await validate(selected)) { readyRoom = ''; return false; }
    readyRoom = roomCode;
    try {
      const ok = await FB()?.markFightReady?.(roomCode, true);
      if (ok) setOnlineStatus('ROM validada. Aguardando o outro jogador…', 'ok');
      return ok;
    } catch (e) {
      readyRoom = '';
      setOnlineStatus(e?.message || 'Falha ao marcar este aparelho como pronto.', 'error');
      return false;
    }
  }

  function renderRoom() {
    const panel = $('arcadeRoomPanel');
    panel?.classList.toggle('hidden', !room);
    if (!room) return;
    const g = game();
    $('arcadeRoomCode').textContent = room.code || roomCode;
    $('arcadeRoomGame').textContent = `${g?.icon || '🎮'} ${g?.title || selected} • ${isHost() ? 'HOST / PLAYER 1' : 'CONVIDADO / PLAYER 2'}`;
    $('arcadeRoomPlayers').innerHTML = Object.values(room.players || {}).map(p => `
      <div class="kof-player-row arcade-player-row-v2">
        <span>${p.uid === room.hostUid ? '👑' : '🥊'}</span>
        <b>${esc(p.name)}</b>
        <small>${playerOnline(p.uid) ? '🟢 online' : '🟡 reconectando'} • ${room.clientReady?.[p.uid]?.ready ? '🎮 pronto' : '🔎 validando ROM'}</small>
      </div>`).join('');

    const count = playerCount(), connected = connectedCount(), ready = readyCount();
    const status = $('arcadeRoomStatus');
    if (status) {
      if (count < 2) status.textContent = '⏳ 1/2 jogadores • compartilhe o código da sala';
      else if (connected < 2) status.textContent = `🟡 2/2 jogadores • ${connected}/2 online`;
      else if (ready < 2) status.textContent = `🔎 ${ready}/2 aparelhos prontos • validando ROM`;
      else status.textContent = '✅ 2/2 jogadores online e prontos para iniciar';
    }

    if (count < 2) setOnlineStatus('Sala criada. Compartilhe o código com seu rival.', 'ok');
    else if (connected < 2) setOnlineStatus('Rival encontrado. Aguardando conexão estável…', 'loading');
    else if (ready < 2) setOnlineStatus('Dois jogadores online. Validando os aparelhos…', 'loading');
    else setOnlineStatus(isHost() ? 'Tudo pronto. Clique em INICIAR ONLINE X1.' : 'Tudo pronto. Aguarde o host iniciar.', 'ok');

    const launch = $('arcadeLaunchButton');
    if (launch) {
      if (isHost()) {
        launch.disabled = launching || count < 2 || connected < 2 || ready < 2;
        launch.textContent = launching ? '⏳ INICIANDO…' : '🚀 INICIAR ONLINE X1';
      } else {
        launch.disabled = true;
        launch.textContent = ready >= 2 ? '✅ PRONTO • AGUARDE O HOST' : '🔎 VALIDANDO…';
      }
    }

    const launchAt = Number(room.launchAt || 0);
    if (sessionArmed && (room.launchState === 'starting' || room.status === 'playing') && launchAt && !launched && launchAt !== lastLaunchAt) {
      lastLaunchAt = launchAt;
      setTimeout(() => launchOnline(true, launchAt), 90);
    }
    ensureReady();
  }

  function watch(code) {
    if (unsub) { try { unsub(); } catch {} }
    unsub = FB()?.watchFightRoom?.(code, (r, e) => {
      if (e) {
        setOnlineStatus(e?.message || 'Falha ao sincronizar a sala.', 'error');
        toast('Sala Arcade', 'Falha ao sincronizar sala.', 'error');
        return;
      }
      room = r;
      if (!room) { leaveRoom(false); return; }
      const roomGame = String(room.arcadeGame || 'kf2k2mp2');
      if (roomGame !== selected) {
        setOnlineStatus('Este código pertence a outro jogo do Arcade.', 'error');
        toast('Sala incompatível', `Esta sala é de ${GAMES[roomGame]?.title || roomGame}.`, 'error');
        leaveRoom(false);
        return;
      }
      renderRoom();
    });
  }

  async function createRoom() {
    const g = game();
    if (!g) return;
    if (!FB()?.ready?.() || !user()) {
      setOnlineStatus('Faça login para criar uma sala online.', 'error');
      toast('Arcade Online', 'Faça login antes de criar sala.', 'error');
      return;
    }
    const btn = $('arcadeCreateRoom');
    markBusy(btn, true, '⏳ CRIANDO…');
    setOnlineStatus(`Preparando sala de ${g.title}…`, 'loading');
    try {
      if (!await validate()) return;
      roomCode = await FB().createFightRoom({ arcadeGame:selected });
      sessionArmed = true; launched = false; launching = false; lastLaunchAt = 0; readyRoom = '';
      watch(roomCode);
      setOnlineStatus(`Sala ${roomCode} criada. Compartilhe o código.`, 'ok');
      toast('Sala criada', `Código ${roomCode}`);
    } catch (e) {
      setOnlineStatus(e?.message || String(e), 'error');
      toast('Erro ao criar sala', e?.message || String(e), 'error');
    } finally { markBusy(btn, false); }
  }

  async function joinRoom() {
    const g = game();
    if (!g) return;
    const code = String($('arcadeJoinCode')?.value || '').trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) {
      setOnlineStatus('Digite um código de sala válido com 6 caracteres.', 'error');
      return;
    }
    if (!FB()?.ready?.() || !user()) {
      setOnlineStatus('Faça login para entrar em uma sala online.', 'error');
      toast('Arcade Online', 'Faça login antes de entrar.', 'error');
      return;
    }
    const btn = $('arcadeJoinRoom');
    markBusy(btn, true, '⏳ ENTRANDO…');
    setOnlineStatus(`Entrando na sala ${code}…`, 'loading');
    try {
      if (!await validate()) return;
      roomCode = await FB().joinFightRoom(code, selected);
      sessionArmed = true; launched = false; launching = false; lastLaunchAt = 0; readyRoom = '';
      watch(roomCode);
      setOnlineStatus(`Conectado à sala ${roomCode}. Validando aparelhos…`, 'ok');
      toast('Conectado', `Você entrou na sala ${roomCode}`);
    } catch (e) {
      setOnlineStatus(e?.message || String(e), 'error');
      toast('Não consegui entrar', e?.message || String(e), 'error');
    } finally { markBusy(btn, false); }
  }

  async function leaveRoom(goBack=true) {
    if (roomCode) await FB()?.leaveFightRoom?.(roomCode).catch(() => {});
    if (unsub) { try { unsub(); } catch {} unsub = null; }
    roomCode = ''; room = null; sessionArmed = false; launched = false; launching = false; lastLaunchAt = 0; readyRoom = '';
    $('arcadeRoomPanel')?.classList.add('hidden');
    setOnlineStatus('Escolha como entrar na partida.', 'info');
    if (goBack) show('kofScreen');
  }

  async function requestLaunch() {
    if (!roomCode || !room) return setOnlineStatus('Crie ou entre em uma sala primeiro.', 'error');
    if (!isHost()) return setOnlineStatus('Somente o host pode iniciar a partida.', 'error');
    if (playerCount() < 2 || connectedCount() < 2 || readyCount() < 2) {
      setOnlineStatus('Aguarde os dois aparelhos ficarem online e prontos.', 'error');
      return;
    }
    launching = true; renderRoom();
    try {
      const result = await FB().requestFightLaunch(roomCode);
      if (!launched) await launchOnline(true, Number(result?.launchAt || Date.now()));
    } catch (e) {
      launching = false; renderRoom();
      setOnlineStatus(e?.message || String(e), 'error');
      toast('Não consegui iniciar', e?.message || String(e), 'error');
    }
  }

  async function launchOnline(fromRoom=false, launchAt=0) {
    if (!fromRoom || !sessionArmed || !roomCode || !room || launched) return;
    const g = game(); if (!g) return;
    launched = true; launching = false;
    $('arcadePlayTitle').textContent = `${g.icon} ${g.title.toUpperCase()}`;
    $('arcadePlayMode').textContent = `SALA ${roomCode} • ${isHost() ? 'PLAYER 1 / HOST' : 'PLAYER 2 / CONVIDADO'}`;
    $('arcadePlayFrame').title = `${g.title} • Online X1`;
    $('arcadePlayFrame').src = playUrl('online', launchAt);
    setPlayStatus('Carregando jogo e conectando WebRTC…', 'loading');
    show('arcadePlayScreen');
  }

  async function openOnline(key) {
    if (roomCode) await leaveRoom(false);
    selected = key;
    const g = game(); if (!g) return;
    $('arcadeOnlineIcon').textContent = g.icon;
    $('arcadeOnlineTitle').textContent = g.title;
    $('arcadeOnlineSubtitle').textContent = `${g.system} • ONLINE 1x1 • um jogador por aparelho`;
    $('arcadeJoinCode').value = '';
    $('arcadeRoomPanel')?.classList.add('hidden');
    setOnlineStatus('Crie uma sala ou digite o código recebido do seu rival.', 'info');
    show('arcadeOnlineScreen');
  }

  function stopPlayer() {
    const frame = $('arcadePlayFrame');
    if (frame) frame.src = 'about:blank';
    setPlayStatus('Parado.', 'info');
  }

  function openHub() {
    stopPlayer();
    show('kofScreen');
    setHubStatus('Escolha 1 Player, 2 Players local ou Online X1.', 'ok');
  }

  async function copyRoom() {
    if (!roomCode) return;
    try {
      await navigator.clipboard?.writeText(roomCode);
      setOnlineStatus(`Código ${roomCode} copiado.`, 'ok');
      toast('Código copiado', roomCode);
    } catch {
      const ta = document.createElement('textarea'); ta.value = roomCode; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {} ta.remove();
      setOnlineStatus(`Código da sala: ${roomCode}`, 'ok');
    }
  }

  function bind() {
    if (window.__GG_ARCADE_V2_BOUND__) return;
    window.__GG_ARCADE_V2_BOUND__ = true;

    $('homeKofButton')?.addEventListener('click', openHub);
    $('kofBackButton')?.addEventListener('click', () => show('homeScreen'));

    // Delegação: os botões continuam funcionando mesmo se os cards forem re-renderizados.
    document.addEventListener('click', e => {
      const btn = e.target.closest?.('[data-arcade-game][data-arcade-mode]');
      if (!btn) return;
      e.preventDefault();
      const key = btn.dataset.arcadeGame;
      const mode = btn.dataset.arcadeMode;
      if (!GAMES[key]) return setHubStatus('Jogo não cadastrado.', 'error');
      if (mode === 'local1') launchLocal(key, 1, btn);
      else if (mode === 'local2') launchLocal(key, 2, btn);
      else if (mode === 'online') openOnline(key);
    });

    $('arcadeOnlineBack')?.addEventListener('click', () => leaveRoom(true));
    $('arcadeCreateRoom')?.addEventListener('click', createRoom);
    $('arcadeJoinRoom')?.addEventListener('click', joinRoom);
    $('arcadeJoinCode')?.addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom(); });
    $('arcadeLeaveRoom')?.addEventListener('click', () => leaveRoom(false));
    $('arcadeLaunchButton')?.addEventListener('click', requestLaunch);
    $('arcadeCopyRoom')?.addEventListener('click', copyRoom);
    $('arcadePlayBack')?.addEventListener('click', () => {
      stopPlayer();
      if (roomCode) show('arcadeOnlineScreen'); else show('kofScreen');
    });

    window.addEventListener('message', e => {
      if (e.origin !== location.origin) return;
      const d = e.data || {};
      if (d.type === 'arcade-player-error') {
        setPlayStatus(d.message || 'Falha ao iniciar.', 'error');
        toast('Arcade', d.message || 'Falha ao iniciar.', 'error');
      }
      if (d.type === 'arcade-player-ready') {
        setPlayStatus(d.online ? 'Jogo pronto • conectando PVP…' : 'Jogo pronto • COIN + START para jogar', 'ok');
        toast('Arcade pronto', d.message || 'Jogo carregado.');
      }
      if (d.type === 'arcade-netplay-status') {
        if (d.state === 'connected') {
          setPlayStatus('✅ PVP conectado • Player 1 x Player 2', 'ok');
          toast('PVP conectado', 'Player 1 e Player 2 estão conectados pelo WebRTC.');
        } else if (d.state === 'error') {
          setPlayStatus(d.message || 'Falha no Netplay.', 'error');
        }
      }
    });
  }

  window.GameGuessArcadeX1 = { open:openHub, openOnline, launchLocal, games:GAMES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
