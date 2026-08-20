export default function handler(req,res){
  if(req.method!=='GET'){res.statusCode=405;return res.end('Method Not Allowed');}
  const token=String(process.env.MAPILLARY_ACCESS_TOKEN||process.env.MAPILLARY_TOKEN||'').trim();
  res.statusCode=200;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify({enabled:Boolean(token),token:token||null,provider:'MapillaryJS + OpenStreetMap'}));
}
