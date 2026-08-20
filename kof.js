(() => {
  'use strict';
  const $=id=>document.getElementById(id),CORE=()=>window.GameGuessCore,FB=()=>window.GameGuessFirebase;
  const WEB_GAME='/roms/v178/kf2k2mp2.zip';
  const EXPECTED_GAME_BYTES=86694745;
  const DEFAULT_NETPLAY='https://netplay.emulatorjs.org/';
  const KOF_WEB_VERSION='17.9.0';
  const KOF_EMULATOR_VERSION='4.2.1';
  const FBN_BUILD='2025-01-07 14:59 UTC';
  let roomCode='',room=null,unsub=null,launched=false,lastReadyRoom='',lastLaunchAtHandled=0;
  let launchInFlight=false,launchPollTimer=0;
  let assetCache={at:0,ready:false,detail:null};
  const rankedClaimsInFlight=new Set();

  function toast(a,b,t=''){CORE()?.toast?.(a,b,t)}
  function show(id){CORE()?.showScreen?.(id)}
  function user(){return FB()?.getUser?.()||null}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function playerCount(r=room){return r?Object.keys(r.players||{}).length:0}
  function connectedCount(r=room){return r?Object.keys(r.players||{}).filter(uid=>playerOnline(uid,r)).length:0}
  function playerOnline(uid,r=room){return Boolean(uid&&Object.keys(r?.presence?.[uid]||{}).length)}
  function opponent(){const u=user();return u&&room?Object.values(room.players||{}).find(p=>p.uid!==u.uid):null}
  function role(){const u=user();return u&&room?.hostUid===u.uid?'HOST':'CONVIDADO'}
  function isHost(){const u=user();return Boolean(u&&room?.hostUid===u.uid)}
  function netplayServer(){return (localStorage.getItem('gameGuessKofNetplayServer')||DEFAULT_NETPLAY).trim()||DEFAULT_NETPLAY}
  function readyPlayers(r=room){return Object.values(r?.clientReady||{}).filter(x=>x?.ready).length}
  function mb(v){return v?`${(v/1024/1024).toFixed(1)} MB`:'tamanho não informado'}

  async function head(url,timeout=6500){
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);
    try{const r=await fetch(url,{method:'HEAD',cache:'no-store',signal:ctrl.signal});return {ok:r.ok,status:r.status,size:Number(r.headers.get('content-length')||0)}}
    catch(e){return {ok:false,status:0,error:e?.name==='AbortError'?'timeout':'network'}}finally{clearTimeout(timer)}
  }

  async function checkServices(){
    const el=$('kofServiceState');if(el)el.textContent='🔎 Verificando EmulatorJS, build FBNeo e ROM em produção…';
    try{
      const r=await fetch('/api/kof-health',{cache:'no-store'}),d=await r.json();
      const emu=Boolean(d?.services?.emulator?.ok||d?.emulator?.ok),core=Boolean(d?.coreReport?.ok),rom=Boolean(d?.rom?.sizeMatches),net=Boolean(d?.netplay?.ok);
      if(el)el.textContent=emu&&core&&rom?`✅ EmulatorJS ${KOF_EMULATOR_VERSION} • FBNeo build ${FBN_BUILD} • ROM ${mb(d?.rom?.size)}${net?' • Netplay OK':' • Netplay pendente'}`:'🟡 Diagnóstico incompleto — use REVERIFICAR ROM';
      return {emulator:emu,core,rom,netplay:net};
    }catch{if(el)el.textContent='🟡 Diagnóstico online indisponível';return {emulator:false,core:false,rom:false,netplay:false}}
  }

  async function refreshFiles(force=false){
    if(!force&&Date.now()-assetCache.at<30000&&assetCache.detail){applyAssetUI(assetCache.detail);return assetCache.ready}
    const game=await head(WEB_GAME);
    const sizeMatches=!game.size||game.size===EXPECTED_GAME_BYTES;
    const detail={game,sizeMatches};
    const ready=game.ok&&sizeMatches;
    assetCache={at:Date.now(),ready,detail};applyAssetUI(detail);
    if(roomCode&&ready)ensureRoomReady().catch(()=>{});
    return ready;
  }
  function applyAssetUI(d){
    const gameOk=Boolean(d?.game?.ok),sizeMatches=Boolean(d?.sizeMatches),ready=gameOk&&sizeMatches;
    const el=$('kofFileState');
    if(el){
      if(ready)el.textContent=`✅ Full Non-Merged V17.8 pronto • ${mb(d.game.size)} • URL nova anti-cache`;
      else if(gameOk)el.textContent=`🔴 ROM diferente da validada: ${d.game.size||'?'} bytes • esperado ${EXPECTED_GAME_BYTES}`;
      else el.textContent='❌ /roms/v178/kf2k2mp2.zip não encontrado neste deploy';
    }
    [$('kofTrainingButton'),$('kofCreateRoom'),$('kofJoinRoom')].forEach(x=>{if(x)x.disabled=!ready});
  }
  async function ensureRoomReady(){
    const u=user();if(!roomCode||!u||!assetCache.ready)return false;
    if(room?.clientReady?.[u.uid]?.ready){lastReadyRoom=roomCode;return true}
    if(lastReadyRoom===roomCode)return true;
    lastReadyRoom=roomCode;
    try{return await FB()?.markFightReady?.(roomCode,true)}catch(e){lastReadyRoom='';console.warn('KOF ready:',e);return false}
  }

  function updateRoomUI(){
    const u=user();
    $('kofRoomPanel')?.classList.toggle('hidden',!room);
    if(!room)return refreshFiles();
    if($('kofRoomCode'))$('kofRoomCode').textContent=room.code||roomCode;
    if($('kofRoomRole'))$('kofRoomRole').textContent=`${role()} • Game ID ${room.gameId} • protocolo ${room.protocolVersion}`;
    if($('kofRoomPlayers'))$('kofRoomPlayers').innerHTML=Object.values(room.players||{}).map(p=>{
      const rdy=Boolean(room.clientReady?.[p.uid]?.ready),online=playerOnline(p.uid);
      return `<div class="kof-player-row"><span>${p.uid===room.hostUid?'👑':'🥊'}</span><b>${esc(p.name)}</b><small>${online?'🟢':'🟡'} ${online?'online':'reconectando'} • ${rdy?'🎮 pronto':'🔎 verificando'}</small></div>`;
    }).join('');
    const count=playerCount(),connected=connectedCount(),rdy=readyPlayers();
    if($('kofRoomStatus')){
      if(count<2)$('kofRoomStatus').textContent='⏳ 1/2 jogadores • aguardando uma SEGUNDA CONTA entrar';
      else if(connected<2)$('kofRoomStatus').textContent=`🟡 2/2 jogadores • ${connected}/2 conectados • aguardando rival voltar`;
      else if(rdy<2)$('kofRoomStatus').textContent=`🔎 2/2 jogadores online • ${rdy}/2 aparelhos prontos`;
      else if(launchInFlight)$('kofRoomStatus').textContent='🚀 Sinal de partida enviado • abrindo KOF nos dois aparelhos…';
      else $('kofRoomStatus').textContent='✅ 2/2 jogadores online • 2/2 aparelhos prontos';
    }
    const launch=$('kofLaunchButton');
    if(launch){
      if(room.launchState==='starting'){launch.disabled=true;launch.textContent='🎮 PARTIDA INICIADA'}
      else if(isHost()){launch.disabled=launchInFlight||count<2||connected<2||rdy<2;launch.textContent=launchInFlight?'⏳ INICIANDO…':(rdy>=2&&connected>=2?'🚀 INICIAR KOF ONLINE':`🔎 AGUARDANDO ${Math.max(0,2-rdy)} APARELHO(S)`)}
      else{launch.disabled=true;launch.textContent=rdy>=2?'✅ PRONTO • AGUARDE O HOST':'🔎 VALIDANDO FBNEO…'}
    }
    const votes=room.resultVotes||{},mineVote=u&&votes[u.uid];
    if($('kofVoteStatus'))$('kofVoteStatus').textContent=room.status==='finished'?`🏆 Resultado confirmado: ${room.players?.[room.winnerUid]?.name||'vencedor'}`:mineVote?'✅ Seu resultado foi enviado. Aguardando confirmação do rival.':'Depois da luta, os dois jogadores confirmam o vencedor.';
    $('kofResultControls')?.classList.toggle('hidden',count<2||room.status==='finished');
    if(room.status==='finished'&&!rankedClaimsInFlight.has(room.code)){rankedClaimsInFlight.add(room.code);recordRanked(room).finally(()=>rankedClaimsInFlight.delete(room.code))}
    refreshFiles().then(ok=>{if(ok)ensureRoomReady()});
    const launchAt=Number(room.launchAt||0);
    if((room.launchState==='starting'||room.status==='playing')&&launchAt&&!launched&&launchAt!==lastLaunchAtHandled){lastLaunchAtHandled=launchAt;setTimeout(()=>launch(false,true),80)}
  }

  function stopLaunchPolling(){if(launchPollTimer){clearInterval(launchPollTimer);launchPollTimer=0}}
  function startLaunchPolling(){
    stopLaunchPolling();
    launchPollTimer=setInterval(async()=>{
      if(!roomCode||launched)return;
      try{
        const latest=await FB()?.getFightRoom?.(roomCode);
        if(!latest)return;
        room=latest;
        const at=Number(latest.launchAt||0);
        if((latest.launchState==='starting'||latest.status==='playing')&&at&&!launched){lastLaunchAtHandled=at;launch(false,true)}
      }catch{}
    },1500);
  }
  function watch(code){if(unsub)unsub();startLaunchPolling();unsub=FB()?.watchFightRoom?.(code,(data,err)=>{if(err){toast('Sala KOF',err.message||'Falha ao acompanhar sala.','error');return}if(!data){room=null;roomCode='';lastReadyRoom='';stopLaunchPolling();updateRoomUI();return}room=data;updateRoomUI()})}
  async function createRoom(){
    if(!FB()?.ready?.())return toast('Firebase','Configure/entre na conta antes de criar a sala.','error');
    if(!await refreshFiles(true))return toast('KOF Web incompleto','O deploy precisa de /roms/v178/kf2k2mp2.zip com exatamente o Full Non-Merged validado.','error');
    try{const btn=$('kofCreateRoom');btn.disabled=true;launched=false;lastLaunchAtHandled=0;lastReadyRoom='';roomCode=await FB().createFightRoom();localStorage.setItem('gameGuessLastKofRoom',roomCode);watch(roomCode);toast('Sala KOF criada',`Código ${roomCode} • aguardando rival`)}catch(e){toast('Erro ao criar sala',e.message||String(e),'error')}finally{if($('kofCreateRoom'))$('kofCreateRoom').disabled=false}
  }
  async function joinRoom(){
    const code=String($('kofJoinCode')?.value||'').trim().toUpperCase();
    if(!await refreshFiles(true))return toast('KOF Web incompleto','A ROM Full Non-Merged V17.8 não está publicada corretamente.','error');
    try{const btn=$('kofJoinRoom');btn.disabled=true;launched=false;lastLaunchAtHandled=0;lastReadyRoom='';roomCode=await FB().joinFightRoom(code);localStorage.setItem('gameGuessLastKofRoom',roomCode);watch(roomCode);toast('Conectado',`Você entrou na sala ${roomCode}`)}catch(e){toast('Não consegui entrar',e.message||String(e),'error')}finally{if($('kofJoinRoom'))$('kofJoinRoom').disabled=false}
  }
  async function leaveRoom(){if(roomCode)await FB()?.leaveFightRoom?.(roomCode).catch(()=>{});if(unsub)unsub();unsub=null;stopLaunchPolling();room=null;roomCode='';launched=false;launchInFlight=false;lastReadyRoom='';lastLaunchAtHandled=0;localStorage.removeItem('gameGuessLastKofRoom');stopEmulator();updateRoomUI()}

  async function requestOnlineLaunch(){
    if(!roomCode||!room)return toast('Sala KOF','Crie ou entre em uma sala antes de iniciar.','error');
    if(!isHost())return toast('Aguardando HOST','Somente o criador da sala inicia a luta.');
    if(launchInFlight||launched)return;
    const count=playerCount(),connected=connectedCount(),rdy=readyPlayers();
    if(count<2)return toast('Aguardando rival','É necessário entrar com uma segunda conta na sala. Abrir a mesma conta em dois aparelhos não cria o Player 2.','error');
    if(connected<2)return toast('Rival desconectado','Os dois jogadores precisam aparecer como ONLINE antes de iniciar.','error');
    if(rdy<2)return toast('Aguardando aparelhos',`Somente ${rdy}/2 aparelhos concluíram a validação do KOF.`,'error');
    launchInFlight=true;updateRoomUI();
    toast('Iniciando KOF online','Enviando o sinal de partida aos dois jogadores…');
    try{
      if(!await refreshFiles(true))throw new Error('A ROM Full Non-Merged não respondeu com o tamanho validado.');
      if(!await ensureRoomReady())throw new Error('Este aparelho ainda não marcou o KOF como pronto.');
      const api=FB();
      if(typeof api?.requestFightLaunch!=='function')throw new Error('O módulo Firebase carregado está desatualizado. Faça Ctrl+F5 e tente novamente.');
      const result=await api.requestFightLaunch(roomCode);
      toast('Partida liberada','Abrindo o KOF no HOST agora; o convidado receberá o mesmo sinal.');
      // Não dependa do callback realtime para o HOST. O write acima já foi confirmado
      // pelo Firebase, então abrimos imediatamente. O convidado continua sendo
      // acionado pelo listener, com polling como fallback.
      if(!launched)await launch(false,true);
      return result;
    }catch(e){
      launchInFlight=false;updateRoomUI();
      toast('Não consegui iniciar',e?.message||String(e),'error');
      console.error('KOF online launch:',e);
    }
  }
  async function launch(training=false,fromRoom=false){
    if(!training&&launched)return true;
    if(!training&&!fromRoom)return requestOnlineLaunch();
    if(!training&&playerCount()<2)return toast('Aguardando rival','A luta online precisa de 2 jogadores.','error');
    if(!await refreshFiles())return toast('KOF Web indisponível','A ROM Full Non-Merged V17.8 não está acessível.','error');
    const gameId=training?20020202:Number(room?.gameId||20020202),roleParam=training?'training':role().toLowerCase(),code=training?'TREINO':roomCode;
    const server=netplayServer();localStorage.setItem('gameGuessKofNetplayServer',server);
    const frame=$('kofEmulatorFrame');if(!frame){launchInFlight=false;return toast('KOF Web','Iframe do emulador não foi encontrado. Atualize a página.','error')}
    if(!training){launched=true;launchInFlight=false;stopLaunchPolling()}
    show('kofPlayScreen');
    frame.src=`/kof-player.html?v=${KOF_WEB_VERSION}&gameId=${encodeURIComponent(gameId)}&room=${encodeURIComponent(code)}&role=${encodeURIComponent(roleParam)}&server=${encodeURIComponent(server)}`;
    if($('kofPlayRoom'))$('kofPlayRoom').textContent=training?'TREINO LOCAL':`SALA ${roomCode} • ${role()}`;
    if($('kofNetplayHelp')){
      $('kofNetplayHelp').classList.toggle('hidden',training);
      if(!training){const action=isHost()?'HOST/CREATE (Criar)':'JOIN/ENTRAR (Entrar)';$('kofNetplayHelp').innerHTML=`<b>⚔️ PVP Web • ${role()}</b><span>Os dois aparelhos usam EmulatorJS ${KOF_EMULATOR_VERSION}, FBNeo build ${FBN_BUILD}, a mesma ROM Full Non-Merged e Game ID ${gameId}. O emulador tentará iniciar automaticamente; se aparecer o botão <b>INICIAR KOF</b>, clique nele neste aparelho. Depois, no Netplay escolha <b>${action}</b>; no outro aparelho use a opção complementar.</span>`}
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
    $('kofRecheckFiles')?.addEventListener('click',()=>Promise.all([refreshFiles(true),checkServices()]).then(([ok])=>toast(ok?'KOF Web pronto':'ROM inválida',ok?'Full Non-Merged V17.8 confirmado no deploy.':'Confira /roms/v178/kf2k2mp2.zip e faça novo deploy.','error')));
    $('kofTrainingButton')?.addEventListener('click',()=>launch(true));$('kofCreateRoom')?.addEventListener('click',createRoom);$('kofJoinRoom')?.addEventListener('click',joinRoom);$('kofLeaveRoom')?.addEventListener('click',leaveRoom);$('kofLaunchButton')?.addEventListener('click',requestOnlineLaunch);
    $('kofNetplayServer')?.addEventListener('change',e=>localStorage.setItem('gameGuessKofNetplayServer',String(e.target.value||DEFAULT_NETPLAY).trim()));
    $('kofCopyRoom')?.addEventListener('click',()=>navigator.clipboard?.writeText(roomCode).then(()=>toast('Código copiado',roomCode)));
    $('kofVoteMe')?.addEventListener('click',()=>vote(user()?.uid));$('kofVoteRival')?.addEventListener('click',()=>vote(opponent()?.uid));
    window.addEventListener('gameguess:authchange',e=>{if(!e.detail?.user&&roomCode)leaveRoom()});
    window.addEventListener('message',e=>{if(e.origin!==location.origin)return;const d=e.data||{};if(d.type==='kof-player-error')toast('Emulador KOF',d.message||'Falha ao iniciar.','error');if(d.type==='kof-player-ready')toast('KOF pronto',d.message||'Emulador carregado.');if(d.type==='kof-netplay-menu')toast('PVP Web',d.message||'Menu Netplay aberto.');if(d.type==='kof-player-slow')toast('KOF carregando','O primeiro carregamento pode demorar porque o navegador está baixando e preparando ~83 MB do romset.')});
  }
  window.GameGuessKOF={open};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
