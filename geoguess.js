(() => {
'use strict';
const $=id=>document.getElementById(id), CORE=()=>window.GameGuessCore, FB=()=>window.GameGuessFirebase;
const REGIONS={world:['🌍','Mundo todo'],americas:['🌎','Américas'],europe:['🏰','Europa'],asia:['🌏','Ásia'],africa:['🦁','África'],oceania:['🌊','Oceania']};
let config={region:'world',rounds:5,maxPlayers:2};
let solo=null, map=null, guessMarker=null, targetMarker=null, line=null, selected=null;
let roomCode='',room=null,unsub=null,mode='solo',lastRenderedRound=-1,advanceScheduled=-1,tick=null;
let exploreMap=null,exploreLayer=null,startMarker=null,steps=0,roundToken=0,lastExploreCenter=null,suppressExploreMove=false;
const exploreCache=new Map();

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));}
function show(id){if(!$(id)?.classList.contains('active'))CORE()?.showScreen?.(id);setTimeout(()=>{map?.invalidateSize?.();exploreMap?.invalidateSize?.();},120)}
function toast(a,b,t=''){CORE()?.toast?.(a,b,t)}
function fmtDistance(km){if(km<1)return `${Math.round(km*1000).toLocaleString('pt-BR')} m`;return `${km<100?km.toFixed(1):Math.round(km).toLocaleString('pt-BR')} km`;}

function injectOsmStyles(){
  if(document.getElementById('geoOsmExplorerStyles'))return;
  const s=document.createElement('style');s.id='geoOsmExplorerStyles';s.textContent=`
  .geo-street-view.leaflet-container{background:radial-gradient(circle at 50% 45%,#122238,#07101b 72%);font-family:Rajdhani,system-ui,sans-serif}
  .geo-street-view .leaflet-control-zoom a{background:#0d1829;color:#eaf6ff;border-color:#263a55}.geo-street-view .leaflet-control-zoom a:hover{background:#162740}
  .geo-street-view .leaflet-control-attribution{background:rgba(5,10,18,.74);color:#91a6bf}.geo-street-view .leaflet-control-attribution a{color:#77dcbc}
  .geo-clue-bar{position:absolute;top:16px;left:62px;right:16px;z-index:5;display:flex;gap:7px;flex-wrap:wrap;pointer-events:none}
  .geo-clue-chip{padding:7px 9px;border:1px solid rgba(102,224,190,.28);border-radius:999px;background:rgba(6,14,25,.82);backdrop-filter:blur(8px);color:#dbe9f7;font:700 .78rem Rajdhani,system-ui,sans-serif;box-shadow:0 7px 24px rgba(0,0,0,.2)}
  .geo-osm-center{position:absolute;left:50%;top:50%;z-index:4;transform:translate(-50%,-50%);width:26px;height:26px;border:2px solid rgba(103,239,186,.92);border-radius:50%;box-shadow:0 0 0 5px rgba(103,239,186,.13),0 0 22px rgba(103,239,186,.35);pointer-events:none}
  .geo-osm-center:after{content:'';position:absolute;left:50%;top:50%;width:5px;height:5px;background:#eafdf7;border-radius:50%;transform:translate(-50%,-50%)}
  .geo-osm-note{color:#91a6bf;font-size:.78rem}
  `;document.head.appendChild(s);
}

function inject(){
  const main=document.querySelector('main.shell');if(!main||$('geoSetupScreen'))return;
  const home=$('homeScreen');
  if(home){const banner=document.createElement('section');banner.className='geo-home-banner';banner.innerHTML=`<div class="geo-home-icon">🌍</div><div><p class="eyebrow">🧭 GEOGUESS ARENA</p><h2>Explore mapas reais do OpenStreetMap</h2><p>Navegue por ruas, quadras, rios, parques e ferrovias sem nomes visíveis, reúna pistas do desenho urbano e marque no mapa onde acredita estar.</p></div><div class="geo-home-actions"><button class="primary-btn" id="homeGeoButton">🌍 JOGAR GEOGUESS</button><button class="secondary-btn" id="homeGeoArenaButton">⚔️ CRIAR ARENA</button></div>`;const social=home.querySelector('.social-home-banner'),quiz=home.querySelector('.quiz-home-banner');home.insertBefore(banner,social||quiz||home.firstChild);}
  main.insertAdjacentHTML('beforeend',`
  <section class="screen geo-setup-screen" id="geoSetupScreen">
    <div class="section-heading"><button class="back-link" id="geoBack">← Voltar</button><div><p class="eyebrow">🌍 GEOGUESS ARENA</p><h2>Onde no mundo?</h2><p>Você receberá um recorte real do OpenStreetMap sem nomes e sem coordenadas. Explore a malha urbana e depois marque no mapa-múndi onde acha que está.</p></div></div>
    <div class="geo-setup-layout">
      <section class="geo-setup-card"><h3>🎮 Partida solo</h3><label>Região<select id="geoRegion"></select></label><label>Rodadas<select id="geoRounds"><option value="3">3 rodadas</option><option value="5" selected>5 rodadas</option><option value="8">8 rodadas</option></select></label><div class="geo-mode-explain"><b>🚶 Movimento liberado</b><span>Arraste o mapa para explorar o bairro, use zoom para analisar ruas e construções e volte ao ponto inicial quando quiser.</span></div><button class="primary-btn huge" id="geoSoloStart">INICIAR SOLO ▶</button></section>
      <section class="geo-setup-card"><h3>⚔️ Arena online</h3><label>Jogadores<select id="geoMaxPlayers">${[2,3,4,5,6,7,8].map(n=>`<option value="${n}">${n} jogadores${n===2?' — 1x1':''}</option>`).join('')}</select></label><div class="geo-room-actions"><button class="primary-btn" id="geoCreateRoom">CRIAR SALA</button><div class="geo-join"><input id="geoJoinCode" maxlength="6" placeholder="ABC123"><button class="secondary-btn" id="geoJoinRoom">ENTRAR</button></div></div><small>Todos recebem o mesmo recorte do OpenStreetMap, sem nomes visíveis, e podem explorar livremente. Tempo: 60 segundos por rodada.</small></section>
      <section class="geo-waiting hidden" id="geoWaiting"><div class="geo-room-code"><span>SALA</span><b id="geoRoomCode">------</b><button class="icon-btn" id="geoCopyCode">📋</button></div><div id="geoWaitingPlayers" class="geo-waiting-players"></div><div id="geoWaitingStatus"></div><button class="primary-btn huge" id="geoStartRoom">INICIAR PARTIDA</button><button class="secondary-btn" id="geoLeaveRoom">SAIR DA SALA</button></section>
    </div>
  </section>
  <section class="screen geo-game-screen" id="geoGameScreen">
    <div class="geo-game-top"><button class="back-link" id="geoQuit">← Sair</button><div class="geo-game-metrics"><span id="geoModeBadge">🌍 SOLO</span><span>🧭 <b id="geoRoundLabel">1/5</b></span><span>⭐ <b id="geoScoreLabel">0</b></span><span>🚶 <b id="geoStepLabel">0</b></span><span id="geoTimerLabel" class="hidden">⏱️ 60</span></div></div>
    <div class="geo-stage" id="geoStage">
      <section class="geo-street-card">
        <div id="geoStreetView" class="geo-street-view"></div><div class="geo-osm-center" aria-hidden="true"></div><div id="geoClueBar" class="geo-clue-bar"></div>
        <div class="geo-street-loading" id="geoStreetLoading"><div class="geo-spinner"></div><b>Preparando OpenStreetMap...</b><span>Carregando ruas e formas do bairro sem revelar nomes.</span></div>
        <div class="geo-street-toolbar"><button id="geoReturnStart" class="geo-float-btn" title="Voltar ao ponto inicial">↩️ INÍCIO</button><span id="geoMoveHint">🗺️ Arraste e dê zoom para explorar o mapa</span></div>
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
  const sel=$('geoRegion');sel.innerHTML=Object.entries(REGIONS).map(([k,[i,n]])=>`<option value="${k}">${i} ${n}</option>`).join('');injectOsmStyles();
}

function ensureGuessMap(){
  if(map||!window.L||!$('geoMap'))return;
  map=L.map('geoMap',{worldCopyJump:true,minZoom:2,zoomControl:true}).setView([15,0],2);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
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

async function fetchRounds(){
  const wanted=config.rounds;
  const r=await fetch(`/api/geoguess?region=${encodeURIComponent(config.region)}&count=${wanted}`,{cache:'no-store'}),d=await r.json().catch(()=>({}));
  if(!r.ok||!Array.isArray(d.candidates))throw new Error(d.error||'Não consegui preparar os locais do OpenStreetMap.');
  const resolved=d.candidates.filter(q=>Number.isFinite(Number(q.lat))&&Number.isFinite(Number(q.lng)));
  if(resolved.length<wanted)throw new Error(`Só consegui preparar ${resolved.length} de ${wanted} locais nesta tentativa. Tente novamente.`);
  return resolved.slice(0,wanted);
}

function currentQ(){return mode==='solo'?solo?.questions?.[solo.index]:room?.questions?.[Number(room.roundIndex||0)]}
function isLocked(){if(mode==='solo')return Boolean(solo?.answered);const me=myPlayer();return !room||room.status!=='playing'||Number(me?.submittedRound)===Number(room.roundIndex);}

function ensureExploreMap(){
  if(exploreMap||!window.L||!$('geoStreetView'))return exploreMap;
  exploreMap=L.map('geoStreetView',{zoomControl:false,attributionControl:true,minZoom:14,maxZoom:19,preferCanvas:true,zoomSnap:.25,zoomDelta:.5});
  L.control.zoom({position:'topleft'}).addTo(exploreMap);
  exploreMap.attributionControl.setPrefix(false);exploreMap.attributionControl.addAttribution('© OpenStreetMap contributors • dados via Overpass');
  L.control.scale({position:'bottomleft',imperial:false,maxWidth:120}).addTo(exploreMap);
  exploreMap.on('movestart',()=>{if(!suppressExploreMove&&!isLocked())lastExploreCenter=exploreMap.getCenter();});
  exploreMap.on('moveend',()=>{
    if(suppressExploreMove){suppressExploreMove=false;return;}
    if(isLocked()||!lastExploreCenter)return;
    const now=exploreMap.getCenter(),m=lastExploreCenter.distanceTo(now);
    if(m>=55){steps++;if($('geoStepLabel'))$('geoStepLabel').textContent=steps;lastExploreCenter=now;}
  });
  return exploreMap;
}
function featureStyle(f){
  const t=f.tags||{},k=f.kind;
  if(k==='road'){
    const major=/^(motorway|trunk|primary)$/.test(t.highway),mid=/^(secondary|tertiary)$/.test(t.highway);
    return {color:major?'#f4c66e':mid?'#8dc6ff':'#526f91',weight:major?5:mid?3.5:2,opacity:.94,lineCap:'round',lineJoin:'round'};
  }
  if(k==='rail')return {color:'#c4a6ff',weight:3,opacity:.9,dashArray:'8 7'};
  if(k==='waterway')return {color:'#55c8f2',weight:3,opacity:.9};
  if(k==='water')return {color:'#3ba9d8',weight:1,fillColor:'#174a66',fillOpacity:.72};
  if(k==='park')return {color:'#66b98b',weight:1,fillColor:'#183b2b',fillOpacity:.68};
  if(k==='landuse'){
    if(t.landuse==='industrial')return {color:'#9a88a9',weight:1,fillColor:'#312b39',fillOpacity:.52};
    if(t.landuse==='commercial')return {color:'#b887aa',weight:1,fillColor:'#392838',fillOpacity:.5};
    if(t.landuse==='forest')return {color:'#5da378',weight:1,fillColor:'#183a27',fillOpacity:.62};
    return {color:'#566b78',weight:1,fillColor:'#1a2630',fillOpacity:.38};
  }
  if(k==='building')return {color:'#6f8294',weight:.8,fillColor:'#263443',fillOpacity:.78};
  return {color:'#52697e',weight:1,opacity:.6};
}
function renderOsmFeatures(data,q){
  const m=ensureExploreMap();if(!m)return;
  if(exploreLayer){exploreLayer.remove();exploreLayer=null;}if(startMarker){startMarker.remove();startMarker=null;}
  exploreLayer=L.layerGroup().addTo(m);
  for(const f of data.features||[]){
    const ll=(f.coordinates||[]).map(([lng,lat])=>[lat,lng]);if(ll.length<2)continue;
    const style=featureStyle(f),polygon=Boolean(f.closed&&['water','park','landuse','building'].includes(f.kind));
    (polygon?L.polygon(ll,style):L.polyline(ll,style)).addTo(exploreLayer);
  }
  startMarker=L.circleMarker([Number(q.lat),Number(q.lng)],{radius:7,color:'#e9fff7',weight:2,fillColor:'#62edb7',fillOpacity:1}).addTo(exploreLayer).bindTooltip('Ponto inicial',{direction:'top',opacity:.9});
  const summary=data.summary||{},chips=(summary.clues||[]).map(x=>`<span class="geo-clue-chip">${esc(x)}</span>`);
  chips.unshift('<span class="geo-clue-chip">🗺️ mapa sem nomes</span>');$('geoClueBar').innerHTML=chips.join('');
}
async function fetchExploreData(q){
  const key=`${Number(q.lat).toFixed(4)},${Number(q.lng).toFixed(4)}`;if(exploreCache.has(key))return exploreCache.get(key);
  const p=(async()=>{const r=await fetch(`/api/geoguess-map?lat=${encodeURIComponent(q.lat)}&lng=${encodeURIComponent(q.lng)}`),d=await r.json().catch(()=>({}));if(!r.ok||!Array.isArray(d.features))throw new Error(d.error||'Não consegui carregar os dados locais do OpenStreetMap.');return d;})();
  exploreCache.set(key,p);try{return await p}catch(e){exploreCache.delete(key);throw e}
}
async function loadStreetRound(q){
  const token=++roundToken,loading=$('geoStreetLoading'),view=$('geoStreetView'),m=ensureExploreMap();
  if(!m)throw new Error('Leaflet não está disponível. Recarregue a página.');
  loading.innerHTML='<div class="geo-spinner"></div><b>Preparando OpenStreetMap...</b><span>Carregando a malha do bairro e removendo nomes que entregariam a resposta.</span>';loading.classList.remove('hidden');view.classList.remove('ready');$('geoClueBar').innerHTML='';steps=0;$('geoStepLabel').textContent='0';
  suppressExploreMove=true;m.dragging.enable();m.scrollWheelZoom.enable();m.doubleClickZoom.enable();m.touchZoom.enable();m.boxZoom?.enable?.();m.keyboard?.enable?.();
  const center=L.latLng(Number(q.lat),Number(q.lng)),bounds=center.toBounds(4000);m.setMaxBounds(bounds.pad(.25));m.setView(center,17,{animate:false});lastExploreCenter=center;
  try{
    const data=await fetchExploreData(q);if(token!==roundToken)return;renderOsmFeatures(data,q);m.invalidateSize();suppressExploreMove=true;m.setView(center,17,{animate:false});loading.classList.add('hidden');view.classList.add('ready');
  }catch(e){
    if(token!==roundToken)return;
    loading.innerHTML='<b>OpenStreetMap temporariamente indisponível.</b><span>O servidor público Overpass pode ficar ocupado. <button class="secondary-btn" style="margin-top:10px" onclick="GameGuessGeo.retryRound()">TENTAR NOVAMENTE</button></span>';
    throw e;
  }
}
function returnToStart(){const q=currentQ();if(!exploreMap||!q||isLocked())return;suppressExploreMove=true;exploreMap.setView([Number(q.lat),Number(q.lng)],17,{animate:true});lastExploreCenter=L.latLng(Number(q.lat),Number(q.lng));}
function retryRound(){const q=currentQ();if(q)loadStreetRound(q).catch(e=>toast('OpenStreetMap',e.message||String(e),'error'));}

async function displayRound(){
  ensureGuessMap();clearMarkers();const q=currentQ();if(!q)return;
  const idx=mode==='solo'?solo.index:Number(room.roundIndex||0),total=mode==='solo'?solo.questions.length:Number(room.config?.rounds||room.questions?.length||5);
  $('geoRoundLabel').textContent=`${idx+1}/${total}`;$('geoScoreLabel').textContent=mode==='solo'?solo.score:Number(myPlayer()?.score||0);$('geoModeBadge').textContent=mode==='solo'?'🌍 SOLO':`⚔️ SALA ${roomCode}`;
  $('geoTimerLabel').classList.toggle('hidden',mode==='solo');$('geoMoveHint').textContent='🗺️ Explore ruas, quadras, rios, parques e ferrovias — nomes estão ocultos';$('geoFeedback').textContent='Clique no mapa para colocar seu palpite.';$('geoSubmitGuess').classList.remove('hidden');$('geoSubmitGuess').disabled=true;$('geoNextRound').classList.add('hidden');$('geoReturnStart').disabled=false;selected=null;
  $('geoScoreboard')?.classList.toggle('hidden',mode!=='arena');if(mode==='arena')renderScoreboard();setTimeout(()=>map?.invalidateSize?.(),100);
  try{await loadStreetRound(q)}catch(e){toast('OpenStreetMap',e.message||String(e),'error');}
}
function reveal(q,guess,km,pts){
  if(!map)return;const target=[Number(q.lat),Number(q.lng)],g=[Number(guess.lat),Number(guess.lng)];
  targetMarker=L.marker(target).addTo(map).bindPopup(`🎯 Local correto: ${esc(q.city)} • ${esc(q.country)}`).openPopup();
  line=L.polyline([g,target],{weight:4,opacity:.82,dashArray:'9 9'}).addTo(map);map.fitBounds(L.latLngBounds([g,target]).pad(.32),{maxZoom:8});
  $('geoMapCard').classList.add('geo-result-mode','geo-map-expanded');$('geoReturnStart').disabled=true;exploreMap?.dragging?.disable?.();exploreMap?.scrollWheelZoom?.disable?.();exploreMap?.doubleClickZoom?.disable?.();exploreMap?.touchZoom?.disable?.();
  $('geoMoveHint').innerHTML=`🎯 <b>${esc(q.city)}</b> • ${esc(q.country)}`;
  $('geoFeedback').innerHTML=`<div class="geo-result-stats"><span><small>DISTÂNCIA</small><b>${fmtDistance(km)}</b></span><span><small>PONTOS</small><b>+${pts.toLocaleString('pt-BR')}</b></span><span><small>MOVIMENTOS</small><b>${steps}</b></span></div>`;
  setTimeout(()=>map.invalidateSize(),180);
}
function awardCoins(amount){const p=CORE()?.getProfile?.()||{};p.coins=Number(p.coins||0)+Math.max(0,Math.round(amount));CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);}

async function startSolo(){
  config.region=$('geoRegion').value;config.rounds=Number($('geoRounds').value)||5;const b=$('geoSoloStart');b.disabled=true;b.textContent='PREPARANDO OSM...';
  try{const questions=await fetchRounds();mode='solo';solo={questions,index:0,score:0,answered:false};show('geoGameScreen');setTimeout(()=>displayRound(),100)}catch(e){toast('GeoGuess OpenStreetMap indisponível',e.message||String(e),'error')}finally{b.disabled=false;b.textContent='INICIAR SOLO ▶';}
}
function submitSolo(){if(!selected||solo?.answered)return;const q=currentQ(),km=hav(selected.lat,selected.lng,q.lat,q.lng),pts=scoreDistance(km);solo.answered=true;solo.score+=pts;$('geoScoreLabel').textContent=solo.score;reveal(q,selected,km,pts);$('geoSubmitGuess').classList.add('hidden');$('geoNextRound').classList.remove('hidden');awardCoins(Math.max(1,Math.min(6,Math.round(pts/1000))));}
function nextSolo(){if(!solo)return;if(solo.index>=solo.questions.length-1){const p=CORE()?.getProfile?.()||{};p.gamesPlayed=Number(p.gamesPlayed||0)+1;p.gamesWon=Number(p.gamesWon||0)+1;p.geoPlayed=Number(p.geoPlayed||0)+1;p.geoBestScore=Math.max(Number(p.geoBestScore||0),solo.score);p.highScore=Math.max(Number(p.highScore||0),solo.score);p.coins=Number(p.coins||0)+4;window.GameGuessRanked?.record?.(p,{kind:'geoguess',score:solo.score,mode:'solo',universe:'geoguess',challenge:config.region,difficulty:'leaflet-osm-explorer',correct:solo.questions.length,wrong:0,won:true});CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);CORE()?.spawnConfetti?.();toast('GeoGuess concluído',`${solo.score.toLocaleString('pt-BR')} / ${(solo.questions.length*5000).toLocaleString('pt-BR')} pontos • +4 personalização`);solo=null;return show('geoSetupScreen');}solo.index++;solo.answered=false;displayRound();}

function user(){return FB()?.getUser?.()}
function players(){return Object.values(room?.players||{}).filter(p=>!p.left).sort((a,b)=>Number(a.slot||99)-Number(b.slot||99))}
function myPlayer(){const u=user();return u?room?.players?.[u.uid]:null}
function online(uid){return Object.keys(room?.presence?.[uid]||{}).length>0}
function renderWaiting(){if(!room)return;$('geoWaiting').classList.remove('hidden');$('geoRoomCode').textContent=roomCode;$('geoWaitingPlayers').innerHTML=players().map(p=>`<div><span>${p.uid===room.hostUid?'👑':'🌍'}</span><b>${esc(p.name)}</b><small>${online(p.uid)?'🟢 online':'🟡 reconectando'}</small></div>`).join('');$('geoWaitingStatus').textContent=`${players().length}/${room.config?.maxPlayers||2} jogadores na sala`;$('geoStartRoom').classList.toggle('hidden',room.hostUid!==user()?.uid);$('geoStartRoom').disabled=players().length<2;}
function renderScoreboard(){if(mode!=='arena'||!room)return;$('geoScoreboard').classList.remove('hidden');$('geoScoreRows').innerHTML=players().sort((a,b)=>Number(b.score||0)-Number(a.score||0)).map((p,i)=>`<div><span>#${i+1}</span><b>${esc(p.name)}</b><small>${Number(p.submittedRound)===Number(room.roundIndex)?`✅ ${fmtDistance(Number(p.distanceKm||0))}`:'🚶 explorando'}</small><strong>${Number(p.score||0).toLocaleString('pt-BR')}</strong></div>`).join('');}
async function createRoom(){if(!user())return toast('Login necessário','Entre na sua conta para criar uma Arena GeoGuess.','error');config.region=$('geoRegion').value;config.rounds=Number($('geoRounds').value)||5;config.maxPlayers=Number($('geoMaxPlayers').value)||2;const b=$('geoCreateRoom');b.disabled=true;b.textContent='PREPARANDO OSM...';try{const questions=await fetchRounds();roomCode=await FB().createGeoRoom({questions,region:config.region,maxPlayers:config.maxPlayers});localStorage.setItem('gameGuessLastGeoRoom',roomCode);mode='arena';watchRoom(roomCode);$('geoWaiting').classList.remove('hidden');toast('Sala criada',`Código ${roomCode}`)}catch(e){toast('Erro ao criar sala',e.message||String(e),'error')}finally{b.disabled=false;b.textContent='CRIAR SALA';}}
async function joinRoom(){if(!user())return toast('Login necessário','Entre na sua conta para entrar na Arena GeoGuess.','error');const code=String($('geoJoinCode').value||'').trim().toUpperCase();try{roomCode=await FB().joinGeoRoom(code);localStorage.setItem('gameGuessLastGeoRoom',roomCode);mode='arena';watchRoom(roomCode);$('geoWaiting').classList.remove('hidden');toast('Conectado',`Você entrou em ${roomCode}`)}catch(e){toast('Não consegui entrar',e.message||String(e),'error')}}
function watchRoom(code){unsub?.();unsub=FB().watchGeoRoom(code,(r,e)=>{if(e)return toast('GeoGuess',e.message||'Falha na sala.','error');room=r;if(!r){roomCode='';$('geoWaiting')?.classList.add('hidden');return;}FB()?.ensureGeoHost?.(code);if(r.status==='waiting'){show('geoSetupScreen');renderWaiting()}else if(r.status==='playing'){show('geoGameScreen');const idx=Number(r.roundIndex||0);if(lastRenderedRound!==idx){lastRenderedRound=idx;displayRound()}else{renderScoreboard();maybeRevealArena();}ensureArenaTicker()}else if(r.status==='finished'){show('geoGameScreen');renderScoreboard();finishArena();}})}
async function startRoom(){try{await FB().startGeoRoom(roomCode)}catch(e){toast('Não consegui iniciar',e.message||String(e),'error')}}
async function submitArena(){if(!selected||isLocked())return;const q=currentQ(),idx=Number(room.roundIndex||0),km=hav(selected.lat,selected.lng,q.lat,q.lng),pts=scoreDistance(km),g={...selected},walkSteps=steps;$('geoSubmitGuess').disabled=true;try{await FB().mutateGeoRoom(roomCode,(r,uid)=>{const p=r.players?.[uid];if(!p||Number(p.submittedRound)===idx||Number(r.roundIndex)!==idx)return;p.submittedRound=idx;p.guessLat=g.lat;p.guessLng=g.lng;p.distanceKm=Math.round(km*10)/10;p.roundScore=pts;p.score=Number(p.score||0)+pts;p.steps=walkSteps;return r;});awardCoins(Math.max(1,Math.min(5,Math.round(pts/1200))))}catch(e){toast('Palpite',e.message||String(e),'error')}}
function allSubmitted(){const idx=Number(room?.roundIndex||0);return players().length>0&&players().every(p=>Number(p.submittedRound)===idx)}
function maybeRevealArena(){if(!room||room.status!=='playing')return;const me=myPlayer(),idx=Number(room.roundIndex||0),q=currentQ();if(Number(me?.submittedRound)===idx&&me?.guessLat!=null&&!targetMarker)reveal(q,{lat:me.guessLat,lng:me.guessLng},Number(me.distanceKm||0),Number(me.roundScore||0));if(allSubmitted()&&room.hostUid===user()?.uid&&advanceScheduled!==idx){advanceScheduled=idx;setTimeout(()=>advanceArena(idx),4000)}}
async function advanceArena(idx){if(!room||room.status!=='playing'||Number(room.roundIndex)!==idx||room.hostUid!==user()?.uid)return;try{await FB().mutateGeoRoom(roomCode,(r)=>{if(Number(r.roundIndex)!==idx)return r;const total=Number(r.config?.rounds||r.questions?.length||5);if(idx>=total-1){r.status='finished';r.roundState='finished';r.finishedAt=Date.now();r.expiresAt=Date.now()+2*60*60*1000;const list=Object.values(r.players||{}).sort((a,b)=>Number(b.score||0)-Number(a.score||0));r.winnerUid=list[0]?.uid||'';return r;}r.roundIndex=idx+1;r.roundDeadline=Date.now()+60000;r.roundState='playing';for(const p of Object.values(r.players||{})){p.roundScore=0;p.distanceKm=0;p.guessLat=null;p.guessLng=null;p.steps=0;}return r;});}catch{}}
function ensureArenaTicker(){if(tick)return;tick=setInterval(async()=>{if(!room||room.status!=='playing')return;const left=Math.max(0,Math.ceil((Number(room.roundDeadline||0)-(FB()?.serverNow?.()||Date.now()))/1000));if($('geoTimerLabel'))$('geoTimerLabel').textContent=`⏱️ ${left}`;if(left<=0&&room.hostUid===user()?.uid&&!allSubmitted()){const idx=Number(room.roundIndex||0);await FB().mutateGeoRoom(roomCode,r=>{for(const p of Object.values(r.players||{})){if(Number(p.submittedRound)!==idx){p.submittedRound=idx;p.guessLat=0;p.guessLng=0;p.distanceKm=20000;p.roundScore=0;p.steps=0;}}return r;}).catch(()=>{});}},500)}
function finishArena(){if(tick){clearInterval(tick);tick=null}const u=user();if(!u||!room)return;const key=`ggGeoRecorded:${room.code}:${u.uid}`;if(!localStorage.getItem(key)){localStorage.setItem(key,'1');const p=CORE()?.getProfile?.()||{},won=room.winnerUid===u.uid;p.geoPlayed=Number(p.geoPlayed||0)+1;p.geoWins=Number(p.geoWins||0)+(won?1:0);p.gamesPlayed=Number(p.gamesPlayed||0)+1;if(won)p.gamesWon=Number(p.gamesWon||0)+1;p.geoBestScore=Math.max(Number(p.geoBestScore||0),Number(myPlayer()?.score||0));p.coins=Number(p.coins||0)+(won?12:4);window.GameGuessRanked?.record?.(p,{kind:'geoguess-arena',score:Number(myPlayer()?.score||0),mode:`${players().length}-players`,universe:'geoguess',challenge:room.config?.region||'world',difficulty:'leaflet-osm-arena',correct:Number(room.config?.rounds||0),wrong:0,won,players:players().length});CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);if(won)CORE()?.spawnConfetti?.();toast(won?'🏆 Você venceu o GeoGuess!':'GeoGuess finalizado',`${Number(myPlayer()?.score||0).toLocaleString('pt-BR')} pontos • +${won?12:4} personalização`);}const winner=room.players?.[room.winnerUid];$('geoFeedback').innerHTML=`🏆 Vencedor: <b>${esc(winner?.name||'Jogador')}</b> • ${Number(winner?.score||0).toLocaleString('pt-BR')} pontos`;}
async function leaveRoom(){if(roomCode)await FB()?.leaveGeoRoom?.(roomCode).catch(()=>{});unsub?.();unsub=null;room=null;roomCode='';localStorage.removeItem('gameGuessLastGeoRoom');lastRenderedRound=-1;advanceScheduled=-1;$('geoWaiting')?.classList.add('hidden');if(tick){clearInterval(tick);tick=null}show('geoSetupScreen')}
function quit(){roundToken++;if(mode==='arena'&&roomCode)return leaveRoom();solo=null;show('geoSetupScreen')}
function toggleMap(){const c=$('geoMapCard');if(!c)return;c.classList.toggle('geo-map-expanded');setTimeout(()=>map?.invalidateSize?.(),180)}
function open(arena=false){show('geoSetupScreen');if(arena)setTimeout(()=>$('geoCreateRoom')?.scrollIntoView({behavior:'smooth',block:'center'}),100)}
function bind(){inject();$('homeGeoButton')?.addEventListener('click',()=>open(false));$('homeGeoArenaButton')?.addEventListener('click',()=>open(true));$('geoBack')?.addEventListener('click',()=>show('homeScreen'));$('geoSoloStart')?.addEventListener('click',startSolo);$('geoSubmitGuess')?.addEventListener('click',()=>mode==='solo'?submitSolo():submitArena());$('geoNextRound')?.addEventListener('click',nextSolo);$('geoCreateRoom')?.addEventListener('click',createRoom);$('geoJoinRoom')?.addEventListener('click',joinRoom);$('geoStartRoom')?.addEventListener('click',startRoom);$('geoLeaveRoom')?.addEventListener('click',leaveRoom);$('geoQuit')?.addEventListener('click',quit);$('geoReturnStart')?.addEventListener('click',returnToStart);$('geoMapToggle')?.addEventListener('click',toggleMap);$('geoCopyCode')?.addEventListener('click',()=>navigator.clipboard?.writeText(roomCode).then(()=>toast('Código copiado',roomCode)));window.addEventListener('gameguess:authchange',e=>{if(!e.detail?.user&&roomCode)leaveRoom()});}
window.GameGuessGeo={open,retryRound};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
