(() => {
  'use strict';
  const $=id=>document.getElementById(id),CORE=()=>window.GameGuessCore,FB=()=>window.GameGuessFirebase;
  const WEB_GAME='/roms/kf2k2mp2.zip';
  const DEFAULT_NETPLAY='https://netplay.emulatorjs.org/';
  let roomCode='',room=null,unsub=null,launched=false,lastReadyRoom='',lastLaunchAtHandled=0;
  let assetCache={at:0,ready:false,detail:null};
  const rankedClaimsInFlight=new Set();

  function toast(a,b,t=''){CORE()?.toast?.(a,b,t)}
  function show(id){CORE()?.showScreen?.(id)}
  function user(){return FB()?.getUser?.()||null}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function onlineCount(r=room){return r?Object.keys(r.players||{}).length:0}
  function playerOnline(uid,r=room){return Boolean(uid&&Object.keys(r?.presence?.[uid]||{}).length)}
  function opponent(){const u=user();return u&&room?Object.values(room.players||{}).find(p=>p.uid!==u.uid):null}
  function role(){const u=user();return u&&room?.hostUid===u.uid?'HOST':'CONVIDADO'}
  function isHost(){const u=user();return Boolean(u&&room?.hostUid===u.uid)}
  function netplayServer(){return (localStorage.getItem('gameGuessKofNetplayServer')||DEFAULT_NETPLAY).trim()||DEFAULT_NETPLAY}
  function readyPlayers(r=room){return Object.values(r?.clientReady||{}).filter(x=>x?.ready).length}

  async function head(url,timeout=5500){
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);
    try{const r=await fetch(url,{method:'HEAD',cache:'no-store',signal:ctrl.signal});return {ok:r.ok,status:r.status,size:Number(r.headers.get('content-length')||0)}}
    catch(e){return {ok:false,status:0,error:e?.name==='AbortError'?'timeout':'network'}}finally{clearTimeout(timer)}
  }
  async function checkServices(){
    const el=$('kofServiceState');if(el)el.textContent='🔎 Verificando EmulatorJS + Netplay…';
    try{
      const [r,c]=await Promise.all([fetch('/api/kof-health',{cache:'no-store'}),fetch('/api/kof-config',{cache:'no-store'})]);
      const d=await r.json(),cfg=await c.json().catch(()=>({}));
      const emu=Boolean(d?.services?.emulator?.ok),net=Boolean(d?.services?.netplay?.ok),turn=Boolean(cfg?.turnConfigured);
      if(el)el.textContent=emu&&net?`✅ EmulatorJS + Netplay respondendo${turn?' • TURN configurado':' • STUN ativo'}`:emu?'🟡 EmulatorJS OK • Netplay indisponível agora':'🔴 Serviço do emulador indisponível agora';
      return {emulator:emu,netplay:net,turn};
    }catch{if(el)el.textContent='🟡 Diagnóstico online indisponível';return {emulator:false,netplay:false,turn:false}}
  }

  async function refreshFiles(force=false){
    if(!force&&Date.now()-assetCache.at<30000&&assetCache.detail){applyAssetUI(assetCache.detail);return assetCache.ready}
    const game=await head(WEB_GAME);
    const detail={game},ready=game.ok;
    assetCache={at:Date.now(),ready,detail};applyAssetUI(detail);
    if(roomCode&&ready)ensureRoomReady().catch(()=>{});
    return ready;
  }
  function applyAssetUI(d){
    const gameOk=Boolean(d?.game?.ok),ready=gameOk;
    if($('kofCloneState'))$('kofCloneState').innerHTML=gameOk?'<b>✅ Magic Plus II Full Non-Merged</b><small>kf2k2mp2.zip • 54 arquivos em um único romset</small>':'<b>❌ Romset ausente</b><small>Falta /roms/kf2k2mp2.zip.</small>';
    if($('kofParentState'))$('kofParentState').innerHTML=gameOk?'<b>✅ KOF 2002 Parent incorporado</b><small>13 ROMs do parent estão dentro do mesmo kf2k2mp2.zip.</small>':'<b>❌ Parent não disponível</b><small>O Full Non-Merged não respondeu.</small>';
    if($('kofBiosState'))$('kofBiosState').innerHTML=gameOk?'<b>✅ Neo Geo BIOS incorporada</b><small>BIOS essenciais estão dentro do mesmo romset.</small>':'<b>❌ BIOS não disponível</b><small>O Full Non-Merged não respondeu.</small>';
    if($('kofFilesReady'))$('kofFilesReady').textContent=ready?'✅ V17: romset Full Non-Merged pronto para o FBNeo.':'⚠️ O arquivo kf2k2mp2.zip da V17 não respondeu.';
    if($('kofTrainingButton'))$('kofTrainingButton').disabled=!ready;
  }
  async function ensureRoomReady(){
    const u=user();if(!roomCode||!u||!assetCache.ready)return false;
    if(room?.clientReady?.[u.uid]?.ready){lastReadyRoom=roomCode;return true}
    if(lastReadyRoom===roomCode)return true;
    lastReadyRoom=roomCode;
    try{return await FB()?.markFightReady?.(roomCode,true)}catch(e){lastReadyRoom='';console.warn('KOF ready:',e);return false}
  }

  function updateRoomUI(){
    const u=user(),opp=opponent();
    $('kofRoomPanel')?.classList.toggle('hidden',!room);
    if(!room)return refreshFiles();
    if($('kofRoomCode'))$('kofRoomCode').textContent=room.code||roomCode;
    if($('kofRoomRole'))$('kofRoomRole').textContent=`${role()} • Game ID ${room.gameId} • protocolo ${room.protocolVersion}`;
    if($('kofRoomPlayers'))$('kofRoomPlayers').innerHTML=Object.values(room.players||{}).map(p=>{
      const rdy=Boolean(room.clientReady?.[p.uid]?.ready),online=playerOnline(p.uid);
      return `<div class="kof-player-row"><span>${p.uid===room.hostUid?'👑':'🥊'}</span><b>${esc(p.name)}</b><small>${online?'🟢':'🟡'} ${online?'online':'reconectando'} • ${rdy?'🎮 pronto':'🔎 verificando'}</small></div>`;
    }).join('');
    const count=onlineCount(),rdy=readyPlayers();
    if($('kofRoomStatus'))$('kofRoomStatus').textContent=count>=2?`✅ 2/2 jogadores • ${rdy}/2 aparelhos prontos`:'⏳ 1/2 jogadores • aguardando rival';
    const launch=$('kofLaunchButton');
    if(launch){
      if(room.launchState==='starting'){launch.disabled=true;launch.textContent='🎮 PARTIDA INICIADA'}
      else if(isHost()){launch.disabled=count<2||rdy<2;launch.textContent=rdy>=2?'🚀 INICIAR KOF ONLINE':`🔎 AGUARDANDO ${Math.max(0,2-rdy)} APARELHO(S)`}
      else{launch.disabled=true;launch.textContent=rdy>=2?'✅ PRONTO • AGUARDE O HOST':'🔎 VALIDANDO ARCADE…'}
    }
    const votes=room.resultVotes||{},mineVote=u&&votes[u.uid];
    if($('kofVoteStatus'))$('kofVoteStatus').textContent=room.status==='finished'?`🏆 Resultado confirmado: ${room.players?.[room.winnerUid]?.name||'vencedor'}`:mineVote?'✅ Seu resultado foi enviado. Aguardando confirmação do rival.':'Depois da luta, os dois jogadores confirmam o vencedor.';
    $('kofResultControls')?.classList.toggle('hidden',count<2||room.status==='finished');
    if(room.status==='finished'&&!rankedClaimsInFlight.has(room.code)){rankedClaimsInFlight.add(room.code);recordRanked(room).finally(()=>rankedClaimsInFlight.delete(room.code))}
    refreshFiles().then(ok=>{if(ok)ensureRoomReady()});
    const launchAt=Number(room.launchAt||0);
    if(room.launchState==='starting'&&launchAt&&launchAt!==lastLaunchAtHandled){lastLaunchAtHandled=launchAt;setTimeout(()=>launch(false,true),250)}
  }

  function watch(code){if(unsub)unsub();unsub=FB()?.watchFightRoom?.(code,(data,err)=>{if(err){toast('Sala KOF',err.message||'Falha ao acompanhar sala.','error');return}if(!data){room=null;roomCode='';lastReadyRoom='';updateRoomUI();return}room=data;updateRoomUI()})}
  async function createRoom(){
    if(!FB()?.ready?.())return toast('Firebase','Configure/entre na conta antes de criar a sala.','error');
    if(!await refreshFiles(true))return toast('KOF Web incompleto','Publique o kf2k2mp2.zip Full Non-Merged da V17 antes de criar a sala.','error');
    try{const btn=$('kofCreateRoom');btn.disabled=true;launched=false;lastLaunchAtHandled=0;lastReadyRoom='';roomCode=await FB().createFightRoom();localStorage.setItem('gameGuessLastKofRoom',roomCode);watch(roomCode);toast('Sala KOF criada',`Código ${roomCode} • aguardando rival`)}catch(e){toast('Erro ao criar sala',e.message||String(e),'error')}finally{if($('kofCreateRoom'))$('kofCreateRoom').disabled=false}
  }
  async function joinRoom(){
    const code=String($('kofJoinCode')?.value||'').trim().toUpperCase();
    if(!await refreshFiles(true))return toast('KOF Web incompleto','Este deploy não contém todos os arquivos do arcade.','error');
    try{const btn=$('kofJoinRoom');btn.disabled=true;launched=false;lastLaunchAtHandled=0;lastReadyRoom='';roomCode=await FB().joinFightRoom(code);localStorage.setItem('gameGuessLastKofRoom',roomCode);watch(roomCode);toast('Conectado',`Você entrou na sala ${roomCode}`)}catch(e){toast('Não consegui entrar',e.message||String(e),'error')}finally{if($('kofJoinRoom'))$('kofJoinRoom').disabled=false}
  }
  async function leaveRoom(){if(roomCode)await FB()?.leaveFightRoom?.(roomCode).catch(()=>{});if(unsub)unsub();unsub=null;room=null;roomCode='';launched=false;lastReadyRoom='';lastLaunchAtHandled=0;localStorage.removeItem('gameGuessLastKofRoom');stopEmulator();updateRoomUI()}

  async function requestOnlineLaunch(){
    if(!roomCode||!room)return;
    if(!isHost())return toast('Aguardando HOST','Somente o criador da sala inicia a luta.');
    if(!await refreshFiles(true))return toast('KOF Web incompleto','Os arquivos do arcade não responderam.','error');
    await ensureRoomReady();
    try{await FB()?.requestFightLaunch?.(roomCode);toast('Sincronizando luta','Os dois aparelhos vão abrir o KOF juntos.')}
    catch(e){toast('Não consegui iniciar',e.message||String(e),'error')}
  }
  async function launch(training=false,fromRoom=false){
    if(!await refreshFiles())return toast('KOF Web indisponível','Os arquivos do arcade não estão acessíveis.','error');
    if(!training&&!fromRoom)return requestOnlineLaunch();
    if(!training&&onlineCount()<2)return toast('Aguardando rival','A luta online precisa de 2 jogadores.','error');
    const gameId=training?20020202:Number(room?.gameId||20020202),roleParam=training?'training':role().toLowerCase(),code=training?'TREINO':roomCode;
    const server=netplayServer();localStorage.setItem('gameGuessKofNetplayServer',server);
    const frame=$('kofEmulatorFrame');if(!frame)return;
    frame.src=`/kof-player.html?v=17.0.0&gameId=${encodeURIComponent(gameId)}&room=${encodeURIComponent(code)}&role=${encodeURIComponent(roleParam)}&server=${encodeURIComponent(server)}`;
    launched=true;show('kofPlayScreen');
    if($('kofPlayRoom'))$('kofPlayRoom').textContent=training?'TREINO LOCAL':`SALA ${roomCode} • ${role()}`;
    if($('kofNetplayHelp')){
      $('kofNetplayHelp').classList.toggle('hidden',training);
      if(!training){const action=isHost()?'abra Netplay e escolha HOST/CREATE':'abra Netplay e escolha JOIN/ENTRAR';$('kofNetplayHelp').innerHTML=`<b>⚔️ Netplay • ${role()}</b><span>O Game ID ${gameId} e o servidor já estão iguais nos dois aparelhos. No menu do EmulatorJS, ${action}. O rival usa a opção complementar.</span>`}
    }
  }
  function stopEmulator(){const f=$('kofEmulatorFrame');if(f)f.src='about:blank'}

  async function vote(winnerUid){if(!roomCode||!winnerUid)return;try{await FB().submitFightResult(roomCode,winnerUid);toast('Resultado enviado','Aguardando o outro jogador confirmar o mesmo vencedor.')}catch(e){toast('Resultado',e.message||String(e),'error')}}
  async function recordRanked(r){
    const u=user();if(!u)return;const key=`gameGuessKofRecorded:${r.code}:${u.uid}`;if(localStorage.getItem(key))return;
    const claimed=await FB()?.claimFightRankedRecord?.(r.code).catch(()=>false);if(!claimed)return;
    localStorage.setItem(key,'1');const p=CORE()?.getProfile?.()||{},won=r.winnerUid===u.uid;
    p.kofPlayed=Number(p.kofPlayed||0)+1;p.kofWins=Number(p.kofWins||0)+(won?1:0);p.kofLosses=Number(p.kofLosses||0)+(won?0:1);p.kofCurrentStreak=won?Number(p.kofCurrentStreak||0)+1:0;p.kofBestStreak=Math.max(Number(p.kofBestStreak||0),p.kofCurrentStreak);p.kofRating=Math.max(1000,Number(p.kofRating||1000)+(won?35:-22));p.coins=Number(p.coins||0)+(won?12:4);
    window.GameGuessRanked?.record?.(p,{kind:'kof',score:p.kofRating,mode:'kof2002',universe:'arcade',challenge:'1x1',difficulty:'ranked',correct:won?1:0,wrong:won?0:1,won,players:2,streak:p.kofCurrentStreak});
    CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);toast(won?'Vitória registrada!':'Partida registrada',`${won?'🏆 Vitória':'🥊 Derrota'} • Elo KOF ${p.kofRating}`)
  }

  async function open(){
    show('kofScreen');checkServices();await refreshFiles(true);if($('kofNetplayServer'))$('kofNetplayServer').value=netplayServer();
    const saved=localStorage.getItem('gameGuessLastKofRoom');if(saved&&user()&&!roomCode){try{const r=await FB()?.getFightRoom?.(saved);if(r?.players?.[user().uid]&&r.status!=='finished'&&Number(r.protocolVersion)===Number(FB()?.fightProtocolVersion)){roomCode=saved;await FB()?.attachFightPresence?.(roomCode);watch(roomCode)}}catch{}}
  }
  function bind(){
    $('homeKofButton')?.addEventListener('click',open);$('kofBackButton')?.addEventListener('click',()=>show('homeScreen'));
    $('kofPlayBackButton')?.addEventListener('click',()=>{stopEmulator();launched=false;show('kofScreen')});
    $('kofRecheckFiles')?.addEventListener('click',()=>refreshFiles(true).then(ok=>toast(ok?'KOF Web pronto':'Arquivos ausentes',ok?'Todos os arquivos responderam.':'Confira o deploy da pasta /roms.',ok?'':'error')));
    $('kofTrainingButton')?.addEventListener('click',()=>launch(true));$('kofCreateRoom')?.addEventListener('click',createRoom);$('kofJoinRoom')?.addEventListener('click',joinRoom);$('kofLeaveRoom')?.addEventListener('click',leaveRoom);$('kofLaunchButton')?.addEventListener('click',requestOnlineLaunch);
    $('kofNetplayServer')?.addEventListener('change',e=>localStorage.setItem('gameGuessKofNetplayServer',String(e.target.value||DEFAULT_NETPLAY).trim()));
    $('kofCopyRoom')?.addEventListener('click',()=>navigator.clipboard?.writeText(roomCode).then(()=>toast('Código copiado',roomCode)));
    $('kofVoteMe')?.addEventListener('click',()=>vote(user()?.uid));$('kofVoteRival')?.addEventListener('click',()=>vote(opponent()?.uid));
    window.addEventListener('gameguess:authchange',e=>{if(!e.detail?.user&&roomCode)leaveRoom()});
    window.addEventListener('message',e=>{if(e.origin!==location.origin)return;const d=e.data||{};if(d.type==='kof-player-error')toast('Emulador KOF',d.message||'Falha ao iniciar.','error');if(d.type==='kof-player-ready')toast('KOF pronto',d.message||'Emulador carregado.');if(d.type==='kof-player-slow')toast('KOF carregando','O primeiro carregamento pode demorar porque o FBNeo precisa descompactar o romset Full Non-Merged de ~84 MB.')});
  }
  window.GameGuessKOF={open};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
