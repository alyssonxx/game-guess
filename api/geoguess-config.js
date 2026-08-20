export default function handler(req,res){
  if(req.method!=='GET'){res.statusCode=405;return res.end('Method Not Allowed');}
  const key=String(process.env.GOOGLE_MAPS_API_KEY||'').trim();
  res.statusCode=200;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify({enabled:Boolean(key),key:key||null,provider:'Google Maps JavaScript API + Street View'}));
}
