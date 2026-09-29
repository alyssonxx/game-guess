(() => {
  'use strict';

  const VERSION = '3.1.0';
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
  let rewardsUnsub = null;
  const tournamentRewardSeen = new Set();

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
    renderPublicTournaments();
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
    $('arcadeTournamentFormat').textContent = `${tournament.maxPlayers} jogadores • MD${tournament.bestOf} • ${tournament.visibility==='private'?'privado':'público'}`;
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
    if(tournament.status==='finished'&&tournament.championUid===user()?.uid&&!tournamentRewardSeen.has(tournament.code)){tournamentRewardSeen.add(tournament.code);FB()?.claimArcadeTournamentReward?.(tournament.code).then(r=>{if(r?.awarded)toast('🏆 Recompensa de torneio',`+300 Arcade Coins • Troféu #${Number(r.claim?.trophies||1)}`,'achievement');renderRewards();}).catch(e=>console.warn('Tournament reward claim:',e));}
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


  async function renderPublicTournaments(){
    const root=$('arcadePublicTournamentList');if(!root)return;root.innerHTML='<div class="home-ranked-empty">Carregando torneios públicos…</div>';
    try{const rows=await FB()?.listArcadePublicTournaments?.()||[];root.innerHTML=rows.length?rows.map(t=>`<article class="arcade-public-tournament"><div><b>${gameIcon(t.game)} ${esc(t.name||'Torneio Arcade')}</b><small>${Number(Object.keys(t.participants||{}).length)}/${Number(t.maxPlayers||4)} jogadores • MD${Number(t.bestOf||3)} • ${t.status==='waiting'?'inscrições':'em andamento'}</small></div><button type="button" data-public-tournament="${esc(t.code)}">${t.status==='waiting'?'ENTRAR':'VER CHAVE'}</button></article>`).join(''):'<div class="home-ranked-empty">Nenhum torneio público aberto agora.</div>';root.querySelectorAll('[data-public-tournament]').forEach(btn=>btn.addEventListener('click',async()=>{const code=btn.dataset.publicTournament;if((await FB()?.getArcadeTournament?.(code))?.status==='waiting'){try{await FB()?.joinArcadeTournament?.(code);}catch(e){if(!String(e?.message||'').includes('já'))console.warn(e);}}openTournamentCode(code);}));}catch(e){root.innerHTML=`<div class="home-ranked-empty">Não consegui carregar torneios: ${esc(e?.message||String(e))}</div>`;}
  }

  async function createTournament() {
    if (!ensureLogin()) return;
    const btn = $('arcadeTournamentCreate');
    const game = $('arcadeTournamentGameSelect')?.value || 'kf2k2mp2';
    const maxPlayers = Number($('arcadeTournamentSize')?.value || 4);
    const bestOf = Number($('arcadeTournamentBestOf')?.value || 3);
    const name = String($('arcadeTournamentName')?.value || '').trim();
    const visibility = String($('arcadeTournamentVisibility')?.value || 'public');
    btn.disabled = true; btn.textContent = 'CRIANDO…';
    try {
      const code = await FB().createArcadeTournament({ game, maxPlayers, bestOf, name, visibility });
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
      const comp = seasonLocal.arcadeCompetitive && Number(seasonLocal.arcadeCompetitive.version)===2 ? seasonLocal.arcadeCompetitive : {rp:0,played:0,wins:0,losses:0,games:{}};
      const fallbackBest = Object.entries(comp.games||{}).sort((a,b)=>Number(b[1]?.rp||0)-Number(a[1]?.rp||0)||Number(b[1]?.wins||0)-Number(a[1]?.wins||0))[0]?.[0] || '';
      const info = FB()?.arcadeRankInfo?.(Number(comp.rp||0),Number(comp.played||0)) || {label:'Recruta',icon:'🎮',placement:Math.min(10,Number(comp.played||0))};
      const own = mine || { arcadeRp:Number(comp.rp||0), arcadeWins:Number(comp.wins||0), arcadeLosses:Number(comp.losses||0), arcadePlayed:Number(comp.played||0), bestArcadeGame:fallbackBest, arcadeDivision:info.label, arcadeDivisionIcon:info.icon };
      const rewards=rewardState(),decor=rewards.equipped||{},title=rewardItem(decor.title); side.dataset.frame=decor.frame||'';side.dataset.banner=decor.banner||'';side.dataset.effect=decor.effect||'';
      side.innerHTML = `
        <div class="ranked-mini-stat"><span>Seu RP</span><b>${Number(own.arcadeRp||0)}</b></div>
        <div class="ranked-mini-stat"><span>Divisão</span><b>${esc(own.arcadeDivisionIcon||'🎮')} ${esc(own.arcadeDivision||'Recruta')}</b></div>
        <div class="ranked-mini-stat"><span>Campanha</span><b>${Number(own.arcadeWins||0)}V / ${Number(own.arcadeLosses||0)}D</b></div>
        <div class="ranked-mini-stat"><span>Classificação</span><b>${Math.min(10,Number(own.arcadePlayed||0))}/10</b></div>
        <div class="ranked-mini-stat"><span>Melhor jogo</span><b>${esc(own.bestArcadeGame?rankGameName(own.bestArcadeGame):'—')}</b></div>
        <div class="ranked-mini-stat"><span>Arcade Coins</span><b>🪙 ${Number(rewards.coins||0)} AC</b></div>
        <div class="ranked-mini-stat"><span>Título</span><b>${title?`${title.icon} ${esc(title.name)}`:'—'}</b></div>`;
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
      <div class="home-ranked-row${r.uid===me?' me':''} arcade-reward-decor" data-frame="${esc(r.arcadeRewardFrame||'')}" data-banner="${esc(r.arcadeRewardBanner||'')}" data-effect="${esc(r.arcadeRewardEffect||'')}">
        <b>${i<3?['🥇','🥈','🥉'][i]:`#${i+1}`}</b>
        <div><b>${esc(r.displayName)}</b><small>${r.arcadeRewardTitle?`${esc(r.arcadeRewardTitleIcon||'🏷️')} ${esc(r.arcadeRewardTitle)} • `:''}${esc(r.arcadeDivisionIcon||'🎮')} ${esc(r.arcadeDivision||'Recruta')} • ${Number(r.arcadePlayed||0)} partidas</small></div>
        <span class="home-ranked-rp">${Number(r.arcadeRp||0)}</span>
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


  // ----- Recompensas Arcade -----
  function rewardState(){ return FB()?.getArcadeRewards?.() || {coins:0,earned:0,spent:0,unlocks:{},equipped:{},seasonBadges:{},trophies:{tournaments:0}}; }
  function rewardItem(id){ return (FB()?.arcadeRewardCatalog?.()||[]).find(x=>x.id===id); }
  function rewardTypeLabel(type){ return ({title:'Título',frame:'Moldura',banner:'Banner',effect:'Efeito',avatar:'Avatar 3D',badge:'Emblema'})[type]||type; }
  function currentCompetitive(){
    const local=CORE()?.getProfile?.()||{},seasonId=String(FB()?.getSeason?.()?.id||'').toUpperCase(),seasonLocal=local.seasonProfile&&String(local.seasonProfile.seasonId||'').toUpperCase()===seasonId?local.seasonProfile:local;
    return seasonLocal.arcadeCompetitive&&Number(seasonLocal.arcadeCompetitive.version)===2?seasonLocal.arcadeCompetitive:{rp:0,played:0,wins:0,losses:0,currentStreak:0,bestStreak:0,games:{}};
  }
  function cosmeticCard(item,state){
    const owned=Boolean(state.unlocks?.[item.id]),equipped=state.equipped?.[item.type]===item.id,shop=item.source==='shop';
    const avatarLike=item.type==='avatar'||item.type==='badge';
    const action=owned?(avatarLike?(item.type==='avatar'?'<button type="button" data-open-avatar-editor>USAR NO AVATAR</button>':'<button type="button" disabled>COLECIONADO</button>'):(equipped?'<button type="button" disabled>EQUIPADO</button>':`<button type="button" data-reward-equip="${esc(item.id)}">EQUIPAR</button>`)):(shop?`<button type="button" data-reward-buy="${esc(item.id)}">🪙 ${Number(item.price||0)} AC</button>`:'<button type="button" disabled>🔒 BLOQUEADO</button>');
    return `<article class="arcade-reward-item${owned?' owned':''}${equipped?' equipped':''}"><div class="reward-item-icon">${esc(item.icon||'🎁')}</div><div><small>${esc(rewardTypeLabel(item.type))}</small><b>${esc(item.name)}</b><span>${shop?'Loja Arcade':owned?'Desbloqueado':'Recompensa competitiva'}</span></div>${action}</article>`;
  }
  function renderRewards(){
    const state=rewardState(),comp=currentCompetitive(),info=FB()?.arcadeRankInfo?.(Number(comp.rp||0),Number(comp.played||0))||{key:'rookie',label:'Recruta',icon:'🎮',next:200},seasonId=String(FB()?.getSeason?.()?.id||'S1').toUpperCase();
    const badge=state.seasonBadges?.[seasonId];
    if($('arcadeRewardCoins'))$('arcadeRewardCoins').textContent=Number(state.coins||0);
    if($('arcadeRewardEarned'))$('arcadeRewardEarned').textContent=Number(state.earned||0);
    if($('arcadeRewardRank'))$('arcadeRewardRank').textContent=`${info.icon||'🎮'} ${info.label||'Recruta'} • ${Number(comp.rp||0)} RP`;
    if($('arcadeRewardSeasonBadge'))$('arcadeRewardSeasonBadge').textContent=badge?`${badge.icon||'🎮'} ${badge.label} • ${seasonId}`:`🎮 Recruta • ${seasonId}`;
    if($('arcadeRewardTrophies'))$('arcadeRewardTrophies').textContent=Number(state.trophies?.tournaments||0);
    const next=(FB()?.arcadeRewardRanks?.()||[]).find(r=>Number(r.min)>Number(comp.rp||0));
    if($('arcadeRewardNext'))$('arcadeRewardNext').textContent=next?`${next.icon} ${next.label}: faltam ${Math.max(0,Number(next.min)-Number(comp.rp||0))} RP • +${next.coins} AC`:'👑 Rank máximo alcançado';
    const ranks=$('arcadeRewardRankRoadmap');if(ranks){ranks.innerHTML=(FB()?.arcadeRewardRanks?.()||[]).map(r=>{const claimed=Boolean(state.rankClaims?.[`${seasonId}_${r.key}`])||r.key==='rookie',reached=Number(comp.rp||0)>=Number(r.min);return `<article class="arcade-rank-reward${reached?' reached':''}${claimed?' claimed':''}"><div>${r.icon}</div><b>${esc(r.label)}</b><small>${Number(r.min)} RP</small><span>${r.coins?`🪙 +${r.coins} AC`:'Entrada'}</span><em>${claimed?'✓ resgatado':reached?'aguardando sincronização':'bloqueado'}</em></article>`;}).join('');}
    const pass=state.seasonPass||{xp:0,level:1,claims:{}},passInfo=FB()?.arcadeBattlePass?.()||{maxLevel:30,rewards:[]};
    if($('arcadeBattlePassLevel'))$('arcadeBattlePassLevel').textContent=`Nível ${Number(pass.level||1)}/${Number(passInfo.maxLevel||30)}`;
    if($('arcadeBattlePassXp'))$('arcadeBattlePassXp').textContent=`${Number(pass.xp||0)} XP`;
    if($('arcadeBattlePassBar'))$('arcadeBattlePassBar').style.width=`${Math.max(0,Math.min(100,Number(pass.xp||0)%100))}%`;
    const passGrid=$('arcadeBattlePassRewards');if(passGrid){passGrid.innerHTML=(passInfo.rewards||[]).map(r=>{const done=Number(pass.level||1)>=Number(r.level),claimed=Boolean(pass.claims?.[r.level]);return `<article class="arcade-rank-reward${done?' reached':''}${claimed?' claimed':''}"><div>🎫</div><b>Nível ${Number(r.level)}</b><small>${Number(r.coins||0)?`🪙 +${Number(r.coins)} AC`:'Cosmético'}</small><span>${(r.unlocks||[]).map(id=>rewardItem(id)?.name||id).join(' • ')||'Recompensa'}</span><em>${claimed?'✓ recebido':done?'sincronizando':'bloqueado'}</em></article>`;}).join('');}
    const gameBadges=$('arcadeRewardGameBadges');if(gameBadges){gameBadges.innerHTML=Object.entries(FIGHT_GAMES).map(([key,g])=>{const gs=comp.games?.[key]||{rp:0,played:0,wins:0,losses:0},gi=FB()?.arcadeRankInfo?.(Number(gs.rp||0),Number(gs.played||0))||{icon:'🎮',label:'Recruta'};return `<article class="arcade-rank-reward reached"><div>${g.icon}</div><b>${esc(g.title)}</b><small>${Number(gs.rp||0)} RP • ${Number(gs.wins||0)}V/${Number(gs.losses||0)}D</small><span>${gi.icon} ${esc(gi.label)}</span><em>${Number(gs.played||0)} partidas</em></article>`;}).join('');}
    const catalog=FB()?.arcadeRewardCatalog?.()||[],inventory=$('arcadeRewardInventory'),shop=$('arcadeRewardShop');
    if(inventory){const owned=catalog.filter(i=>state.unlocks?.[i.id]);inventory.innerHTML=owned.length?owned.map(i=>cosmeticCard(i,state)).join(''):'<div class="home-ranked-empty">Nenhum cosmético desbloqueado.</div>';}
    if(shop){const items=catalog.filter(i=>i.source==='shop');shop.innerHTML=items.map(i=>cosmeticCard(i,state)).join('');}
    const milestones=$('arcadeRewardMilestones');if(milestones){milestones.innerHTML=(FB()?.arcadeRewardMilestones?.()||[]).map(m=>{const claimed=Boolean(state.milestoneClaims?.[`${seasonId}_${m.key}`]);return `<div class="arcade-reward-milestone${claimed?' done':''}"><span>${claimed?'✅':'⬜'}</span><b>${esc(m.label)}</b><small>+${Number(m.coins||0)} AC</small></div>`;}).join('');}
    const eq=$('arcadeRewardEquipped');if(eq){const parts=['title','frame','banner','effect'].map(type=>{const id=state.equipped?.[type],item=rewardItem(id);return `<span><small>${rewardTypeLabel(type)}</small><b>${item?`${item.icon} ${esc(item.name)}`:'—'}</b></span>`;});eq.innerHTML=parts.join('');}
  }
  function stopRewardsWatch(){if(rewardsUnsub){try{rewardsUnsub();}catch{}rewardsUnsub=null;}}
  function subscribeRewards(){stopRewardsWatch();if(!FB()?.ready?.()||!user()){renderRewards();return;}const maybe=FB()?.watchArcadeRewards?.(()=>{renderRewards();subscribeHomeRanking();});if(typeof maybe==='function')rewardsUnsub=maybe;else renderRewards();}
  function openRewards(){if(!ensureLogin('Faça login para abrir suas recompensas Arcade.'))return;show('arcadeRewardsScreen');FB()?.ensureArcadeRewardProfile?.().then(()=>{renderRewards();subscribeRewards();}).catch(e=>toast('Recompensas',e?.message||String(e),'error'));}
  async function buyReward(id){try{const r=await FB()?.buyArcadeRewardItem?.(id);if(r?.bought)toast('🎁 Compra concluída',`${r.item?.name||'Item'} desbloqueado. Saldo: ${Number(r.state?.coins||0)} AC`,'achievement');else if(r?.reason==='owned')toast('Recompensas','Você já possui esse item.');else if(r?.reason==='coins')toast('Arcade Coins',`Faltam ${Number(r.need||0)} AC para comprar este item.`,'error');renderRewards();}catch(e){toast('Recompensas',e?.message||String(e),'error');}}
  async function equipReward(id){try{const r=await FB()?.equipArcadeRewardItem?.(id);if(r?.equipped)toast('Cosmético equipado',r.item?.name||'Pronto!','achievement');renderRewards();subscribeHomeRanking();}catch(e){toast('Recompensas',e?.message||String(e),'error');}}

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

  async function getLocalReplay(id){const db=await openReplayDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(REPLAY_STORE,'readonly'),req=tx.objectStore(REPLAY_STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}
  async function putLocalReplay(row){const db=await openReplayDb();await new Promise((resolve,reject)=>{const tx=db.transaction(REPLAY_STORE,'readwrite');tx.objectStore(REPLAY_STORE).put(row);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});return row;}
  function cloudReplayEnabled(){return localStorage.getItem('gg_arcade_replay_cloud_enabled')==='1';}
  function renderCloudToggle(){const b=$('arcadeReplayCloudToggle');if(!b)return;const ready=Boolean(FB()?.replayCloudReady?.()),on=cloudReplayEnabled();b.disabled=!ready;b.textContent=!ready?'☁ STORAGE NÃO CONFIGURADO':on?'☁ NUVEM AUTOMÁTICA: LIGADA':'☁ NUVEM AUTOMÁTICA: DESLIGADA';b.classList.toggle('off',!on);}
  function toggleReplayCloud(){if(!FB()?.replayCloudReady?.())return toast('Replay na nuvem','Ative o Firebase Storage e publique storage.rules.','error');localStorage.setItem('gg_arcade_replay_cloud_enabled',cloudReplayEnabled()?'0':'1');renderCloudToggle();toast('Replay na nuvem',cloudReplayEnabled()?'Upload automático de replays online ativado.':'Upload automático desativado.');}
  async function replayParticipants(roomCode){try{const room=await FB()?.getFightRoom?.(roomCode);const out={};for(const [uid,p] of Object.entries(room?.players||{}))out[uid]={uid,name:p?.name||p?.displayName||'Jogador'};return {participants:out,winnerUid:room?.winnerUid||''};}catch{return{participants:{},winnerUid:''};}}
  async function uploadLocalReplay(id,{quiet=false}={}){
    if(!ensureLogin('Faça login para enviar o replay à nuvem.'))return null;
    const row=await getLocalReplay(id);if(!row)throw new Error('Replay local não encontrado.');if(row.cloudReplayId)return row.cloudReplayId;
    if(!row.online)throw new Error('Nesta versão, o upload compartilhável é destinado às partidas online.');
    const rel=await replayParticipants(row.room);
    const meta=await FB()?.uploadArcadeReplay?.({id:row.id,seasonId:FB()?.getSeason?.()?.id,game:row.game,title:row.title,room:row.room,createdAt:row.createdAt,durationMs:row.durationMs,size:row.size,mimeType:row.mimeType,audio:row.audio,videoBlob:row.blob,inputTraceBlob:row.inputTraceBlob,inputStateBlob:row.inputStateBlob,inputEvents:row.inputReplay?.eventCount||0,ejsVersion:row.ejsVersion,core:row.core,romSha256:row.romSha256,participants:rel.participants,winnerUid:rel.winnerUid,visibility:'participants'});
    row.cloudReplayId=meta.id;row.cloudUploadedAt=Date.now();await putLocalReplay(row);if(!quiet)toast('☁ Replay enviado','O replay já pode ser visto pelos participantes.','achievement');await renderCloudReplays();return meta.id;
  }
  async function shareCloudReplay(id){const url=`${location.origin}/arcade-replay-player.html?source=cloud&id=${encodeURIComponent(id)}`;try{await navigator.clipboard.writeText(url);toast('Replay compartilhado','Link copiado. O destinatário precisa estar logado se o replay não for público.');}catch{prompt('Copie o link do replay:',url);}}
  function openInputReplay(source,id){window.open(`/arcade-replay-player.html?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`,'_blank','noopener');}
  async function changeCloudVisibility(id,current){try{const next=current==='public'?'participants':'public';await FB()?.setArcadeReplayVisibility?.(id,next);toast('Visibilidade',next==='public'?'Replay público para usuários conectados.':'Replay visível aos participantes.');renderCloudReplays();}catch(e){toast('Replay',e?.message||String(e),'error');}}
  async function deleteCloudReplay(id){if(!confirm('Excluir este replay da nuvem?'))return;try{await FB()?.deleteArcadeCloudReplay?.(id);toast('Replay','Replay removido da nuvem.');renderCloudReplays();}catch(e){toast('Replay',e?.message||String(e),'error');}}
  async function renderCloudReplays(){
    const root=$('arcadeCloudReplayGrid');if(!root)return;if(!FB()?.ready?.()||!user()){root.innerHTML='<div class="home-ranked-empty">Faça login para ver replays compartilhados.</div>';return;}if(!FB()?.replayCloudReady?.()){root.innerHTML='<div class="home-ranked-empty">Firebase Storage ainda não está disponível. Publique storage.rules e ative o Storage.</div>';return;}
    root.innerHTML='<div class="home-ranked-empty">Carregando replays da nuvem…</div>';
    try{const rows=await FB()?.listArcadeCloudReplays?.(40)||[];if(!rows.length){root.innerHTML='<div class="home-ranked-empty">Nenhum replay compartilhado ainda.</div>';return;}const resolved=await Promise.all(rows.map(async r=>{try{return await FB()?.resolveArcadeReplayAssets?.(r)||r;}catch{return r;}}));const me=user()?.uid;
      root.innerHTML=resolved.map(r=>{const video=r.urls?.['video.webm']||'',mine=r.uploaderUid===me,input=Boolean(r.inputReplay&&r.stateReplay);return `<article class="arcade-replay-card"><div class="arcade-replay-cloud-preview">${video?`<video controls preload="metadata" src="${esc(video)}"></video>`:'<div class="home-ranked-empty">Replay competitivo por inputs</div>'}</div><div class="arcade-replay-body"><div class="arcade-replay-title"><b>☁ ${gameIcon(r.game)} ${esc(gameTitle(r.game))}</b><small>${esc(fmtDate(r.createdAt))}</small></div><div class="arcade-replay-meta"><span>${r.audio?'🔊 áudio':'🔇 sem áudio'}</span><span>${input?'🎮 inputs/frame':'🎥 vídeo'}</span><span>${r.visibility==='public'?'🌎 público':'👥 participantes'}</span>${r.room?`<span>SALA ${esc(r.room)}</span>`:''}</div><div class="arcade-replay-actions">${input?`<button data-play-cloud-input="${esc(r.id)}">REPLAY INPUT</button>`:''}<button data-share-cloud="${esc(r.id)}">COMPARTILHAR</button>${mine?`<button data-visibility-cloud="${esc(r.id)}" data-current="${esc(r.visibility)}">${r.visibility==='public'?'TORNAR PARTICIPANTES':'TORNAR PÚBLICO'}</button><button class="danger" data-delete-cloud="${esc(r.id)}">EXCLUIR NUVEM</button>`:''}</div></div></article>`;}).join('');
      root.querySelectorAll('[data-play-cloud-input]').forEach(b=>b.addEventListener('click',()=>openInputReplay('cloud',b.dataset.playCloudInput)));root.querySelectorAll('[data-share-cloud]').forEach(b=>b.addEventListener('click',()=>shareCloudReplay(b.dataset.shareCloud)));root.querySelectorAll('[data-visibility-cloud]').forEach(b=>b.addEventListener('click',()=>changeCloudVisibility(b.dataset.visibilityCloud,b.dataset.current)));root.querySelectorAll('[data-delete-cloud]').forEach(b=>b.addEventListener('click',()=>deleteCloudReplay(b.dataset.deleteCloud)));
    }catch(e){root.innerHTML=`<div class="home-ranked-empty">Falha ao abrir nuvem: ${esc(e?.message||String(e))}</div>`;}
  }

  function revokeReplayUrls(){for(const u of replayUrls)try{URL.revokeObjectURL(u)}catch{};replayUrls=[];}
  async function renderReplays() {
    const root=$('arcadeReplayGrid'); if(!root)return;
    revokeReplayUrls(); root.innerHTML='<div class="home-ranked-empty">Carregando replays locais…</div>';
    try {
      const rows=await listReplays();
      if(!rows.length){root.innerHTML='<div class="home-ranked-empty">Nenhum replay salvo neste navegador ainda.</div>';return;}
      root.innerHTML=rows.map(r=>{
        const url=r.blob?URL.createObjectURL(r.blob):'';if(url)replayUrls.push(url);const input=Boolean(r.inputTraceBlob&&r.inputStateBlob);const cloud=String(r.cloudReplayId||'');
        return `<article class="arcade-replay-card" data-replay-id="${esc(r.id)}">${url?`<video controls preload="metadata" src="${esc(url)}"></video>`:'<div class="home-ranked-empty">Sem vídeo local • replay de inputs disponível</div>'}<div class="arcade-replay-body"><div class="arcade-replay-title"><b>${gameIcon(r.game)} ${esc(gameTitle(r.game))}</b><small>${esc(fmtDate(r.createdAt))}</small></div><div class="arcade-replay-meta"><span>${r.online?'🌐 ONLINE':'🕹 LOCAL'}</span><span>${Math.round(Number(r.durationMs||0)/1000)}s</span>${r.size?`<span>${fmtBytes(r.size)}</span>`:''}<span>${r.audio?'🔊 ÁUDIO':'🔇 SEM ÁUDIO'}</span>${input?`<span>🎮 ${Number(r.inputReplay?.eventCount||0)} INPUTS</span>`:''}${r.room&&r.room!=='LOCAL'?`<span>SALA ${esc(r.room)}</span>`:''}${cloud?'<span>☁ NUVEM</span>':''}</div><div class="arcade-replay-actions">${url?`<a href="${esc(url)}" download="game-guess-${esc(r.game)}-${Number(r.createdAt||Date.now())}.webm">SALVAR VÍDEO</a>`:''}${input?`<button data-play-local-input="${esc(r.id)}">REPLAY INPUT</button>`:''}${r.online&&!cloud?`<button data-upload-replay="${esc(r.id)}">☁ ENVIAR NUVEM</button>`:''}${cloud?`<button data-share-cloud="${esc(cloud)}">COMPARTILHAR</button>`:''}<button class="danger" data-delete-replay="${esc(r.id)}">EXCLUIR</button></div></div></article>`;
      }).join('');
      root.querySelectorAll('[data-delete-replay]').forEach(btn=>btn.addEventListener('click',async()=>{await deleteReplay(btn.dataset.deleteReplay);renderReplays();}));
      root.querySelectorAll('[data-upload-replay]').forEach(btn=>btn.addEventListener('click',async()=>{btn.disabled=true;try{await uploadLocalReplay(btn.dataset.uploadReplay);}catch(e){toast('Replay',e?.message||String(e),'error');}finally{renderReplays();}}));
      root.querySelectorAll('[data-play-local-input]').forEach(btn=>btn.addEventListener('click',()=>openInputReplay('local',btn.dataset.playLocalInput)));
      root.querySelectorAll('[data-share-cloud]').forEach(btn=>btn.addEventListener('click',()=>shareCloudReplay(btn.dataset.shareCloud)));
    } catch(e){root.innerHTML=`<div class="home-ranked-empty">Não consegui abrir os replays: ${esc(e?.message||String(e))}</div>`;}
  }
  function openReplays(){show('arcadeReplaysScreen');renderReplayToggle();renderCloudToggle();renderReplays();renderCloudReplays();}


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

    $('arcadeRewardsButton')?.addEventListener('click', openRewards);
    $('homeArcadeRewardsButton')?.addEventListener('click', openRewards);
    $('arcadeRewardsBack')?.addEventListener('click', ()=>{stopRewardsWatch();show('kofScreen');});
    $('arcadeRewardInventory')?.addEventListener('click',e=>{const avatar=e.target.closest('[data-open-avatar-editor]'),equip=e.target.closest('[data-reward-equip]');if(avatar)window.GameGuessCompetitiveUI?.openAvatar?.();else if(equip)equipReward(equip.dataset.rewardEquip);});
    $('arcadeRewardShop')?.addEventListener('click',e=>{const avatar=e.target.closest('[data-open-avatar-editor]'),buy=e.target.closest('[data-reward-buy]'),equip=e.target.closest('[data-reward-equip]');if(avatar)window.GameGuessCompetitiveUI?.openAvatar?.();else if(buy)buyReward(buy.dataset.rewardBuy);else if(equip)equipReward(equip.dataset.rewardEquip);});

    $('arcadeReplaysButton')?.addEventListener('click', openReplays);
    $('homeArcadeReplaysButton')?.addEventListener('click', openReplays);
    $('arcadeReplaysBack')?.addEventListener('click', ()=>show('kofScreen'));
    $('arcadeReplayRefresh')?.addEventListener('click', renderReplays);
    $('arcadeReplayToggle')?.addEventListener('click', toggleReplay);
    $('arcadeReplayCloudToggle')?.addEventListener('click', toggleReplayCloud);
    $('arcadeCloudReplayRefresh')?.addEventListener('click', renderCloudReplays);
    renderReplayToggle(); renderCloudToggle();

    const openRanked=()=>{if(!ensureLogin('Faça login para ver o Arcade Ranked.'))return;FB()?.loadRanking?.('arcadeRp');};
    $('arcadeRankingButton')?.addEventListener('click', openRanked);
    $('homeArcadeRankingButton')?.addEventListener('click', openRanked);

    window.addEventListener('gameguess:authchange', ()=>{subscribeHomeRanking();subscribeRewards();});
    window.addEventListener('gameguess:arcade-replay-saved', async e => { const id=e?.detail?.replayId;if(id&&cloudReplayEnabled()&&e?.detail?.role==='host'){try{await uploadLocalReplay(id,{quiet:true});}catch(err){console.warn('Auto upload replay:',err);}} if ($('arcadeReplaysScreen')?.classList.contains('active')) { renderReplays(); renderCloudReplays(); } });
    subscribeHomeRanking();
  }

  window.GameGuessArcadeCompetitive = {
    version:VERSION, openTournament, openTournamentCode, openReplays, openRewards, listReplays, getLocalReplay, renderReplays, renderCloudReplays, uploadLocalReplay, renderRewards, subscribeHomeRanking,
    onTournamentFinishedRoom(code){ if(tournamentCode && code===tournamentCode) renderTournament(); }
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
