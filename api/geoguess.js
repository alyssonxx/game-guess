const SEEDS=[
['americas','Brasil','Recife',-8.0476,-34.8770],['americas','Brasil','Rio de Janeiro',-22.9068,-43.1729],['americas','Brasil','São Paulo',-23.5505,-46.6333],['americas','Brasil','Salvador',-12.9777,-38.5016],['americas','Brasil','Brasília',-15.7939,-47.8828],
['americas','Argentina','Buenos Aires',-34.6037,-58.3816],['americas','Chile','Santiago',-33.4489,-70.6693],['americas','Peru','Lima',-12.0464,-77.0428],['americas','Colômbia','Bogotá',4.7110,-74.0721],['americas','México','Cidade do México',19.4326,-99.1332],['americas','Estados Unidos','Nova York',40.7128,-74.0060],['americas','Estados Unidos','São Francisco',37.7749,-122.4194],['americas','Estados Unidos','Chicago',41.8781,-87.6298],['americas','Canadá','Toronto',43.6532,-79.3832],['americas','Canadá','Vancouver',49.2827,-123.1207],['americas','Cuba','Havana',23.1136,-82.3666],['americas','Uruguai','Montevidéu',-34.9011,-56.1645],['americas','Equador','Quito',-0.1807,-78.4678],
['europe','Portugal','Lisboa',38.7223,-9.1393],['europe','Portugal','Porto',41.1579,-8.6291],['europe','Espanha','Madri',40.4168,-3.7038],['europe','Espanha','Barcelona',41.3874,2.1686],['europe','França','Paris',48.8566,2.3522],['europe','França','Lyon',45.7640,4.8357],['europe','Itália','Roma',41.9028,12.4964],['europe','Itália','Veneza',45.4408,12.3155],['europe','Alemanha','Berlim',52.5200,13.4050],['europe','Alemanha','Munique',48.1351,11.5820],['europe','Reino Unido','Londres',51.5074,-0.1278],['europe','Países Baixos','Amsterdã',52.3676,4.9041],['europe','Bélgica','Bruxelas',50.8503,4.3517],['europe','Áustria','Viena',48.2082,16.3738],['europe','República Tcheca','Praga',50.0755,14.4378],['europe','Hungria','Budapeste',47.4979,19.0402],['europe','Polônia','Cracóvia',50.0647,19.9450],['europe','Grécia','Atenas',37.9838,23.7275],['europe','Dinamarca','Copenhague',55.6761,12.5683],['europe','Suécia','Estocolmo',59.3293,18.0686],['europe','Noruega','Oslo',59.9139,10.7522],['europe','Finlândia','Helsinque',60.1699,24.9384],['europe','Irlanda','Dublin',53.3498,-6.2603],['europe','Turquia','Istambul',41.0082,28.9784],
['asia','Japão','Tóquio',35.6762,139.6503],['asia','Japão','Quioto',35.0116,135.7681],['asia','Coreia do Sul','Seul',37.5665,126.9780],['asia','China','Pequim',39.9042,116.4074],['asia','China','Xangai',31.2304,121.4737],['asia','Índia','Nova Délhi',28.6139,77.2090],['asia','Índia','Mumbai',19.0760,72.8777],['asia','Tailândia','Bangkok',13.7563,100.5018],['asia','Vietnã','Hanói',21.0278,105.8342],['asia','Singapura','Singapura',1.3521,103.8198],['asia','Malásia','Kuala Lumpur',3.1390,101.6869],['asia','Indonésia','Jacarta',-6.2088,106.8456],['asia','Filipinas','Manila',14.5995,120.9842],['asia','Emirados Árabes Unidos','Dubai',25.2048,55.2708],['asia','Israel','Jerusalém',31.7683,35.2137],['asia','Nepal','Catmandu',27.7172,85.3240],
['africa','Egito','Cairo',30.0444,31.2357],['africa','Marrocos','Marrakech',31.6295,-7.9811],['africa','África do Sul','Cidade do Cabo',-33.9249,18.4241],['africa','África do Sul','Joanesburgo',-26.2041,28.0473],['africa','Quênia','Nairóbi',-1.2921,36.8219],['africa','Tanzânia','Zanzibar',-6.1659,39.2026],['africa','Gana','Acra',5.6037,-0.1870],['africa','Senegal','Dacar',14.7167,-17.4677],['africa','Etiópia','Adis Abeba',8.9806,38.7578],['africa','Tunísia','Túnis',36.8065,10.1815],
['oceania','Austrália','Sydney',-33.8688,151.2093],['oceania','Austrália','Melbourne',-37.8136,144.9631],['oceania','Austrália','Brisbane',-27.4698,153.0251],['oceania','Nova Zelândia','Auckland',-36.8509,174.7645],['oceania','Nova Zelândia','Wellington',-41.2866,174.7756],['oceania','Fiji','Suva',-18.1248,178.4501]
];
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function out(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
function clean(s){return String(s||'').replace(/<[^>]+>/g,'').trim();}
async function queryNearby(seed){
  const [,country,city,lat,lng]=seed;
  const p=new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'geosearch',ggsprimary:'all',ggsnamespace:'0',ggsradius:'10000',ggslimit:'24',ggscoord:`${lat}|${lng}`,prop:'pageimages|coordinates',piprop:'thumbnail',pithumbsize:'1280',origin:'*'});
  try{
    const r=await fetch(`https://pt.wikipedia.org/w/api.php?${p}`,{headers:{'User-Agent':'GameGuess/15.0 (GeoGuess mode)'}});
    if(!r.ok)throw new Error('wiki');const d=await r.json();
    const pages=(d?.query?.pages||[]).filter(x=>x?.thumbnail?.source&&x?.coordinates?.[0]);
    if(pages.length){const page=pages[Math.floor(Math.random()*pages.length)],c=page.coordinates[0];return {id:`wiki:${page.pageid}`,image:page.thumbnail.source,lat:Number(c.lat),lng:Number(c.lon),country,city,revealTitle:clean(page.title),sourceUrl:`https://pt.wikipedia.org/?curid=${page.pageid}`};}
  }catch{}
  try{
    const r=await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`,{headers:{'User-Agent':'GameGuess/15.0 (GeoGuess mode)'}});if(!r.ok)throw new Error('summary');const d=await r.json();
    if(d?.thumbnail?.source)return {id:`summary:${city}:${Date.now()}`,image:d.thumbnail.source,lat,lng,country,city,revealTitle:city,sourceUrl:d?.content_urls?.desktop?.page||''};
  }catch{}
  return null;
}
export default async function handler(req,res){
  if(req.method!=='GET')return out(res,405,{error:'Use GET'});
  const region=String(req.query?.region||'world').toLowerCase();const count=Math.max(1,Math.min(8,Number(req.query?.count||5)));
  let pool=SEEDS.filter(s=>region==='world'||s[0]===region||s[0]==='world');if(pool.length<count)pool=SEEDS;
  const picked=shuffle(pool).slice(0,Math.min(pool.length,count*3));const results=[];const used=new Set();
  for(let i=0;i<picked.length&&results.length<count;i+=4){
    const batch=await Promise.all(picked.slice(i,i+4).map(queryNearby));
    for(const q of batch){if(!q||used.has(q.image))continue;used.add(q.image);results.push(q);if(results.length>=count)break;}
  }
  if(results.length<count)return out(res,503,{error:'Não consegui obter imagens geolocalizadas suficientes agora.',questions:results});
  out(res,200,{questions:results});
}
