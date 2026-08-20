(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const boot=document.getElementById('boot'),text=document.getElementById('bootText');
  const GAME_URL='/roms/kf2k2mp2.zip';
  const PARENT_URL='/roms/kof2002.zip';
  const BIOS_URL='/roms/neogeo.zip';
  let started=false;

  function post(type,message,extra={}){try{window.parent?.postMessage({type,message,...extra},location.origin)}catch{}}
  function setText(message){if(text)text.textContent=message}
  function fail(message){setText(message);post('kof-player-error',message)}
  async function json(url){try{const r=await fetch(url,{cache:'no-store'});return r.ok?await r.json():null}catch{return null}}
  async function head(url){try{const r=await fetch(url,{method:'HEAD',cache:'no-store'});return r.ok}catch{return false}}

  async function bootGame(){
    try{
      setText('Validando Magic Plus II, ROM parent e BIOS Neo Geo…');
      const [gameOk,parentOk,biosOk,cfg,manifest]=await Promise.all([
        head(GAME_URL),head(PARENT_URL),head(BIOS_URL),json('/api/kof-config'),json('/kof-rom-manifest.json')
      ]);
      if(!gameOk)return fail('A ROM clone kf2k2mp2.zip não foi publicada. Faça o deploy completo da V16.1.');
      if(!parentOk||!biosOk){
        const missing=[!parentOk&&'kof2002.zip (parent FBNeo)',!biosOk&&'neogeo.zip (BIOS FBNeo)'].filter(Boolean).join(' + ');
        return fail(`KOF preparado, mas falta ${missing}. Confira se os arquivos FBNeo validados da V16.1 foram publicados em /roms.`);
      }

      const gameId=Math.max(1,Number(params.get('gameId'))||20020202);
      const server=params.get('server')||cfg?.netplayServer||'https://netplay.emulatorjs.org/';
      const ice=Array.isArray(cfg?.iceServers)&&cfg.iceServers.length?cfg.iceServers:[
        {urls:'stun:stun.l.google.com:19302'},
        {urls:'stun:stun1.l.google.com:19302'}
      ];

      // FBNeo identifica o driver pelo nome do ZIP. O clone deve permanecer exatamente
      // kf2k2mp2.zip e recebe o parent pelo EJS_gameParentUrl.
      window.EJS_player='#game';
      window.EJS_core='fbneo';
      window.EJS_gameUrl=GAME_URL;
      window.EJS_gameParentUrl=PARENT_URL;
      window.EJS_biosUrl=BIOS_URL;
      window.EJS_gameName='The King of Fighters 2002 Magic Plus II';
      window.EJS_gameID=gameId;
      window.EJS_pathtodata='https://cdn.emulatorjs.org/4.2.3/data/';
      window.EJS_language='pt-BR';
      window.EJS_startOnLoaded=true;
      window.EJS_noAutoFocus=matchMedia('(hover:none) and (pointer:coarse)').matches;
      window.EJS_color='#42e8ff';
      window.EJS_backgroundColor='#050913';
      window.EJS_netplayServer=server;
      window.EJS_netplayICEServers=ice;
      window.EJS_controlScheme='arcade';
      window.EJS_AdTimer=-1;
      window.EJS_CacheLimit=1024*1024*1024;
      window.EJS_DEBUG_XX=params.get('debug')==='1';
      window.EJS_ready=()=>{setText('FBNeo carregado. Validando o romset kf2k2mp2…');post('kof-player-core-ready','FBNeo carregado.');};
      window.EJS_onGameStart=()=>{started=true;if(boot)boot.style.display='none';post('kof-player-ready',`KOF iniciado • Game ID ${gameId}`,{gameId});};

      setText('Carregando KOF 2002 Magic Plus II…');
      const script=document.createElement('script');script.src='https://cdn.emulatorjs.org/4.2.3/data/loader.js';script.onerror=()=>fail('Não consegui carregar o EmulatorJS 4.2.3. Verifique a conexão.');document.body.appendChild(script);
      setTimeout(()=>{if(!started)setText('Primeiro carregamento pode demorar. Se o FBNeo listar ROMs ausentes, confira kof2002.zip e neogeo.zip com o manifesto V16.');},7000);
      setTimeout(()=>{if(!started)post('kof-player-slow','O emulador ainda está preparando o jogo.',{manifest:manifest?.version||'16.1.0'});},18000);
    }catch(e){fail(e?.message||String(e))}
  }
  window.addEventListener('unhandledrejection',e=>{if(!started&&e?.reason)post('kof-player-debug',String(e.reason?.message||e.reason))});
  bootGame();
})();
