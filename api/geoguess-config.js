export default function handler(req,res){
  if(req.method!=='GET'){res.statusCode=405;return res.end('Method Not Allowed');}
  const token=String(process.env.MAPILLARY_ACCESS_TOKEN||process.env.MAPILLARY_TOKEN||'').trim();
  res.statusCode=200;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify({version:'18.2.0',enabled:Boolean(token),token:token||null,tokenFormat:token.startsWith('MLY|')?'client-token':'unknown',provider:'MapillaryJS 4.1.2 + Leaflet/OpenStreetMap'}));
}
