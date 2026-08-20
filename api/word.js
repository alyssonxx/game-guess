import { COMMON_PT5 } from '../server-data/words-pt.js';
const LOCAL=new Set(COMMON_PT5);
const CACHE=new Map();
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');}
function out(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
function badCategory(title=''){return /nome[s]? proprio[s]?|sigla[s]?|abreviatur|simbolo[s]?|marca[s]? registrada/i.test(String(title).normalize('NFD').replace(/[\u0300-\u036f]/g,''));}
async function wiktionary(word){
  const q=new URL('https://pt.wiktionary.org/w/api.php');
  q.searchParams.set('action','query');q.searchParams.set('format','json');q.searchParams.set('redirects','1');
  q.searchParams.set('prop','categories|extracts');q.searchParams.set('cllimit','max');q.searchParams.set('exintro','1');q.searchParams.set('explaintext','1');q.searchParams.set('titles',word);
  const c=new AbortController(),t=setTimeout(()=>c.abort(),5000);
  try{
    const r=await fetch(q,{signal:c.signal,headers:{'Accept':'application/json','User-Agent':'GameGuess-V9/1.0'}});if(!r.ok)return false;
    const d=await r.json();const p=Object.values(d?.query?.pages||{})[0];if(!p||p.missing!==undefined||Number(p.ns)!==0)return false;
    const cats=(p.categories||[]).map(x=>x.title||'');if(cats.some(badCategory))return false;
    const ex=String(p.extract||'');if(/nome proprio|sigla|abreviatura/i.test(ex.normalize('NFD').replace(/[\u0300-\u036f]/g,'')))return false;
    return ex.length>10 || cats.length>0;
  }catch{return null}finally{clearTimeout(t)}
}
export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return out(res,405,{valid:false,error:'Use POST.'});}
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});const word=norm(body.word);
  if(word.length!==5)return out(res,200,{valid:false,reason:'length'});
  if(LOCAL.has(word))return out(res,200,{valid:true,source:'local'});
  const hit=CACHE.get(word);if(hit&&Date.now()-hit.at<86400000)return out(res,200,{valid:hit.valid,source:'cache'});
  const online=await wiktionary(word);
  if(online===null)return out(res,200,{valid:false,reason:'validation_unavailable'});
  CACHE.set(word,{valid:Boolean(online),at:Date.now()});return out(res,200,{valid:Boolean(online),source:'wiktionary'});
}
