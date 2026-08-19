(() => {
  'use strict';
  const params=new URLSearchParams(location.search),DB_NAME='gameGuessArcadeFiles',STORE='files';
  const boot=document.getElementById('boot'),text=document.getElementById('bootText');
  function fail(message){text.textContent=message;window.parent?.postMessage({type:'kof-player-error',message},location.origin)}
  function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function get(key){const d=await db(),v=await new Promise((resolve,reject)=>{const tx=d.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)});d.close();return v}
  async function bootGame(){
    try{
      const clone=await get('kof-clone'),parent=await get('kof-parent'),bios=await get('neogeo-bios');if(!parent?.blob||!bios?.blob)return fail('Faltam kof2002.zip e/ou neogeo.zip. Volte e importe os arquivos.');
      const cloneUrl=clone?.blob?URL.createObjectURL(clone.blob):'/roms/kf2k2mp2.zip',parentUrl=URL.createObjectURL(parent.blob),biosUrl=URL.createObjectURL(bios.blob),gameId=Math.max(1,Number(params.get('gameId'))||20020202),server=params.get('server')||'https://netplay.emulatorjs.org/';
      window.EJS_player='#game';window.EJS_core='fbneo';window.EJS_gameUrl=cloneUrl;window.EJS_gameParentUrl=parentUrl;window.EJS_biosUrl=biosUrl;window.EJS_gameName='The King of Fighters 2002 Magic Plus II';window.EJS_gameID=gameId;window.EJS_pathtodata='https://cdn.emulatorjs.org/4.2.3/data/';window.EJS_language='pt-BR';window.EJS_startOnLoaded=true;window.EJS_noAutoFocus=matchMedia('(hover:none) and (pointer:coarse)').matches;window.EJS_color='#42e8ff';window.EJS_backgroundColor='#050913';window.EJS_netplayServer=server;window.EJS_netplayICEServers=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];window.EJS_controlScheme='arcade';window.EJS_AdTimer=-1;
      window.EJS_onGameStart=()=>{boot.style.display='none';window.parent?.postMessage({type:'kof-player-ready',message:`KOF iniciado • Game ID ${gameId}`},location.origin)};
      const script=document.createElement('script');script.src='https://cdn.emulatorjs.org/4.2.3/data/loader.js';script.onerror=()=>fail('Não consegui carregar o EmulatorJS 4.2.3. Verifique sua internet e tente novamente.');document.body.appendChild(script);
      setTimeout(()=>{if(boot.style.display!=='none')text.textContent='O primeiro carregamento do núcleo FBNeo pode levar alguns segundos…';},4500);
    }catch(e){fail(e.message||String(e))}
  }
  bootGame();
})();
