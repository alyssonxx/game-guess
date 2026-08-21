function cleanDomain(value){
  return String(value||'')
    .trim()
    .replace(/^https?:\/\//i,'')
    .split('/')[0]
    .replace(/[^a-z0-9.:-]/gi,'')
    .slice(0,253);
}

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.status(405).json({ok:false,error:'method_not_allowed'});
    return;
  }

  const gameId=String(req.query?.game_id||'').replace(/[^0-9]/g,'').slice(0,18);
  if(!gameId){
    res.status(400).json({ok:false,error:'missing_game_id'});
    return;
  }

  // O servidor oficial do EmulatorJS filtra as salas por DOMAIN + GAME ID.
  // A V18.9 enviava somente game_id e, por isso, recebia sempre uma lista vazia.
  const forwardedHost=String(req.headers['x-forwarded-host']||'').split(',')[0].trim();
  const domain=cleanDomain(req.query?.domain||forwardedHost||req.headers.host);
  if(!domain){
    res.status(400).json({ok:false,error:'missing_domain'});
    return;
  }

  const upstream=String(process.env.KOF_NETPLAY_SERVER||'').trim().replace(/\/+$/,'');
  if(!upstream){
    res.status(503).json({ok:false,error:'netplay_server_not_configured'});
    return;
  }
  if(!/^https:\/\//i.test(upstream)){
    res.status(500).json({ok:false,error:'netplay_server_must_use_https'});
    return;
  }

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),9000);

  try{
    const url=`${upstream}/list?domain=${encodeURIComponent(domain)}&game_id=${encodeURIComponent(gameId)}`;
    const response=await fetch(url,{
      method:'GET',
      cache:'no-store',
      signal:controller.signal,
      headers:{accept:'application/json','user-agent':'GameGuess-Netplay-Proxy/19.1'}
    });

    const raw=await response.text();
    if(!response.ok){
      res.setHeader('Cache-Control','no-store, max-age=0');
      res.status(502).json({ok:false,error:'upstream_http_error',status:response.status});
      return;
    }

    let rooms={};
    try{ rooms=raw?JSON.parse(raw):{}; }
    catch{
      res.setHeader('Cache-Control','no-store, max-age=0');
      res.status(502).json({ok:false,error:'upstream_invalid_json'});
      return;
    }
    if(!rooms||typeof rooms!=='object'||Array.isArray(rooms)) rooms={};

    res.setHeader('Cache-Control','no-store, max-age=0');
    if(String(req.query?.probe||'')==='1'){
      res.status(200).json({...rooms,__ok:true,__upstream:upstream,__domain:domain});
      return;
    }
    res.status(200).json(rooms);
  }catch(error){
    const message=error?.name==='AbortError'?'upstream_timeout':'upstream_unreachable';
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.status(502).json({ok:false,error:message});
  }finally{
    clearTimeout(timeout);
  }
}
