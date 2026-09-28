/* Google adapter. No Google script, map or panorama is loaded before server admission. */
(()=>{
  const $=id=>document.getElementById(id);
  let admission=null,admitting=null,sdkPromise=null,service=null,panorama=null,failed=false,countdown=null;
  let startPano='',startHeading=0,previousPano='',steps=0;
  const timeout=(promise,ms)=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('O serviço demorou para responder. Tente novamente.')),ms);
    promise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
  });
  function notice(data){
    clearInterval(countdown);
    let box=$('geoGoogleNotice');
    if(!box){box=document.createElement('div');box.id='geoGoogleNotice';box.className='geo-google-notice';box.setAttribute('role','status');$('geoSetupScreen')?.prepend(box);}
    box.replaceChildren();
    const title=document.createElement('strong');title.textContent='Google Street View indisponível';box.append(title);
    const message=document.createElement('p');message.textContent=data.message||'A configuração de segurança ainda não foi concluída.';box.append(message);
    if(data.error==='MONTHLY_LIMIT'&&Number.isFinite(data.resetsAt)){
      const timer=document.createElement('span');box.append(timer);
      const received=performance.now(),remaining=data.resetsAt-data.serverNow;
      const update=()=>{
        const seconds=Math.max(0,Math.ceil((remaining-(performance.now()-received))/1000));
        const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60);
        timer.textContent=seconds?`Nova liberação em ${days}d ${hours}h ${minutes}min ${seconds%60}s`:'Período renovado. Clique em iniciar para verificar a disponibilidade.';
        if(!seconds)clearInterval(countdown);
      };update();countdown=setInterval(update,1000);
    }
    const loading=$('geoStreetLoading');
    if(loading){loading.classList.remove('hidden');loading.textContent=message.textContent;}
  }
  async function begin(){
    if(admitting)return admitting;
    admitting=(async()=>{
      if(failed)throw new Error('Google indisponível. Corrija a configuração e recarregue a página.');
      const user=window.GameGuessFirebase?.getUser?.();
      if(!user){const data={message:'Entre na sua conta para jogar com o Google Street View.'};notice(data);throw new Error(data.message);}
      const token=await user.getIdToken();
      let response,data;
      try{
        response=await fetch('/api/geoguess-google',{method:'POST',cache:'no-store',headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});
        data=await response.json();
      }catch{data={message:'Não foi possível verificar a cota. Jogo bloqueado por segurança.'};notice(data);throw new Error(data.message);}
      if(!response.ok||!data.enabled||!data.apiKey){admission=null;notice(data);throw new Error(data.message||'Street View bloqueado por segurança.');}
      admission={uid:user.uid,expiresAt:Date.now()+60*60*1000};
      await loadSdk(data.apiKey);
      $('geoGoogleNotice')?.remove();clearInterval(countdown);
    })().finally(()=>{admitting=null;});
    return admitting;
  }
  async function ensure(){
    const uid=window.GameGuessFirebase?.getUser?.()?.uid;
    if(failed)throw new Error('A autenticação do Google falhou. Verifique API, domínio e faturamento.');
    if(!admission||admission.uid!==uid||admission.expiresAt<=Date.now())await begin();
  }
  function loadSdk(key){
    if(sdkPromise)return sdkPromise;
    sdkPromise=new Promise((resolve,reject)=>{
      window.gm_authFailure=()=>{
        failed=true;admission=null;panorama?.setVisible(false);
        const message='O Google recusou a configuração. Verifique a Maps JavaScript API, as restrições da chave e o faturamento. Nenhuma tentativa automática será feita.';
        notice({message});reject(new Error(message));
      };
      window.__geoGoogleReady=()=>{
        if(failed)return;
        service=new google.maps.StreetViewService();resolve();
      };
      const script=document.createElement('script');script.id='geoGoogleSdk';script.async=true;
      const url=new URL('https://maps.googleapis.com/maps/api/js');
      for(const [name,value] of Object.entries({key,callback:'__geoGoogleReady',loading:'async',v:'quarterly',language:'pt-BR',region:'BR'}))url.searchParams.set(name,value);
      script.src=url.href;script.onerror=()=>{failed=true;reject(new Error('Não foi possível carregar o Google Maps.'));};document.head.append(script);
    });
    return timeout(sdkPromise,20000);
  }
  async function resolveSeeds(seeds,wanted){
    await ensure();const questions=[];
    for(const seed of seeds){
      let result;
      try{result=await timeout(service.getPanorama({location:{lat:Number(seed.lat),lng:Number(seed.lng)},radius:1500,source:google.maps.StreetViewSource.OUTDOOR}),10000);}
      catch(error){if(String(error?.code||error?.message||error).includes('ZERO_RESULTS'))continue;throw error;}
      const location=result?.data?.location;
      if(!location?.pano||!location.latLng||questions.some(q=>q.imageId===location.pano))continue;
      questions.push({id:`google:${location.pano}`,imageId:location.pano,lat:location.latLng.lat(),lng:location.latLng.lng(),country:seed.country,city:seed.city,region:seed.region,heading:0,cameraType:'spherical',provider:'google'});
      if(questions.length>=wanted)return questions;
    }
    throw new Error(`Há cobertura em apenas ${questions.length} dos ${wanted} locais necessários. Tente outra região.`);
  }
  async function load(q){
    await ensure();
    if(!panorama){
      panorama=new google.maps.StreetViewPanorama($('geoStreetView'),{visible:false,addressControl:false,showRoadLabels:false,fullscreenControl:false,zoomControl:false,panControl:false,motionTracking:false,motionTrackingControl:false,enableCloseButton:false,linksControl:true,clickToGo:true,scrollwheel:false});
      panorama.addListener('pano_changed',()=>{
        const current=panorama.getPano();if(previousPano&&current!==previousPano)steps++;
        previousPano=current;$('geoStepLabel').textContent=String(steps);
      });
      panorama.addListener('pov_changed',()=>{
        const heading=panorama.getPov()?.heading||0;
        if($('geoCompassNeedle'))$('geoCompassNeedle').style.transform=`rotate(${-heading}deg)`;
        if($('geoCompassLabel'))$('geoCompassLabel').textContent=['N','NE','L','SE','S','SO','O','NO'][Math.round(((heading%360+360)%360)/45)%8];
      });
    }
    startPano=String(q.imageId);startHeading=Number(q.heading)||0;previousPano='';steps=0;$('geoStepLabel').textContent='0';
    const ready=new Promise((resolve,reject)=>{
      const listener=panorama.addListener('status_changed',()=>{
        listener.remove();panorama.getStatus()==='OK'?resolve():reject(new Error('Panorama indisponível no Google.'));
      });
      // If already at this panorama, no new status event is required.
      if(panorama.getPano()===startPano&&panorama.getStatus()==='OK'){listener.remove();resolve();}
      else panorama.setPano(startPano);
    });
    panorama.setPov({heading:startHeading,pitch:0});panorama.setZoom(1);panorama.setVisible(true);
    await timeout(ready,20000);
    google.maps.event.trigger(panorama,'resize');
  }
  function move(direction){
    if(!panorama)return;const heading=(panorama.getPov().heading+(direction<0?180:0)+360)%360;
    const links=panorama.getLinks()||[];
    const delta=value=>Math.abs(((value-heading+540)%360)-180);
    const next=links.filter(link=>link.pano).sort((a,b)=>delta(a.heading)-delta(b.heading))[0];
    if(next)panorama.setPano(next.pano);
  }
  function reset(){if(!panorama)return;panorama.setPano(startPano);panorama.setPov({heading:startHeading,pitch:0});panorama.setZoom(1);}
  function lock(locked){panorama?.setOptions({linksControl:!locked,clickToGo:!locked});}
  function zoom(delta){if(panorama)panorama.setZoom(Math.max(0,Math.min(4,panorama.getZoom()+(delta<0?.5:-.5))));}
  // Small bridge for the existing guess-map controls. Uses Google's own map, not OSM.
  function mapLibrary(){
    const point=value=>Array.isArray(value)?{lat:Number(value[0]),lng:Number(value[1])}:value;
    function bounds(values){const value=new google.maps.LatLngBounds();values.forEach(p=>value.extend(point(p)));return {value,pad(){return this;}};}
    function layer(kind,coordinates,options={}){
      let native=null;
      const wrapper={
        addTo(map){
          native=kind==='marker'?new google.maps.Marker({map:map.native,position:point(coordinates),title:options.title||'',...(options.icon?{icon:{path:google.maps.SymbolPath.CIRCLE,scale:8,fillColor:'#10b981',fillOpacity:1,strokeColor:'#fff',strokeWeight:3}}:{})}):new google.maps.Polyline({map:map.native,path:coordinates.map(point),strokeColor:'#10b981',strokeWeight:3});return wrapper;
        },
        setLatLng(position){native?.setPosition(point(position));return wrapper;},
        remove(){native?.setMap(null);},
        bindPopup(){return wrapper;},openPopup(){return wrapper;}
      };return wrapper;
    }
    return {
      map(id){
        const native=new google.maps.Map($(id),{center:{lat:-14.2,lng:-51.9},zoom:3,minZoom:1,disableDefaultUI:true,zoomControl:true,streetViewControl:false,clickableIcons:false,scrollwheel:false,styles:[{featureType:'poi',stylers:[{visibility:'off'}]},{featureType:'transit',stylers:[{visibility:'off'}]}]});
        const wrapper={native,setView(center,zoom){native.setCenter(point(center));native.setZoom(zoom);return wrapper;},fitBounds(value,options={}){native.fitBounds(value.value||bounds(value).value,12);if(options.maxZoom)google.maps.event.addListenerOnce(native,'idle',()=>{if(native.getZoom()>options.maxZoom)native.setZoom(options.maxZoom);});},invalidateSize(){google.maps.event.trigger(native,'resize');},removeLayer(layer){layer.remove();},on(name,callback){native.addListener(name,event=>{if(event.latLng)callback({latlng:{wrap:()=>({lat:event.latLng.lat(),lng:event.latLng.lng()})}});});return wrapper;}};return wrapper;
      },
      marker:(position,options)=>layer('marker',position,options),polyline:(positions,options)=>layer('line',positions,options),latLngBounds:bounds,divIcon:()=>true,
      control:{zoom:()=>({addTo(){}})},tileLayer:()=>({addTo(){}})
    };
  }
  window.GameGuessGoogle={begin,ensure,resolveSeeds,load,move,reset,lock,zoom,mapLibrary,notice,resize:()=>{if(panorama)google.maps.event.trigger(panorama,'resize');}};
})();
