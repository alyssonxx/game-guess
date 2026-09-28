import {createHash} from 'node:crypto';

export const MAX_MONTHLY_LOADS=4000;
export const BILLING_TIME_ZONE='America/Los_Angeles';

// Google's free allowance resets at midnight Pacific, not at midnight in Brazil.
export function billingPeriod(now=Date.now()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:BILLING_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
  const year=Number(parts.year),month=Number(parts.month);
  const noon=Date.UTC(year,month,1,12);
  const offsetName=new Intl.DateTimeFormat('en-US',{timeZone:BILLING_TIME_ZONE,timeZoneName:'shortOffset'}).formatToParts(noon).find(p=>p.type==='timeZoneName').value;
  const offset=Number(offsetName.match(/GMT([+-]\d+)/)?.[1]);
  if(!Number.isFinite(offset))throw new Error('Unknown billing time zone offset');
  return {id:`${parts.year}-${parts.month}`,day:`${parts.year}-${parts.month}-${parts.day}`,resetsAt:Date.UTC(year,month,1)-offset*3600000};
}
export function quotaPolicy(env=process.env){
  const requested=Number(env.GOOGLE_MAPS_MONTHLY_LIMIT||MAX_MONTHLY_LOADS);
  const limit=Number.isInteger(requested)&&requested>0?Math.min(requested,MAX_MONTHLY_LOADS):0;
  return {limit,perUserDaily:20};
}
function validCount(value){return Number.isInteger(value)&&value>=0;}
export function quotaStatus(state,period,policy){
  if(state!==null&&(!state||state.version!==1||state.period!==period.id||!validCount(state.used)||!state.users||typeof state.users!=='object'))throw new Error('Invalid quota ledger');
  const used=state?.used||0;
  return {limit:policy.limit,used,remaining:Math.max(0,policy.limit-used),resetsAt:period.resetsAt,period:period.id};
}
// Pure transaction callback; concurrency is serialized by the database, never by a browser.
export function reserveLoad(state,uid,now,policy){
  const period=billingPeriod(now),status=quotaStatus(state,period,policy);
  if(!status.remaining||period.resetsAt-now<60000)return;
  const key=createHash('sha256').update(uid).digest('hex');
  const entry=state?.users?.[key];
  if(entry&&(!validCount(entry.used)||typeof entry.day!=='string'))throw new Error('Invalid user quota');
  const usedToday=entry?.day===period.day?entry.used:0;
  if(usedToday>=policy.perUserDaily)return;
  return {version:1,period:period.id,used:status.used+1,updatedAt:now,users:{...(state?.users||{}),[key]:{day:period.day,used:usedToday+1}}};
}
let adminPromise;
export async function quotaServices(){
  if(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON||!process.env.FIREBASE_DATABASE_URL)throw new Error('Quota storage not configured');
  if(!adminPromise)adminPromise=(async()=>{
    const [{initializeApp,getApps,cert},{getAuth},{getDatabase}]=await Promise.all([import('firebase-admin/app'),import('firebase-admin/auth'),import('firebase-admin/database')]);
    const app=getApps().find(app=>app.name==='geoguess-quota')||initializeApp({credential:cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),databaseURL:process.env.FIREBASE_DATABASE_URL},'geoguess-quota');
    return {auth:getAuth(app),db:getDatabase(app)};
  })().catch(error=>{adminPromise=null;throw error;});
  return adminPromise;
}
export function googleReady(env=process.env){
  return env.GOOGLE_MAPS_ENABLED==='true'&&env.GOOGLE_MAPS_SAFETY_CONFIRMED==='true'&&Boolean(env.GOOGLE_MAPS_API_KEY)&&Boolean(env.FIREBASE_SERVICE_ACCOUNT_JSON)&&Boolean(env.FIREBASE_DATABASE_URL)&&Boolean(env.GOOGLE_MAPS_ALLOWED_ORIGINS);
}
