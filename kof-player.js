(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const boot=document.getElementById('boot'),text=document.getElementById('bootText');
  const GAME_URL='/roms/kf2k2mp2web.zip';
  const ROMDATA_URL='/roms/kf2k2mp2web.dat';
  const BIOS_URL='/roms/neogeo-web.zip';
  let started=false;

  function post(type,message,extra={}){try{window.parent?.postMessage({type,message,...extra},location.origin)}catch{}}
  function setText(message){if(text)text.textContent=message}
  function fail(message){setText(message);post('kof-player-error',message)}
  async function json(url){try{const r=await fetch(url,{cache:'no-store'});return r.ok?await r.json():null}catch{return null}}
  async function head(url){try{const r=await fetch(url,{method:'HEAD',cache:'no-store'});return r.ok}catch{return false}}

  async function bootGame(){
    try{
      setText('Validando ROM web, RomData e BIOS Neo Geo…');
      const [gameOk,datOk,biosOk,cfg]=await Promise.all([
        head(GAME_URL),head(ROMDATA_URL),head(BIOS_URL),json('/api/kof-config')
      ]);
      if(!gameOk||!datOk||!biosOk){
        const missing=[!gameOk&&'pacote do jogo',!datOk&&'RomData',!biosOk&&'BIOS'].filter(Boolean).join(', ');
        return fail(`Arquivos web ausentes: ${missing}. Faça o deploy completo da V14.2.`);
      }

      const gameId=Math.max(1,Number(params.get('gameId'))||20020202);
      const server=params.get('server')||cfg?.netplayServer||'https://netplay.emulatorjs.org/';
      const ice=Array.isArray(cfg?.iceServers)&&cfg.iceServers.length?cfg.iceServers:[
        {urls:'stun:stun.l.google.com:19302'},
        {urls:'stun:stun1.l.google.com:19302'}
      ];

      // O ZIP usa um nome de set próprio. O FBNeo encontra o RomData por um destes
      // caminhos, independentemente de onde o frontend montar o conteúdo principal.
      // O arquivo é minúsculo, então duplicá-lo no VFS não aumenta o download do jogo.
      window.EJS_externalFiles={
        '/roms/kf2k2mp2web.dat':ROMDATA_URL,
        '/kf2k2mp2web.dat':ROMDATA_URL,
        '/fbneo/romdata/kf2k2mp2web.dat':ROMDATA_URL,
        '/system/fbneo/romdata/kf2k2mp2web.dat':ROMDATA_URL,
        '/home/web_user/retroarch/system/fbneo/romdata/kf2k2mp2web.dat':ROMDATA_URL
      };

      window.EJS_player='#game';
      window.EJS_core='fbneo';
      window.EJS_gameUrl=GAME_URL;
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
      window.EJS_ready=()=>{
        setText('FBNeo carregado. Montando o romset web…');
        post('kof-player-core-ready','FBNeo carregado.');
      };
      window.EJS_onGameStart=()=>{
        started=true;
        if(boot)boot.style.display='none';
        post('kof-player-ready',`KOF iniciado • Game ID ${gameId}`,{gameId});
      };

      setText('Baixando o pacote web do KOF e iniciando o FBNeo…');
      const script=document.createElement('script');
      script.src='https://cdn.emulatorjs.org/4.2.3/data/loader.js';
      script.onerror=()=>fail('Não consegui carregar o EmulatorJS 4.2.3. Verifique a conexão e tente novamente.');
      document.body.appendChild(script);

      setTimeout(()=>{if(!started)setText('Primeiro carregamento: o pacote do KOF tem cerca de 40 MB. Aguarde; se aparecer “Play”, toque para iniciar.');},6500);
      setTimeout(()=>{if(!started)post('kof-player-slow','O emulador ainda está preparando o jogo.');},18000);
    }catch(e){fail(e?.message||String(e))}
  }
  window.addEventListener('unhandledrejection',e=>{if(!started&&e?.reason)post('kof-player-debug',String(e.reason?.message||e.reason))});
  bootGame();
})();
