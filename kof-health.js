const CHECKS = [
  ['emulator','https://cdn.emulatorjs.org/4.2.1/data/loader.js'],
  ['netplay',process.env.KOF_NETPLAY_SERVER||'https://netplay.emulatorjs.org/']
];
async function probe(url,timeout=3500){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);
  try{
    const r=await fetch(url,{method:'GET',redirect:'follow',cache:'no-store',signal:ctrl.signal,headers:{'User-Agent':'GameGuess-V17.5-Health/1.0'}});
    return {ok:r.ok||r.status<500,status:r.status};
  }catch(e){return {ok:false,status:0,error:e?.name==='AbortError'?'timeout':'network'};}
  finally{clearTimeout(timer);}
}
export default async function handler(req,res){
  if(req.method!=='GET'){res.status(405).json({ok:false,error:'method_not_allowed'});return;}
  res.setHeader('Cache-Control','no-store');
  const entries=await Promise.all(CHECKS.map(async ([name,url])=>[name,await probe(url)]));
  const services=Object.fromEntries(entries);
  res.status(200).json({
    ok:services.emulator.ok&&services.netplay.ok,
    services,
    turnConfigured:Boolean(process.env.KOF_TURN_URL),
    checkedAt:Date.now(),
    version:'17.5.0',
    emulatorVersion:'4.2.1',
    core:'arcade',
    romLayout:'split-parent-bios',
    biosBuild:'fbneo-user-pack-repacked-root'
  });
}
