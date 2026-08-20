(() => {
'use strict';
const $=id=>document.getElementById(id), CORE=()=>window.GameGuessCore, FB=()=>window.GameGuessFirebase;
const GEO_VERSION='18.2.0';
const REGIONS={world:['🌍','Mundo todo'],americas:['🌎','Américas'],europe:['🏰','Europa'],asia:['🌏','Ásia'],africa:['🦁','África'],oceania:['🌊','Oceania']};
let config={region:'world',rounds:5,maxPlayers:2};
let solo=null, map=null, guessMarker=null, targetMarker=null, line=null, selected=null;
let roomCode='',room=null,unsub=null,mode='solo',lastRenderedRound=-1,advanceScheduled=-1,tick=null;
let mapillaryPromise=null,mapillaryToken='',viewer=null,roundStartImageId='',lastImageId='',steps=0,suppressStep=false,roundToken=0;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));}
function show(id){if(!$(id)?.classList.contains('active'))CORE()?.showScreen?.(id);setTimeout(()=>map?.invalidateSize?.(),120)}
function toast(a,b,t=''){CORE()?.toast?.(a,b,t)}
function fmtDistance(km){if(km<1)return `${Math.round(km*1000).toLocaleString('pt-BR')} m`;return `${km<100?km.toFixed(1):Math.round(km).toLocaleString('pt-BR')} km`;}
function inject(){
  const main=document.querySelector('main.shell');if(!main||$('geoSetupScreen'))return;
  const home=$('homeScreen');
  if(home){const banner=document.createElement('section');banner.className='geo-home-banner';banner.innerHTML=`<div class="geo-home-icon">🌍</div><div><p class="eyebrow">🧭 GEOGUESS ARENA • V18.1</p><h2>Explore ruas reais gratuitamente</h2><p>Explore imagens de rua do Mapillary, avance pelas setas, gire a câmera quando a captura for 360°, procure placas e pistas e depois marque seu palpite no mapa.</p></div><div class="geo-home-actions"><button class="primary-btn" id="homeGeoButton">🌍 JOGAR GEOGUESS</button><button class="secondary-btn" id="homeGeoArenaButton">⚔️ CRIAR ARENA</button></div>`;const social=home.querySelector('.social-home-banner'),quiz=home.querySelector('.quiz-home-banner');home.insertBefore(banner,social||quiz||home.firstChild);}
  main.insertAdjacentHTML('beforeend',`
  <section class="screen geo-setup-screen" id="geoSetupScreen">
    <div class="section-heading"><button class="back-link" id="geoBack">← Voltar</button><div><p class="eyebrow">🌍 GEOGUESS ARENA</p><h2>Onde no mundo?</h2><p>Você será colocado em uma imagem de rua real do Mapillary. Avance pela sequência, explore os arredores e depois marque no mapa onde acredita que a rodada começou.</p></div></div>
    <div class="geo-setup-layout">
      <section class="geo-setup-card"><h3>🎮 Partida solo</h3><label>Região<select id="geoRegion"></select></label><label>Rodadas<select id="geoRounds"><option value="3">3 rodadas</option><option value="5" selected>5 rodadas</option><option value="8">8 rodadas</option></select></label><div class="geo-mode-explain"><b>🚶 Movimento liberado</b><span>Clique nas setas/rua para avançar, arraste para olhar ao redor e use a roda do mouse para zoom.</span></div><button class="primary-btn huge" id="geoSoloStart">INICIAR SOLO ▶</button></section>
      <section class="geo-setup-card"><h3>⚔️ Arena online</h3><label>Jogadores<select id="geoMaxPlayers">${[2,3,4,5,6,7,8].map(n=>`<option value="${n}">${n} jogadores${n===2?' — 1x1':''}</option>`).join('')}</select></label><div class="geo-room-actions"><button class="primary-btn" id="geoCreateRoom">CRIAR SALA</button><div class="geo-join"><input id="geoJoinCode" maxlength="6" placeholder="ABC123"><button class="secondary-btn" id="geoJoinRoom">ENTRAR</button></div></div><small>Todos começam na mesma imagem/sequência do Mapillary e podem navegar livremente. Imagens 360° são priorizadas quando disponíveis. Tempo: 60 segundos por rodada.</small></section>
      <section class="geo-waiting hidden" id="geoWaiting"><div class="geo-room-code"><span>SALA</span><b id="geoRoomCode">------</b><button class="icon-btn" id="geoCopyCode">📋</button></div><div id="geoWaitingPlayers" class="geo-waiting-players"></div><div id="geoWaitingStatus"></div><button class="primary-btn huge" id="geoStartRoom">INICIAR PARTIDA</button><button class="secondary-btn" id="geoLeaveRoom">SAIR DA SALA</button></section>
    </div>
  </section>
  <section class="screen geo-game-screen" id="geoGameScreen">
    <div class="geo-game-top"><button class="back-link" id="geoQuit">← Sair</button><div class="geo-game-metrics"><span id="geoModeBadge">🌍 SOLO</span><span>🧭 <b id="geoRoundLabel">1/5</b></span><span>⭐ <b id="geoScoreLabel">0</b></span><span>🚶 <b id="geoStepLabel">0</b></span><span id="geoTimerLabel" class="hidden">⏱️ 60</span></div></div>
    <div class="geo-stage" id="geoStage">
      <section class="geo-street-card">
        <div id="geoStreetView" class="geo-street-view"></div>
        <div class="geo-street-loading" id="geoStreetLoading"><div class="geo-spinner"></div><b>Preparando Mapillary...</b><span>Procurando uma sequência de imagens de rua navegável.</span></div>
        <div class="geo-street-toolbar"><button id="geoReturnStart" class="geo-float-btn" title="Voltar ao ponto inicial">↩️ INÍCIO</button><span id="geoMoveHint">🚶 Avance pelas imagens para encontrar pistas • © Mapillary</span></div>
      </section>
      <section class="geo-map-card" id="geoMapCard">
        <div class="geo-map-head"><b>📍 SEU PALPITE</b><button class="geo-map-toggle" id="geoMapToggle" title="Expandir/recolher mapa">⛶</button></div>
        <div id="geoMap" class="geo-map"></div>
        <div class="geo-map-actions"><button class="primary-btn" id="geoSubmitGuess" disabled>📍 CONFIRMAR LOCAL</button><button class="primary-btn hidden" id="geoNextRound">PRÓXIMA RODADA ▶</button></div>
        <div id="geoFeedback" class="geo-feedback">Clique no mapa para colocar seu palpite.</div>
      </section>
    </div>
    <section class="geo-scoreboard hidden" id="geoScoreboard"><h3>🏆 Placar da Arena</h3><div id="geoScoreRows"></div></section>
  </section>`);
  const sel=$('geoRegion');sel.innerHTML=Object.entries(REGIONS).map(([k,[i,n]])=>`<option value="${k}">${i} ${n}</option>`).join('');
}

async function ensureMapillary(){
  if(window.mapillary?.Viewer&&mapillaryToken)return window.mapillary;
  if(mapillaryPromise)return mapillaryPromise;
  mapillaryPromise=(async()=>{
    const r=await fetch('/api/geoguess-config',{cache:'no-store'}),cfg=await r.json().catch(()=>({}));
    if(!r.ok||!cfg.enabled||!cfg.token)throw new Error('O GeoGuess precisa do MAPILLARY_ACCESS_TOKEN no Vercel. Crie um app no Mapillary Developer Dashboard e use o Client Token.');
    mapillaryToken=String(cfg.token);
    if(!document.getElementById('gameGuessMapillaryCss')){
      const css=document.createElement('link');css.id='gameGuessMapillaryCss';css.rel='stylesheet';css.href='https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.css';document.head.appendChild(css);
    }
    if(!window.mapillary?.Viewer){
      await new Promise((resolve,reject)=>{
        const existing=document.getElementById('gameGuessMapillaryJs');
        if(existing){
          if(window.mapillary?.Viewer)return resolve();
          existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',()=>{existing.remove();reject(new Error('Falha ao carregar o MapillaryJS.'));},{once:true});return;
        }
        const js=document.createElement('script');js.id='gameGuessMapillaryJs';js.src='https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.js';js.async=true;js.onload=resolve;js.onerror=()=>{js.remove();reject(new Error('Falha ao carregar o MapillaryJS. Verifique sua conexão ou bloqueadores de conteúdo.'));};document.head.appendChild(js);
      });
    }
    if(!window.mapillary?.Viewer)throw new Error('O MapillaryJS não inicializou corretamente.');
    return window.mapillary;
  })();
  try{return await mapillaryPromise}catch(e){mapillaryPromise=null;throw e}
}

function ensureGuessMap(){
  if(map||!window.L||!$('geoMap'))return;
  map=L.map('geoMap',{worldCopyJump:true,minZoom:2,zoomControl:true}).setView([15,0],2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'}).addTo(map);
  map.on('click',e=>{
    if(isLocked())return;
    selected={lat:e.latlng.lat,lng:e.latlng.lng};
    if(guessMarker)guessMarker.setLatLng(e.latlng);else guessMarker=L.marker(e.latlng).addTo(map);
    $('geoSubmitGuess').disabled=false;$('geoFeedback').innerHTML=`📍 Palpite marcado. <span class="geo-muted">Você ainda pode mover o pino antes de confirmar.</span>`;
  });
}
function clearMarkers(){if(!map)return;for(const x of [guessMarker,targetMarker,line])if(x)map.removeLayer(x);guessMarker=targetMarker=line=null;selected=null;map.setView([15,0],2);$('geoMapCard')?.classList.remove('geo-result-mode','geo-map-expanded');}
function hav(a,b,c,d){const R=6371,to=x=>x*Math.PI/180,dLat=to(c-a),dLon=to(d-b),x=Math.sin(dLat/2)**2+Math.cos(to(a))*Math.cos(to(c))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function scoreDistance(km){if(km<=.025)return 5000;return Math.max(0,Math.round(5000*Math.exp(-km/1800)));}

function mlyGeometry(img){
  const g=img?.computed_geometry||img?.geometry,c=g?.coordinates;
  return Array.isArray(c)&&c.length>=2?{lng:Number(c[0]),lat:Number(c[1])}:null;
}
function mlyBbox(lat,lng,km){
  const latPad=km/111.32,lngPad=km/(111.32*Math.max(.22,Math.abs(Math.cos(lat*Math.PI/180))));
  return [lng-lngPad,lat-latPad,lng+lngPad,lat+latPad].map(n=>Number(n.toFixed(6))).join(',');
}
function pickMlyImage(items){
  const usable=(items||[]).filter(x=>x?.id&&mlyGeometry(x));
  if(!usable.length)return null;
  const seq=x=>Boolean(x?.sequence?.id||x?.sequence);
  const spherical=usable.filter(x=>String(x.camera_type||'').toLowerCase()==='spherical');
  const pools=[spherical.filter(seq),usable.filter(seq),spherical,usable];
  const pool=pools.find(a=>a.length)||usable;
  return pool[Math.floor(Math.random()*pool.length)]||null;
}
async function browserMapillaryImages(lat,lng,km){
  const u=new URL('https://graph.mapillary.com/images');
  u.searchParams.set('access_token',mapillaryToken);
  u.searchParams.set('bbox',mlyBbox(Number(lat),Number(lng),km));
  u.searchParams.set('limit','100');
  u.searchParams.set('fields','id,computed_geometry,geometry,computed_compass_angle,compass_angle,camera_type,sequence,captured_at');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
    const r=await fetch(u,{signal:controller.signal,headers:{Accept:'application/json'}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){
      const msg=d?.error?.message||`Mapillary HTTP ${r.status}`;
      const e=new Error(msg);e.status=r.status;throw e;
    }
    return Array.isArray(d.data)?d.data:[];
  }finally{clearTimeout(timer)}
}
async function resolveSeedInBrowser(seed){
  let lastErr=null;
  for(const km of [4,12,30]){
    try{
      const items=await browserMapillaryImages(seed.lat,seed.lng,km),img=pickMlyImage(items),g=mlyGeometry(img);
      if(img&&g){
        const heading=Number(img.computed_compass_angle??img.compass_angle??0);
        return {id:`mly:${img.id}`,imageId:String(img.id),lat:g.lat,lng:g.lng,country:seed.country,city:seed.city,region:seed.region,heading:Number.isFinite(heading)?heading:0,cameraType:String(img.camera_type||''),provider:'mapillary'};
      }
    }catch(e){lastErr=e;if([400,401,403].includes(Number(e.status)))throw e;}
  }
  if(lastErr&&Number(lastErr.status)>=400)throw lastErr;
  return null;
}
async function fetchRounds(){
  await ensureMapillary();
  const wanted=config.rounds;
  const r=await fetch(`/api/geoguess?region=${encodeURIComponent(config.region)}&count=${wanted}`,{cache:'no-store'}),d=await r.json().catch(()=>({}));
  if(!r.ok&&d?.fatal)throw new Error(d.error||'A API do Mapillary recusou a configuração atual.');
  const resolved=Array.isArray(d.candidates)?d.candidates.filter(q=>q?.imageId&&Number.isFinite(Number(q.lat))&&Number.isFinite(Number(q.lng))):[];
  if(resolved.length>=wanted)return resolved.slice(0,wanted);

  // Fallback importante: alguns provedores/serverless podem receber resposta vazia do índice espacial
  // do Mapillary. Como Client Token é próprio para uso no browser/MapillaryJS, tentamos a busca
  // diretamente no navegador antes de desistir.
  const seeds=Array.isArray(d.seeds)?d.seeds:[];
  let firstError=null;
  for(const seed of seeds){
    if(resolved.length>=wanted)break;
    try{
      const q=await resolveSeedInBrowser(seed);
      if(q&&!resolved.some(x=>x.imageId===q.imageId))resolved.push(q);
    }catch(e){
      firstError=firstError||e;
      if([400,401,403].includes(Number(e.status)))break;
    }
  }
  if(resolved.length>=wanted)return resolved.slice(0,wanted);
  if(firstError){
    const auth=[400,401,403].includes(Number(firstError.status));
    throw new Error(auth?`O Mapillary recusou o Client Token (${firstError.status}). No Developer Dashboard, confirme READ ativado, copie o Client Token (MLY|...), atualize MAPILLARY_ACCESS_TOKEN no Vercel e faça Redeploy. Detalhe: ${firstError.message}`:`Falha ao consultar o Mapillary: ${firstError.message}`);
  }
  const serverDetail=d?.diagnostic?.firstError?` • servidor: ${d.diagnostic.firstError}`:'';
  throw new Error(`Não encontrei ${wanted} sequências navegáveis no Mapillary após buscas de até 30 km. Encontradas: ${resolved.length}.${serverDetail}`);
}

function currentQ(){return mode==='solo'?solo?.questions?.[solo.index]:room?.questions?.[Number(room.roundIndex||0)]}
function isLocked(){if(mode==='solo')return Boolean(solo?.answered);const me=myPlayer();return !room||room.status!=='playing'||Number(me?.submittedRound)===Number(room.roundIndex);}

async function ensureViewer(){
  const mly=await ensureMapillary();if(viewer)return viewer;
  viewer=new mly.Viewer({accessToken:mapillaryToken,container:'geoStreetView',fallback:{image:true,navigation:true},component:{cover:false,sequence:{visible:true,playing:false},zoom:true}});
  viewer.on('image',event=>{
    const image=event?.image,id=String(image?.id||'');if(!id)return;
    if(suppressStep){suppressStep=false;lastImageId=id;return;}
    if(lastImageId&&id!==lastImageId&&!isLocked()){steps++;$('geoStepLabel').textContent=steps;}
    lastImageId=id;
  });
  return viewer;
}
async function loadStreetRound(q){
  const token=++roundToken,loading=$('geoStreetLoading'),view=$('geoStreetView');
  loading.innerHTML='<div class="geo-spinner"></div><b>Preparando Mapillary...</b><span>Carregando a sequência de imagens da rodada.</span>';loading.classList.remove('hidden');view.classList.remove('ready');
  const v=await ensureViewer();if(token!==roundToken)return;
  roundStartImageId=String(q.imageId);lastImageId=roundStartImageId;steps=0;$('geoStepLabel').textContent='0';suppressStep=true;
  try{
    await v.moveTo(roundStartImageId);if(token!==roundToken)return;
    try{await v.setFieldOfView?.(90)}catch{}
    v.resize?.();loading.classList.add('hidden');view.classList.add('ready');
  }catch(e){
    if(token!==roundToken)return;
    loading.innerHTML='<b>Não foi possível abrir esta imagem do Mapillary.</b><span>Tente iniciar outra partida.</span>';
    throw e;
  }
}
async function returnToStart(){const q=currentQ();if(!viewer||!q||isLocked())return;suppressStep=true;lastImageId=String(q.imageId);try{await viewer.moveTo(String(q.imageId));await viewer.setFieldOfView?.(90)}catch(e){toast('Mapillary','Não consegui voltar ao ponto inicial.','error')}}

async function displayRound(){
  ensureGuessMap();clearMarkers();const q=currentQ();if(!q)return;
  const idx=mode==='solo'?solo.index:Number(room.roundIndex||0),total=mode==='solo'?solo.questions.length:Number(room.config?.rounds||room.questions?.length||5);
  $('geoRoundLabel').textContent=`${idx+1}/${total}`;$('geoScoreLabel').textContent=mode==='solo'?solo.score:Number(myPlayer()?.score||0);$('geoModeBadge').textContent=mode==='solo'?'🌍 SOLO':`⚔️ SALA ${roomCode}`;
  $('geoTimerLabel').classList.toggle('hidden',mode==='solo');$('geoMoveHint').textContent=q.cameraType==='spherical'?'🌀 360° • avance pelas setas e procure pistas • © Mapillary':'🚶 Sequência de rua • avance pelas setas e procure pistas • © Mapillary';$('geoFeedback').textContent='Clique no mapa para colocar seu palpite.';$('geoSubmitGuess').classList.remove('hidden');$('geoSubmitGuess').disabled=true;$('geoNextRound').classList.add('hidden');$('geoReturnStart').disabled=false;selected=null;
  $('geoScoreboard')?.classList.toggle('hidden',mode!=='arena');if(mode==='arena')renderScoreboard();setTimeout(()=>map?.invalidateSize?.(),100);
  try{await loadStreetRound(q)}catch(e){toast('Mapillary',e.message||String(e),'error');}
}
function reveal(q,guess,km,pts){
  if(!map)return;const target=[Number(q.lat),Number(q.lng)],g=[Number(guess.lat),Number(guess.lng)];
  targetMarker=L.marker(target).addTo(map).bindPopup(`🎯 Local correto: ${esc(q.city)} • ${esc(q.country)}`).openPopup();
  line=L.polyline([g,target],{weight:4,opacity:.82,dashArray:'9 9'}).addTo(map);map.fitBounds(L.latLngBounds([g,target]).pad(.32),{maxZoom:8});
  $('geoMapCard').classList.add('geo-result-mode','geo-map-expanded');$('geoReturnStart').disabled=true;
  $('geoMoveHint').innerHTML=`🎯 <b>${esc(q.city)}</b> • ${esc(q.country)}`;
  $('geoFeedback').innerHTML=`<div class="geo-result-stats"><span><small>DISTÂNCIA</small><b>${fmtDistance(km)}</b></span><span><small>PONTOS</small><b>+${pts.toLocaleString('pt-BR')}</b></span><span><small>PASSOS</small><b>${steps}</b></span></div>`;
  setTimeout(()=>map.invalidateSize(),180);
}
function awardCoins(amount){const p=CORE()?.getProfile?.()||{};p.coins=Number(p.coins||0)+Math.max(0,Math.round(amount));CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);}

async function startSolo(){
  config.region=$('geoRegion').value;config.rounds=Number($('geoRounds').value)||5;const b=$('geoSoloStart');b.disabled=true;b.textContent='PREPARANDO MAPILLARY...';
  try{const questions=await fetchRounds();mode='solo';solo={questions,index:0,score:0,answered:false};show('geoGameScreen');setTimeout(()=>displayRound(),100)}catch(e){toast('GeoGuess Mapillary indisponível',e.message||String(e),'error')}finally{b.disabled=false;b.textContent='INICIAR SOLO ▶';}
}
function submitSolo(){if(!selected||solo?.answered)return;const q=currentQ(),km=hav(selected.lat,selected.lng,q.lat,q.lng),pts=scoreDistance(km);solo.answered=true;solo.score+=pts;$('geoScoreLabel').textContent=solo.score;reveal(q,selected,km,pts);$('geoSubmitGuess').classList.add('hidden');$('geoNextRound').classList.remove('hidden');awardCoins(Math.max(1,Math.min(6,Math.round(pts/1000))));}
function nextSolo(){if(!solo)return;if(solo.index>=solo.questions.length-1){const p=CORE()?.getProfile?.()||{};p.gamesPlayed=Number(p.gamesPlayed||0)+1;p.gamesWon=Number(p.gamesWon||0)+1;p.geoPlayed=Number(p.geoPlayed||0)+1;p.geoBestScore=Math.max(Number(p.geoBestScore||0),solo.score);p.highScore=Math.max(Number(p.highScore||0),solo.score);p.coins=Number(p.coins||0)+4;window.GameGuessRanked?.record?.(p,{kind:'geoguess',score:solo.score,mode:'solo',universe:'geoguess',challenge:config.region,difficulty:'mapillary-street',correct:solo.questions.length,wrong:0,won:true});CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);CORE()?.spawnConfetti?.();toast('GeoGuess concluído',`${solo.score.toLocaleString('pt-BR')} / ${(solo.questions.length*5000).toLocaleString('pt-BR')} pontos • +4 personalização`);solo=null;return show('geoSetupScreen');}solo.index++;solo.answered=false;displayRound();}

function user(){return FB()?.getUser?.()}
function players(){return Object.values(room?.players||{}).filter(p=>!p.left).sort((a,b)=>Number(a.slot||99)-Number(b.slot||99))}
function myPlayer(){const u=user();return u?room?.players?.[u.uid]:null}
function online(uid){return Object.keys(room?.presence?.[uid]||{}).length>0}
function renderWaiting(){if(!room)return;$('geoWaiting').classList.remove('hidden');$('geoRoomCode').textContent=roomCode;$('geoWaitingPlayers').innerHTML=players().map(p=>`<div><span>${p.uid===room.hostUid?'👑':'🌍'}</span><b>${esc(p.name)}</b><small>${online(p.uid)?'🟢 online':'🟡 reconectando'}</small></div>`).join('');$('geoWaitingStatus').textContent=`${players().length}/${room.config?.maxPlayers||2} jogadores na sala`;$('geoStartRoom').classList.toggle('hidden',room.hostUid!==user()?.uid);$('geoStartRoom').disabled=players().length<2;}
function renderScoreboard(){if(mode!=='arena'||!room)return;$('geoScoreboard').classList.remove('hidden');$('geoScoreRows').innerHTML=players().sort((a,b)=>Number(b.score||0)-Number(a.score||0)).map((p,i)=>`<div><span>#${i+1}</span><b>${esc(p.name)}</b><small>${Number(p.submittedRound)===Number(room.roundIndex)?`✅ ${fmtDistance(Number(p.distanceKm||0))}`:'🚶 explorando'}</small><strong>${Number(p.score||0).toLocaleString('pt-BR')}</strong></div>`).join('');}
async function createRoom(){if(!user())return toast('Login necessário','Entre na sua conta para criar uma Arena GeoGuess.','error');config.region=$('geoRegion').value;config.rounds=Number($('geoRounds').value)||5;config.maxPlayers=Number($('geoMaxPlayers').value)||2;const b=$('geoCreateRoom');b.disabled=true;b.textContent='PREPARANDO MAPILLARY...';try{const questions=await fetchRounds();roomCode=await FB().createGeoRoom({questions,region:config.region,maxPlayers:config.maxPlayers});localStorage.setItem('gameGuessLastGeoRoom',roomCode);mode='arena';watchRoom(roomCode);$('geoWaiting').classList.remove('hidden');toast('Sala criada',`Código ${roomCode}`)}catch(e){toast('Erro ao criar sala',e.message||String(e),'error')}finally{b.disabled=false;b.textContent='CRIAR SALA';}}
async function joinRoom(){if(!user())return toast('Login necessário','Entre na sua conta para entrar na Arena GeoGuess.','error');const code=String($('geoJoinCode').value||'').trim().toUpperCase();try{roomCode=await FB().joinGeoRoom(code);localStorage.setItem('gameGuessLastGeoRoom',roomCode);mode='arena';watchRoom(roomCode);$('geoWaiting').classList.remove('hidden');toast('Conectado',`Você entrou em ${roomCode}`)}catch(e){toast('Não consegui entrar',e.message||String(e),'error')}}
function watchRoom(code){unsub?.();unsub=FB().watchGeoRoom(code,(r,e)=>{if(e)return toast('GeoGuess',e.message||'Falha na sala.','error');room=r;if(!r){roomCode='';$('geoWaiting')?.classList.add('hidden');return;}FB()?.ensureGeoHost?.(code);if(r.status==='waiting'){show('geoSetupScreen');renderWaiting()}else if(r.status==='playing'){show('geoGameScreen');const idx=Number(r.roundIndex||0);if(lastRenderedRound!==idx){lastRenderedRound=idx;displayRound()}else{renderScoreboard();maybeRevealArena();}ensureArenaTicker()}else if(r.status==='finished'){show('geoGameScreen');renderScoreboard();finishArena();}})}
async function startRoom(){try{await FB().startGeoRoom(roomCode)}catch(e){toast('Não consegui iniciar',e.message||String(e),'error')}}
async function submitArena(){if(!selected||isLocked())return;const q=currentQ(),idx=Number(room.roundIndex||0),km=hav(selected.lat,selected.lng,q.lat,q.lng),pts=scoreDistance(km),g={...selected},walkSteps=steps;$('geoSubmitGuess').disabled=true;try{await FB().mutateGeoRoom(roomCode,(r,uid)=>{const p=r.players?.[uid];if(!p||Number(p.submittedRound)===idx||Number(r.roundIndex)!==idx)return;p.submittedRound=idx;p.guessLat=g.lat;p.guessLng=g.lng;p.distanceKm=Math.round(km*10)/10;p.roundScore=pts;p.score=Number(p.score||0)+pts;p.steps=walkSteps;return r;});awardCoins(Math.max(1,Math.min(5,Math.round(pts/1200))))}catch(e){toast('Palpite',e.message||String(e),'error')}}
function allSubmitted(){const idx=Number(room?.roundIndex||0);return players().length>0&&players().every(p=>Number(p.submittedRound)===idx)}
function maybeRevealArena(){if(!room||room.status!=='playing')return;const me=myPlayer(),idx=Number(room.roundIndex||0),q=currentQ();if(Number(me?.submittedRound)===idx&&me?.guessLat!=null&&!targetMarker)reveal(q,{lat:me.guessLat,lng:me.guessLng},Number(me.distanceKm||0),Number(me.roundScore||0));if(allSubmitted()&&room.hostUid===user()?.uid&&advanceScheduled!==idx){advanceScheduled=idx;setTimeout(()=>advanceArena(idx),4000)}}
async function advanceArena(idx){if(!room||room.status!=='playing'||Number(room.roundIndex)!==idx||room.hostUid!==user()?.uid)return;try{await FB().mutateGeoRoom(roomCode,(r)=>{if(Number(r.roundIndex)!==idx)return r;const total=Number(r.config?.rounds||r.questions?.length||5);if(idx>=total-1){r.status='finished';r.roundState='finished';r.finishedAt=Date.now();r.expiresAt=Date.now()+2*60*60*1000;const list=Object.values(r.players||{}).sort((a,b)=>Number(b.score||0)-Number(a.score||0));r.winnerUid=list[0]?.uid||'';return r;}r.roundIndex=idx+1;r.roundDeadline=Date.now()+60000;r.roundState='playing';for(const p of Object.values(r.players||{})){p.roundScore=0;p.distanceKm=0;p.guessLat=null;p.guessLng=null;p.steps=0;}return r;});}catch{}}
function ensureArenaTicker(){if(tick)return;tick=setInterval(async()=>{if(!room||room.status!=='playing')return;const left=Math.max(0,Math.ceil((Number(room.roundDeadline||0)-(FB()?.serverNow?.()||Date.now()))/1000));if($('geoTimerLabel'))$('geoTimerLabel').textContent=`⏱️ ${left}`;if(left<=0&&room.hostUid===user()?.uid&&!allSubmitted()){const idx=Number(room.roundIndex||0);await FB().mutateGeoRoom(roomCode,r=>{for(const p of Object.values(r.players||{})){if(Number(p.submittedRound)!==idx){p.submittedRound=idx;p.guessLat=0;p.guessLng=0;p.distanceKm=20000;p.roundScore=0;p.steps=0;}}return r;}).catch(()=>{});}},500)}
function finishArena(){if(tick){clearInterval(tick);tick=null}const u=user();if(!u||!room)return;const key=`ggGeoRecorded:${room.code}:${u.uid}`;if(!localStorage.getItem(key)){localStorage.setItem(key,'1');const p=CORE()?.getProfile?.()||{},won=room.winnerUid===u.uid;p.geoPlayed=Number(p.geoPlayed||0)+1;p.geoWins=Number(p.geoWins||0)+(won?1:0);p.gamesPlayed=Number(p.gamesPlayed||0)+1;if(won)p.gamesWon=Number(p.gamesWon||0)+1;p.geoBestScore=Math.max(Number(p.geoBestScore||0),Number(myPlayer()?.score||0));p.coins=Number(p.coins||0)+(won?12:4);window.GameGuessRanked?.record?.(p,{kind:'geoguess-arena',score:Number(myPlayer()?.score||0),mode:`${players().length}-players`,universe:'geoguess',challenge:room.config?.region||'world',difficulty:'mapillary-arena',correct:Number(room.config?.rounds||0),wrong:0,won,players:players().length});CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);if(won)CORE()?.spawnConfetti?.();toast(won?'🏆 Você venceu o GeoGuess!':'GeoGuess finalizado',`${Number(myPlayer()?.score||0).toLocaleString('pt-BR')} pontos • +${won?12:4} personalização`);}const winner=room.players?.[room.winnerUid];$('geoFeedback').innerHTML=`🏆 Vencedor: <b>${esc(winner?.name||'Jogador')}</b> • ${Number(winner?.score||0).toLocaleString('pt-BR')} pontos`;}
async function leaveRoom(){if(roomCode)await FB()?.leaveGeoRoom?.(roomCode).catch(()=>{});unsub?.();unsub=null;room=null;roomCode='';localStorage.removeItem('gameGuessLastGeoRoom');lastRenderedRound=-1;advanceScheduled=-1;$('geoWaiting')?.classList.add('hidden');if(tick){clearInterval(tick);tick=null}show('geoSetupScreen')}
function quit(){roundToken++;if(mode==='arena'&&roomCode)return leaveRoom();solo=null;show('geoSetupScreen')}
function toggleMap(){const c=$('geoMapCard');if(!c)return;c.classList.toggle('geo-map-expanded');setTimeout(()=>map?.invalidateSize?.(),180)}
function open(arena=false){show('geoSetupScreen');if(arena)setTimeout(()=>$('geoCreateRoom')?.scrollIntoView({behavior:'smooth',block:'center'}),100)}
function bind(){inject();$('homeGeoButton')?.addEventListener('click',()=>open(false));$('homeGeoArenaButton')?.addEventListener('click',()=>open(true));$('geoBack')?.addEventListener('click',()=>show('homeScreen'));$('geoSoloStart')?.addEventListener('click',startSolo);$('geoSubmitGuess')?.addEventListener('click',()=>mode==='solo'?submitSolo():submitArena());$('geoNextRound')?.addEventListener('click',nextSolo);$('geoCreateRoom')?.addEventListener('click',createRoom);$('geoJoinRoom')?.addEventListener('click',joinRoom);$('geoStartRoom')?.addEventListener('click',startRoom);$('geoLeaveRoom')?.addEventListener('click',leaveRoom);$('geoQuit')?.addEventListener('click',quit);$('geoReturnStart')?.addEventListener('click',returnToStart);$('geoMapToggle')?.addEventListener('click',toggleMap);$('geoCopyCode')?.addEventListener('click',()=>navigator.clipboard?.writeText(roomCode).then(()=>toast('Código copiado',roomCode)));window.addEventListener('gameguess:authchange',e=>{if(!e.detail?.user&&roomCode)leaveRoom()});}
window.GameGuessGeo={open,version:GEO_VERSION};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
