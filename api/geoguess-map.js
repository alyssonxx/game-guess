const ENDPOINTS=[
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];
function out(res,status,body,cache=false){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control',cache?'public, s-maxage=86400, stale-while-revalidate=604800':'no-store');
  res.end(JSON.stringify(body));
}
function num(v,min,max){const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:null;}
function query(lat,lng){return `[out:json][timeout:12];(
way(around:1600,${lat},${lng})["highway"~"motorway|trunk|primary|secondary|tertiary|residential|unclassified|service|living_street|pedestrian"];
way(around:1600,${lat},${lng})["railway"~"rail|tram|light_rail|subway"];
way(around:1600,${lat},${lng})["waterway"~"river|stream|canal|drain"];
way(around:1400,${lat},${lng})["natural"="water"];
way(around:1200,${lat},${lng})["leisure"="park"];
way(around:1000,${lat},${lng})["landuse"~"forest|grass|residential|commercial|industrial|cemetery"];
way(around:420,${lat},${lng})["building"];
);out geom;`;}
function kind(tags={}){
  if(tags.highway)return 'road';
  if(tags.railway)return 'rail';
  if(tags.waterway)return 'waterway';
  if(tags.natural==='water')return 'water';
  if(tags.leisure==='park')return 'park';
  if(tags.landuse)return 'landuse';
  if(tags.building)return 'building';
  return 'other';
}
function keepTags(t={}){return {highway:t.highway||'',railway:t.railway||'',waterway:t.waterway||'',natural:t.natural||'',leisure:t.leisure||'',landuse:t.landuse||'',building:t.building||'',lanes:t.lanes||'',bridge:t.bridge||'',tunnel:t.tunnel||''};}
async function fetchOverpass(endpoint,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14500);
  try{
    const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','Accept':'application/json','User-Agent':'GameGuess-GeoGuess/17.6 (+https://game-guess-bay.vercel.app)'},body:`data=${encodeURIComponent(body)}`,signal:controller.signal});
    const text=await r.text();
    if(!r.ok)throw new Error(`Overpass HTTP ${r.status}`);
    return JSON.parse(text);
  }finally{clearTimeout(timer)}
}
function summarize(features){
  const c={road:0,rail:0,waterway:0,water:0,park:0,landuse:0,building:0};
  for(const f of features)if(c[f.kind]!=null)c[f.kind]++;
  const clues=[];
  if(c.road>35)clues.push('Malha viária densa');else if(c.road>12)clues.push('Malha viária moderada');else clues.push('Poucas vias próximas');
  if(c.rail)clues.push('Há ferrovia/trilho na área');
  if(c.water||c.waterway)clues.push('Água ou canal próximo');
  if(c.park)clues.push('Área verde/parque próximo');
  if(c.building>80)clues.push('Área bastante construída');else if(c.building<15)clues.push('Área pouco construída');
  return {counts:c,clues:clues.slice(0,4)};
}
export default async function handler(req,res){
  if(req.method!=='GET')return out(res,405,{error:'Use GET'});
  const lat=num(req.query?.lat,-90,90),lng=num(req.query?.lng,-180,180);
  if(lat===null||lng===null)return out(res,400,{error:'Coordenadas inválidas.'});
  const q=query(lat,lng);let data=null,lastError=null;
  for(const endpoint of ENDPOINTS){try{data=await fetchOverpass(endpoint,q);if(Array.isArray(data?.elements))break;}catch(e){lastError=e;}}
  if(!Array.isArray(data?.elements))return out(res,503,{error:'Os dados do OpenStreetMap/Overpass estão temporariamente indisponíveis. Tente novamente em alguns segundos.',detail:lastError?.message||''});
  const features=[];
  for(const e of data.elements){
    if(e.type!=='way'||!Array.isArray(e.geometry)||e.geometry.length<2)continue;
    const coordinates=e.geometry.map(p=>[Number(p.lon),Number(p.lat)]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));
    if(coordinates.length<2)continue;
    const tags=keepTags(e.tags||{}),k=kind(tags),closed=coordinates.length>3&&coordinates[0][0]===coordinates.at(-1)[0]&&coordinates[0][1]===coordinates.at(-1)[1];
    features.push({id:String(e.id),kind:k,closed,tags,coordinates});
    if(features.length>=650)break;
  }
  return out(res,200,{provider:'OpenStreetMap / Overpass',center:{lat,lng},features,summary:summarize(features)},true);
}
