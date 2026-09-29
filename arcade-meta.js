(() => {
  'use strict';
  const VERSION='3.1.0';
  const $=id=>document.getElementById(id);
  const CORE=()=>window.GameGuessCore;
  const FB=()=>window.GameGuessFirebase;
  const ARCADE=()=>window.GameGuessArcadeX1;
  const AVATAR=()=>window.GameGuessAvatar3D;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const GAMES={kf2k2mp2:{title:'KOF 2002 Magic Plus II',icon:'🥊'},samsh5spho:{title:'Samurai Shodown V Special',icon:'⚔️'},mvsc:{title:'Marvel vs. Capcom',icon:'🦸'},xmvsfur1:{title:'X-Men vs. Street Fighter',icon:'✖️'}};
  let rankingUnsub=null,profileUid='',homeAvatarInstance=null;
  const toast=(a,b,t='')=>CORE()?.toast?.(a,b,t);
  const show=id=>CORE()?.showScreen?.(id);
  const user=()=>FB()?.getUser?.()||null;
  const gameName=k=>GAMES[k]?.title||k||'Arcade';
  const gameIcon=k=>GAMES[k]?.icon||'🎮';
  const rankInfo=(rp,played)=>FB()?.arcadeRankInfo?.(Number(rp||0),Number(played||0))||{icon:'🎮',label:'Recruta'};
  const pct=(w,p)=>p?Math.round(Number(w||0)/Number(p||1)*100):0;
  const fmtDate=ms=>{try{return new Date(Number(ms||Date.now())).toLocaleString('pt-BR')}catch{return''}};
  const seasonText=season=>{const end=Number(season?.endsAt||0);if(!end)return season?.label||season?.id||'Temporada atual';const left=end-Date.now();if(left<=0)return `${season?.label||season?.id||'Temporada'} • encerramento pendente`;const days=Math.ceil(left/86400000);return `${season?.label||season?.id||'Temporada'} • ${days} dia${days===1?'':'s'} restante${days===1?'':'s'}`;};
  function setTopCompetitive(rp=0,coins=0,visible=true){const rpEl=$('arcadeRpTop'),acEl=$('arcadeCoinsTop');if(rpEl){rpEl.querySelector('b').textContent=Number(rp||0);rpEl.style.display=visible?'':'none';}if(acEl){acEl.querySelector('b').textContent=Number(coins||0);acEl.style.display=visible?'':'none';}}

  async function openAvatar(){return AVATAR()?.openEditor?.();}

  async function renderHomeIdentity(){
    const root=$('homeArcadeIdentityCard');if(!root)return;
    if(!user()){setTopCompetitive(0,0,false);root.innerHTML='<div class="meta-empty">Entre para criar seu Avatar 3D e acompanhar a temporada.</div>';return;}
    try{
      const data=await FB()?.getArcadeIdentity?.(user().uid),row=data?.row||{},avatar=data?.avatar||{},rw=data?.rewards||FB()?.getArcadeRewards?.()||{},info=rankInfo(row.arcadeRp,row.arcadePlayed),pass=rw.seasonPass||{level:1,xp:0};
      setTopCompetitive(row.arcadeRp,rw.coins,true);
      root.innerHTML=`<div class="home-avatar-canvas" id="homeArcadeAvatarPreview"></div><div class="home-avatar-copy"><small>IDENTIDADE COMPETITIVA • ${esc(seasonText(data?.season||{}))}</small><b>${esc(row.displayName||data?.publicProfile?.name||'Jogador')}</b><span>${info.icon} ${esc(info.label)} • ${Number(row.arcadeRp||0)} RP</span><span>🎫 Passe nível ${Number(pass.level||1)}/30 • ${Number(pass.xp||0)} XP • 🪙 ${Number(rw.coins||0)} AC</span><div><button type="button" data-home-meta="profile">PERFIL</button><button type="button" data-home-meta="avatar">AVATAR 3D</button><button type="button" data-home-meta="ranks">RANKINGS</button></div></div>`;
      homeAvatarInstance?.destroy?.();try{homeAvatarInstance=await AVATAR()?.renderPreview?.($('homeArcadeAvatarPreview'),avatar,{autoRotate:true});}catch(e){console.warn('Home avatar 3D:',e);$('homeArcadeAvatarPreview').innerHTML='<div class="meta-avatar-fallback">🧍</div>';}
    }catch(e){root.innerHTML=`<div class="meta-empty">Não foi possível carregar seu perfil competitivo: ${esc(e?.message||String(e))}</div>`;}
  }

  function profileTab(name){document.querySelectorAll('[data-comp-tab]').forEach(b=>b.classList.toggle('active',b.dataset.compTab===name));document.querySelectorAll('[data-comp-panel]').forEach(p=>p.classList.toggle('active',p.dataset.compPanel===name));}
  async function openProfile(uid=user()?.uid){
    if(!uid||!user()){toast('Perfil competitivo','Faça login para abrir o perfil.','error');FB()?.openAuth?.('login');return;}
    profileUid=uid;show('arcadeCompetitiveProfileScreen');profileTab('overview');
    const status=$('competitiveProfileStatus');if(status)status.textContent='Carregando perfil competitivo…';
    try{const data=await FB()?.getArcadeCompetitiveProfile?.(uid);renderProfile(data);}
    catch(e){if(status)status.textContent=e?.message||String(e);}
  }
  async function renderProfile(data){
    if(!data)return;const row=data.row||{},rw=data.rewards||{},info=rankInfo(row.arcadeRp,row.arcadePlayed),self=data.uid===user()?.uid,name=row.displayName||data.publicProfile?.name||'Jogador';
    $('competitiveProfileName').textContent=name;$('competitiveProfileRank').textContent=`${info.icon} ${info.label} • ${Number(row.arcadeRp||0)} RP`;$('competitiveProfileStatus').textContent=`${Number(row.arcadeWins||0)}V • ${Number(row.arcadeLosses||0)}D • ${pct(row.arcadeWins,row.arcadePlayed)}% win rate`;
    const hero=$('competitiveProfileHero');if(hero){hero.dataset.frame=row.arcadeRewardFrame||'';hero.dataset.banner=row.arcadeRewardBanner||'';hero.dataset.effect=row.arcadeRewardEffect||'';}
    try{await AVATAR()?.renderPreview?.($('competitiveProfileAvatar'),data.avatar||{}, {autoRotate:true});}catch(e){console.warn('Profile avatar 3D:',e);$('competitiveProfileAvatar').innerHTML='<div class="meta-avatar-fallback">🧍</div>';}
    const overview=$('competitiveOverview');if(overview)overview.innerHTML=`
      <div class="meta-stat"><small>RP GERAL</small><b>${Number(row.arcadeRp||0)}</b></div><div class="meta-stat"><small>DIVISÃO</small><b>${info.icon} ${esc(info.label)}</b></div><div class="meta-stat"><small>PARTIDAS</small><b>${Number(row.arcadePlayed||0)}</b></div><div class="meta-stat"><small>WIN RATE</small><b>${pct(row.arcadeWins,row.arcadePlayed)}%</b></div><div class="meta-stat"><small>MELHOR STREAK</small><b>${Number(row.arcadeBestStreak||0)}</b></div><div class="meta-stat"><small>TORNEIOS</small><b>🏆 ${Number(row.arcadeTournamentTrophies||rw.trophies?.tournaments||0)}</b></div>`;
    const games=$('competitiveGames');if(games)games.innerHTML=Object.entries(GAMES).map(([k,g])=>{const st=row.arcadeGames?.[k]||{rp:0,played:0,wins:0,losses:0},ri=rankInfo(st.rp,st.played);return `<article class="meta-game-card"><span>${g.icon}</span><div><b>${esc(g.title)}</b><small>${ri.icon} ${esc(ri.label)} • ${Number(st.rp||0)} RP</small><em>${Number(st.wins||0)}V / ${Number(st.losses||0)}D • ${Number(st.played||0)} partidas</em></div><button data-open-game-rank="${k}">RANKING</button></article>`}).join('');
    const rivalByUid=Object.fromEntries((data.rivals||[]).map(r=>[r.uid,r.name||'Rival']));
    const matches=$('competitiveMatches');if(matches){matches.innerHTML=(data.matches||[]).length?(data.matches||[]).map(m=>{const entry=m.players?.[data.uid]||{},opp=Object.keys(m.players||{}).find(x=>x!==data.uid)||'',win=m.winnerUid===data.uid;return `<article class="meta-match ${win?'win':'loss'}"><span>${win?'🏆':'🏳'}</span><div><b>${gameIcon(m.game)} ${esc(gameName(m.game))}</b><small>${fmtDate(m.finishedAt||m.createdAt)} • vs ${esc(rivalByUid[opp]||opp.slice(0,8)||'Rival')} • sala ${esc(m.code||'—')}</small></div><strong>${entry.delta>0?'+':''}${Number(entry.delta||0)} RP</strong></article>`}).join(''):'<div class="meta-empty">Nenhuma partida ranqueada registrada nesta temporada.</div>';}
    const replayRoot=$('competitiveReplays');if(replayRoot){try{
      const rankedCodes=new Set((data.matches||[]).map(m=>String(m.code||'').toUpperCase()).filter(Boolean));
      const cloud=(await FB()?.listArcadeCloudReplays?.(80)||[]).filter(r=>Boolean(r.participants?.[data.uid])||r.uploaderUid===data.uid).filter(r=>!rankedCodes.size||rankedCodes.has(String(r.room||'').toUpperCase()));
      const local=self?(await window.GameGuessArcadeCompetitive?.listReplays?.()||[]).filter(r=>rankedCodes.has(String(r.room||'').toUpperCase())):[];
      const cloudHtml=cloud.slice(0,12).map(r=>`<article class="meta-match replay"><span>☁</span><div><b>${gameIcon(r.game)} ${esc(gameName(r.game))}</b><small>${fmtDate(r.createdAt)} • sala ${esc(r.room||'—')} • ${r.inputReplay&&r.stateReplay?'🎮 inputs/frame':'🎥 vídeo'} • ${r.visibility==='public'?'público':'participantes'}</small></div><button data-open-cloud-replay="${esc(r.id)}">ASSISTIR</button></article>`).join('');
      const localHtml=local.slice(0,8).map(r=>`<article class="meta-match replay"><span>📱</span><div><b>${gameIcon(r.game)} ${esc(gameName(r.game))}</b><small>${fmtDate(r.createdAt)} • sala ${esc(r.room||'—')} • ${Math.round(Number(r.durationMs||0)/1000)}s</small></div><button data-open-replays>LOCAL</button></article>`).join('');
      replayRoot.innerHTML=cloudHtml+localHtml||'<div class="meta-empty">Nenhum replay compartilhado associado às partidas deste perfil.</div>';
    }catch(e){replayRoot.innerHTML='<div class="meta-empty">Não foi possível consultar os replays deste perfil.</div>';}}
    const rivals=$('competitiveRivals');if(rivals){rivals.innerHTML=(data.rivals||[]).length?(data.rivals||[]).map(r=>`<article class="meta-rival"><div><b>⚔️ ${esc(r.name)}</b><small>${Number(r.played)} confrontos • ${Number(r.wins)}V/${Number(r.losses)}D</small></div><span>${r.wins===r.losses?'EMPATE':r.wins>r.losses?'VANTAGEM SUA':'RIVAL À FRENTE'}</span>${self?`<button data-challenge-rival="${esc(r.uid)}">DESAFIAR</button>`:''}</article>`).join(''):'<div class="meta-empty">Rivalidades aparecem depois das suas partidas Ranked.</div>';}
    const seasons=$('competitiveSeasons');if(seasons){const rows=Object.values(data.history||{}).sort((a,b)=>String(b.seasonId).localeCompare(String(a.seasonId)));seasons.innerHTML=rows.length?rows.map(s=>`<article class="meta-season"><div><b>${esc(s.seasonId||'Temporada')}</b><small>${s.divisionIcon||'🎮'} ${esc(s.division||'Recruta')}</small></div><strong>Pico ${Number(s.peakRp||0)} RP</strong><span>${Number(s.wins||0)}V/${Number(s.losses||0)}D</span></article>`).join(''):'<div class="meta-empty">A primeira temporada será registrada após sua próxima partida.</div>';}
    const collection=$('competitiveCollection');if(collection){if(!self)collection.innerHTML='<div class="meta-empty">A coleção completa é privada. Cosméticos equipados continuam visíveis no ranking.</div>';else{const cat=FB()?.arcadeRewardCatalog?.()||[],owned=cat.filter(i=>rw.unlocks?.[i.id]);collection.innerHTML=owned.length?owned.map(i=>`<span class="meta-collectible" title="${esc(i.name)}">${i.icon||'🎁'}<small>${esc(i.name)}</small></span>`).join(''):'<div class="meta-empty">Nenhuma recompensa desbloqueada.</div>';}}
    const pass=$('competitivePass');if(pass){const p=rw.seasonPass||{level:1,xp:0};pass.innerHTML=self?`<div><b>🎫 Passe gratuito • Nível ${Number(p.level||1)}/30</b><small>${Number(p.xp||0)} XP • cada partida Ranked gera XP automaticamente</small></div><div class="meta-passbar"><i style="width:${Number(p.xp||0)%100}%"></i></div>`:'<div class="meta-empty">Progressão do passe é privada.</div>';}
    const seasonClaim=$('competitiveSeasonClaim');if(seasonClaim){seasonClaim.classList.toggle('hidden',!self);seasonClaim.onclick=async()=>{try{const r=await FB()?.claimArcadeSeasonPlacementReward?.();if(r?.awarded)toast('Recompensa de temporada',`${r.reward.label} • +${r.reward.coins} AC`,'achievement');else toast('Temporada','Nenhuma recompensa pendente.');}catch(e){toast('Temporada',e?.message||String(e),'error')}};}
  }

  function stopRanking(){if(rankingUnsub){try{rankingUnsub()}catch{}rankingUnsub=null;}}
  function openRankHub(board='general'){if(!user()){FB()?.openAuth?.('login');return;}show('arcadeRankHubScreen');setRankBoard(board);}
  function rankRow(row,i,board){const game=GAMES[board],rp=game?row.gameRp:row.arcadeRp,played=game?row.gamePlayed:row.arcadePlayed,wins=game?row.gameWins:row.arcadeWins,losses=game?row.gameLosses:row.arcadeLosses,ri=rankInfo(rp,played);return `<button class="meta-rank-row" data-profile-uid="${esc(row.uid)}"><strong>#${i+1}</strong><div><b>${esc(row.displayName||'Jogador')}</b><small>${game?game.icon+' '+game.title:ri.icon+' '+ri.label} • ${Number(wins||0)}V/${Number(losses||0)}D</small></div><em>${Number(rp||0)} RP</em></button>`;}
  function setRankBoard(board='general'){
    stopRanking();document.querySelectorAll('[data-rank-board]').forEach(b=>b.classList.toggle('active',b.dataset.rankBoard===board));const root=$('arcadeRankHubList');if(root)root.innerHTML='<div class="meta-empty">Carregando ranking…</div>';
    const render=rows=>{if(!root)return;let list=[...(rows||[])];if(board==='tournaments')list.sort((a,b)=>Number(b.arcadeTournamentTrophies||0)-Number(a.arcadeTournamentTrophies||0)||Number(b.arcadeRp||0)-Number(a.arcadeRp||0));if(board==='streak')list.sort((a,b)=>Number(b.arcadeBestStreak||0)-Number(a.arcadeBestStreak||0)||Number(b.arcadeRp||0)-Number(a.arcadeRp||0));if(['tournaments','streak'].includes(board))root.innerHTML=list.slice(0,50).map((r,i)=>`<button class="meta-rank-row" data-profile-uid="${esc(r.uid)}"><strong>#${i+1}</strong><div><b>${esc(r.displayName||'Jogador')}</b><small>${board==='tournaments'?`🏆 ${Number(r.arcadeTournamentTrophies||0)} torneios`:`🔥 ${Number(r.arcadeBestStreak||0)} streak`}</small></div><em>${Number(r.arcadeRp||0)} RP</em></button>`).join('')||'<div class="meta-empty">Sem dados.</div>';else root.innerHTML=list.map((r,i)=>rankRow(r,i,board)).join('')||'<div class="meta-empty">Sem jogadores classificados.</div>';};
    if(GAMES[board])rankingUnsub=FB()?.listenArcadeGameRanking?.(board,50,render);else rankingUnsub=FB()?.listenToArcadeRanking?.(100,render);
  }

  async function renderPublicTournaments(){const root=$('arcadePublicTournamentList');if(!root||!user())return;try{const rows=await FB()?.listArcadePublicTournaments?.()||[];root.innerHTML=rows.length?rows.map(t=>`<article class="meta-public-tournament"><div><b>${gameIcon(t.game)} ${esc(t.name||'Torneio')}</b><small>${Object.keys(t.participants||{}).length}/${Number(t.maxPlayers||4)} • MD${Number(t.bestOf||3)} • ${t.status==='waiting'?'inscrições':'em andamento'}</small></div><button data-open-public-tournament="${esc(t.code)}">${t.status==='waiting'?'ENTRAR':'VER'}</button></article>`).join(''):'<div class="meta-empty">Nenhum torneio público aberto.</div>';}catch(e){root.innerHTML='<div class="meta-empty">Falha ao carregar torneios públicos.</div>';}}

  async function showVS({room,game,meUid}={}){
    const overlay=$('arcadeVsOverlay');if(!overlay||!room)return;const ids=Object.keys(room.players||{}),p1=room.hostUid||ids[0],p2=ids.find(x=>x!==p1)||room.guestUid;overlay.classList.add('active');overlay.setAttribute('aria-hidden','false');
    const [a,b]=await Promise.all([FB()?.getArcadeIdentity?.(p1).catch(()=>null),FB()?.getArcadeIdentity?.(p2).catch(()=>null)]);const ar=a?.row||{},br=b?.row||{},ai=rankInfo(ar.arcadeRp,ar.arcadePlayed),bi=rankInfo(br.arcadeRp,br.arcadePlayed);
    $('arcadeVsGame').textContent=`${gameIcon(game)} ${gameName(game)}`;$('arcadeVsP1Name').textContent=ar.displayName||room.players?.[p1]?.name||'PLAYER 1';$('arcadeVsP2Name').textContent=br.displayName||room.players?.[p2]?.name||'PLAYER 2';$('arcadeVsP1Rank').textContent=`${ai.icon} ${ai.label} • ${Number(ar.arcadeRp||0)} RP`;$('arcadeVsP2Rank').textContent=`${bi.icon} ${bi.label} • ${Number(br.arcadeRp||0)} RP`;
    await Promise.allSettled([AVATAR()?.renderPreview?.($('arcadeVsP1Avatar'),a?.avatar||{}, {autoRotate:false,rotation:.35}),AVATAR()?.renderPreview?.($('arcadeVsP2Avatar'),b?.avatar||{}, {autoRotate:false,rotation:-.35})]);
    await new Promise(r=>setTimeout(r,1800));overlay.classList.remove('active');overlay.setAttribute('aria-hidden','true');
  }

  function showPostMatch({record,room,game}={}){
    const overlay=$('arcadePostMatchOverlay');if(!overlay||!record)return;const won=Boolean(record.won),rw=record.reward||{};overlay.classList.add('active');overlay.setAttribute('aria-hidden','false');$('postMatchResult').textContent=won?'🏆 VITÓRIA':'🏳 DERROTA';$('postMatchGame').textContent=`${gameIcon(game)} ${gameName(game)}`;$('postMatchRp').textContent=`${Number(record.delta||0)>0?'+':''}${Number(record.delta||0)} RP`;$('postMatchTotalRp').textContent=`${Number(record.rp||0)} RP • ${record.divisionIcon||'🎮'} ${record.division||'Recruta'}`;$('postMatchCoins').textContent=Number(rw.totalCoins||0)>0?`🪙 +${Number(rw.totalCoins||0)} AC`:'🪙 +0 AC';$('postMatchPass').textContent=`🎫 +${Number(rw.passXp||0)} XP`;$('postMatchStreak').textContent=`🔥 Sequência ${Number(record.state?.currentStreak||0)}`;
    const unlocked=$('postMatchUnlocked');if(unlocked)unlocked.textContent=(rw.unlocked||[]).length?`🎁 ${(rw.unlocked||[]).length} recompensa(s) desbloqueada(s)`:'Continue jogando para liberar novas recompensas.';
    overlay.querySelector('[data-postmatch=close]').onclick=()=>overlay.classList.remove('active');overlay.querySelector('[data-postmatch=profile]').onclick=()=>{overlay.classList.remove('active');openProfile()};overlay.querySelector('[data-postmatch=rewards]').onclick=()=>{overlay.classList.remove('active');window.GameGuessArcadeCompetitive?.openRewards?.()};overlay.querySelector('[data-postmatch=rematch]').onclick=()=>{overlay.classList.remove('active');ARCADE()?.openOnline?.(game)};
  }

  function bind(){
    document.addEventListener('click',e=>{
      const home=e.target.closest('[data-home-meta]');if(home){if(home.dataset.homeMeta==='profile')openProfile();if(home.dataset.homeMeta==='avatar')openAvatar();if(home.dataset.homeMeta==='ranks')openRankHub();}
      const profile=e.target.closest('[data-profile-uid]');if(profile)openProfile(profile.dataset.profileUid);
      const rank=e.target.closest('[data-rank-board]');if(rank)setRankBoard(rank.dataset.rankBoard);
      const gameRank=e.target.closest('[data-open-game-rank]');if(gameRank)openRankHub(gameRank.dataset.openGameRank);
      const chall=e.target.closest('[data-challenge-rival]');if(chall){show('kofScreen');toast('Rivalidade','Escolha o jogo e crie uma sala X1 para desafiar este rival.');}
      const pub=e.target.closest('[data-open-public-tournament]');if(pub)window.GameGuessArcadeCompetitive?.openTournamentCode?.(pub.dataset.openPublicTournament);
      const replay=e.target.closest('[data-open-replays]');if(replay)window.GameGuessArcadeCompetitive?.openReplays?.();
    });
    $('competitiveProfileBack')?.addEventListener('click',()=>show('homeScreen'));$('arcadeRankHubBack')?.addEventListener('click',()=>{stopRanking();show('homeScreen')});$('arcadeAvatar3dBack')?.addEventListener('click',()=>show('homeScreen'));
    document.querySelectorAll('[data-comp-tab]').forEach(b=>b.addEventListener('click',()=>profileTab(b.dataset.compTab)));
    $('homeArcadeProfileButton')?.addEventListener('click',()=>openProfile());$('homeArcadeAvatarButton')?.addEventListener('click',openAvatar);$('homeArcadeRankHubButton')?.addEventListener('click',()=>openRankHub());$('arcadeAvatar3DButton')?.addEventListener('click',openAvatar);$('arcadeCompetitiveProfileButton')?.addEventListener('click',()=>openProfile());
    window.addEventListener('gameguess:authchange',()=>setTimeout(()=>{renderHomeIdentity();renderPublicTournaments()},250));window.addEventListener('gameguess:arcade-rewards',()=>renderHomeIdentity());window.addEventListener('gameguess:avatar3d',()=>renderHomeIdentity());
    setTimeout(()=>{renderHomeIdentity();renderPublicTournaments()},650);
  }

  window.GameGuessCompetitiveUI={version:VERSION,openProfile,openAvatar,openRankHub,showVS,showPostMatch,renderHomeIdentity,renderPublicTournaments};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
