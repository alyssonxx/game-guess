const EJS_VERSION='4.2.1';
const GAME_PATH='/roms/v178/kf2k2mp2.zip';
const EXPECTED_GAME_BYTES=86694745;
const EXPECTED_CORE_BUILD_END='2025-01-07T14:59:35+00:00';

async function probe(url,{method='GET',timeout=5000}={}){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);
  try{
    const r=await fetch(url,{method,redirect:'follow',cache:'no-store',signal:ctrl.signal,headers:{'User-Agent':'GameGuess-V17.8-Health/1.0'}});
    return {ok:r.ok,status:r.status,size:Number(r.headers.get('content-length')||0),type:r.headers.get('content-type')||''};
  }catch(e){return {ok:false,status:0,error:e?.name==='AbortError'?'timeout':'network'};}
  finally{clearTimeout(timer);}
}

export default async function handler(req,res){
  if(req.method!=='GET'){res.status(405).json({ok:false,error:'method_not_allowed'});return;}
  res.setHeader('Cache-Control','no-store');
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=String(req.headers.host||'').trim();
  const origin=host?`${proto}://${host}`:'';
  const loaderUrl=`https://cdn.emulatorjs.org/${EJS_VERSION}/data/loader.js`;
  const reportUrl=`https://cdn.emulatorjs.org/${EJS_VERSION}/data/cores/reports/fbneo.json`;
  const netplayUrl=process.env.KOF_NETPLAY_SERVER||'https://netplay.emulatorjs.org/';

  const [emulator,netplay,rom] = await Promise.all([
    probe(loaderUrl),
    probe(netplayUrl),
    origin?probe(origin+GAME_PATH,{method:'HEAD'}):Promise.resolve({ok:false,status:0,error:'no_host'})
  ]);

  let coreReport={ok:false};
  try{
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),5000);
    const r=await fetch(reportUrl,{cache:'no-store',signal:ctrl.signal});
    const j=r.ok?await r.json():null;
    clearTimeout(timer);
    coreReport={ok:Boolean(r.ok&&j?.core==='fbneo'),status:r.status,core:j?.core||null,buildStart:j?.buildStart||null,buildEnd:j?.buildEnd||null,expectedBuildEnd:EXPECTED_CORE_BUILD_END,buildMatches:j?.buildEnd===EXPECTED_CORE_BUILD_END};
  }catch(e){coreReport={ok:false,status:0,error:e?.name==='AbortError'?'timeout':'network'};}

  const romMatches=Boolean(rom.ok&&(!rom.size||rom.size===EXPECTED_GAME_BYTES));
  res.status(200).json({
    ok:Boolean(emulator.ok&&romMatches&&coreReport.ok),
    version:'17.8.0',
    emulatorVersion:EJS_VERSION,
    emulatorCommit:'13362ef',
    core:'fbneo',
    coreArtifact:'fbneo-wasm.data',
    coreReport,
    rom:{...rom,path:GAME_PATH,expectedBytes:EXPECTED_GAME_BYTES,sizeMatches:romMatches},
    netplay,
    turnConfigured:Boolean(process.env.KOF_TURN_URL),
    checkedAt:Date.now()
  });
}
