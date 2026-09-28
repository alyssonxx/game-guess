(() => {
  'use strict';

  const VERSION = '2.5.0';
  const $ = id => document.getElementById(id);
  const CORE = () => window.GameGuessCore;
  const FB = () => window.GameGuessFirebase;
  const ARCADE = () => window.GameGuessArcadeX1;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const FIGHT_GAMES = {
    kf2k2mp2: { title:'KOF 2002 Magic Plus II', icon:'🥊' },
    samsh5spho: { title:'Samurai Shodown V Special', icon:'⚔️' },
    mvsc: { title:'Marvel vs. Capcom', icon:'🦸' },
    xmvsfur1: { title:'X-Men vs. Street Fighter', icon:'✖️' }
  };
  const ALL_GAMES = {
    ...FIGHT_GAMES,
    neobombe: { title:'Neo Bomberman', icon:'💣' }
  };

  let tournamentCode = '';
  let tournament = null;
  let tournamentUnsub = null;
  let rankingUnsub = null;
  let replayUrls = [];

  function user() { return FB()?.getUser?.() || null; }
  function show(id) { CORE()?.showScreen?.(id); }
  function toast(title, message, type='') { CORE()?.toast?.(title, message, type); }
  function gameTitle(key) { return ALL_GAMES[key]?.title || key || 'Arcade'; }
  function gameIcon(key) { return ALL_GAMES[key]?.icon || '🎮'; }
  function fmtDate(ms) { try { return new Date(Number(ms || Date.now())).toLocaleString('pt-BR'); } catch { return ''; } }
  function fmtBytes(n) { n = Number(n || 0); if (n < 1024*1024) return `${Math.max(1,Math.round(n/1024))} KB`; return `${(n/1024/1024).toFixed(1)} MB`; }

  function ensureLogin(message='Faça login para usar o competitivo do Arcade.') {
    if (FB()?.ready?.() && user()) return true;
    toast('Arcade competitivo', message, 'error');
    FB()?.openAuth?.('login');
    return false;
  }

  function setTournamentStatus(message, kind='info') {
    const el = $('arcadeTournamentStatus');
    if (!el) return;
    el.textContent = message;
    el.dataset.kind = kind;
  }

  function stopTournamentWatch() {
    if (tournamentUnsub) { try { tournamentUnsub(); } catch {} tournamentUnsub = null; }
  }

  function openTournament() {
    if (!ensureLogin()) return;
    show('arcadeTournamentScreen');
    if (!tournament) setTournamentStatus('Crie um torneio ou entre com um código.', 'info');
  }

  function openTournamentCode(code) {
    if (!ensureLogin()) return;
    const normalized = String(code || '').trim().toUpperCase();
    show('arcadeTournamentScreen');
    if (!/^[A-Z2-9]{6}$/.test(normalized)) { setTournamentStatus('Código de torneio inválido.', 'error'); return; }
    watchTournament(normalized);
  }

  function leaveTournamentView(goArcade=true) {
    stopTournamentWatch();
    tournamentCode = '';
    tournament = null;
    $('arcadeTournamentLive')?.classList.add('hidden');
    if (goArcade) show('kofScreen');
  }

  function participants(t=tournament) {
    return Object.values(t?.participants || {}).sort((a,b) => Number(a.seed || 999)-Number(b.seed || 999) || Number(a.joinedAt || 0)-Number(b.joinedAt || 0));
  }

  function playerName(uid, t=tournament) {
    return t?.participants?.[uid]?.name || (uid ? `Player ${String(uid).slice(0,5)}` : 'A definir');
  }

  function renderParticipants() {
    const el = $('arcadeTournamentPlayers');
    if (!el || !tournament) return;
    const me = user()?.uid;
    const rows = participants();
    el.innerHTML = rows.map((p,i) => `
      <div class="arcade-tournament-player${p.uid===me?' me':''}">
        <span>${p.uid===tournament.hostUid?'👑':'🥊'}</span>
        <b>${esc(p.name)}</b>
        <small>#${Number(p.seed || i+1)}</small>
      </div>`).join('') + Array.from({length:Math.max(0,Number(tournament.maxPlayers||0)-rows.length)},(_,i)=>`
      <div class="arcade-tournament-player"><span>…</span><b>Aguardando jogador</b><small>${rows.length+i+1}/${tournament.maxPlayers}</small></div>`).join('');
  }

  function roundLabel(round, totalRounds) {
    if (round === totalRounds) return 'FINAL';
    if (round === totalRounds - 1) return 'SEMIFINAL';
    if (round === totalRounds - 2) return 'QUARTAS';
    return `RODADA ${round}`;
  }

  function myMatchAction(match) {
    const uid = user()?.uid;
    if (!uid || !match || match.winnerUid || (match.player1Uid !== uid && match.player2Uid !== uid)) return '';
    if (!match.player1Uid || !match.player2Uid) return '<small>Aguardando o outro classificado.</small>';
    if (match.fightRoomCode) return `<button class="primary-btn arcade-match-action" data-open-tournament-match="${esc(match.id)}">🎮 ENTRAR NO CONFRONTO</button>`;
    if (match.player1Uid === uid) return `<button class="primary-btn arcade-match-action" data-open-tournament-match="${esc(match.id)}">⚡ CRIAR CONFRONTO</button>`;
    return '<small>⏳ Aguardando o Player 1 criar a sala desta série.</small>';
  }

  function renderBracket() {
    const root = $('arcadeTournamentBracket');
    if (!root || !tournament) return;
    const matches = Object.values(tournament.matches || {}).sort((a,b)=>Number(a.round)-Number(b.round)||Number(a.index)-Number(b.index));
    if (!matches.length) {
      root.innerHTML = '<div class="home-ranked-empty">A chave será criada quando o host iniciar o torneio.</div>';
      return;
    }
    const totalRounds = Math.max(...matches.map(m=>Number(m.round||1)));
    const uid = user()?.uid;
    let html = '';
    for (let round=1; round<=totalRounds; round++) {
      const rm = matches.filter(m=>Number(m.round)===round);
      html += `<div class="arcade-bracket-round"><h4>${roundLabel(round,totalRounds)}</h4>`;
      for (const m of rm) {
        const mine = uid && (m.player1Uid===uid || m.player2Uid===uid);
        const done = Boolean(m.winnerUid);
        const p1 = playerName(m.player1Uid), p2 = playerName(m.player2Uid);
        html += `<article class="arcade-bracket-match${mine?' mine':''}${done?' done':''}">
          <div class="arcade-bracket-player${done&&m.winnerUid===m.player1Uid?' winner':''}"><span>${esc(p1)}</span><b>${Number(m.score1||0)}</b></div>
          <div class="arcade-bracket-vs">MD${tournament.bestOf} • ${done?'ENCERRADO':'VS'}</div>
          <div class="arcade-bracket-player${done&&m.winnerUid===m.player2Uid?' winner':''}"><span>${esc(p2)}</span><b>${Number(m.score2||0)}</b></div>
          ${done?`<small>🏆 ${esc(playerName(m.winnerUid))} classificado</small>`:myMatchAction(m)}
        </article>`;
      }
      html += '</div>';
    }
    root.innerHTML = html;
    root.querySelectorAll('[data-open-tournament-match]').forEach(btn => btn.addEventListener('click', () => openTournamentMatch(btn.dataset.openTournamentMatch)));
  }

  function renderTournament() {
    const live = $('arcadeTournamentLive');
    if (!live || !tournament) return;
    live.classList.remove('hidden');
    $('arcadeTournamentCode').textContent = tournament.code || tournamentCode;
    $('arcadeTournamentGame').textContent = `${gameIcon(tournament.game)} ${gameTitle(tournament.game)}`;
    $('arcadeTournamentFormat').textContent = `${tournament.maxPlayers} jogadores • MD${tournament.bestOf} • eliminação simples`;
    $('arcadeTournamentState').textContent = tournament.status === 'waiting' ? 'INSCRIÇÕES' : tournament.status === 'playing' ? 'EM ANDAMENTO' : 'FINALIZADO';
    renderParticipants();
    renderBracket();

    const start = $('arcadeTournamentStart');
    if (start) {
      const count = participants().length;
      const isHost = user()?.uid === tournament.hostUid;
      start.classList.toggle('hidden', tournament.status !== 'waiting' || !isHost);
      start.disabled = count !== Number(tournament.maxPlayers || 0);
      start.textContent = count === Number(tournament.maxPlayers||0) ? '🏁 INICIAR TORNEIO' : `AGUARDANDO ${count}/${tournament.maxPlayers}`;
    }
    const champion = $('arcadeTournamentChampion');
    if (champion) {
      champion.classList.toggle('hidden', !tournament.championUid);
      if (tournament.championUid) champion.innerHTML = `🏆 CAMPEÃO<strong>${esc(playerName(tournament.championUid))}</strong>`;
    }
    const count = participants().length;
    setTournamentStatus(
      tournament.status === 'waiting' ? `Inscrições abertas: ${count}/${tournament.maxPlayers} jogadores.` :
      tournament.status === 'playing' ? 'Torneio em andamento. Abra seu confronto quando ele estiver disponível.' :
      `Torneio encerrado. Campeão: ${playerName(tournament.championUid)}.`,
      tournament.status === 'finished' ? 'ok' : 'info'
    );
  }

  function watchTournament(code) {
    stopTournamentWatch();
    tournamentCode = String(code || '').toUpperCase();
    tournamentUnsub = FB()?.watchArcadeTournament?.(tournamentCode, (value, error) => {
      if (error) { setTournamentStatus(error.message || 'Falha ao sincronizar torneio.', 'error'); return; }
      if (!value) { setTournamentStatus('Este torneio não existe mais.', 'error'); return; }
      tournament = value;
      renderTournament();
    });
  }

  async function createTournament() {
    if (!ensureLogin()) return;
    const btn = $('arcadeTournamentCreate');
    const game = $('arcadeTournamentGameSelect')?.value || 'kf2k2mp2';
    const maxPlayers = Number($('arcadeTournamentSize')?.value || 4);
    const bestOf = Number($('arcadeTournamentBestOf')?.value || 3);
    const name = String($('arcadeTournamentName')?.value || '').trim();
    btn.disabled = true; btn.textContent = 'CRIANDO…';
    try {
      const code = await FB().createArcadeTournament({ game, maxPlayers, bestOf, name });
      watchTournament(code);
      toast('Torneio criado', `Código ${code}`);
    } catch (e) { setTournamentStatus(e?.message || String(e), 'error'); }
    finally { btn.disabled = false; btn.textContent = '🏆 CRIAR TORNEIO'; }
  }

  async function joinTournament() {
    if (!ensureLogin()) return;
    const code = String($('arcadeTournamentJoinCode')?.value || '').trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) return setTournamentStatus('Digite um código de torneio válido com 6 caracteres.', 'error');
    const btn = $('arcadeTournamentJoin'); btn.disabled = true; btn.textContent = 'ENTRANDO…';
    try {
      await FB().joinArcadeTournament(code);
      watchTournament(code);
      toast('Torneio', `Você entrou em ${code}.`);
    } catch (e) { setTournamentStatus(e?.message || String(e), 'error'); }
    finally { btn.disabled = false; btn.textContent = 'ENTRAR'; }
  }

  async function startTournament() {
    if (!tournamentCode) return;
    try { await FB().startArcadeTournament(tournamentCode); }
    catch (e) { setTournamentStatus(e?.message || String(e), 'error'); }
  }

  async function openTournamentMatch(matchId) {
    if (!tournament || !tournamentCode || !ensureLogin()) return;
    let match = tournament.matches?.[matchId];
    const uid = user()?.uid;
    if (!match || (match.player1Uid !== uid && match.player2Uid !== uid)) return setTournamentStatus('Este confronto não pertence a você.', 'error');
    if (!match.player1Uid || !match.player2Uid) return setTournamentStatus('Aguarde o outro classificado.', 'error');
    let fightCode = String(match.fightRoomCode || '');
    try {
      if (!fightCode) {
        if (match.player1Uid !== uid) return setTournamentStatus('Aguarde o Player 1 criar a sala desta série.', 'info');
        setTournamentStatus('Criando sala WebRTC do confronto…', 'info');
        fightCode = await FB().createFightRoom({ arcadeGame:tournament.game, ranked:true, tournamentCode, tournamentMatchId:matchId });
        await FB().linkArcadeTournamentFightRoom(tournamentCode, matchId, fightCode);
      }
      await ARCADE()?.openRoomCode?.(tournament.game, fightCode);
    } catch (e) { setTournamentStatus(e?.message || String(e), 'error'); }
  }

  async function copyTournamentCode() {
    if (!tournamentCode) return;
    try { await navigator.clipboard.writeText(tournamentCode); toast('Código copiado', tournamentCode); }
    catch { toast('Código do torneio', tournamentCode); }
  }

  function rankGameName(key) { return gameTitle(key || ''); }
  function renderHomeRanking(rows=[]) {
    const root = $('homeArcadeRankedList');
    if (!root) return;
    const me = user()?.uid;
    const side = $('homeArcadeMyStats');
    const renderOwn = mine => {
      if (!side) return;
      if (!user()) { side.innerHTML = '<p>Entre na sua conta para carregar suas estatísticas Arcade.</p>'; return; }
      const local = CORE()?.getProfile?.() || {};
      const seasonId = String(FB()?.getSeason?.()?.id || '').toUpperCase();
      const seasonLocal = local.seasonProfile && String(local.seasonProfile.seasonId || '').toUpperCase() === seasonId ? local.seasonProfile : local;
      const localGames = seasonLocal.arcadeGames && typeof seasonLocal.arcadeGames === 'object' ? seasonLocal.arcadeGames : {};
      const fallbackBest = Object.entries(localGames).sort((a,b)=>Number(b[1]?.rating||0)-Number(a[1]?.rating||0)||Number(b[1]?.wins||0)-Number(a[1]?.wins||0))[0]?.[0] || (Number(seasonLocal.kofPlayed||0)>0?'kf2k2mp2':'');
      const own = mine || { arcadeRating:Number(seasonLocal.arcadeRating||1000), arcadeWins:Number(seasonLocal.arcadeWins||seasonLocal.kofWins||0), arcadeLosses:Number(seasonLocal.arcadeLosses||seasonLocal.kofLosses||0), bestArcadeGame:fallbackBest };
      side.innerHTML = `
        <div class="ranked-mini-stat"><span>Seu RP</span><b>${Number(own.arcadeRating||1000)}</b></div>
        <div class="ranked-mini-stat"><span>Vitórias</span><b>${Number(own.arcadeWins||0)}</b></div>
        <div class="ranked-mini-stat"><span>Derrotas</span><b>${Number(own.arcadeLosses||0)}</b></div>
        <div class="ranked-mini-stat"><span>Melhor jogo</span><b>${esc(own.bestArcadeGame?rankGameName(own.bestArcadeGame):'—')}</b></div>`;
    };

    if (!user()) {
      root.innerHTML = '<div class="home-ranked-empty">Entre na sua conta para carregar o Arcade Ranked.</div>';
      renderOwn(null);
      return;
    }
    const mine = rows.find(r=>r.uid===me);
    renderOwn(mine);
    if (!rows.length) {
      root.innerHTML = '<div class="home-ranked-empty">Ainda não há partidas Arcade ranqueadas nesta temporada.</div>';
      return;
    }
    root.innerHTML = `<div class="home-ranked-row head"><span>POS</span><span>JOGADOR</span><span>RP</span><span>V / D</span><span>MELHOR JOGO</span></div>` + rows.slice(0,10).map((r,i)=>`
      <div class="home-ranked-row${r.uid===me?' me':''}">
        <b>${i<3?['🥇','🥈','🥉'][i]:`#${i+1}`}</b>
        <div><b>${esc(r.displayName)}</b><small>${Number(r.arcadePlayed||0)} partidas</small></div>
        <span class="home-ranked-rp">${Number(r.arcadeRating||1000)}</span>
        <span class="home-ranked-vd">${Number(r.arcadeWins||0)}V / ${Number(r.arcadeLosses||0)}D</span>
        <span class="home-ranked-best">${gameIcon(r.bestArcadeGame)} ${esc(rankGameName(r.bestArcadeGame))}</span>
      </div>`).join('');
  }

  function subscribeHomeRanking() {
    if (rankingUnsub) { try { rankingUnsub(); } catch {} rankingUnsub = null; }
    if (!FB()?.ready?.() || !user()) { renderHomeRanking([]); return; }
    const maybe = FB()?.listenToArcadeRanking?.(10, rows => renderHomeRanking(rows));
    if (typeof maybe === 'function') rankingUnsub = maybe;
  }

  // ----- Replay em vídeo local (IndexedDB) -----
  const REPLAY_DB = 'GameGuessArcadeReplays';
  const REPLAY_STORE = 'replays';
  function openReplayDb() {
    return new Promise((resolve,reject)=>{
      const req = indexedDB.open(REPLAY_DB,1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(REPLAY_STORE)) {
          const store = db.createObjectStore(REPLAY_STORE,{keyPath:'id'});
          store.createIndex('createdAt','createdAt');
          store.createIndex('game','game');
        }
      };
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
  }
  async function listReplays() {
    const db = await openReplayDb();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(REPLAY_STORE,'readonly'),req=tx.objectStore(REPLAY_STORE).getAll();
      req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0))); req.onerror=()=>reject(req.error);
    });
  }
  async function deleteReplay(id) {
    const db=await openReplayDb();
    await new Promise((resolve,reject)=>{const tx=db.transaction(REPLAY_STORE,'readwrite');tx.objectStore(REPLAY_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
  }
  function revokeReplayUrls(){for(const u of replayUrls)try{URL.revokeObjectURL(u)}catch{};replayUrls=[];}
  async function renderReplays() {
    const root=$('arcadeReplayGrid'); if(!root)return;
    revokeReplayUrls(); root.innerHTML='<div class="home-ranked-empty">Carregando replays…</div>';
    try {
      const rows=await listReplays();
      if(!rows.length){root.innerHTML='<div class="home-ranked-empty">Nenhum replay salvo neste navegador ainda.</div>';return;}
      root.innerHTML=rows.map(r=>{
        const url=URL.createObjectURL(r.blob); replayUrls.push(url);
        return `<article class="arcade-replay-card" data-replay-id="${esc(r.id)}"><video controls preload="metadata" src="${esc(url)}"></video><div class="arcade-replay-body"><div class="arcade-replay-title"><b>${gameIcon(r.game)} ${esc(gameTitle(r.game))}</b><small>${esc(fmtDate(r.createdAt))}</small></div><div class="arcade-replay-meta"><span>${r.online?'🌐 ONLINE':'🕹 LOCAL'}</span><span>${Math.round(Number(r.durationMs||0)/1000)}s</span><span>${fmtBytes(r.size)}</span>${r.room&&r.room!=='LOCAL'?`<span>SALA ${esc(r.room)}</span>`:''}</div><div class="arcade-replay-actions"><a href="${esc(url)}" download="game-guess-${esc(r.game)}-${Number(r.createdAt||Date.now())}.webm">SALVAR VÍDEO</a><button class="danger" data-delete-replay="${esc(r.id)}">EXCLUIR</button></div></div></article>`;
      }).join('');
      root.querySelectorAll('[data-delete-replay]').forEach(btn=>btn.addEventListener('click',async()=>{await deleteReplay(btn.dataset.deleteReplay);renderReplays();}));
    } catch(e){root.innerHTML=`<div class="home-ranked-empty">Não consegui abrir os replays: ${esc(e?.message||String(e))}</div>`;}
  }
  function openReplays(){show('arcadeReplaysScreen');renderReplays();}

  function replayEnabled(){ return localStorage.getItem('gg_arcade_replay_enabled') !== '0'; }
  function renderReplayToggle(){
    const btn=$('arcadeReplayToggle'); if(!btn)return;
    const on=replayEnabled(); btn.classList.toggle('off',!on); btn.textContent=on?'● REPLAY AUTOMÁTICO: LIGADO':'○ REPLAY AUTOMÁTICO: DESLIGADO';
  }
  function toggleReplay(){ localStorage.setItem('gg_arcade_replay_enabled', replayEnabled()?'0':'1'); renderReplayToggle(); toast('Replay Arcade',replayEnabled()?'Gravação automática ativada.':'Gravação automática desativada.'); }

  function bind() {
    $('arcadeTournamentButton')?.addEventListener('click', openTournament);
    $('homeArcadeTournamentButton')?.addEventListener('click', openTournament);
    $('arcadeTournamentBack')?.addEventListener('click', ()=>leaveTournamentView(true));
    $('arcadeTournamentCreate')?.addEventListener('click', createTournament);
    $('arcadeTournamentJoin')?.addEventListener('click', joinTournament);
    $('arcadeTournamentJoinCode')?.addEventListener('keydown', e=>{if(e.key==='Enter')joinTournament();});
    $('arcadeTournamentStart')?.addEventListener('click', startTournament);
    $('arcadeTournamentCopy')?.addEventListener('click', copyTournamentCode);
    $('arcadeTournamentLeaveView')?.addEventListener('click', ()=>leaveTournamentView(true));

    $('arcadeReplaysButton')?.addEventListener('click', openReplays);
    $('homeArcadeReplaysButton')?.addEventListener('click', openReplays);
    $('arcadeReplaysBack')?.addEventListener('click', ()=>show('kofScreen'));
    $('arcadeReplayRefresh')?.addEventListener('click', renderReplays);
    $('arcadeReplayToggle')?.addEventListener('click', toggleReplay);
    renderReplayToggle();

    const openRanked=()=>{if(!ensureLogin('Faça login para ver o Arcade Ranked.'))return;FB()?.loadRanking?.('arcadeRating');};
    $('arcadeRankingButton')?.addEventListener('click', openRanked);
    $('homeArcadeRankingButton')?.addEventListener('click', openRanked);

    window.addEventListener('gameguess:authchange', subscribeHomeRanking);
    window.addEventListener('gameguess:arcade-replay-saved', () => { if ($('arcadeReplaysScreen')?.classList.contains('active')) renderReplays(); });
    subscribeHomeRanking();
  }

  window.GameGuessArcadeCompetitive = {
    version:VERSION, openTournament, openTournamentCode, openReplays, renderReplays, subscribeHomeRanking,
    onTournamentFinishedRoom(code){ if(tournamentCode && code===tournamentCode) renderTournament(); }
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
