function j(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body));}
async function fetchBin(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),10000);try{return await fetch(url,{signal:c.signal,redirect:'follow',headers:{'User-Agent':'GameGuess-V7/1.0','Accept':'image/avif,image/webp,image/*,*/*;q=.8'}})}finally{clearTimeout(t)}}
function safeId(s){return /^[A-Za-z0-9_.-]{1,100}$/.test(String(s||''))?String(s):''}
function allowedDigi(raw){try{const u=new URL(raw);return ['digi-api.com','www.digi-api.com'].includes(u.hostname)?u.toString():''}catch{return ''}}
async function wikiThumb(title){for(const lang of ['pt','en']){try{const q=new URL(`https://${lang}.wikipedia.org/w/api.php`);q.searchParams.set('action','query');q.searchParams.set('prop','pageimages');q.searchParams.set('titles',title);q.searchParams.set('pithumbsize','900');q.searchParams.set('pilicense','any');q.searchParams.set('format','json');q.searchParams.set('redirects','1');const r=await fetch(q,{headers:{'User-Agent':'GameGuess-V7/1.0'}});if(!r.ok)continue;const d=await r.json();const pages=Object.values(d?.query?.pages||{});const image=pages[0]?.thumbnail?.source||'';if(image)return image;}catch{}}return '';}

const FANDOM_WIKIS={
  db:'dragonball.fandom.com',
  ygo:'yugioh.fandom.com',
  naruto:'naruto.fandom.com',
  saintseiya:'saintseiya.fandom.com'
};
const FALLBACK_LABELS={db:'DRAGON BALL',ygo:'YU-GI-OH!',naruto:'NARUTO',saintseiya:'CAVALEIROS',wiki:'DESENHOS',digi:'DIGIMON',lol:'LEAGUE',poke:'POKÉMON'};
const FALLBACK_ICONS={db:'🐉',ygo:'🃏',naruto:'🍥',saintseiya:'♈',wiki:'📺',digi:'🔵',lol:'⚔️',poke:'🔴'};

function fallbackSvg(kind='wiki'){
  const label=FALLBACK_LABELS[kind]||'GAME GUESS';
  const icon=FALLBACK_ICONS[kind]||'🎮';
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#10172e"/><stop offset="1" stop-color="#29153b"/></linearGradient></defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <circle cx="600" cy="330" r="165" fill="#ffffff" opacity=".05"/>
  <text x="600" y="370" text-anchor="middle" font-size="150">${icon}</text>
  <text x="600" y="555" text-anchor="middle" font-family="Arial,sans-serif" font-size="52" font-weight="700" fill="#ffffff">${label}</text>
  <text x="600" y="620" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" fill="#aeb9d8">imagem externa indisponível • use as pistas</text>
</svg>`,'utf8');
}
function sendFallback(res,method,kind){
  const b=fallbackSvg(kind);
  res.statusCode=200;
  res.setHeader('Content-Type','image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');
  res.setHeader('X-GameGuess-Fallback','1');
  if(method==='HEAD')return res.end();
  res.setHeader('Content-Length',String(b.length));
  res.end(b);
}

async function mediaWikiThumb(host,title){
  const endpoints=[];
  const q=new URL(`https://${host}/api.php`);
  q.searchParams.set('action','query');q.searchParams.set('prop','pageimages');q.searchParams.set('titles',title);q.searchParams.set('pithumbsize','900');q.searchParams.set('format','json');q.searchParams.set('redirects','1');q.searchParams.set('origin','*');endpoints.push(['page',q]);
  const p=new URL(`https://${host}/api.php`);
  p.searchParams.set('action','query');p.searchParams.set('generator','images');p.searchParams.set('titles',title);p.searchParams.set('gimlimit','25');p.searchParams.set('prop','imageinfo');p.searchParams.set('iiprop','url');p.searchParams.set('iiurlwidth','900');p.searchParams.set('format','json');p.searchParams.set('redirects','1');p.searchParams.set('origin','*');endpoints.push(['images',p]);
  for(const [mode,url] of endpoints){try{const r=await fetch(url,{headers:{'User-Agent':'GameGuess-V7/1.0','Accept':'application/json'}});if(!r.ok)continue;const d=await r.json();const pages=Object.values(d?.query?.pages||{});if(mode==='page'){const image=pages[0]?.thumbnail?.source||'';if(image)return image;}else{const bad=/logo|icon|symbol|flag|rank|button|portal|wiki|favicon|sprite|banner|background/i;const ranked=pages.filter(x=>x?.imageinfo?.[0]?.thumburl&&!bad.test(String(x.title||''))).sort((a,b)=>String(a.title||'').length-String(b.title||'').length);const image=ranked[0]?.imageinfo?.[0]?.thumburl||'';if(image)return image;}}catch{}}
  return '';
}
async function franchiseThumb(series,title){const host=FANDOM_WIKIS[String(series||'').toLowerCase()];if(host){const f=await mediaWikiThumb(host,title);if(f)return f;}return await wikiThumb(title);}

export default async function handler(req,res){
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return j(res,405,{error:'Método não permitido.'});}
  const src=String(req.query?.src||'');
  let fallbackKind=src==='franchise'?String(req.query?.series||'').toLowerCase():src;
  try{
    let url='';
    if(src==='lol'){
      const id=safeId(req.query?.id);if(!id)return sendFallback(res,req.method,'lol');
      url=`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg`;
    }else if(src==='poke'){
      const id=Number(req.query?.id);if(!Number.isInteger(id)||id<1||id>2000)return sendFallback(res,req.method,'poke');
      url=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    }else if(src==='digi'){
      url=allowedDigi(String(req.query?.url||''));if(!url)return sendFallback(res,req.method,'digi');
    }else if(src==='franchise'){
      const series=String(req.query?.series||'').toLowerCase();
      const title=String(req.query?.title||'').slice(0,140);
      if(!FANDOM_WIKIS[series]||!title)return sendFallback(res,req.method,series);
      url=await franchiseThumb(series,title);
      if(!url)return sendFallback(res,req.method,series);
    }else if(src==='wiki'){
      const title=String(req.query?.title||'').slice(0,140);
      if(!title)return sendFallback(res,req.method,'wiki');
      url=await wikiThumb(title);
      if(!url)return sendFallback(res,req.method,'wiki');
    }else return sendFallback(res,req.method,'wiki');

    const up=await fetchBin(url);
    if(!up.ok)return sendFallback(res,req.method,fallbackKind);
    const ct=up.headers.get('content-type')||'image/jpeg';
    if(!ct.startsWith('image/'))return sendFallback(res,req.method,fallbackKind);
    res.statusCode=200;
    res.setHeader('Content-Type',ct);
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
    res.setHeader('X-GameGuess-Asset','proxied');
    if(req.method==='HEAD')return res.end();
    const b=Buffer.from(await up.arrayBuffer());
    res.setHeader('Content-Length',String(b.length));
    res.end(b);
  }catch(e){
    console.error('asset',e);
    return sendFallback(res,req.method,fallbackKind);
  }
}
