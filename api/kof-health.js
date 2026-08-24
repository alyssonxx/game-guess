const TRAINING_EJS='4.2.3';
const ONLINE_EJS='4.3.0-pre';
const GAME_PATH='/roms/v178/kf2k2mp2.zip';
const EXPECTED_GAME_BYTES=86694745;
const EXPECTED_CORE_BUILD_END='2025-06-14T18:54:56+00:00';
async function probe(url,{method='GET',timeout=7000}={}){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);try{const r=await fetch(url,{method,redirect:'follow',cache:'no-store',signal:ctrl.signal,headers:{'User-Agent':'GameGuess-V19.7-Health/1.0'}});return {ok:r.ok,status:r.status,size:Number(r.headers.get('content-length')||0),type:r.headers.get('content-type')||''};}catch(e){return {ok:false,status:0,error:e?.name==='AbortError'?'timeout':'network'};}finally{clearTimeout(timer);}}
export default async function handler(req,res){
  if(req.method!=='GET'){res.status(405).json({ok:false,error:'method_not_allowed'});return;}res.setHeader('Cache-Control','no-store, max-age=0');
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim(),host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim(),origin=host?`${proto}://${host}`:'';
  const trainingLoader=`https://cdn.emulatorjs.org/${TRAINING_EJS}/data/loader.js`,onlineLoader=`https://cdn.emulatorjs.org/${ONLINE_EJS}/data/loader.js`,reportUrl=`https://cdn.emulatorjs.org/${TRAINING_EJS}/data/cores/reports/fbneo.json`;
  const PUBLIC='https://netplay.emulatorjs.org',raw=String(process.env.KOF_NETPLAY_SERVER||'').trim().replace(/\/+$/,''),dedicated=/^https:\/\/[^\s/]+/i.test(raw)?raw:'',netplayServer=dedicated||PUBLIC;
  const netplayProbeUrl=`${netplayServer}/list?domain=${encodeURIComponent(host||'game-guess-bay.vercel.app')}&game_id=1`;
  const [trainingEmulator,onlineEmulator,rom,netplay]=await Promise.all([probe(trainingLoader),probe(onlineLoader),origin?probe(origin+GAME_PATH,{method:'HEAD'}):Promise.resolve({ok:false,status:0,error:'no_host'}),probe(netplayProbeUrl,{timeout:9000})]);
  let coreReport={ok:false};try{const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),5000),r=await fetch(reportUrl,{cache:'no-store',signal:ctrl.signal}),j=r.ok?await r.json():null;clearTimeout(timer);coreReport={ok:Boolean(r.ok&&j?.core==='fbneo'),status:r.status,core:j?.core||null,buildEnd:j?.buildEnd||null,expectedBuildEnd:EXPECTED_CORE_BUILD_END,buildMatches:j?.buildEnd===EXPECTED_CORE_BUILD_END};}catch(e){coreReport={ok:false,status:0,error:e?.name==='AbortError'?'timeout':'network'};}
  const romMatches=Boolean(rom.ok&&(!rom.size||rom.size===EXPECTED_GAME_BYTES));
  res.status(200).json({ok:Boolean(trainingEmulator.ok&&onlineEmulator.ok&&romMatches),version:'19.9.1',trainingEmulator:{...trainingEmulator,version:TRAINING_EJS},onlineEmulator:{...onlineEmulator,version:ONLINE_EJS},core:'fbneo',coreReport,rom:{...rom,path:GAME_PATH,expectedBytes:EXPECTED_GAME_BYTES,sizeMatches:romMatches},netplay:{...netplay,url:netplayServer,probeUrl:netplayProbeUrl,configured:true,source:dedicated?'dedicated':'public'},netplayConfigured:true,dedicatedConfigured:Boolean(dedicated),netplaySource:dedicated?'dedicated':'public',netplayMode:dedicated?'dedicated-with-public-fallback':'public-emulatorjs-fallback',turnConfigured:Boolean(process.env.KOF_TURN_URL),checkedAt:Date.now()});
}
