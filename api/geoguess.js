const LOCATIONS = [
  ['americas','Brasil','Recife',-8.0578,-34.8829],['americas','Brasil','Olinda',-8.0089,-34.8553],['americas','Brasil','Salvador',-12.9767,-38.5016],['americas','Brasil','Brasília',-15.7939,-47.8828],['americas','Brasil','São Paulo',-23.5505,-46.6333],['americas','Brasil','Rio de Janeiro',-22.9068,-43.1729],['americas','Brasil','Belo Horizonte',-19.9167,-43.9345],['americas','Brasil','Curitiba',-25.4284,-49.2733],['americas','Brasil','Porto Alegre',-30.0346,-51.2177],['americas','Brasil','Fortaleza',-3.7319,-38.5267],
  ['americas','Argentina','Buenos Aires',-34.6037,-58.3816],['americas','Argentina','Córdoba',-31.4201,-64.1888],['americas','Chile','Santiago',-33.4489,-70.6693],['americas','Peru','Lima',-12.0464,-77.0428],['americas','Colômbia','Bogotá',4.7110,-74.0721],['americas','Colômbia','Medellín',6.2442,-75.5812],['americas','México','Cidade do México',19.4326,-99.1332],['americas','México','Guadalajara',20.6597,-103.3496],['americas','Estados Unidos','Nova York',40.7128,-74.0060],['americas','Estados Unidos','Boston',42.3601,-71.0589],['americas','Estados Unidos','Chicago',41.8781,-87.6298],['americas','Estados Unidos','Seattle',47.6062,-122.3321],['americas','Estados Unidos','São Francisco',37.7749,-122.4194],['americas','Estados Unidos','Los Angeles',34.0522,-118.2437],['americas','Canadá','Toronto',43.6532,-79.3832],['americas','Canadá','Vancouver',49.2827,-123.1207],['americas','Canadá','Montreal',45.5019,-73.5674],['americas','Uruguai','Montevidéu',-34.9011,-56.1645],['americas','Equador','Quito',-0.1807,-78.4678],
  ['europe','Portugal','Lisboa',38.7223,-9.1393],['europe','Portugal','Porto',41.1579,-8.6291],['europe','Espanha','Madri',40.4168,-3.7038],['europe','Espanha','Barcelona',41.3874,2.1686],['europe','França','Paris',48.8566,2.3522],['europe','França','Lyon',45.7640,4.8357],['europe','Itália','Roma',41.9028,12.4964],['europe','Itália','Milão',45.4642,9.1900],['europe','Alemanha','Berlim',52.5200,13.4050],['europe','Alemanha','Munique',48.1351,11.5820],['europe','Reino Unido','Londres',51.5074,-0.1278],['europe','Reino Unido','Edimburgo',55.9533,-3.1883],['europe','Países Baixos','Amsterdã',52.3676,4.9041],['europe','Bélgica','Bruxelas',50.8503,4.3517],['europe','Áustria','Viena',48.2082,16.3738],['europe','Tchéquia','Praga',50.0755,14.4378],['europe','Hungria','Budapeste',47.4979,19.0402],['europe','Polônia','Cracóvia',50.0647,19.9450],['europe','Grécia','Atenas',37.9838,23.7275],['europe','Dinamarca','Copenhague',55.6761,12.5683],['europe','Suécia','Estocolmo',59.3293,18.0686],['europe','Noruega','Oslo',59.9139,10.7522],['europe','Finlândia','Helsinque',60.1699,24.9384],['europe','Irlanda','Dublin',53.3498,-6.2603],['europe','Turquia','Istambul',41.0082,28.9784],['europe','Suíça','Zurique',47.3769,8.5417],
  ['asia','Japão','Tóquio',35.6762,139.6503],['asia','Japão','Osaka',34.6937,135.5023],['asia','Japão','Quioto',35.0116,135.7681],['asia','Coreia do Sul','Seul',37.5665,126.9780],['asia','Índia','Nova Délhi',28.6139,77.2090],['asia','Índia','Bengaluru',12.9716,77.5946],['asia','Tailândia','Bangkok',13.7563,100.5018],['asia','Vietnã','Hanói',21.0278,105.8342],['asia','Singapura','Singapura',1.3521,103.8198],['asia','Malásia','Kuala Lumpur',3.1390,101.6869],['asia','Indonésia','Jacarta',-6.2088,106.8456],['asia','Filipinas','Manila',14.5995,120.9842],['asia','Emirados Árabes Unidos','Dubai',25.2048,55.2708],['asia','Israel','Jerusalém',31.7683,35.2137],['asia','Jordânia','Amã',31.9539,35.9106],['asia','Taiwan','Taipei',25.0330,121.5654],['asia','Hong Kong','Hong Kong',22.3193,114.1694],
  ['africa','Botsuana','Gaborone',-24.6282,25.9231],['africa','África do Sul','Cidade do Cabo',-33.9249,18.4241],['africa','África do Sul','Joanesburgo',-26.2041,28.0473],['africa','Quênia','Nairóbi',-1.2921,36.8219],['africa','Gana','Acra',5.6037,-0.1870],['africa','Senegal','Dacar',14.7167,-17.4677],['africa','Uganda','Kampala',0.3476,32.5825],['africa','Ruanda','Kigali',-1.9441,30.0619],['africa','Tunísia','Túnis',36.8065,10.1815],['africa','Lesoto','Maseru',-29.3158,27.4869],['africa','Eswatini','Mbabane',-26.3054,31.1367],
  ['oceania','Austrália','Sydney',-33.8688,151.2093],['oceania','Austrália','Melbourne',-37.8136,144.9631],['oceania','Austrália','Brisbane',-27.4698,153.0251],['oceania','Austrália','Perth',-31.9505,115.8605],['oceania','Austrália','Adelaide',-34.9285,138.6007],['oceania','Nova Zelândia','Auckland',-36.8509,174.7645],['oceania','Nova Zelândia','Wellington',-41.2866,174.7756],['oceania','Nova Zelândia','Christchurch',-43.5321,172.6362]
];

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function out(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function jitter(lat,lng){
  const radius=.12+Math.random()*.68,angle=Math.random()*Math.PI*2;
  const dLat=(radius/111.32)*Math.cos(angle),cos=Math.max(.22,Math.abs(Math.cos(lat*Math.PI/180))),dLng=(radius/(111.32*cos))*Math.sin(angle);
  return {lat:Number((lat+dLat).toFixed(6)),lng:Number((lng+dLng).toFixed(6))};
}

export default async function handler(req,res){
  if(req.method!=='GET')return out(res,405,{error:'Use GET'});
  const region=String(req.query?.region||'world').toLowerCase();
  const count=clamp(Number(req.query?.count||5),3,8);
  let pool=LOCATIONS.filter(s=>region==='world'||s[0]===region);
  if(pool.length<count)pool=LOCATIONS;
  const selected=shuffle(pool).slice(0,count);
  const candidates=selected.map(([r,country,city,lat,lng],i)=>{
    const p=jitter(lat,lng);
    return {id:`osm:${Date.now().toString(36)}:${i}:${Math.random().toString(36).slice(2,7)}`,lat:p.lat,lng:p.lng,country,city,region:r,provider:'openstreetmap',exploreRadius:1600};
  });
  return out(res,200,{provider:'leaflet+openstreetmap',mode:'osm-explorer',candidates});
}
