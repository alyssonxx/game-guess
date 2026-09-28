(() => {
'use strict';
const $=id=>document.getElementById(id), CORE=()=>window.GameGuessCore, FB=()=>window.GameGuessFirebase;
const GEO_VERSION='21.0.0';
const CAMERA_FOV=55;
const REGIONS={brazil:['🇧🇷','Brasil'],world:['🌍','Mundo todo'],americas:['🌎','Américas'],europe:['🏰','Europa'],asia:['🌏','Ásia'],africa:['🦁','África'],oceania:['🌊','Oceania']};
const GEO_ROUND_SECONDS=300;
const GEO_GUESS_PENALTY_MS=50000;
let L=null,geoProvider='';
const googleGeo=()=>window.GameGuessGoogle;
async function ensureGeoProvider(){
  if(geoProvider)return geoProvider;
  const {r,d}=await fetchJsonWithTimeout('/api/geoguess-config',8000);
  if(!r.ok)throw new Error(d?.message||'Não foi possível carregar a configuração do GeoGuess.');
  geoProvider=d?.provider==='google'?'google':'mapillary';
  document.body.classList.toggle('geo-google-provider',geoProvider==='google');
  return geoProvider;
}
let config={region:'brazil',rounds:5,maxPlayers:2,difficulty:'normal'};
let solo=null, map=null, guessMarker=null, targetMarker=null, line=null, selected=null;
let roomCode='',room=null,unsub=null,mode='solo',lastRenderedRound=-1,advanceScheduled=-1,tick=null,soloTick=null;
let mapillaryPromise=null,leafletPromise=null,mapillaryToken='',viewer=null,roundStartImageId='',lastImageId='',steps=0,suppressStep=false,roundToken=0;
let activeSequenceIds=[],activeSequenceIndex=-1,activeSequenceId='',sequenceMoveBusy=false;
let continuationSearchBusy=false,navStatusTimer=null;
const sequenceCache=new Map(),imageMetaCache=new Map(),continuationCache=new Map();

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));}
function show(id){if(!$(id)?.classList.contains('active'))CORE()?.showScreen?.(id);setTimeout(()=>map?.invalidateSize?.(),120)}
function toast(a,b,t=''){CORE()?.toast?.(a,b,t)}
function fmtDistance(km){if(km<1)return `${Math.round(km*1000).toLocaleString('pt-BR')} m`;return `${km<100?km.toFixed(1):Math.round(km).toLocaleString('pt-BR')} km`;}
function inject(){
  const main=document.querySelector('main.shell');if(!main||$('geoSetupScreen'))return;
  $('homeGeoguessButton')?.closest('.feature-card')?.classList.add('geo-home-card');
  main.insertAdjacentHTML('beforeend',`
  <section class="screen geo-setup-screen" id="geoSetupScreen">
    <div class="section-heading geo-section-heading"><button class="back-link" id="geoBack">← Voltar</button><div><p class="eyebrow">🌍 GEOGUESS ARENA</p><h2>Onde no mundo?</h2><p>Explore imagens reais de rua, siga as pistas e fixe seu palpite no mapa antes que o relógio acabe.</p></div></div>
    <div class="geo-setup-layout">
      <section class="geo-setup-card geo-solo-card"><div class="geo-card-kicker">JOGUE NO SEU RITMO</div><h3>🎮 Partida solo</h3><label>Região<select id="geoRegion"></select></label><div class="geo-mode-explain"><b>⏱️ 5 minutos por rodada</b><span>Pontuação pela distância, com as mesmas regras para todos.</span></div><label>Rodadas<select id="geoRounds"><option value="3">3 rodadas</option><option value="5" selected>5 rodadas</option><option value="8">8 rodadas</option></select></label><div class="geo-mode-explain"><b>🚶 Movimento liberado</b><span>Avance pelas imagens, arraste para olhar ao redor e use as pistas do cenário antes de marcar o mapa.</span></div><button class="primary-btn huge" id="geoSoloStart">INICIAR SOLO ▶</button></section>
      <section class="geo-setup-card geo-arena-card"><div class="geo-card-kicker">DESAFIE AMIGOS</div><h3>⚔️ Arena online</h3><label>Região<select id="geoArenaRegion"></select></label><div class="geo-mode-explain"><b>⏱️ 5 minutos por rodada</b><span>Os dois primeiros palpites confirmados retiram 50 segundos cada do relógio de todos.</span></div><div class="geo-arena-options"><label>Rodadas<select id="geoArenaRounds"><option value="3">3 rodadas</option><option value="5" selected>5 rodadas</option><option value="8">8 rodadas</option></select></label><label>Jogadores<select id="geoMaxPlayers">${[2,3,4,5,6,7,8].map(n=>`<option value="${n}">${n} jogadores${n===2?' — 1x1':''}</option>`).join('')}</select></label></div><div class="geo-room-actions"><button class="primary-btn" id="geoCreateRoom">CRIAR SALA</button><div class="geo-join"><input id="geoJoinCode" maxlength="6" placeholder="ABC123" autocomplete="off" aria-label="Código da sala"><button class="secondary-btn" id="geoJoinRoom">ENTRAR</button></div></div><small>Todos recebem a mesma sequência, com cronômetro e placar ao vivo. É preciso entrar na conta para jogar online.</small></section>
      <section class="geo-waiting hidden" id="geoWaiting"><div class="geo-room-code"><span>SALA</span><b id="geoRoomCode">------</b><button class="icon-btn" id="geoCopyCode" aria-label="Copiar código da sala" title="Copiar código da sala">📋</button></div><div id="geoWaitingPlayers" class="geo-waiting-players"></div><div id="geoWaitingStatus"></div><button class="primary-btn huge" id="geoStartRoom">INICIAR PARTIDA</button><button class="secondary-btn" id="geoLeaveRoom">SAIR DA SALA</button></section>
    </div>
  </section>
  <section class="screen geo-game-screen" id="geoGameScreen">
    <div class="geo-game-top"><button class="back-link" id="geoQuit">← Sair</button><div class="geo-game-metrics"><span id="geoModeBadge">🌍 SOLO</span><span>🧭 <b id="geoRoundLabel">1/5</b></span><span>⭐ <b id="geoScoreLabel">0</b></span><span>🚶 <b id="geoStepLabel">0</b></span><span id="geoTimerLabel" class="hidden">⏱️ 60</span></div></div>
    <div class="geo-stage" id="geoStage">
      <section class="geo-street-card">
        <div id="geoStreetView" class="geo-street-view" aria-label="Imagem de rua da rodada"></div>
        <div class="geo-street-loading" id="geoStreetLoading" role="status"><div class="geo-spinner"></div><b>Preparando imagens da rua...</b><span>Procurando uma sequência de imagens de rua navegável.</span></div>
        <div class="geo-street-toolbar"><button id="geoReturnStart" class="geo-float-btn" title="Voltar ao ponto inicial">↩️ INÍCIO</button><span id="geoMoveHint">🚶 Avance pelas imagens para encontrar pistas • © Mapillary</span></div>
      </section>
      <section class="geo-map-card" id="geoMapCard">
        <div class="geo-map-head"><b>📍 SEU PALPITE</b><button class="geo-map-toggle" id="geoMapToggle" title="Expandir/recolher mapa" aria-label="Expandir ou recolher o mapa">⛶</button></div>
        <div id="geoMap" class="geo-map" aria-label="Mapa para marcar seu palpite"></div>
        <div class="geo-map-actions"><button class="primary-btn" id="geoSubmitGuess" disabled>📍 CONFIRMAR LOCAL</button><button class="primary-btn hidden" id="geoNextRound">PRÓXIMA RODADA ▶</button></div>
        <div id="geoFeedback" class="geo-feedback" aria-live="polite">Clique no mapa para colocar seu palpite.</div>
      </section>
    </div>
    <section class="geo-scoreboard hidden" id="geoScoreboard"><h3>🏆 Placar da Arena</h3><div id="geoScoreRows"></div></section>
  </section>`);
  const regions=Object.entries(REGIONS).map(([k,[i,n]])=>`<option value="${k}">${i} ${n}</option>`).join('');
  for(const id of ['geoRegion','geoArenaRegion']){const sel=$(id);if(sel)sel.innerHTML=regions;}
}

function fetchJsonWithTimeout(url,ms=8000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);
  return fetch(url,{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}})
    .then(async r=>({r,d:await r.json().catch(()=>({}))}))
    .finally(()=>clearTimeout(timer));
}
async function ensureMapillaryToken(){
  if(mapillaryToken)return mapillaryToken;
  let result;
  try{result=await fetchJsonWithTimeout('/api/geoguess-config',7000)}catch(e){
    if(e?.name==='AbortError')throw new Error('A configuração do Mapillary demorou demais para responder. Faça um novo deploy no Vercel e tente novamente.');
    throw new Error('Não consegui carregar a configuração do Mapillary.');
  }
  const {r,d:cfg}=result;
  if(!r.ok||!cfg.enabled||!cfg.token)throw new Error('O GeoGuess precisa do MAPILLARY_ACCESS_TOKEN no Vercel. Use o Client Token (MLY|...) do aplicativo Mapillary.');
  mapillaryToken=String(cfg.token);
  if(!mapillaryToken.startsWith('MLY|'))throw new Error('O token configurado não parece ser um Client Token do Mapillary (deve começar com MLY|).');
  return mapillaryToken;
}
function loadScriptWithTimeout(src,id,isReady,ms=9000){
  return new Promise((resolve,reject)=>{
    let timer=null;
    const finish=(err)=>{if(timer)clearTimeout(timer);err?reject(err):resolve();};
    let el=document.getElementById(id);
    if(el){
      if(isReady())return resolve();
      el.addEventListener('load',()=>isReady()?finish():finish(new Error('A biblioteca carregou, mas não foi inicializada.')),{once:true});
      el.addEventListener('error',()=>{el.remove();finish(new Error('Falha ao carregar MapillaryJS.'));},{once:true});
    }else{
      el=document.createElement('script');el.id=id;el.src=src;el.async=true;
      el.onload=()=>isReady()?finish():finish(new Error('A biblioteca carregou, mas não foi inicializada.'));
      el.onerror=()=>{el.remove();finish(new Error('Falha ao carregar a biblioteca necessária.'));};
      document.head.appendChild(el);
    }
    timer=setTimeout(()=>{try{el?.remove()}catch{};reject(new Error('Tempo esgotado ao carregar a biblioteca necessária.'));},ms);
  });
}
function loadStylesheet(href,id,fallbackHref=''){
  if(document.getElementById(id))return;
  const link=document.createElement('link');link.id=id;link.rel='stylesheet';link.href=href;
  if(fallbackHref)link.onerror=()=>{if(link.href!==fallbackHref)link.href=fallbackHref;};
  document.head.appendChild(link);
}
async function ensureMapillary(){
  if(window.mapillary?.Viewer&&mapillaryToken)return window.mapillary;
  if(mapillaryPromise)return mapillaryPromise;
  mapillaryPromise=(async()=>{
    await ensureMapillaryToken();
    loadStylesheet('https://cdn.jsdelivr.net/npm/mapillary-js@4.1.2/dist/mapillary.css','gameGuessMapillaryCss','https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.css');
    if(!window.mapillary?.Viewer){
      try{await loadScriptWithTimeout('https://cdn.jsdelivr.net/npm/mapillary-js@4.1.2/dist/mapillary.js','gameGuessMapillaryJs',()=>Boolean(window.mapillary?.Viewer),9000)}
      catch{
        document.getElementById('gameGuessMapillaryJs')?.remove();
        await loadScriptWithTimeout('https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.js','gameGuessMapillaryJs',()=>Boolean(window.mapillary?.Viewer),9000);
      }
    }
    if(!window.mapillary?.Viewer)throw new Error('O MapillaryJS não inicializou. Verifique bloqueadores de conteúdo ou a rede.');
    return window.mapillary;
  })();
  try{return await mapillaryPromise}catch(e){mapillaryPromise=null;throw e}
}

async function ensureLeaflet(){
  if(window.L?.map)return window.L;
  if(leafletPromise)return leafletPromise;
  leafletPromise=(async()=>{
    loadStylesheet('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css','gameGuessLeafletCss','https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    try{await loadScriptWithTimeout('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js','gameGuessLeafletJs',()=>Boolean(window.L?.map),9000);}
    catch{
      document.getElementById('gameGuessLeafletJs')?.remove();
      await loadScriptWithTimeout('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','gameGuessLeafletJs',()=>Boolean(window.L?.map),9000);
    }
    if(!window.L?.map)throw new Error('Não consegui inicializar o mapa de palpite. Verifique sua conexão e tente novamente.');
    return window.L;
  })();
  try{return await leafletPromise}catch(e){leafletPromise=null;throw e}
}
async function ensureGuessMap(){
  if(map)return map;
  await ensureGeoProvider();
  if(geoProvider==='google'){await googleGeo().ensure();L=googleGeo().mapLibrary();}else L=await ensureLeaflet();
  if(!$('geoMap'))throw new Error('A área do mapa não está disponível. Atualize a página e tente novamente.');
  map=L.map('geoMap',{worldCopyJump:true,minZoom:1,zoomControl:false,zoomSnap:.25,scrollWheelZoom:false}).setView([-14.2,-51.9],2);
  L.control.zoom({position:'topleft',zoomInTitle:'Aproximar mapa',zoomOutTitle:'Afastar mapa'}).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
  map.on('click',e=>{
    if(isLocked())return;
    const position=e.latlng.wrap();selected={lat:position.lat,lng:position.lng};
    if(guessMarker)guessMarker.setLatLng(position);else guessMarker=L.marker(position,{icon:L.divIcon({className:'geo-guess-pin',html:'<span></span>',iconSize:[26,26],iconAnchor:[13,13]}),title:'Seu palpite'}).addTo(map);
    $('geoSubmitGuess').disabled=false;$('geoFeedback').innerHTML=`📍 Palpite marcado. <span class="geo-muted">Você ainda pode mover o pino antes de confirmar.</span>`;
  });
  return map;
}
function clearMarkers(){
  if(!map)return;
  for(const marker of [guessMarker,targetMarker,line])if(marker)map.removeLayer(marker);
  guessMarker=targetMarker=line=null;selected=null;
  $('geoMapCard')?.classList.remove('geo-result-mode','geo-map-expanded','geo-map-minimized');
  $('geoMapToggle')?.setAttribute('aria-expanded','false');
  $('geoMapMinimize')?.setAttribute('aria-expanded','true');
  if($('geoMapMinimize'))$('geoMapMinimize').textContent='−';
  const region=mode==='arena'?room?.config?.region:config.region;
  const views={world:[[15,0],2],americas:[[5,-75],2],europe:[[50,15],3],asia:[[30,100],2],africa:[[0,20],2],oceania:[[-25,140],3]};
  setTimeout(()=>{
    map.invalidateSize();
    if(region==='brazil')map.fitBounds([[-34,-74],[6,-34]],{padding:[6,6],maxZoom:4});
    else {const [center,zoom]=views[region]||views.world;map.setView(center,zoom);}
  },220);
}
function hav(a,b,c,d){const R=6371,to=x=>x*Math.PI/180,dLat=to(c-a),dLon=to(d-b),x=Math.sin(dLat/2)**2+Math.cos(to(a))*Math.cos(to(c))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function scoreDistance(km,difficulty='normal'){
  const multiplier=1;
  const scoreConfig={distance:km,formula:'distanceBased',difficultyMultiplier:multiplier};
  const pts=window.GameGuessScoring?.calculateScore?.('geoguess',scoreConfig);
  return pts||Math.max(0,Math.round(5000*Math.exp(-km/1800)*multiplier));
}

function mlyGeometry(img){
  const g=img?.computed_geometry||img?.geometry,c=g?.coordinates;
  return Array.isArray(c)&&c.length>=2?{lng:Number(c[0]),lat:Number(c[1])}:null;
}
function mlyBbox(lat,lng,km=1.5){
  // Mantém a caixa pequena para evitar consultas pesadas no endpoint /images.
  const latPad=Math.min(.02,Math.max(.006,km/111.32));
  const rawLng=km/(111.32*Math.max(.35,Math.abs(Math.cos(lat*Math.PI/180))));
  const lngPad=Math.min(.02,Math.max(.006,rawLng));
  return [lng-lngPad,lat-latPad,lng+lngPad,lat+latPad].map(n=>Number(n.toFixed(6))).join(',');
}
function mlySequenceId(img){
  const raw=img?.sequence?.id??img?.sequence??'';
  return String(raw||'').trim();
}
function rememberMlyMeta(img){
  const id=String(img?.id||'').trim();if(!id)return img;
  const merged={...(imageMetaCache.get(id)||{})};
  for(const [k,v] of Object.entries(img||{}))if(v!==undefined&&v!==null&&v!=='')merged[k]=v;
  merged.id=id;imageMetaCache.set(id,merged);return merged;
}
function angleDelta(a,b){return ((Number(b)-Number(a)+540)%360)-180;}
function geoBearing(lat1,lng1,lat2,lng2){
  const to=x=>x*Math.PI/180,y=Math.sin(to(lng2-lng1))*Math.cos(to(lat2)),x=Math.cos(to(lat1))*Math.sin(to(lat2))-Math.sin(to(lat1))*Math.cos(to(lat2))*Math.cos(to(lng2-lng1));
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}
async function mapillaryImageMeta(imageId,timeoutMs=9000){
  const id=String(imageId||'').trim();if(!id)return null;
  const cached=imageMetaCache.get(id);if(cached&&mlyGeometry(cached)&&mlySequenceId(cached))return cached;
  const token=await ensureMapillaryToken(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const u=new URL(`https://graph.mapillary.com/${encodeURIComponent(id)}`);
    u.searchParams.set('access_token',token);
    u.searchParams.set('fields','id,computed_geometry,geometry,computed_compass_angle,compass_angle,camera_type,sequence,captured_at');
    const r=await fetch(u.toString(),{signal:controller.signal,headers:{Accept:'application/json'}}),d=await r.json().catch(()=>({}));
    if(!r.ok)return null;
    return rememberMlyMeta(d);
  }catch{return null}finally{clearTimeout(timer)}
}
function shuffled(list){
  const a=[...(list||[])];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
async function mapillarySequenceIds(sequenceId,timeoutMs=14000){
  const sid=String(sequenceId||'').trim();
  if(!sid)return [];
  const cached=sequenceCache.get(sid);
  if(cached?.length)return cached;
  const token=await ensureMapillaryToken();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const u=new URL('https://graph.mapillary.com/image_ids');
    u.searchParams.set('access_token',token);
    u.searchParams.set('sequence_id',sid);
    const r=await fetch(u.toString(),{signal:controller.signal,headers:{Accept:'application/json'}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){
      const msg=d?.error?.message||d?.message||d?.error||`Mapillary sequence HTTP ${r.status}`;
      const e=new Error(msg);e.status=r.status;throw e;
    }
    const ids=[...new Set((Array.isArray(d.data)?d.data:[]).map(x=>String(x?.id||'')).filter(Boolean))];
    if(ids.length)sequenceCache.set(sid,ids);
    return ids;
  }catch(e){
    if(e?.name==='AbortError'){const x=new Error('A sequência do Mapillary demorou demais para responder.');x.status=408;throw x;}
    throw e;
  }finally{clearTimeout(timer)}
}
async function mapillaryImageSequenceId(imageId,timeoutMs=10000){
  const id=String(imageId||'').trim();if(!id)return '';
  const token=await ensureMapillaryToken();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const u=new URL(`https://graph.mapillary.com/${encodeURIComponent(id)}`);
    u.searchParams.set('access_token',token);u.searchParams.set('fields','id,sequence');
    const r=await fetch(u.toString(),{signal:controller.signal,headers:{Accept:'application/json'}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)return '';
    return mlySequenceId(d);
  }catch{return ''}finally{clearTimeout(timer)}
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
async function mapillaryGraphImages(params,timeoutMs=18000){
  const token=await ensureMapillaryToken();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const u=new URL('https://graph.mapillary.com/images');
    u.searchParams.set('access_token',token);
    u.searchParams.set('fields','id,computed_geometry,geometry,computed_compass_angle,compass_angle,camera_type,sequence,captured_at');
    for(const [k,v] of Object.entries(params||{}))if(v!==undefined&&v!==null)u.searchParams.set(k,String(v));
    const r=await fetch(u.toString(),{signal:controller.signal,headers:{Accept:'application/json'}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){
      const msg=d?.error?.message||d?.message||d?.error||`Mapillary HTTP ${r.status}`;
      const e=new Error(msg);e.status=r.status;throw e;
    }
    const rows=Array.isArray(d.data)?d.data:[];
    rows.forEach(rememberMlyMeta);
    return rows;
  }catch(e){
    if(e?.name==='AbortError'){
      const x=new Error('Tempo esgotado ao consultar a cobertura do Mapillary.');
      x.status=408;throw x;
    }
    throw e;
  }finally{clearTimeout(timer)}
}
async function browserMapillaryImages(lat,lng){
  // Primeiro usa a busca por raio (mais leve e rápida, disponível na API atual).
  // Se não houver imagem a até 50 m do centro, cai para uma bbox pequena ao redor da cidade.
  let firstError=null;
  try{
    const nearby=await mapillaryGraphImages({lat,lng,radius:50,limit:20},12000);
    if(nearby.some(img=>img.camera_type==='spherical'))return nearby;
    if(nearby.length){
      // Look beyond the nearest flat photograph before falling back to it.
      try{const area=await mapillaryGraphImages({bbox:mlyBbox(lat,lng,1.5),limit:60},12000);return [...new Map([...area,...nearby].map(img=>[String(img.id),img])).values()];}catch{return nearby;}
    }
  }catch(e){
    firstError=e;
    if([400,401,403,429].includes(Number(e?.status)))throw e;
  }
  try{
    return await mapillaryGraphImages({bbox:mlyBbox(lat,lng,1.5),limit:30},20000);
  }catch(e){
    if(firstError&&!e?.status)e.status=firstError.status;
    throw e;
  }
}
async function resolveSeedInBrowser(seed){
  const items=await browserMapillaryImages(seed.lat,seed.lng);
  const usable=(items||[]).filter(x=>x?.id&&mlyGeometry(x)&&mlySequenceId(x));
  if(!usable.length)return null;
  const seqFrequency=new Map();
  for(const x of usable){const sid=mlySequenceId(x);seqFrequency.set(sid,(seqFrequency.get(sid)||0)+1);}
  const candidates=shuffled(usable).sort((a,b)=>{
    const sa=(String(a.camera_type||'').toLowerCase()==='spherical'?100:0)+(seqFrequency.get(mlySequenceId(a))||0);
    const sb=(String(b.camera_type||'').toLowerCase()==='spherical'?100:0)+(seqFrequency.get(mlySequenceId(b))||0);
    return sb-sa||(Number(b.captured_at)||0)-(Number(a.captured_at)||0);
  }).slice(0,4);
  let firstError=null;
  for(const img of candidates){
    const sid=mlySequenceId(img),g=mlyGeometry(img);if(!sid||!g)continue;
    try{
      const ids=await mapillarySequenceIds(sid,12000);
      if(ids.length<3||!ids.includes(String(img.id)))continue;
      const heading=Number(img.computed_compass_angle??img.compass_angle??0);
      return {id:`mly:${img.id}`,imageId:String(img.id),sequenceId:sid,sequenceLength:ids.length,lat:g.lat,lng:g.lng,country:seed.country,city:seed.city,region:seed.region,heading:Number.isFinite(heading)?heading:0,cameraType:String(img.camera_type||''),provider:'mapillary'};
    }catch(e){if(!firstError)firstError=e;}
  }
  if(firstError&&[400,401,403].includes(Number(firstError.status)))throw firstError;
  return null;
}
function updatePrepareProgress(found,wanted,checked,total){
  const label=`BUSCANDO RUAS ${found}/${wanted} • ${checked}/${total}`;
  for(const id of ['geoSoloStart','geoCreateRoom']){const b=$(id);if(b?.disabled)b.textContent=label;}
}
async function fetchRounds(){
  await ensureGeoProvider();
  if(geoProvider==='google')await googleGeo().begin();else await ensureMapillaryToken();
  const wanted=config.rounds;
  let data={};
  try{
    const {r,d}=await fetchJsonWithTimeout(`/api/geoguess?region=${encodeURIComponent(config.region)}&count=${wanted}`,8000);
    if(!r.ok)throw new Error(d?.error||`API GeoGuess HTTP ${r.status}`);
    data=d||{};
  }catch(e){
    if(e?.name==='AbortError')throw new Error('O servidor demorou para preparar as localizações. Tente novamente.');
    throw e;
  }
  const seeds=Array.isArray(data.seeds)?data.seeds:[];
  if(!seeds.length)throw new Error('O servidor não retornou locais candidatos para esta região.');
  if(geoProvider==='google')return googleGeo().resolveSeeds(seeds,wanted);
  const resolved=[];let firstError=null,checked=0;
  // Busca paralela no navegador: evita o timeout de funções serverless do Vercel.
  for(let i=0;i<seeds.length&&resolved.length<wanted;i+=4){
    const batch=seeds.slice(i,i+4);
    const results=await Promise.all(batch.map(async seed=>{
      try{return {q:await resolveSeedInBrowser(seed)}}catch(e){return {e}}
    }));
    checked+=batch.length;
    for(const result of results){
      if(result.e&&!firstError)firstError=result.e;
      const q=result.q;
      if(q&&!resolved.some(x=>x.imageId===q.imageId))resolved.push(q);
      if(resolved.length>=wanted)break;
    }
    updatePrepareProgress(resolved.length,wanted,checked,seeds.length);
    if(firstError&&[400,401,403].includes(Number(firstError.status)))break;
  }
  if(resolved.length>=wanted){
    // Pré-carrega o viewer sem bloquear o botão de início.
    ensureMapillary().catch(()=>{});
    return resolved.slice(0,wanted);
  }
  if(firstError){
    const auth=[400,401,403].includes(Number(firstError.status));
    throw new Error(auth?`O Mapillary recusou o Client Token (${firstError.status}). Confirme a permissão READ no Developer Dashboard e atualize MAPILLARY_ACCESS_TOKEN no Vercel. Detalhe: ${firstError.message}`:`Não consegui consultar cobertura suficiente do Mapillary. ${firstError.message}`);
  }
  throw new Error(`Encontrei apenas ${resolved.length} de ${wanted} locais com imagens Mapillary. Tente novamente ou escolha outra região com melhor cobertura (World, Europe ou Americas têm melhor cobertura).`);
}

function currentQ(){return mode==='solo'?solo?.questions?.[solo.index]:room?.questions?.[Number(room.roundIndex||0)]}
function isLocked(){if(mode==='solo')return Boolean(solo?.answered);const me=myPlayer();return !room||room.status!=='playing'||Number(me?.submittedRound)===Number(room.roundIndex);}

function setNavStatus(text,kind=''){
  const el=$('geoSeqPosition');if(!el)return;
  el.dataset.kind=kind||'';
  if(text)el.innerHTML=text;
  if(navStatusTimer){clearTimeout(navStatusTimer);navStatusTimer=null;}
}
function navIndex(){
  let idx=activeSequenceIds.indexOf(String(lastImageId||roundStartImageId||''));
  if(idx<0)idx=activeSequenceIndex;
  if(idx>=0)activeSequenceIndex=idx;
  return idx;
}
function ensureSequenceControls(){
  if($('geoSequenceNav'))return;
  const card=document.querySelector('.geo-street-card');if(!card)return;
  const style=document.createElement('style');style.id='geoSequenceNavStyle';style.textContent=`
    .geo-sequence-nav{position:absolute;left:50%;bottom:54px;transform:translateX(-50%);z-index:24;display:grid;grid-template-columns:minmax(94px,auto) minmax(142px,auto) minmax(94px,auto);align-items:center;gap:8px;padding:8px;border:1px solid rgba(122,230,255,.34);border-radius:16px;background:rgba(7,18,34,.9);backdrop-filter:blur(10px);box-shadow:0 12px 34px rgba(0,0,0,.34);user-select:none}
    .geo-sequence-nav button{height:42px;border:1px solid rgba(122,230,255,.32);border-radius:11px;background:#10243a;color:#fff;font:800 12px/1 inherit;letter-spacing:.02em;cursor:pointer;transition:.14s ease}
    .geo-sequence-nav button:hover:not(:disabled){background:#173a57;transform:translateY(-1px)}
    .geo-sequence-nav button:active:not(:disabled){transform:translateY(1px) scale(.98)}
    .geo-sequence-nav button:disabled{opacity:.35;cursor:not-allowed}
    .geo-sequence-pos{min-width:142px;text-align:center;color:#d8f7ff;font:800 12px/1.18 inherit;white-space:nowrap}
    .geo-sequence-pos small{display:block;color:#8ca5bc;font-weight:600;margin-top:3px}
    .geo-sequence-pos[data-kind="busy"]{color:#7ae6ff}.geo-sequence-pos[data-kind="route"]{color:#9fffae}.geo-sequence-pos[data-kind="warn"]{color:#ffd37a}
    .geo-play-tools{position:absolute;left:14px;top:14px;z-index:25;display:flex;gap:7px}
    .geo-play-tools button{width:38px;height:38px;border:1px solid rgba(122,230,255,.3);border-radius:10px;background:rgba(7,18,34,.82);color:#fff;cursor:pointer;font-size:16px;backdrop-filter:blur(8px)}
    .geo-play-tools button:hover{background:#173a57}
    .geo-street-card:fullscreen{background:#050b13}.geo-street-card:fullscreen .geo-street-view{height:100vh!important;border-radius:0}.geo-street-card:fullscreen .geo-street-toolbar{z-index:25}
    @media(max-width:760px){.geo-sequence-nav{bottom:50px;grid-template-columns:76px minmax(112px,1fr) 76px;max-width:calc(100% - 22px);width:auto}.geo-sequence-nav button{font-size:10px}.geo-sequence-pos{min-width:108px}.geo-play-tools{left:10px;top:10px}}
  `;document.head.appendChild(style);
  card.insertAdjacentHTML('beforeend',`<div class="geo-play-tools" id="geoPlayTools"><button id="geoMapHotkey" type="button" title="Abrir/recolher mapa (M)">🗺️</button><button id="geoFullscreen" type="button" title="Tela cheia (F)">⛶</button></div><div class="geo-sequence-nav" id="geoSequenceNav" aria-label="Navegação da rua"><button id="geoSeqPrev" type="button" title="Voltar (S, A, ↓ ou ←)">◀ VOLTAR</button><span class="geo-sequence-pos" id="geoSeqPosition">CARREGANDO<small>W/S • setas • espaço avança</small></span><button id="geoSeqNext" type="button" title="Avançar (W, D, ↑, → ou Espaço)">AVANÇAR ▶</button></div>`);
  $('geoSeqPrev')?.addEventListener('click',()=>moveSequence(-1));
  $('geoSeqNext')?.addEventListener('click',()=>moveSequence(1));
  $('geoSeqPrev').title='Imagem anterior (S ou ↓)';
  $('geoSeqNext').title='Próxima imagem (W ou ↑)';
  $('geoSeqPrev').textContent='↓';$('geoSeqPrev').setAttribute('aria-label','Voltar pela rua');
  $('geoSeqNext').textContent='↑';$('geoSeqNext').setAttribute('aria-label','Avançar pela rua');
  $('geoMapHotkey')?.addEventListener('click',toggleMap);
  $('geoFullscreen')?.addEventListener('click',toggleGeoFullscreen);
  const tools=$('geoPlayTools');
  tools.insertAdjacentHTML('beforeend','<button id="geoResetCamera" type="button" title="Centralizar câmera" aria-label="Centralizar câmera">◎</button>');
  $('geoResetCamera').addEventListener('click',resetCamera);
  tools.insertAdjacentHTML('beforeend','<button id="geoZoomIn" type="button" title="Aproximar imagem" aria-label="Aproximar imagem">+</button><button id="geoZoomOut" type="button" title="Afastar imagem" aria-label="Afastar imagem">−</button><div class="geo-compass" title="Orientação da câmera"><span id="geoCompassNeedle" aria-hidden="true">▲</span><b id="geoCompassLabel">N</b></div>');
  $('geoZoomIn').addEventListener('click',()=>zoomStreet(-10));
  $('geoZoomOut').addEventListener('click',()=>zoomStreet(10));
  $('geoMapToggle').insertAdjacentHTML('beforebegin','<button type="button" class="geo-map-toggle" id="geoMapMinimize" title="Ocultar ou mostrar minimapa" aria-label="Ocultar ou mostrar minimapa" aria-expanded="true">−</button>');
  $('geoMapMinimize').addEventListener('click',()=>{const hidden=$('geoMapCard').classList.toggle('geo-map-minimized');$('geoMapMinimize').textContent=hidden?'+':'−';$('geoMapMinimize').setAttribute('aria-expanded',String(!hidden));setTimeout(()=>map?.invalidateSize?.(),220);});
  document.addEventListener('fullscreenchange',()=>{viewer?.resize?.();map?.invalidateSize?.();});
}
function updateSequenceControls(){
  ensureSequenceControls();
  if(geoProvider==='google'){
    const locked=isLocked();googleGeo().lock(locked);
    if($('geoSeqPrev'))$('geoSeqPrev').disabled=locked;
    if($('geoSeqNext'))$('geoSeqNext').disabled=locked;
    if($('geoSeqPosition'))$('geoSeqPosition').innerHTML='STREET VIEW<small>Use as setas da rua ou W/S</small>';
    return;
  }
  const prev=$('geoSeqPrev'),next=$('geoSeqNext'),label=$('geoSeqPosition'),locked=isLocked(),idx=navIndex(),total=activeSequenceIds.length;
  if(label&&!sequenceMoveBusy&&!continuationSearchBusy&&!navStatusTimer){
    const edge=total&&idx>=0&&((idx===0)||(idx===total-1));
    label.dataset.kind=edge?'route':'';
    label.innerHTML=total&&idx>=0?`🚶 ${idx+1}/${total}<small>${edge?'Fim do trecho • use as setas da rua':'W/S • ↑/↓ para caminhar'}</small>`:`EXPLORAR<small>Use as setas na imagem</small>`;
  }
  const disabled=locked||sequenceMoveBusy||continuationSearchBusy;
  if(prev)prev.disabled=disabled||idx<=0;
  if(next)next.disabled=disabled||idx<0||idx>=total-1;
}
async function activateSequenceForImage(imageId,sequenceId=''){
  const id=String(imageId||'').trim();if(!id)return [];
  let sid=String(sequenceId||'').trim();
  if(!sid){const meta=await mapillaryImageMeta(id);sid=mlySequenceId(meta);}
  if(!sid)sid=await mapillaryImageSequenceId(id);
  if(!sid)return [];
  const ids=await mapillarySequenceIds(sid,14000);
  const start=ids.indexOf(id);if(ids.length<2||start<0)return [];
  activeSequenceId=sid;activeSequenceIds=ids;activeSequenceIndex=start;updateSequenceControls();return ids;
}
async function prepareRoundSequence(q){
  activeSequenceIds=[];activeSequenceIndex=-1;activeSequenceId='';sequenceMoveBusy=false;continuationSearchBusy=false;updateSequenceControls();
  let sid=String(q?.sequenceId||'').trim();
  if(!sid)sid=await mapillaryImageSequenceId(q?.imageId);
  if(sid&&!q.sequenceId)q.sequenceId=sid;
  return activateSequenceForImage(q?.imageId,sid);
}
async function findNearbyContinuation(direction){
  const currentId=String(lastImageId||roundStartImageId||'').trim();if(!currentId)return null;
  const key=`${currentId}:${direction<0?'back':'forward'}`;if(continuationCache.has(key))return continuationCache.get(key);
  const meta=await mapillaryImageMeta(currentId);const g=mlyGeometry(meta);if(!g){continuationCache.set(key,null);return null;}
  const baseHeading=Number(meta?.computed_compass_angle??meta?.compass_angle??0),wanted=(Number.isFinite(baseHeading)?baseHeading:0)+(direction<0?180:0);
  let nearby=[];try{nearby=await mapillaryGraphImages({lat:g.lat,lng:g.lng,radius:45,limit:30},10000)}catch{return null;}
  const active=new Set(activeSequenceIds.map(String));
  const ranked=nearby.map(img=>{
    const id=String(img?.id||''),ig=mlyGeometry(img),sid=mlySequenceId(img);if(!id||id===currentId||!ig||!sid||active.has(id))return null;
    const meters=hav(g.lat,g.lng,ig.lat,ig.lng)*1000;if(meters<2||meters>55)return null;
    const bearing=geoBearing(g.lat,g.lng,ig.lat,ig.lng),turn=Math.abs(angleDelta(wanted,bearing));if(turn>115)return null;
    const spherical=String(img.camera_type||'').toLowerCase()==='spherical'?0:-8;
    return {img,id,sid,meters,turn,score:turn*.72+meters*.28+spherical};
  }).filter(Boolean).sort((a,b)=>a.score-b.score).slice(0,6);
  for(const c of ranked){
    try{const ids=await mapillarySequenceIds(c.sid,9000);if(ids.length>=3&&ids.includes(c.id)){const result={...c,ids};continuationCache.set(key,result);return result;}}catch{}
  }
  continuationCache.set(key,null);return null;
}
async function moveNearbyContinuation(direction){
  continuationSearchBusy=true;setNavStatus('🔎 CONECTANDO RUA...<small>procurando imagens próximas</small>','busy');updateSequenceControls();
  try{
    const c=await findNearbyContinuation(direction);if(!c){setNavStatus('SEM CONTINUAÇÃO<small>tente voltar ou escolha outra pista</small>','warn');navStatusTimer=setTimeout(()=>{navStatusTimer=null;updateSequenceControls();},1800);return false;}
    await Promise.race([viewer.moveTo(c.id),new Promise((_,reject)=>setTimeout(()=>reject(new Error('A continuação demorou demais para abrir.')),15000))]);
    activeSequenceId=c.sid;activeSequenceIds=c.ids;activeSequenceIndex=c.ids.indexOf(c.id);lastImageId=c.id;setNavStatus('✓ NOVA RUA<small>rota conectada automaticamente</small>','route');navStatusTimer=setTimeout(()=>{navStatusTimer=null;updateSequenceControls();},1200);return true;
  }catch(e){toast('Movimento',e?.message||'Não consegui conectar a próxima rua.','error');return false;}
  finally{continuationSearchBusy=false;updateSequenceControls();}
}
async function moveSequence(delta){
  if(geoProvider==='google'){if(!isLocked())googleGeo().move(delta);return;}
  if(sequenceMoveBusy||continuationSearchBusy||!viewer||isLocked())return;
  let idx=navIndex();const dir=delta<0?-1:1;
  if(idx<0||!activeSequenceIds.length)return;
  const immediate=idx+dir;
  if(immediate<0||immediate>=activeSequenceIds.length)return;
  sequenceMoveBusy=true;setNavStatus(dir>0?'AVANÇANDO...<small>carregando próxima imagem</small>':'VOLTANDO...<small>carregando imagem anterior</small>','busy');updateSequenceControls();
  const token=roundToken;
  try{
    const target=activeSequenceIds[immediate];
    await viewer.moveTo(target);
    if(token!==roundToken)return false;
    activeSequenceIndex=immediate;lastImageId=String(target);return true;
  }catch(e){toast('Movimento',e?.message||'Não consegui abrir a próxima imagem desta rua.','error');return false;}
  finally{sequenceMoveBusy=false;updateSequenceControls();}
}
function toggleGeoFullscreen(){
  const card=$('geoStage');if(!card)return;
  if(document.fullscreenElement){document.exitFullscreen?.().catch(()=>{});return;}
  card.requestFullscreen?.().catch(()=>toast('Tela cheia','Seu navegador bloqueou o modo tela cheia.','error'));
}
function bindSequenceKeyboard(){
  if(window.__geoSequenceKeyboard)return;window.__geoSequenceKeyboard=true;
  document.addEventListener('keydown',e=>{
    if(!$('geoGameScreen')?.classList.contains('active')||isLocked())return;
    const tag=String(e.target?.tagName||'').toLowerCase();if(['input','select','textarea','button'].includes(tag))return;
    const k=e.key;
    if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target?.isContentEditable||e.target?.closest?.('.leaflet-container'))return;
    if(['ArrowUp','w','W'].includes(k)){e.preventDefault();moveSequence(1);}
    else if(['ArrowDown','s','S'].includes(k)){e.preventDefault();moveSequence(-1);}
    else if(['r','R'].includes(k)){e.preventDefault();returnToStart();}
    else if(['m','M'].includes(k)){e.preventDefault();toggleMap();}
    else if(['f','F'].includes(k)){e.preventDefault();toggleGeoFullscreen();}
  });
}
function mapillaryProxyUrl(url){
  try{
    const u=new URL(String(url||''),location.href),h=u.hostname.toLowerCase();
    const needsProxy=h==='fbcdn.net'||h.endsWith('.fbcdn.net')||h==='cdninstagram.com'||h.endsWith('.cdninstagram.com')||h==='fbsbx.com'||h.endsWith('.fbsbx.com');
    return needsProxy?`${location.origin}/api/asset?src=mapillary&url=${encodeURIComponent(u.href)}`:u.href;
  }catch{return url;}
}
function createMapillaryDataProvider(mly){
  if(!mly?.GraphDataProvider)return null;
  class GameGuessMapillaryProvider extends mly.GraphDataProvider{
    getImageBuffer(url,abort){return super.getImageBuffer(mapillaryProxyUrl(url),abort);}
    getCluster(url,abort){return super.getCluster(mapillaryProxyUrl(url),abort);}
    getMesh(url,abort){return super.getMesh(mapillaryProxyUrl(url),abort);}
  }
  return new GameGuessMapillaryProvider({accessToken:mapillaryToken});
}
async function ensureViewer(){
  const mly=await ensureMapillary();if(viewer)return viewer;
  const dataProvider=createMapillaryDataProvider(mly);
  const options={
    accessToken:mapillaryToken,
    container:'geoStreetView',
    imageTiling:false,
    combinedPanning:false,
    component:{cover:false,direction:true,keyboard:false,fallback:{image:true,navigation:true},sequence:false,zoom:false,cache:true}
  };
  if(dataProvider)options.dataProvider=dataProvider;
  viewer=new mly.Viewer(options);
  viewer.on('bearing',event=>{const bearing=Number(event.bearing);if(!Number.isFinite(bearing))return;const needle=$('geoCompassNeedle'),label=$('geoCompassLabel');if(needle)needle.style.transform=`rotate(${-bearing}deg)`;if(label)label.textContent=['N','NE','L','SE','S','SO','O','NO'][Math.round(((bearing%360+360)%360)/45)%8];});
  viewer.on('image',event=>{
    const image=event?.image,id=String(image?.id||'');if(!id)return;
    if(image)rememberMlyMeta({id,computed_geometry:image.computedLngLat?{coordinates:[image.computedLngLat.lng,image.computedLngLat.lat]}:undefined,computed_compass_angle:image.computedCompassAngle,camera_type:image.cameraType,sequence:image.sequenceId?{id:image.sequenceId}:undefined});
    if(suppressStep){suppressStep=false;lastImageId=id;activeSequenceIndex=activeSequenceIds.indexOf(id);updateSequenceControls();return;}
    if(lastImageId&&id!==lastImageId&&!isLocked()){steps++;$('geoStepLabel').textContent=steps;}
    lastImageId=id;activeSequenceIndex=activeSequenceIds.indexOf(id);updateSequenceControls();
    if(activeSequenceIndex<0&&!sequenceMoveBusy&&!continuationSearchBusy)activateSequenceForImage(id).catch(()=>{});
  });
  return viewer;
}
async function loadStreetRound(q){
  if(geoProvider==='google'){
    if(q.provider!=='google')throw new Error('Esta sala usa outro provedor. Crie uma nova sala para jogar com o Google.');
    const loading=$('geoStreetLoading');loading.textContent='Carregando Google Street View...';loading.classList.remove('hidden');
    try{await googleGeo().load(q);viewer={resize:()=>googleGeo().resize()};loading.classList.add('hidden');$('geoStreetView').classList.add('ready');updateSequenceControls();}
    catch(error){loading.textContent=error.message||'Street View indisponível.';throw error;}
    return;
  }
  const token=++roundToken,loading=$('geoStreetLoading'),view=$('geoStreetView');
  loading.innerHTML='<div class="geo-spinner"></div><b>Preparando imagens da rua...</b><span>Carregando a sequência de imagens da rodada.</span>';loading.classList.remove('hidden');view.classList.remove('ready');
  const v=await ensureViewer();if(token!==roundToken)return;
  roundStartImageId=String(q.imageId);lastImageId=roundStartImageId;steps=0;$('geoStepLabel').textContent='0';suppressStep=true;continuationCache.clear();
  try{
    await prepareRoundSequence(q).catch(()=>[]);if(token!==roundToken)return;
    await Promise.race([v.moveTo(roundStartImageId),new Promise((_,reject)=>setTimeout(()=>reject(new Error('A imagem do Mapillary demorou demais para abrir.')),20000))]);if(token!==roundToken)return;
    resetCamera();
    v.resize?.();loading.classList.add('hidden');view.classList.add('ready');updateSequenceControls();
  }catch(e){
    if(token!==roundToken)return;
    loading.innerHTML='<b>Não foi possível abrir esta imagem do Mapillary.</b><span>O navegador não conseguiu carregar a mídia do CDN da Meta. O modo proxy v20.4.1 usa a função /api/asset existente para evitar bloqueios de fbcdn.net; se persistir, teste sem bloqueador/VPN.</span>';
    throw e;
  }
}
function resetCamera(){if(!viewer)return;try{viewer.setCenter([.5,.5]);viewer.setFieldOfView(CAMERA_FOV);}catch{}}
async function zoomStreet(delta){if(geoProvider==='google'){googleGeo().zoom(delta);return;}if(!viewer)return;try{const fov=await viewer.getFieldOfView();viewer.setFieldOfView(Math.max(30,Math.min(80,fov+delta)));}catch{}}
async function returnToStart(){if(geoProvider==='google'){if(!isLocked())googleGeo().reset();return;}const q=currentQ();if(!viewer||!q||isLocked()||sequenceMoveBusy)return;sequenceMoveBusy=true;updateSequenceControls();suppressStep=true;try{await viewer.moveTo(String(q.imageId));await prepareRoundSequence(q).catch(()=>[]);activeSequenceIndex=activeSequenceIds.indexOf(String(q.imageId));resetCamera();}catch(e){toast('Mapillary','Não consegui voltar ao ponto inicial.','error')}finally{sequenceMoveBusy=false;updateSequenceControls();}}

function difficultyFor(){return {timerSec:GEO_ROUND_SECONDS,scoreMultiplier:1};}
function formatGeoTime(seconds){const value=Math.max(0,Math.ceil(seconds));return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;}
function geoNow(){return FB()?.serverNow?.()||Date.now();}
function clearSoloTimer(){if(soloTick){clearInterval(soloTick);soloTick=null;}if(solo)solo.deadline=0;}
function renderSoloTimer(){
  if(!solo?.deadline)return;
  const left=Math.max(0,Math.ceil((solo.deadline-Date.now())/1000));
  const label=$('geoTimerLabel');
  if(label){label.textContent=`⏱️ ${formatGeoTime(left)}`;label.classList.toggle('geo-timer-warning',left<=10);}
  if(left<=0)expireSoloRound();
}
function startSoloTimer(){
  if(!solo||solo.answered)return;
  clearSoloTimer();
  solo.deadline=Date.now()+difficultyFor().timerSec*1000;
  renderSoloTimer();
  soloTick=setInterval(renderSoloTimer,250);
}
function expireSoloRound(){
  if(!solo||solo.answered)return;
  clearSoloTimer();
  const q=currentQ();if(!q)return;
  solo.answered=true;
  const guess=selected?{...selected}:{lat:Number(q.lat),lng:Number(q.lng)};
  const km=selected?hav(guess.lat,guess.lng,q.lat,q.lng):0;
  reveal(q,guess,km,0);
  $('geoFeedback').innerHTML='<b>⏱️ Tempo esgotado.</b><span>O local correto foi revelado — esta rodada valeu 0 pontos.</span>';
  $('geoSubmitGuess').classList.add('hidden');
  $('geoNextRound').classList.remove('hidden');
}

async function displayRound(){
  clearSoloTimer();
  const q=currentQ();if(!q)return;
  try{await ensureGuessMap();}catch(e){
    toast('Mapa indisponível',e.message||'Não consegui carregar o mapa de palpite.','error');
    if(mode==='solo'){solo=null;show('geoSetupScreen');}
    return;
  }
  if(q!==currentQ())return;
  clearMarkers();
  const idx=mode==='solo'?solo.index:Number(room.roundIndex||0),total=mode==='solo'?solo.questions.length:Number(room.config?.rounds||room.questions?.length||5);
  const difficulty=difficultyFor(mode==='arena'?room?.config?.difficulty:config.difficulty);
  $('geoRoundLabel').textContent=`${idx+1}/${total}`;$('geoScoreLabel').textContent=mode==='solo'?solo.score:Number(myPlayer()?.score||0);$('geoModeBadge').textContent=mode==='solo'?'🌍 SOLO • 5 MIN':`⚔️ SALA ${roomCode}`;
  $('geoTimerLabel').classList.remove('hidden');$('geoTimerLabel').classList.remove('geo-timer-warning');$('geoTimerLabel').textContent=`⏱️ ${formatGeoTime(GEO_ROUND_SECONDS)}`;
  $('geoMoveHint').textContent=geoProvider==='google'?'Google Street View • W/S para caminhar • M mapa • F tela cheia':q.cameraType==='spherical'?'🌀 360° • W/↑/Espaço avança • S/↓ volta • M mapa • F tela cheia • © Mapillary':'🚶 W/↑/Espaço avança • S/↓ volta • fim da sequência conecta outra rua • © Mapillary';$('geoFeedback').textContent='Clique no mapa para colocar seu palpite.';$('geoSubmitGuess').classList.remove('hidden');$('geoSubmitGuess').disabled=true;$('geoNextRound').textContent='PRÓXIMA RODADA ▶';$('geoNextRound').classList.add('hidden');$('geoReturnStart').disabled=false;selected=null;
  $('geoScoreboard')?.classList.toggle('hidden',mode!=='arena');if(mode==='arena')renderScoreboard();setTimeout(()=>map?.invalidateSize?.(),100);
  try{
    await loadStreetRound(q);
    if(q!==currentQ())return;
    if(mode==='solo')startSoloTimer();
  }catch(e){toast('Imagens indisponíveis',e.message||String(e),'error');}
}
function reveal(q,guess,km,pts){
  if(!map)return;const target=[Number(q.lat),Number(q.lng)],g=[Number(guess.lat),Number(guess.lng)];
  targetMarker=L.marker(target).addTo(map).bindPopup(`🎯 Local correto: ${esc(q.city)} • ${esc(q.country)}`).openPopup();
  line=L.polyline([g,target],{weight:4,opacity:.82,dashArray:'9 9'}).addTo(map);map.fitBounds(L.latLngBounds([g,target]).pad(.32),{maxZoom:8});
  $('geoMapCard').classList.remove('geo-map-minimized');$('geoMapCard').classList.add('geo-result-mode','geo-map-expanded');$('geoMapToggle')?.setAttribute('aria-expanded','true');$('geoMapMinimize')?.setAttribute('aria-expanded','true');if($('geoMapMinimize'))$('geoMapMinimize').textContent='−';$('geoReturnStart').disabled=true;updateSequenceControls();
  $('geoMoveHint').innerHTML=`🎯 <b>${esc(q.city)}</b> • ${esc(q.country)}`;
  $('geoFeedback').innerHTML=`<div class="geo-result-stats"><span><small>DISTÂNCIA</small><b>${fmtDistance(km)}</b></span><span><small>PONTOS</small><b>+${pts.toLocaleString('pt-BR')}</b></span><span><small>PASSOS</small><b>${steps}</b></span></div>`;
  setTimeout(()=>map.invalidateSize(),180);
}
function awardCoins(amount){const p=CORE()?.getProfile?.()||{};const coins=window.GameGuessScoring?.pointsToCoinReward?.(amount,'normal')||Math.max(0,Math.round(amount));p.coins=Number(p.coins||0)+coins;CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);}

async function startSolo(){
  config.region=$('geoRegion').value;config.difficulty='normal';config.rounds=Number($('geoRounds').value)||5;const b=$('geoSoloStart');b.disabled=true;b.textContent='PREPARANDO LOCALIZAÇÕES...';
  try{const questions=await fetchRounds();await ensureGuessMap();mode='solo';solo={questions,index:0,score:0,answered:false,deadline:0};show('geoGameScreen');setTimeout(()=>displayRound(),100)}catch(e){toast('GeoGuess indisponível',e.message||String(e),'error')}finally{b.disabled=false;b.textContent='INICIAR SOLO ▶';}
}
function submitSolo(){if(!selected||solo?.answered||!solo?.deadline)return;if(Date.now()>=solo.deadline)return expireSoloRound();clearSoloTimer();const q=currentQ(),km=hav(selected.lat,selected.lng,q.lat,q.lng),pts=scoreDistance(km,config.difficulty);solo.answered=true;solo.score+=pts;$('geoScoreLabel').textContent=solo.score;reveal(q,selected,km,pts);$('geoSubmitGuess').classList.add('hidden');$('geoNextRound').classList.remove('hidden');awardCoins(Math.max(1,Math.min(6,Math.round(pts/1000))));}
function nextSolo(){
  if(!solo)return;
  clearSoloTimer();
  if(solo.index>=solo.questions.length-1){
    const p=CORE()?.getProfile?.()||{},multiplier=difficultyFor().scoreMultiplier,maxScore=solo.questions.length*5000*multiplier;
    p.gamesPlayed=Number(p.gamesPlayed||0)+1;p.gamesWon=Number(p.gamesWon||0)+1;p.geoPlayed=Number(p.geoPlayed||0)+1;p.geoBestScore=Math.max(Number(p.geoBestScore||0),solo.score);p.highScore=Math.max(Number(p.highScore||0),solo.score);
    const coinsEarned=window.GameGuessScoring?.pointsToCoinReward?.(solo.score,config.difficulty)||4;p.coins=Number(p.coins||0)+coinsEarned;
    window.GameGuessRanked?.record?.(p,{kind:'geoguess',score:solo.score,mode:'solo',universe:'geoguess',challenge:config.region,difficulty:config.difficulty,correct:solo.questions.length,wrong:0,won:true});CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);CORE()?.spawnConfetti?.();toast('GeoGuess concluído',`${solo.score.toLocaleString('pt-BR')} / ${maxScore.toLocaleString('pt-BR')} pontos • +${coinsEarned} moedas`);solo=null;return show('geoSetupScreen');
  }
  solo.index++;solo.answered=false;displayRound();
}

function user(){return FB()?.getUser?.()}
function players(){return Object.values(room?.players||{}).filter(p=>!p.left).sort((a,b)=>Number(a.slot||99)-Number(b.slot||99))}
function myPlayer(){const u=user();return u?room?.players?.[u.uid]:null}
function online(uid){return Object.keys(room?.presence?.[uid]||{}).length>0}
function renderWaiting(){if(!room)return;$('geoWaiting').classList.remove('hidden');$('geoRoomCode').textContent=roomCode;$('geoWaitingPlayers').innerHTML=players().map(p=>`<div><span>${p.uid===room.hostUid?'👑':'🌍'}</span><b>${esc(p.name)}</b><small>${online(p.uid)?'🟢 online':'🟡 reconectando'}</small></div>`).join('');$('geoWaitingStatus').textContent=`${players().length}/${room.config?.maxPlayers||2} jogadores na sala`;$('geoStartRoom').classList.toggle('hidden',room.hostUid!==user()?.uid);$('geoStartRoom').disabled=players().length<2;}
function renderScoreboard(){
  if(mode!=='arena'||!room)return;
  const finished=room.status==='finished',list=players().sort((a,b)=>Number(b.score||0)-Number(a.score||0));
  $('geoScoreboard').classList.remove('hidden');
  $('geoScoreboard').querySelector('h3').textContent=finished?'🏆 Classificação final':'🏆 Classificação • pontos acumulados';
  $('geoScoreRows').innerHTML=list.map((p,i)=>{
    const rank=list.findIndex(other=>Number(other.score||0)===Number(p.score||0))+1;
    const submitted=Number(p.submittedRound)===Number(room.roundIndex);
    const detail=submitted?(p.timedOut?'⌛ Tempo esgotado':`Rodada: +${Number(p.roundScore||0).toLocaleString('pt-BR')} pts`):'🚶 Explorando';
    return `<div><span>#${rank}</span><b>${esc(p.name)}</b><small>${detail}</small><strong>${Number(p.score||0).toLocaleString('pt-BR')} pts</strong></div>`;
  }).join('');
  $('geoScoreLabel').textContent=Number(myPlayer()?.score||0).toLocaleString('pt-BR');
}
async function createRoom(){
  if(!user())return toast('Login necessário','Entre na sua conta para criar uma Arena GeoGuess.','error');
  config.region=$('geoArenaRegion').value;config.difficulty='normal';config.rounds=Number($('geoArenaRounds').value)||5;config.maxPlayers=Number($('geoMaxPlayers').value)||2;
  const b=$('geoCreateRoom');b.disabled=true;b.textContent='PREPARANDO LOCALIZAÇÕES...';
  try{
    const questions=await fetchRounds();await ensureGuessMap();
    const diff=difficultyFor(config.difficulty);
    roomCode=await FB().createGeoRoom({questions,region:config.region,difficulty:config.difficulty,rounds:config.rounds,maxPlayers:config.maxPlayers,timerSec:diff.timerSec});
    localStorage.setItem('gameGuessLastGeoRoom',roomCode);mode='arena';watchRoom(roomCode);$('geoWaiting').classList.remove('hidden');toast('Sala criada',`Código ${roomCode}`);
  }catch(e){toast('Erro ao criar sala',e.message||String(e),'error')}finally{b.disabled=false;b.textContent='CRIAR SALA';}
}
async function joinRoom(){
  if(!user())return toast('Login necessário','Entre na sua conta para entrar na Arena GeoGuess.','error');
  const code=String($('geoJoinCode').value||'').trim().toUpperCase();
  try{await ensureGeoProvider();if(geoProvider==='google')await googleGeo().begin();await ensureGuessMap();roomCode=await FB().joinGeoRoom(code);localStorage.setItem('gameGuessLastGeoRoom',roomCode);mode='arena';watchRoom(roomCode);$('geoWaiting').classList.remove('hidden');toast('Conectado',`Você entrou em ${roomCode}`)}catch(e){toast('Não consegui entrar',e.message||String(e),'error')}
}
function watchRoom(code){unsub?.();unsub=FB().watchGeoRoom(code,(r,e)=>{if(e)return toast('GeoGuess',e.message||'Falha na sala.','error');room=r;if(!r){roomCode='';$('geoWaiting')?.classList.add('hidden');if(tick){clearInterval(tick);tick=null;}return;}FB()?.ensureGeoHost?.(code);if(r.status==='waiting'){show('geoSetupScreen');renderWaiting()}else if(r.status==='playing'){show('geoGameScreen');const idx=Number(r.roundIndex||0);if(lastRenderedRound!==idx){lastRenderedRound=idx;displayRound()}else{renderScoreboard();maybeRevealArena();}ensureArenaTicker()}else if(r.status==='finished'){show('geoGameScreen');renderScoreboard();finishArena();}})}
async function startRoom(){try{await FB().startGeoRoom(roomCode)}catch(e){toast('Não consegui iniciar',e.message||String(e),'error')}}
// Runs inside the Firebase transaction: retries cannot duplicate points or time deductions.
function applyArenaGuess(r,uid,idx,guess,km,pts,walkSteps,now){
  const p=r.players?.[uid];
  if(r.status!=='playing'||!p||p.left||Number(p.submittedRound)===idx||Number(r.roundIndex)!==idx||now>=Number(r.roundDeadline))return;
  const confirmed=Object.values(r.players||{}).filter(player=>Number(player.submittedRound)===idx&&!player.timedOut).length;
  p.submittedRound=idx;p.timedOut=false;p.guessLat=guess.lat;p.guessLng=guess.lng;
  p.distanceKm=Math.round(km*10)/10;p.roundScore=pts;p.score=Number(p.score||0)+pts;p.steps=walkSteps;
  if(confirmed<2)r.roundDeadline=Math.max(now,Number(r.roundDeadline)-GEO_GUESS_PENALTY_MS);
  return r;
}
async function submitArena(){
  if(!selected||isLocked())return;
  const q=currentQ(),idx=Number(room.roundIndex||0),km=hav(selected.lat,selected.lng,q.lat,q.lng),pts=scoreDistance(km),g={...selected},walkSteps=steps;
  $('geoSubmitGuess').disabled=true;
  try{
    const result=await FB().mutateGeoRoom(roomCode,(r,uid)=>applyArenaGuess(r,uid,idx,g,km,pts,walkSteps,geoNow()));
    if(result?.committed)awardCoins(Math.max(1,Math.min(5,Math.round(pts/1200))));
    else { $('geoSubmitGuess').disabled=isLocked();toast('Palpite não registrado','A rodada terminou ou seu palpite já foi confirmado.'); }
  }catch(e){$('geoSubmitGuess').disabled=false;toast('Palpite',e.message||String(e),'error')}
}
function allSubmitted(){const idx=Number(room?.roundIndex||0);return players().length>0&&players().every(p=>Number(p.submittedRound)===idx)}
function maybeRevealArena(){if(!room||room.status!=='playing')return;const me=myPlayer(),idx=Number(room.roundIndex||0),q=currentQ();if(Number(me?.submittedRound)===idx&&!allSubmitted()){$('geoSubmitGuess').classList.add('hidden');$('geoFeedback').textContent='✅ Palpite confirmado. Aguardando os demais jogadores.';}if(allSubmitted()&&Number(me?.submittedRound)===idx&&!targetMarker){if(me?.timedOut){reveal(q,{lat:q.lat,lng:q.lng},0,0);$('geoFeedback').innerHTML='<b>⌛ Tempo esgotado.</b><span>Você não confirmou um palpite nesta rodada.</span>';}else if(me?.guessLat!=null)reveal(q,{lat:me.guessLat,lng:me.guessLng},Number(me.distanceKm||0),Number(me.roundScore||0));}if(allSubmitted()&&room.hostUid===user()?.uid&&advanceScheduled!==idx){advanceScheduled=idx;setTimeout(()=>advanceArena(idx),4000)}}
async function advanceArena(idx){if(!room||room.status!=='playing'||Number(room.roundIndex)!==idx||room.hostUid!==user()?.uid)return;try{await FB().mutateGeoRoom(roomCode,(r)=>{if(r.status!=='playing'||Number(r.roundIndex)!==idx||Object.values(r.players||{}).some(p=>!p.left&&Number(p.submittedRound)!==idx))return;const total=Number(r.config?.rounds||r.questions?.length||5);if(idx>=total-1){r.status='finished';r.roundState='finished';r.finishedAt=geoNow();r.expiresAt=geoNow()+2*60*60*1000;const list=Object.values(r.players||{}).filter(p=>!p.left).sort((a,b)=>Number(b.score||0)-Number(a.score||0));r.winnerUid=list.length&&(!list[1]||Number(list[0].score||0)>Number(list[1].score||0))?list[0].uid:'';return r;}const diff=difficultyFor(r.config?.difficulty);r.roundIndex=idx+1;r.roundDeadline=geoNow()+GEO_ROUND_SECONDS*1000;r.roundState='playing';for(const p of Object.values(r.players||{})){p.roundScore=0;p.distanceKm=0;p.timedOut=false;p.guessLat=null;p.guessLng=null;p.steps=0;}return r;});}catch{}}
function ensureArenaTicker(){if(tick)return;tick=setInterval(async()=>{if(!room||room.status!=='playing'){if(tick){clearInterval(tick);tick=null;}return;}const left=Math.max(0,Math.ceil((Number(room.roundDeadline||0)-(FB()?.serverNow?.()||Date.now()))/1000));if($('geoTimerLabel')){$('geoTimerLabel').textContent=`⏱️ ${formatGeoTime(left)}`;$('geoTimerLabel').classList.toggle('geo-timer-warning',left<=10);}if(left<=0&&room.hostUid===user()?.uid&&!allSubmitted()){const idx=Number(room.roundIndex||0);await FB().mutateGeoRoom(roomCode,r=>{if(r.status!=='playing'||Number(r.roundIndex)!==idx||geoNow()<Number(r.roundDeadline))return;for(const p of Object.values(r.players||{})){if(!p.left&&Number(p.submittedRound)!==idx){p.submittedRound=idx;p.timedOut=true;p.guessLat=null;p.guessLng=null;p.distanceKm=0;p.roundScore=0;p.steps=0;}}return r;}).catch(()=>{});}},500)}
function finishArena(){if(tick){clearInterval(tick);tick=null}const u=user();if(!u||!room)return;const key=`ggGeoRecorded:${room.code}:${u.uid}`;if(!localStorage.getItem(key)){localStorage.setItem(key,'1');const p=CORE()?.getProfile?.()||{},won=room.winnerUid===u.uid,myScore=Number(myPlayer()?.score||0),difficulty=room.config?.difficulty||'normal';p.geoPlayed=Number(p.geoPlayed||0)+1;p.geoWins=Number(p.geoWins||0)+(won?1:0);p.gamesPlayed=Number(p.gamesPlayed||0)+1;if(won)p.gamesWon=Number(p.gamesWon||0)+1;p.geoBestScore=Math.max(Number(p.geoBestScore||0),myScore);const coinsEarned=window.GameGuessScoring?.pointsToCoinReward?.(myScore,difficulty)||(won?12:4);p.coins=Number(p.coins||0)+coinsEarned;window.GameGuessRanked?.record?.(p,{kind:'geoguess-arena',score:myScore,mode:`${players().length}-players`,universe:'geoguess',challenge:room.config?.region||'world',difficulty:difficulty,correct:Number(room.config?.rounds||0),wrong:0,won,players:players().length});CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);if(won)CORE()?.spawnConfetti?.();toast(won?'🏆 Você venceu o GeoGuess!':'GeoGuess finalizado',`${myScore.toLocaleString('pt-BR')} pontos • +${coinsEarned} moedas`);}const winner=room.players?.[room.winnerUid];const leaders=players().filter(p=>Number(p.score||0)===Math.max(...players().map(p=>Number(p.score||0))));$('geoFeedback').innerHTML=winner?`🏆 Vencedor: <b>${esc(winner.name)}</b> • ${Number(winner.score||0).toLocaleString('pt-BR')} pontos`:`🤝 Empate: <b>${leaders.map(p=>esc(p.name)).join(' e ')}</b> • ${Number(leaders[0]?.score||0).toLocaleString('pt-BR')} pontos`;$('geoMapCard').classList.remove('geo-map-minimized');$('geoSubmitGuess').classList.add('hidden');$('geoTimerLabel').textContent='🏁 Finalizado';renderScoreboard();}
async function leaveRoom(){clearSoloTimer();if(roomCode)await FB()?.leaveGeoRoom?.(roomCode).catch(()=>{});unsub?.();unsub=null;room=null;roomCode='';localStorage.removeItem('gameGuessLastGeoRoom');lastRenderedRound=-1;advanceScheduled=-1;$('geoWaiting')?.classList.add('hidden');if(tick){clearInterval(tick);tick=null}show('geoSetupScreen')}
function quit(){roundToken++;clearSoloTimer();if(mode==='arena'&&roomCode)return leaveRoom();solo=null;show('geoSetupScreen')}
function toggleMap(){const c=$('geoMapCard');if(!c)return;c.classList.remove('geo-map-minimized');$('geoMapMinimize')?.setAttribute('aria-expanded','true');if($('geoMapMinimize'))$('geoMapMinimize').textContent='−';const expanded=c.classList.toggle('geo-map-expanded');$('geoMapToggle')?.setAttribute('aria-expanded',String(expanded));setTimeout(()=>map?.invalidateSize?.(),220)}
function open(arena=false){show('geoSetupScreen');if(arena)setTimeout(()=>$('geoCreateRoom')?.scrollIntoView({behavior:'smooth',block:'center'}),100)}
function bind(){inject();ensureSequenceControls();bindSequenceKeyboard();const openSolo=()=>open(false),openArena=()=>open(true);$('homeGeoButton')?.addEventListener('click',openSolo);$('homeGeoguessButton')?.addEventListener('click',openSolo);$('homeGeoArenaButton')?.addEventListener('click',openArena);$('homeGeoguessArenaButton')?.addEventListener('click',openArena);$('geoBack')?.addEventListener('click',()=>show('homeScreen'));$('geoSoloStart')?.addEventListener('click',startSolo);$('geoSubmitGuess')?.addEventListener('click',()=>mode==='solo'?submitSolo():submitArena());$('geoNextRound')?.addEventListener('click',nextSolo);$('geoCreateRoom')?.addEventListener('click',createRoom);$('geoJoinRoom')?.addEventListener('click',joinRoom);$('geoStartRoom')?.addEventListener('click',startRoom);$('geoLeaveRoom')?.addEventListener('click',leaveRoom);$('geoQuit')?.addEventListener('click',quit);$('geoReturnStart')?.addEventListener('click',returnToStart);$('geoMapToggle')?.addEventListener('click',toggleMap);$('geoCopyCode')?.addEventListener('click',()=>navigator.clipboard?.writeText(roomCode).then(()=>toast('Código copiado',roomCode)));window.addEventListener('gameguess:authchange',e=>{if(!e.detail?.user&&roomCode)leaveRoom()});}
window.GameGuessGeo={open,version:GEO_VERSION};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
