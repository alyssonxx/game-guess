import {billingPeriod,quotaPolicy,quotaStatus,reserveLoad,quotaServices,googleReady} from '../server/geo-google-quota.js';

export function createHandler({services=quotaServices,now=Date.now,env=process.env}={}){
  return async function handler(req,res){
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.setHeader('Vary','Origin');
    const period=billingPeriod(now()),policy=quotaPolicy(env);
    const send=(code,data)=>res.status(code).json({provider:'google',serverNow:now(),...data});
    if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(405,{enabled:false,error:'METHOD_NOT_ALLOWED'});}
    if(!googleReady(env)||!policy.limit)return send(503,{enabled:false,error:'GOOGLE_SETUP_REQUIRED',message:'Street View bloqueado: falta concluir a configuração e as proteções no servidor e no Google Cloud.'});
    const allowed=env.GOOGLE_MAPS_ALLOWED_ORIGINS.split(',').map(s=>s.trim()).filter(Boolean);
    // Exact origins only, no wildcard. This is an extra layer, not Google API-key security.
    if(req.method==='POST'&&!allowed.includes(req.headers?.origin))return send(403,{enabled:false,error:'ORIGIN_DENIED',message:'Origem não autorizada.'});
    try{
      const {auth,db}=await services();
      const ledger=db.ref(`geoGoogleQuota/${period.id}`);
      if(req.method==='GET'){
        const status=quotaStatus((await ledger.get()).val(),period,policy);
        return send(200,{enabled:status.remaining>0,...status});
      }
      const bearer=/^Bearer (.+)$/.exec(req.headers?.authorization||'')?.[1];
      if(!bearer)return send(401,{enabled:false,error:'LOGIN_REQUIRED',message:'Entre na sua conta para jogar com o Google Street View.'});
      let identity;
      try{identity=await auth.verifyIdToken(bearer,true);}catch{return send(401,{enabled:false,error:'LOGIN_REQUIRED',message:'Sessão expirada. Entre novamente.'});}
      // Reserve before returning the browser key or constructing any billable viewer.
      const result=await ledger.transaction(state=>{
        const timestamp=now();
        if(billingPeriod(timestamp).id!==period.id)return;
        return reserveLoad(state,identity.uid,timestamp,policy);
      },undefined,false);
      const status=quotaStatus(result.snapshot.val(),period,policy);
      if(!result.committed){
        const monthly=status.remaining===0;
        return send(429,{enabled:false,...status,error:monthly?'MONTHLY_LIMIT':'SAFETY_LIMIT',message:monthly?'Limite mensal de segurança atingido.':'Limite de segurança atingido. Tente novamente mais tarde.'});
      }
      return send(200,{enabled:true,...status,apiKey:env.GOOGLE_MAPS_API_KEY});
    }catch{
      // No memory/localStorage fallback and no key on error. Never log credentials/tokens.
      return send(503,{enabled:false,error:'QUOTA_UNAVAILABLE',message:'Verificação de cota indisponível. Street View bloqueado por segurança.'});
    }
  };
}
export default createHandler();
