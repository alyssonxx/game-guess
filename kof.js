(() => {
  'use strict';
  const $=id=>document.getElementById(id),CORE=()=>window.GameGuessCore,FB=()=>window.GameGuessFirebase;
  const DB_NAME='gameGuessArcadeFiles',STORE='files',DB_VERSION=1;
  const CLONE_URL='/roms/kf2k2mp2.zip';
  const CLONE_SHA='6c6ab95604d3704f2bd805df4ec9df8ece6b77486a191da672bba8f9d8bf1f61';
  const DEFAULT_NETPLAY='https://netplay.emulatorjs.org/';
  let roomCode='',room=null,unsub=null,launched=false;
  const rankedClaimsInFlight=new Set();

  function toast(a,b,t=''){CORE()?.toast?.(a,b,t)}
  function show(id){CORE()?.showScreen?.(id)}
  function user(){return FB()?.getUser?.()||null}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function putFile(key,file){const d=await db(),sha=await sha256(file);await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put({blob:file,name:file.name,size:file.size,type:file.type,lastModified:file.lastModified,sha256:sha},key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});d.close();return sha}
  async function getFile(key){const d=await db(),v=await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)});d.close();return v}
  async function removeFile(key){const d=await db();await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});d.close()}
  async function sha256(blob){const buf=await blob.arrayBuffer(),hash=await crypto.subtle.digest('SHA-256',buf);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}

  function onlineCount(r=room){return r?Object.keys(r.players||{}).length:0}
  function playerOnline(uid,r=room){return Boolean(uid&&Object.keys(r?.presence?.[uid]||{}).length)}
  function opponent(){const u=user();return u&&room?Object.values(room.players||{}).find(p=>p.uid!==u.uid):null}
  function role(){const u=user();return u&&room?.hostUid===u.uid?'HOST':'CONVIDADO'}
  function netplayServer(){return (localStorage.getItem('gameGuessKofNetplayServer')||DEFAULT_NETPLAY).trim()||DEFAULT_NETPLAY}


  async function checkServices(){
    const el=$('kofServiceState');if(el)el.textContent='🔎 Verificando EmulatorJS + Netplay…';
    try{
      const r=await fetch('/api/kof-health',{cache:'no-store'}),d=await r.json();
      const emu=Boolean(d?.services?.emulator?.ok),net=Boolean(d?.services?.netplay?.ok);
      if(el)el.textContent=emu&&net?'✅ EmulatorJS + Netplay respondendo':emu?'🟡 EmulatorJS OK • Netplay indisponível agora':'🔴 Serviço do emulador indisponível agora';
      return {emulator:emu,netplay:net};
    }catch{if(el)el.textContent='🟡 Diagnóstico online indisponível';return {emulator:false,netplay:false};}
  }

  async function bundledCloneAvailable(){
    try{const r=await fetch(CLONE_URL,{method:'HEAD',cache:'no-store'});return r.ok}catch{return false}
  }
  async function refreshFiles(){
    const [clone,parent,bios,bundled]=await Promise.all([getFile('kof-clone').catch(()=>null),getFile('kof-parent').catch(()=>null),getFile('neogeo-bios').catch(()=>null),bundledCloneAvailable()]);
    const cloneReady=Boolean(clone||bundled);
    if($('kofCloneState'))$('kofCloneState').innerHTML=clone?`<b>✅ ${esc(clone.name)}</b><small>Magic Plus II importado • SHA ${String(clone.sha256||'').slice(0,12)}…</small>`:bundled?`<b>✅ Magic Plus II integrado</b><small>ROM enviada por você • SHA ${CLONE_SHA.slice(0,12)}…</small>`:'<b>⚠️ kf2k2mp2.zip necessário</b><small>A ROM não está no site. Importe o seu arquivo local.</small>';
    if($('kofParentState'))$('kofParentState').innerHTML=parent?`<b>✅ ${esc(parent.name)}</b><small>${(parent.size/1024/1024).toFixed(1)} MB • salvo neste aparelho</small>`:'<b>⚠️ kof2002.zip necessário</b><small>Importe a ROM parent do KOF 2002.</small>';
    if($('kofBiosState'))$('kofBiosState').innerHTML=bios?`<b>✅ ${esc(bios.name)}</b><small>${(bios.size/1024).toFixed(0)} KB • salvo neste aparelho</small>`:'<b>⚠️ neogeo.zip necessário</b><small>Importe a BIOS Neo Geo.</small>';
    const ready=Boolean(cloneReady&&parent&&bios);
    if($('kofTrainingButton'))$('kofTrainingButton').disabled=!ready;
    if($('kofLaunchButton'))$('kofLaunchButton').disabled=!ready||onlineCount()<2;
    if($('kofFilesReady'))$('kofFilesReady').textContent=ready?'✅ Magic Plus II + parent + BIOS prontos neste aparelho':'⚠️ Falta importar um ou mais arquivos necessários neste aparelho';
    return ready;
  }

  async function importFile(kind,file){
    if(!file)return;const expected=kind==='kof-clone'?'kf2k2mp2.zip':kind==='kof-parent'?'kof2002.zip':'neogeo.zip';
    if(!/\.zip$/i.test(file.name))return toast('Arquivo inválido','Selecione um arquivo ZIP.','error');
    if(file.name.toLowerCase()!==expected)toast('Nome diferente',`Esperado: ${expected}. Vou salvar mesmo assim para você testar.`);
    toast('Verificando arquivo',`${file.name}…`);
    const sha=await putFile(kind,file);
    if(kind==='kof-clone'&&sha!==CLONE_SHA)toast('ROM diferente',`O SHA-256 não é igual ao kf2k2mp2 enviado inicialmente. Vou permitir o teste, mas a compatibilidade pode mudar.`,'error');
    else toast('Arquivo salvo',`${file.name} • SHA-256 ${sha.slice(0,12)}…`);
    await refreshFiles();
  }

  function updateRoomUI(){
    const u=user(),opp=opponent();
    $('kofRoomPanel')?.classList.toggle('hidden',!room);
    if(!room)return refreshFiles();
    if($('kofRoomCode'))$('kofRoomCode').textContent=room.code||roomCode;
    if($('kofRoomRole'))$('kofRoomRole').textContent=`${role()} • Game ID ${room.gameId}`;
    if($('kofRoomPlayers'))$('kofRoomPlayers').innerHTML=Object.values(room.players||{}).map(p=>`<div class="kof-player-row"><span>${p.uid===room.hostUid?'👑':'🥊'}</span><b>${esc(p.name)}</b><small>${playerOnline(p.uid)?'🟢 online':'🟡 reconectando'}</small></div>`).join('');
    if($('kofRoomStatus'))$('kofRoomStatus').textContent=onlineCount()>=2?'✅ 2/2 jogadores • pronto para iniciar':'⏳ 1/2 jogadores • aguardando rival';
    if($('kofLaunchButton'))$('kofLaunchButton').disabled=onlineCount()<2;
    const votes=room.resultVotes||{},mineVote=u&&votes[u.uid];
    if($('kofVoteStatus'))$('kofVoteStatus').textContent=room.status==='finished'?`🏆 Resultado confirmado: ${room.players?.[room.winnerUid]?.name||'vencedor'}`:mineVote?'✅ Seu resultado foi enviado. Aguardando confirmação do rival.':'Depois da luta, os dois jogadores confirmam o vencedor.';
    $('kofResultControls')?.classList.toggle('hidden',onlineCount()<2||room.status==='finished');
    if(room.status==='finished'&&!rankedClaimsInFlight.has(room.code)){rankedClaimsInFlight.add(room.code);recordRanked(room).finally(()=>rankedClaimsInFlight.delete(room.code));}
    refreshFiles();
  }

  function watch(code){if(unsub)unsub();unsub=FB()?.watchFightRoom?.(code,(data,err)=>{if(err){toast('Sala KOF',err.message||'Falha ao acompanhar sala.','error');return}if(!data){room=null;roomCode='';updateRoomUI();return}room=data;updateRoomUI()})}
  async function createRoom(){
    if(!FB()?.ready?.())return toast('Firebase','Configure/entre na conta antes de criar a sala.','error');
    try{const btn=$('kofCreateRoom');btn.disabled=true;roomCode=await FB().createFightRoom();localStorage.setItem('gameGuessLastKofRoom',roomCode);watch(roomCode);toast('Sala KOF criada',`Código ${roomCode}`)}catch(e){toast('Erro ao criar sala',e.message||String(e),'error')}finally{if($('kofCreateRoom'))$('kofCreateRoom').disabled=false}
  }
  async function joinRoom(){
    const code=String($('kofJoinCode')?.value||'').trim().toUpperCase();
    try{const btn=$('kofJoinRoom');btn.disabled=true;roomCode=await FB().joinFightRoom(code);localStorage.setItem('gameGuessLastKofRoom',roomCode);watch(roomCode);toast('Conectado',`Você entrou na sala ${roomCode}`)}catch(e){toast('Não consegui entrar',e.message||String(e),'error')}finally{if($('kofJoinRoom'))$('kofJoinRoom').disabled=false}
  }
  async function leaveRoom(){if(roomCode)await FB()?.leaveFightRoom?.(roomCode).catch(()=>{});if(unsub)unsub();unsub=null;room=null;roomCode='';localStorage.removeItem('gameGuessLastKofRoom');updateRoomUI()}

  async function launch(training=false){
    if(!await refreshFiles())return toast('Arquivos necessários','Garanta kf2k2mp2.zip, kof2002.zip e neogeo.zip primeiro.','error');
    if(!training&&onlineCount()<2)return toast('Aguardando rival','A luta online precisa de 2 jogadores.','error');
    const gameId=training?20020202:Number(room.gameId),roleParam=training?'training':role().toLowerCase(),code=training?'TREINO':roomCode;
    const server=netplayServer();localStorage.setItem('gameGuessKofNetplayServer',server);
    const frame=$('kofEmulatorFrame');if(!frame)return;
    frame.src=`/kof-player.html?gameId=${encodeURIComponent(gameId)}&room=${encodeURIComponent(code)}&role=${encodeURIComponent(roleParam)}&server=${encodeURIComponent(server)}`;
    launched=true;show('kofPlayScreen');
    if($('kofPlayRoom'))$('kofPlayRoom').textContent=training?'TREINO LOCAL':`SALA ${roomCode} • ${role()}`;
    if($('kofNetplayHelp'))$('kofNetplayHelp').classList.toggle('hidden',training);
  }

  async function vote(winnerUid){if(!roomCode||!winnerUid)return;try{await FB().submitFightResult(roomCode,winnerUid);toast('Resultado enviado','Aguardando o outro jogador confirmar o mesmo vencedor.')}catch(e){toast('Resultado',e.message||String(e),'error')}}
  async function recordRanked(r){
    const u=user();if(!u)return;const key=`gameGuessKofRecorded:${r.code}:${u.uid}`;if(localStorage.getItem(key))return;
    // O Firebase é a trava global: mesmo abrindo a conta em outro aparelho,
    // cada luta só pode afetar o Ranked uma vez por jogador.
    const claimed=await FB()?.claimFightRankedRecord?.(r.code).catch(()=>false);if(!claimed)return;
    localStorage.setItem(key,'1');
    const p=CORE()?.getProfile?.()||{},won=r.winnerUid===u.uid;
    p.kofPlayed=Number(p.kofPlayed||0)+1;p.kofWins=Number(p.kofWins||0)+(won?1:0);p.kofLosses=Number(p.kofLosses||0)+(won?0:1);p.kofCurrentStreak=won?Number(p.kofCurrentStreak||0)+1:0;p.kofBestStreak=Math.max(Number(p.kofBestStreak||0),p.kofCurrentStreak);p.kofRating=Math.max(1000,Number(p.kofRating||1000)+(won?35:-22));
    window.GameGuessRanked?.record?.(p,{kind:'kof',score:p.kofRating,mode:'kof2002',universe:'arcade',challenge:'1x1',difficulty:'ranked',correct:won?1:0,wrong:won?0:1,won,players:2,streak:p.kofCurrentStreak});
    CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);toast(won?'Vitória registrada!':'Partida registrada',`${won?'🏆 Vitória':'🥊 Derrota'} • Elo KOF ${p.kofRating}`);
  }

  async function open(){show('kofScreen');checkServices();await refreshFiles();if($('kofNetplayServer'))$('kofNetplayServer').value=netplayServer();const saved=localStorage.getItem('gameGuessLastKofRoom');if(saved&&user()&&!roomCode){try{const r=await FB()?.getFightRoom?.(saved);if(r?.players?.[user().uid]&&r.status!=='finished'){roomCode=saved;await FB()?.attachFightPresence?.(roomCode);watch(roomCode)}}catch{}}}
  function bind(){
    $('homeKofButton')?.addEventListener('click',open);$('kofBackButton')?.addEventListener('click',()=>show('homeScreen'));$('kofPlayBackButton')?.addEventListener('click',()=>show('kofScreen'));
    $('kofCloneInput')?.addEventListener('change',e=>importFile('kof-clone',e.target.files?.[0]));$('kofParentInput')?.addEventListener('change',e=>importFile('kof-parent',e.target.files?.[0]));$('kofBiosInput')?.addEventListener('change',e=>importFile('neogeo-bios',e.target.files?.[0]));
    $('kofRemoveClone')?.addEventListener('click',async()=>{await removeFile('kof-clone');refreshFiles()});$('kofRemoveParent')?.addEventListener('click',async()=>{await removeFile('kof-parent');refreshFiles()});$('kofRemoveBios')?.addEventListener('click',async()=>{await removeFile('neogeo-bios');refreshFiles()});
    $('kofTrainingButton')?.addEventListener('click',()=>launch(true));$('kofCreateRoom')?.addEventListener('click',createRoom);$('kofJoinRoom')?.addEventListener('click',joinRoom);$('kofLeaveRoom')?.addEventListener('click',leaveRoom);$('kofLaunchButton')?.addEventListener('click',()=>launch(false));
    $('kofNetplayServer')?.addEventListener('change',e=>localStorage.setItem('gameGuessKofNetplayServer',String(e.target.value||DEFAULT_NETPLAY).trim()));
    $('kofCopyRoom')?.addEventListener('click',()=>navigator.clipboard?.writeText(roomCode).then(()=>toast('Código copiado',roomCode)));
    $('kofVoteMe')?.addEventListener('click',()=>vote(user()?.uid));$('kofVoteRival')?.addEventListener('click',()=>vote(opponent()?.uid));
    window.addEventListener('gameguess:authchange',e=>{if(!e.detail?.user&&roomCode)leaveRoom()});
    window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='kof-player-error')toast('Emulador KOF',e.data.message||'Falha ao iniciar.','error');if(e.data?.type==='kof-player-ready')toast('KOF pronto',e.data.message||'Emulador carregado.')});
  }
  window.GameGuessKOF={open};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
