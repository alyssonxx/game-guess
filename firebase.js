import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getDatabase, ref, set, get, update, onValue, query, orderByChild,
  limitToLast, runTransaction, remove, onDisconnect, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js';

const CONFIG = window.GAME_GUESS_FIREBASE_CONFIG || {};
const APP_VERSION = '13.0.0';
const PROTOCOL_VERSION = 13;
const WAITING_TTL_MS = 30 * 60 * 1000;
const PLAYING_TTL_MS = 4 * 60 * 60 * 1000;
const FINISHED_TTL_MS = 2 * 60 * 60 * 1000;
const HOST_GRACE_MS = 12000;
const CLIENT_SESSION_ID = (globalThis.crypto?.randomUUID?.() || `gg-${Date.now()}-${Math.random().toString(36).slice(2)}`);
const configured = Boolean(
  CONFIG.apiKey && CONFIG.databaseURL && CONFIG.projectId && CONFIG.appId &&
  !String(CONFIG.apiKey).includes('COLE_') && !String(CONFIG.projectId).includes('SEU-PROJETO')
);

const $ = id => document.getElementById(id);
const CORE = () => window.GameGuessCore;
const PROFILE_KEY = 'gameGuessArcadeV4';
let app = null, auth = null, db = null, currentUser = null;
let serverOffsetMs = 0;
let firebaseConnected = false;
let serverOffsetUnsub = null;
let connectedUnsub = null;
let seasonUnsub = null;
const duelPresence = new Map();
let authMode = 'login';
let rankingUnsub = null;
let syncTimer = null;
let pendingProfile = null;
const DEFAULT_SEASON = Object.freeze({id:'S1',label:'Temporada 1',description:'Temporada competitiva atual',startsAt:0,endsAt:0});
let currentSeason={...DEFAULT_SEASON};

function showScreen(id) { CORE()?.showScreen?.(id); }
function toast(a,b,t='') { CORE()?.toast?.(a,b,t); }
function openOverlay(id){const el=$(id);if(!el)return;el.classList.add('active');el.setAttribute('aria-hidden','false');}
function closeOverlay(id){const el=$(id);if(!el)return;el.classList.remove('active');el.setAttribute('aria-hidden','true');}
function localProfile(){try{return CORE()?.getProfile?.() || JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}catch{return {}}}
function cleanName(v){return String(v||'Jogador').trim().replace(/[<>]/g,'').slice(0,20)||'Jogador';}
function num(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:0;}
function mapMax(a={},b={}){const out={...a};for(const [k,v] of Object.entries(b||{}))out[k]=Math.max(num(out[k]),num(v));return out;}
function mergeAchievements(a={},b={}){return {...a,...b};}

function serverNow(){return Date.now()+Number(serverOffsetMs||0);}
function isConnected(){return Boolean(firebaseConnected);}
function newSubmissionId(){return `${CLIENT_SESSION_ID}:${serverNow()}:${Math.random().toString(36).slice(2,10)}`;}
function safeKey(v,fallback='unknown'){return String(v||fallback).toLowerCase().trim().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||fallback;}
function normalizeSeason(raw={}){
  if(typeof raw==='string')raw={id:raw};
  const id=String(raw?.id||raw?.code||DEFAULT_SEASON.id).trim().toUpperCase().replace(/[^A-Z0-9_-]+/g,'')||DEFAULT_SEASON.id;
  return {id,label:String(raw?.label||raw?.name||raw?.title||`Temporada ${id}`),description:String(raw?.description||raw?.subtitle||''),startsAt:Number(raw?.startsAt||raw?.startAt||0)||0,endsAt:Number(raw?.endsAt||raw?.endAt||0)||0};
}
function currentSeasonId(){return currentSeason.id||DEFAULT_SEASON.id;}
function currentSeasonLabel(){return currentSeason.label||`Temporada ${currentSeasonId()}`;}
function sameSeasonProfile(p={}){return String(p?.seasonId||'').toUpperCase()===currentSeasonId();}
function compactSeasonProfile(p={}){return {...compactProfile(p),seasonId:currentSeasonId(),seasonLabel:currentSeasonLabel()};}
function freshSeasonProfile(){return compactSeasonProfile({});}
function mergeSeasonProfiles(a={},b={}){
  const A=sameSeasonProfile(a)?a:null,B=sameSeasonProfile(b)?b:null;
  if(A&&B)return {...compactProfile(mergeProfiles(A,B)),seasonId:currentSeasonId(),seasonLabel:currentSeasonLabel()};
  if(A)return compactSeasonProfile(A);if(B)return compactSeasonProfile(B);return freshSeasonProfile();
}

function statMerge(a={},b={}){return {played:Math.max(num(a.played),num(b.played)),wins:Math.max(num(a.wins),num(b.wins)),bestScore:Math.max(num(a.bestScore),num(b.bestScore)),bestCorrect:Math.max(num(a.bestCorrect),num(b.bestCorrect))};}
function mergeStatMap(a={},b={}){const out={};for(const k of new Set([...Object.keys(a||{}),...Object.keys(b||{})]))out[k]=statMerge(a?.[k],b?.[k]);return out;}
function normalizeRankedStats(s={}){return {bestMatch:s.bestMatch&&typeof s.bestMatch==='object'?s.bestMatch:{},modes:s.modes&&typeof s.modes==='object'?s.modes:{},universes:s.universes&&typeof s.universes==='object'?s.universes:{},challenges:s.challenges&&typeof s.challenges==='object'?s.challenges:{},difficulties:s.difficulties&&typeof s.difficulties==='object'?s.difficulties:{},arena:s.arena&&typeof s.arena==='object'?s.arena:{played:0,wins:0,losses:0,bestScore:0,maxPlayers:0},termo:s.termo&&typeof s.termo==='object'?s.termo:{modes:{}}};}
function mergeRankedStats(a={},b={}){const A=normalizeRankedStats(a),B=normalizeRankedStats(b),bestA=num(A.bestMatch?.score),bestB=num(B.bestMatch?.score);return {bestMatch:bestB>bestA?B.bestMatch:A.bestMatch,modes:mergeStatMap(A.modes,B.modes),universes:mergeStatMap(A.universes,B.universes),challenges:mergeStatMap(A.challenges,B.challenges),difficulties:mergeStatMap(A.difficulties,B.difficulties),arena:{played:Math.max(num(A.arena.played),num(B.arena.played)),wins:Math.max(num(A.arena.wins),num(B.arena.wins)),losses:Math.max(num(A.arena.losses),num(B.arena.losses)),bestScore:Math.max(num(A.arena.bestScore),num(B.arena.bestScore)),maxPlayers:Math.max(num(A.arena.maxPlayers),num(B.arena.maxPlayers))},termo:{modes:mergeStatMap(A.termo?.modes||{},B.termo?.modes||{})}};}
function bestStatKey(map={}){return Object.entries(map||{}).sort((a,b)=>(num(b[1]?.bestScore)-num(a[1]?.bestScore))||(num(b[1]?.wins)-num(a[1]?.wins)))[0]?.[0]||'';}
function bestNumericKey(map={}){return Object.entries(map||{}).sort((a,b)=>num(b[1])-num(a[1]))[0]?.[0]||'';}
function applyRankedDetail(target={},detail={}){
  const s=normalizeRankedStats(target.rankedStats),score=num(detail.score),correct=num(detail.correct),won=Boolean(detail.won);
  const bump=(map,key)=>{key=safeKey(key);const cur=map[key]||{played:0,wins:0,bestScore:0,bestCorrect:0};cur.played=num(cur.played)+1;if(won)cur.wins=num(cur.wins)+1;cur.bestScore=Math.max(num(cur.bestScore),score);cur.bestCorrect=Math.max(num(cur.bestCorrect),correct);map[key]=cur;};
  bump(s.modes,detail.mode||detail.kind||'geral');bump(s.universes,detail.universe||'games');bump(s.challenges,detail.challenge||'geral');bump(s.difficulties,detail.difficulty||'normal');
  if(detail.kind==='arena'){s.arena.played=num(s.arena.played)+1;if(won)s.arena.wins=num(s.arena.wins)+1;else if(!detail.tie)s.arena.losses=num(s.arena.losses)+1;s.arena.bestScore=Math.max(num(s.arena.bestScore),score);s.arena.maxPlayers=Math.max(num(s.arena.maxPlayers),num(detail.players));}
  if(detail.kind==='termo'){s.termo.modes=s.termo.modes||{};bump(s.termo.modes,detail.mode||'single');}
  if(score>num(s.bestMatch?.score))s.bestMatch={score,mode:String(detail.mode||detail.kind||''),universe:String(detail.universe||''),challenge:String(detail.challenge||''),difficulty:String(detail.difficulty||''),correct,wrong:num(detail.wrong),players:num(detail.players),at:serverNow()};
  target.rankedStats=s;return target;
}
function recordRankedResult(profile={},detail={}){
  applyRankedDetail(profile,detail);
  const s=sameSeasonProfile(profile.seasonProfile)?compactSeasonProfile(profile.seasonProfile):freshSeasonProfile();
  const score=num(detail.score),won=Boolean(detail.won),kind=String(detail.kind||'solo');
  s.highScore=Math.max(num(s.highScore),score);s.bestStreak=Math.max(num(s.bestStreak),num(detail.correct));
  if(kind==='arena'){s.duelPlayed=num(s.duelPlayed)+1;if(won)s.duelWins=num(s.duelWins)+1;else if(!detail.tie)s.duelLosses=num(s.duelLosses)+1;s.duelBestScore=Math.max(num(s.duelBestScore),score);}
  else if(kind==='termo'){s.termPlayed=num(s.termPlayed)+1;if(won){s.termWins=num(s.termWins)+1;s.termModeWins={...(s.termModeWins||{})};const k=safeKey(detail.mode||'single');s.termModeWins[k]=num(s.termModeWins[k])+1;}}
  else{s.gamesPlayed=num(s.gamesPlayed)+1;if(won)s.gamesWon=num(s.gamesWon)+1;s.modeRecords={...(s.modeRecords||{})};const mk=safeKey(detail.mode||kind);s.modeRecords[mk]=Math.max(num(s.modeRecords[mk]),score);if(won){s.modeWins={...(s.modeWins||{})};s.modeWins[mk]=num(s.modeWins[mk])+1;s.multiverseWins={...(s.multiverseWins||{})};const uk=safeKey(detail.universe||'games');s.multiverseWins[uk]=num(s.multiverseWins[uk])+1;}}
  applyRankedDetail(s,detail);s.seasonId=currentSeasonId();s.seasonLabel=currentSeasonLabel();profile.seasonProfile=s;return profile;
}

function compactProfile(p={}){
  return {
    coins:num(p.coins), highScore:num(p.highScore), gamesPlayed:num(p.gamesPlayed), gamesWon:num(p.gamesWon),
    bestStreak:num(p.bestStreak), achievements:p.achievements||{}, platformWins:p.platformWins||{}, modeWins:p.modeWins||{},
    modeRecords:p.modeRecords||{}, multiverseWins:p.multiverseWins||{}, termPlayed:num(p.termPlayed), termWins:num(p.termWins),
    termBestStreak:num(p.termBestStreak), termCurrentStreak:num(p.termCurrentStreak), termModeWins:p.termModeWins||{}, duelWins:num(p.duelWins),
    duelLosses:num(p.duelLosses), duelPlayed:num(p.duelPlayed), duelBestScore:num(p.duelBestScore),
    rankedStats:normalizeRankedStats(p.rankedStats)
  };
}

function mergeProfiles(local={},remote={}){
  const l=compactProfile(local), r=compactProfile(remote);
  return {
    ...local,
    coins:Math.max(l.coins,r.coins), highScore:Math.max(l.highScore,r.highScore),
    gamesPlayed:Math.max(l.gamesPlayed,r.gamesPlayed), gamesWon:Math.max(l.gamesWon,r.gamesWon),
    bestStreak:Math.max(l.bestStreak,r.bestStreak),
    achievements:mergeAchievements(l.achievements,r.achievements),
    platformWins:mapMax(l.platformWins,r.platformWins), modeWins:mapMax(l.modeWins,r.modeWins), modeRecords:mapMax(l.modeRecords,r.modeRecords),
    multiverseWins:mapMax(l.multiverseWins,r.multiverseWins),
    termPlayed:Math.max(l.termPlayed,r.termPlayed), termWins:Math.max(l.termWins,r.termWins), termBestStreak:Math.max(l.termBestStreak,r.termBestStreak),
    termCurrentStreak:Math.max(l.termCurrentStreak,r.termCurrentStreak), termModeWins:mapMax(l.termModeWins,r.termModeWins),
    duelWins:Math.max(l.duelWins,r.duelWins), duelLosses:Math.max(l.duelLosses,r.duelLosses), duelPlayed:Math.max(l.duelPlayed,r.duelPlayed),
    duelBestScore:Math.max(l.duelBestScore,r.duelBestScore),
    rankedStats:mergeRankedStats(l.rankedStats,r.rankedStats)
  };
}

function ratingOf(p={}){
  const mv=Object.values(p.multiverseWins||{}).reduce((a,b)=>a+num(b),0);
  return Math.max(0,Math.round(
    num(p.highScore) + num(p.gamesWon)*18 + num(p.bestStreak)*30 + num(p.termWins)*15 + mv*8 + num(p.duelWins)*350
  ));
}

function leaderboardRow(profile, user=currentUser){
  const p=compactProfile(profile),rs=normalizeRankedStats(p.rankedStats),best=rs.bestMatch||{},played=num(p.gamesPlayed)+num(p.termPlayed)+num(p.duelPlayed),wins=num(p.gamesWon)+num(p.termWins)+num(p.duelWins);
  return {displayName:cleanName(user?.displayName || user?.email?.split('@')[0] || 'Jogador'),rating:ratingOf(p),wins:p.gamesWon,played:p.gamesPlayed,totalPlayed:played,totalWins:wins,bestStreak:p.bestStreak,duelWins:p.duelWins,duelLosses:p.duelLosses,bestScore:num(best.score)||p.highScore,bestMode:String(best.mode||bestStatKey(rs.modes)||bestNumericKey(p.modeRecords)||bestNumericKey(p.modeWins)||''),bestUniverse:String(best.universe||bestStatKey(rs.universes)||bestNumericKey(p.multiverseWins)||''),bestChallenge:String(best.challenge||bestStatKey(rs.challenges)||''),bestDifficulty:String(best.difficulty||bestStatKey(rs.difficulties)||''),arenaBestScore:num(rs.arena.bestScore)||p.duelBestScore,arenaMaxPlayers:num(rs.arena.maxPlayers),arenaPlayed:num(rs.arena.played)||p.duelPlayed,termBestMode:bestStatKey(rs.termo?.modes||{})||bestNumericKey(p.termModeWins),accuracy:played?Math.round(wins/played*100):0,updatedAt:serverNow()};
}

async function flushProfile(profile){
  if(!configured || !currentUser || !db)return;
  const source=profile||localProfile();
  const local=compactProfile(source),localSeason=sameSeasonProfile(source?.seasonProfile)?compactSeasonProfile(source.seasonProfile):freshSeasonProfile();
  const displayName=cleanName(currentUser.displayName || currentUser.email?.split('@')[0] || 'Jogador');
  try{
    const pref=ref(db,`profiles/${currentUser.uid}`);
    const tx=await runTransaction(pref,current=>{
      const merged=compactProfile(mergeProfiles(local,current?.profile||{}));
      const mergedSeason=mergeSeasonProfiles(localSeason,current?.seasonProfile||{});
      return {displayName,email:currentUser.email||'',profile:merged,seasonProfile:mergedSeason,updatedAt:serverNow()};
    },{applyLocally:false});
    const payload=tx.snapshot?.val()||{};
    const merged=compactProfile(mergeProfiles(local,payload.profile||{}));
    const mergedSeason=mergeSeasonProfiles(localSeason,payload.seasonProfile||{});
    await Promise.all([
      set(ref(db,`leaderboard/${currentUser.uid}`),leaderboardRow(merged,currentUser)),
      set(ref(db,`rankedSeasons/${currentSeasonId()}/leaderboard/${currentUser.uid}`),{...leaderboardRow(mergedSeason,currentUser),seasonId:currentSeasonId(),seasonLabel:currentSeasonLabel()})
    ]);
  }catch(e){console.warn('Firebase sync:',e);}
}

function syncLocalProfile(profile){
  if(!configured || !currentUser)return;
  pendingProfile=profile||localProfile();
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>{const p=pendingProfile;pendingProfile=null;flushProfile(p)},650);
}

function setAuthMode(mode){
  authMode=mode==='register'?'register':'login';
  $('loginTabButton')?.classList.toggle('active',authMode==='login');
  $('registerTabButton')?.classList.toggle('active',authMode==='register');
  $('displayNameField')?.classList.toggle('hidden',authMode!=='register');
  if($('authTitle'))$('authTitle').textContent=authMode==='register'?'Criar conta':'Entrar';
  if($('authSubmitButton'))$('authSubmitButton').textContent=authMode==='register'?'CRIAR CONTA':'ENTRAR';
  if($('authPassword'))$('authPassword').autocomplete=authMode==='register'?'new-password':'current-password';
  hideAuthError();
}
function authErrorMessage(e){
  const code=String(e?.code||'');
  if(code.includes('email-already-in-use'))return 'Este e-mail já está cadastrado.';
  if(code.includes('invalid-email'))return 'Digite um e-mail válido.';
  if(code.includes('weak-password'))return 'A senha precisa ter pelo menos 6 caracteres.';
  if(code.includes('invalid-credential')||code.includes('wrong-password')||code.includes('user-not-found'))return 'E-mail ou senha incorretos.';
  if(code.includes('popup-closed'))return 'A janela de login foi fechada.';
  if(code.includes('operation-not-allowed'))return 'Esse método de login ainda não foi ativado no Firebase.';
  return e?.message||'Não foi possível autenticar agora.';
}
function showAuthError(text){if(!$('authError'))return;$('authError').textContent=text;$('authError').classList.remove('hidden');}
function hideAuthError(){$('authError')?.classList.add('hidden');}

function updateAuthUI(){
  const signed=Boolean(currentUser);
  if($('accountLabel'))$('accountLabel').textContent=signed?cleanName(currentUser.displayName||currentUser.email?.split('@')[0]):'Entrar';
  $('duelAuthWarning')?.classList.toggle('hidden',signed);
  $('rankingLoginButton')?.classList.toggle('hidden',signed);
  if($('createDuelButton'))$('createDuelButton').disabled=!signed||!configured;
  if($('joinDuelButton'))$('joinDuelButton').disabled=!signed||!configured;
  const form=$('authForm'),google=$('googleLoginButton'),divider=document.querySelector('.auth-divider'),panel=$('signedInPanel');
  form?.classList.toggle('hidden',signed);google?.classList.toggle('hidden',signed);divider?.classList.toggle('hidden',signed);panel?.classList.toggle('hidden',!signed);
  document.querySelector('.auth-tabs')?.classList.toggle('hidden',signed);
  if(signed){
    if($('signedInName'))$('signedInName').textContent=cleanName(currentUser.displayName||currentUser.email?.split('@')[0]);
    if($('signedInEmail'))$('signedInEmail').textContent=currentUser.email||'';
    const p=localProfile();if($('signedInStats'))$('signedInStats').innerHTML=`<span>🏆 Rating <b>${ratingOf(p)}</b></span><span>⚔️ Arena <b>${num(p.duelWins)}V / ${num(p.duelLosses)}D</b></span>`;
  }
}

function openAuth(mode='login'){
  if(!configured){toast('Firebase ainda não configurado','Abra firebase-config.js e siga FIREBASE-SETUP.md.','error');return;}
  setAuthMode(mode);updateAuthUI();openOverlay('authOverlay');
}

async function register(email,password,name){
  if(!configured)throw new Error('Firebase não configurado.');
  const nick=cleanName(name);if(nick.length<3)throw new Error('Escolha um nome de jogador com pelo menos 3 caracteres.');
  const cred=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(cred.user,{displayName:nick});currentUser=cred.user;await flushProfile(localProfile());return cred.user;
}
async function login(email,password){if(!configured)throw new Error('Firebase não configurado.');return (await signInWithEmailAndPassword(auth,email,password)).user;}
async function googleLogin(){if(!configured)throw new Error('Firebase não configurado.');return (await signInWithPopup(auth,new GoogleAuthProvider())).user;}
async function logout(){
  for(const h of [...duelPresence.values()]){
    try{
      clearInterval(h.timer);
      await h.disconnectPresence.cancel();
      await h.disconnectLastSeen.cancel();
      await remove(h.presenceRef);
    }catch{}
  }
  duelPresence.clear();
  if(auth)await signOut(auth);
}

let rankingMode='rating';
function ensureRankingUI(){
  if(!document.getElementById('gameGuessRankingV12Styles')){
    const style=document.createElement('style');style.id='gameGuessRankingV12Styles';style.textContent=`
      .ranking-v12-filters{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}
      .ranking-v12-filters button{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.035);color:inherit;border-radius:999px;padding:8px 12px;cursor:pointer}
      .ranking-v12-filters button.active{border-color:rgba(91,238,224,.55);background:rgba(91,238,224,.09)}
      .ranking-season-banner{display:grid;gap:4px;margin:0 0 12px;padding:12px 14px;border:1px solid rgba(91,238,224,.2);border-radius:14px;background:rgba(91,238,224,.05)}
      .ranking-season-banner b{font:800 .9rem 'Orbitron'}.ranking-season-banner span{color:#96a6c4}
      .ranking-entry{border-bottom:1px solid rgba(255,255,255,.07)}
      .ranking-entry-main{display:grid;grid-template-columns:56px minmax(0,1fr) 100px auto;gap:10px;align-items:center;padding:14px 12px}
      .ranking-entry.me .ranking-entry-main{background:linear-gradient(90deg,rgba(72,232,255,.09),transparent);border-radius:12px}
      .rank-player-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:5px}.rank-chip{font-size:.72rem;padding:3px 7px;border:1px solid rgba(255,255,255,.09);border-radius:999px;color:#9fb0d0;background:rgba(255,255,255,.025)}
      .rank-detail-toggle{border:1px solid rgba(91,238,224,.25);background:rgba(91,238,224,.06);color:#9ff6eb;border-radius:9px;padding:8px 10px;cursor:pointer;font-weight:700;white-space:nowrap}
      .ranking-detail{display:none;padding:0 14px 14px 68px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
      .ranking-entry.open .ranking-detail{display:grid;animation:rankDetailIn .2s ease}
      .ranking-detail div{border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px;background:rgba(255,255,255,.025)}.ranking-detail small{display:block;opacity:.7;margin-bottom:2px}
      @keyframes rankDetailIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
      @media(max-width:650px){.ranking-entry-main{grid-template-columns:42px minmax(0,1fr) 76px;gap:7px}.rank-detail-toggle{grid-column:2/-1;justify-self:start}.ranking-detail{padding:0 10px 12px;grid-template-columns:1fr 1fr}.rank-player-meta{gap:4px}.rank-chip{font-size:.66rem}.ranking-entry-main>strong{text-align:right}}
      @media(max-width:390px){.ranking-detail{grid-template-columns:1fr}.rank-chip:nth-child(n+3){display:none}}
    `;document.head.appendChild(style);
  }
  const list=$('rankingList');
  if(list&&!$('rankingSeasonBanner')){const b=document.createElement('div');b.id='rankingSeasonBanner';b.className='ranking-season-banner';b.innerHTML=`<b>🏁 ${escapeHtml(currentSeasonLabel())}</b><span>${escapeHtml(currentSeason.description||'Ranking da temporada atual')}</span>`;list.parentElement?.insertBefore(b,list);}
  if(list&&!$('rankingV12Filters')){const bar=document.createElement('div');bar.id='rankingV12Filters';bar.className='ranking-v12-filters';bar.innerHTML=`<button data-rank-mode="rating" class="active">🌍 Geral</button><button data-rank-mode="bestScore">⭐ Melhor partida</button><button data-rank-mode="arenaBestScore">⚔️ Arena</button><button data-rank-mode="bestStreak">🔥 Sequência</button>`;list.parentElement?.insertBefore(bar,list);bar.addEventListener('click',e=>{const b=e.target.closest('[data-rank-mode]');if(!b)return;rankingMode=b.dataset.rankMode;bar.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));loadRanking();});}
  if(list&&!list.dataset.rankDetailsBound){list.dataset.rankDetailsBound='1';list.addEventListener('click',e=>{const btn=e.target.closest('.rank-detail-toggle');if(!btn)return;const entry=btn.closest('.ranking-entry');if(!entry)return;const open=entry.classList.toggle('open');btn.textContent=open?'FECHAR DETALHES':'VER DETALHES';btn.setAttribute('aria-expanded',String(open));});}
}
function labelKey(v){return String(v||'—').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
function prettyRankLabel(v){
  const k=String(v||'').toLowerCase();
  const map={classic:'Clássico',quick:'Rápido',survival:'Survival',blitz:'Blitz',mystery:'Mistério',decades:'Décadas',themed:'Temático',random:'Aleatório',chaos:'Caos',ladder:'Escalada',endless:'Maratona',single:'Uma Palavra',duet:'Dueto',quartet:'Quarteto',image:'Imagem',ability:'Habilidade',origin:'Origem/Nação',group:'Grupo/Afiliação',era:'Saga/Geração',role:'Classe/Papel',dossier:'Dossiê',blind:'Só Pistas',games:'Games',dragonball:'Dragon Ball',naruto:'Naruto',yugioh:'Yu-Gi-Oh!',saintseiya:'Cavaleiros',pokemon:'Pokémon',digimon:'Digimon',lol:'League of Legends',cartoons:'Desenhos',globinho:'TV Globinho',termo:'Termo',easy:'Fácil',normal:'Normal',hard:'Difícil',insane:'Insano'};
  return map[k]||labelKey(v);
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function rankingHTML(rows){
  if(!rows.length)return '<div class="ranking-empty">Ainda não há jogadores no ranking.</div>';
  return rows.map((x,i)=>{
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`,me=currentUser&&x.uid===currentUser.uid;
    const arena=x.arenaPlayed?`${x.duelWins||0}V/${x.duelLosses||0}D • até ${x.arenaMaxPlayers||2} jogadores`:'Sem partidas nesta temporada';
    const bestMode=prettyRankLabel(x.bestMode),bestUniverse=prettyRankLabel(x.bestUniverse),bestChallenge=prettyRankLabel(x.bestChallenge),bestDifficulty=prettyRankLabel(x.bestDifficulty),term=prettyRankLabel(x.termBestMode);
    return `<article class="ranking-entry${me?' me':''}"><div class="ranking-entry-main"><b class="rank-pos">${medal}</b><div class="rank-player"><span>${escapeHtml(x.displayName)}</span><small>⭐ ${x.bestScore||0} melhor • 🎯 ${x.accuracy||0}% aproveitamento</small><div class="rank-player-meta"><span class="rank-chip">🎮 ${escapeHtml(bestMode)}</span><span class="rank-chip">🌌 ${escapeHtml(bestUniverse)}</span><span class="rank-chip">🧩 ${escapeHtml(bestChallenge)}</span></div></div><strong>${x.rating||0}</strong><button type="button" class="rank-detail-toggle" aria-expanded="false">VER DETALHES</button></div><div class="ranking-detail"><div><small>Melhor modalidade</small><b>${escapeHtml(bestMode)}</b></div><div><small>Melhor universo</small><b>${escapeHtml(bestUniverse)}</b></div><div><small>Melhor desafio</small><b>${escapeHtml(bestChallenge)}</b></div><div><small>Dificuldade de destaque</small><b>${escapeHtml(bestDifficulty)}</b></div><div><small>Melhor pontuação</small><b>${x.bestScore||0} pts</b></div><div><small>Maior sequência</small><b>🔥 ${x.bestStreak||0}</b></div><div><small>Arena</small><b>${escapeHtml(arena)}</b></div><div><small>Termo de destaque</small><b>${escapeHtml(term)}</b></div></div></article>`;
  }).join('');
}
function loadRanking(){
  showScreen('rankingScreen');ensureRankingUI();if(rankingUnsub){rankingUnsub();rankingUnsub=null;}
  if(!configured){$('rankingList').innerHTML='<div class="ranking-empty">Configure o Firebase para ativar o ranking global.</div>';return;}
  if(!currentUser){$('rankingList').innerHTML='<div class="ranking-empty">Entre na sua conta para carregar o ranking.</div>';$('myRankCard').innerHTML='<span>Faça login para aparecer no ranking.</span>';return;}
  const q=query(ref(db,`rankedSeasons/${currentSeasonId()}/leaderboard`),orderByChild('rating'),limitToLast(100));
  rankingUnsub=onValue(q,snap=>{const raw=snap.val()||{},rows=Object.entries(raw).map(([uid,v])=>({uid,...v})).sort((a,b)=>(Number(b[rankingMode]||0)-Number(a[rankingMode]||0))||((b.rating||0)-(a.rating||0)));if($('rankingList'))$('rankingList').innerHTML=rankingHTML(rows);const idx=rows.findIndex(x=>x.uid===currentUser.uid),mine=rows[idx];if($('myRankCard'))$('myRankCard').innerHTML=mine?`<b>#${idx+1}</b><span>${escapeHtml(mine.displayName)}</span><strong>${mine.rating} pts</strong><small>⭐ ${mine.bestScore||0} • ⚔️ ${mine.duelWins||0} vitórias • ${mine.accuracy||0}% aproveitamento</small>`:'<span>Jogue uma partida para entrar no ranking.</span>';},e=>{$('rankingList').innerHTML=`<div class="ranking-empty">Não consegui ler o ranking: ${escapeHtml(e.message)}</div>`;});
}

function roomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let out='';for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out;}
function playerOnline(room,uid){return Object.keys(room?.presence?.[uid]||{}).length>0;}
function claimedSlots(room){return Object.entries(room?.slots||{}).filter(([,uid])=>Boolean(uid));}
async function attachDuelPresence(code){
  if(!currentUser||!db||!code)return;code=String(code).toUpperCase();const key=`${code}:${currentUser.uid}`;if(duelPresence.has(key))return;
  const presenceRef=ref(db,`duels/${code}/presence/${currentUser.uid}/${CLIENT_SESSION_ID}`),playerRef=ref(db,`duels/${code}/players/${currentUser.uid}`),lastSeenRef=ref(db,`duels/${code}/players/${currentUser.uid}/lastSeen`);
  const disconnectPresence=onDisconnect(presenceRef),disconnectLastSeen=onDisconnect(lastSeenRef);await disconnectPresence.remove();await disconnectLastSeen.set(serverTimestamp());
  await set(presenceRef,{sessionId:CLIENT_SESSION_ID,connectedAt:serverTimestamp(),heartbeatAt:serverTimestamp()});await update(playerRef,{controlSessionId:CLIENT_SESSION_ID,lastSeen:serverNow(),connectionState:'online'}).catch(()=>{});
  const timer=setInterval(async()=>{if(!currentUser)return;await update(presenceRef,{heartbeatAt:serverTimestamp()}).catch(()=>{});await set(lastSeenRef,serverNow()).catch(()=>{});},8000);duelPresence.set(key,{presenceRef,playerRef,lastSeenRef,disconnectPresence,disconnectLastSeen,timer,code});
}
async function detachDuelPresence(code){
  if(!currentUser||!db||!code)return;code=String(code).toUpperCase();const key=`${code}:${currentUser.uid}`,h=duelPresence.get(key);
  if(h){clearInterval(h.timer);await h.disconnectPresence.cancel().catch(()=>{});await h.disconnectLastSeen.cancel().catch(()=>{});await remove(h.presenceRef).catch(()=>{});duelPresence.delete(key);}else await remove(ref(db,`duels/${code}/presence/${currentUser.uid}/${CLIENT_SESSION_ID}`)).catch(()=>{});
}
async function cleanupExpiredDuel(code){if(!db||!code)return false;const r=ref(db,`duels/${String(code).toUpperCase()}`),snap=await get(r),room=snap.val();if(room?.expiresAt&&Number(room.expiresAt)<=serverNow()){await remove(r).catch(()=>{});return true;}return false;}
async function createDuelRoom(payload){
  if(!currentUser)throw new Error('Faça login antes de criar uma arena.');
  for(let tries=0;tries<8;tries++){const code=roomCode(),r=ref(db,`duels/${code}`);if((await get(r)).exists())continue;const name=cleanName(currentUser.displayName||currentUser.email?.split('@')[0]),maxPlayers=Math.max(2,Math.min(8,Number(payload?.config?.maxPlayers||2))),now=serverNow();const room={code,protocolVersion:PROTOCOL_VERSION,appVersion:APP_VERSION,hostUid:currentUser.uid,status:'waiting',roundState:'waiting',createdAt:now,updatedAt:now,expiresAt:now+WAITING_TTL_MS,startedAt:0,finishedAt:0,roundIndex:0,roundDeadline:0,revealUntil:0,timeoutRound:-1,roundHadSkip:false,config:{...(payload.config||{}),maxPlayers},questions:payload.questions||[],slots:{1:currentUser.uid},players:{[currentUser.uid]:{uid:currentUser.uid,name,slot:1,joinedAt:now,lastSeen:now,connectionState:'online',controlSessionId:CLIENT_SESSION_ID,lives:3,correct:0,score:0,wrong:0,roundWrong:0,roundSolved:false,roundResult:'',eliminated:false,left:false,lastRound:-1,lastSubmissionId:''}}};await set(r,room);await attachDuelPresence(code);return code;}throw new Error('Não consegui gerar um código de sala. Tente novamente.');
}
async function claimDuelSlot(code,maxPlayers){
  for(let slot=1;slot<=maxPlayers;slot++){
    const sr=ref(db,`duels/${code}/slots/${slot}`),result=await runTransaction(sr,current=>{if(current===currentUser.uid)return current;if(current===null||current===undefined)return currentUser.uid;return;},{applyLocally:false});
    if(result.committed&&result.snapshot?.val()===currentUser.uid){
      const disconnectSlot=onDisconnect(sr);
      await disconnectSlot.remove();
      return {slot,disconnectSlot};
    }
  }
  return null;
}
async function releaseDuelSlot(code,slot){if(!slot)return;await runTransaction(ref(db,`duels/${code}/slots/${slot}`),current=>current===currentUser?.uid?null:current,{applyLocally:false}).catch(()=>{});}
async function joinDuelRoom(code){
  if(!currentUser)throw new Error('Faça login antes de entrar na arena.');code=String(code||'').trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))throw new Error('Código inválido.');
  const roomRef=ref(db,`duels/${code}`),snap=await get(roomRef);if(!snap.exists())throw new Error('Sala não encontrada.');const initial=snap.val();
  if(Number(initial.protocolVersion||0)!==PROTOCOL_VERSION)throw new Error(`Esta sala usa outra versão do jogo. Atualize a página (V${APP_VERSION}).`);
  if(initial.expiresAt&&Number(initial.expiresAt)<=serverNow()){await cleanupExpiredDuel(code);throw new Error('Esta arena expirou. Crie uma nova sala.');}
  if(initial.status==='finished')throw new Error('Esta arena já foi finalizada.');if(initial.players?.[currentUser.uid]){await attachDuelPresence(code);return code;}if(initial.status!=='waiting')throw new Error('Esta arena já começou.');
  const maxPlayers=Math.max(2,Math.min(8,Number(initial.config?.maxPlayers||2))),claim=await claimDuelSlot(code,maxPlayers);if(!claim)throw new Error('Esta arena acabou de ficar cheia.');
  const slot=claim.slot,name=cleanName(currentUser.displayName||currentUser.email?.split('@')[0]),now=serverNow(),playerRef=ref(db,`duels/${code}/players/${currentUser.uid}`),player={uid:currentUser.uid,name,slot,joinedAt:now,lastSeen:now,connectionState:'online',controlSessionId:CLIENT_SESSION_ID,lives:3,correct:0,score:0,wrong:0,roundWrong:0,roundSolved:false,roundResult:'',eliminated:false,left:false,lastRound:-1,lastSubmissionId:''};
  try{await set(playerRef,player);await claim.disconnectSlot.cancel();}catch(error){await claim.disconnectSlot.cancel().catch(()=>{});await releaseDuelSlot(code,slot);if(String(error?.code||error?.message||'').toLowerCase().includes('permission'))throw new Error('O Firebase recusou a entrada. Publique o database.rules.json da V13.');throw error;}
  const after=(await get(roomRef)).val();if(!after||after.status!=='waiting'||Number(after.protocolVersion)!==PROTOCOL_VERSION){await remove(playerRef).catch(()=>{});await releaseDuelSlot(code,slot);throw new Error('A sala iniciou ou mudou de versão enquanto você entrava.');}
  await attachDuelPresence(code);const joinedCount=Object.values(after.players||{}).filter(p=>!p.left).length;if(joinedCount>=maxPlayers){try{await startDuelRoom(code,true);}catch{}}else await update(roomRef,{updatedAt:serverNow()}).catch(()=>{});return code;
}
async function startDuelRoom(code,allowAnyPlayer=false){
  if(!currentUser)throw new Error('Sessão expirada. Entre novamente.');code=String(code||'').trim().toUpperCase();
  const result=await runTransaction(ref(db,`duels/${code}`),room=>{if(!room)return;if(Number(room.protocolVersion||0)!==PROTOCOL_VERSION)return;if(!allowAnyPlayer&&room.hostUid!==currentUser.uid)return;if(!room.players?.[currentUser.uid])return;if(room.status!=='waiting')return;const players=Object.values(room.players||{}).filter(p=>!p.left);if(players.length<2)return;const now=serverNow();room.status='playing';room.roundState='playing';room.startedAt=now;room.roundDeadline=now+35000;room.revealUntil=0;room.timeoutRound=-1;room.roundHadSkip=false;room.updatedAt=now;room.expiresAt=now+PLAYING_TTL_MS;for(const p of players){p.roundSolved=false;p.roundWrong=0;p.roundResult='';p.eliminated=false;p.left=false;p.lastSubmissionId='';if(!Number.isFinite(Number(p.lives)))p.lives=3;}return room;},{applyLocally:false});
  if(!result.committed)throw new Error('É preciso ter pelo menos 2 jogadores e permissão para iniciar.');return result.snapshot?.val()||null;
}
async function ensureDuelHost(code){
  if(!currentUser||!code)return;await runTransaction(ref(db,`duels/${String(code).toUpperCase()}`),room=>{if(!room||!room.players?.[currentUser.uid]||room.status==='finished')return;const host=room.players?.[room.hostUid],hostPresent=playerOnline(room,room.hostUid),stale=!host||host.left||(!hostPresent&&(serverNow()-Number(host?.lastSeen||0)>=HOST_GRACE_MS));if(!stale)return;const replacement=Object.values(room.players||{}).filter(p=>!p.left).sort((a,b)=>(Number(a.slot||99)-Number(b.slot||99))||(Number(a.joinedAt||0)-Number(b.joinedAt||0)))[0];if(replacement&&replacement.uid!==room.hostUid){room.hostUid=replacement.uid;room.lastEvent={type:'host-migrated',uid:replacement.uid,at:serverNow()};room.updatedAt=serverNow();}return room;},{applyLocally:false}).catch(()=>{});
}
async function leaveDuelRoom(code){
  if(!currentUser||!code)return;code=String(code).toUpperCase();await detachDuelPresence(code).catch(()=>{});await runTransaction(ref(db,`duels/${code}`),room=>{if(!room)return;const p=room.players?.[currentUser.uid];if(!p)return;const slot=p.slot;delete room.players[currentUser.uid];if(slot&&room.slots?.[slot]===currentUser.uid)delete room.slots[slot];if(room.hostUid===currentUser.uid){const replacement=Object.values(room.players||{}).filter(x=>!x.left).sort((a,b)=>Number(a.slot||99)-Number(b.slot||99))[0];if(replacement)room.hostUid=replacement.uid;}if(!Object.keys(room.players||{}).length)return null;room.updatedAt=serverNow();return room;},{applyLocally:false});
}
function watchDuel(code,cb){if(!db)return()=>{};return onValue(ref(db,`duels/${code}`),s=>cb(s.val()),e=>cb(null,e));}
async function mutateDuel(code,fn){
  if(!currentUser)throw new Error('Sessão expirada. Entre novamente.');const result=await runTransaction(ref(db,`duels/${code}`),room=>{if(!room)return;const uid=currentUser.uid,p=room.players?.[uid];if(!p||p.left)return;if(p.controlSessionId&&p.controlSessionId!==CLIENT_SESSION_ID)return;const before=JSON.stringify(room),next=fn(room,uid);if(!next)return;if(JSON.stringify(next)===before)return;next.updatedAt=serverNow();return next;},{applyLocally:false});return {committed:result.committed,value:result.snapshot?.val()||null};
}
async function deleteDuel(code){if(!currentUser||!code)return;code=String(code).toUpperCase();await detachDuelPresence(code).catch(()=>{});const snap=await get(ref(db,`duels/${code}`)),room=snap.val();if(room?.hostUid===currentUser.uid||Number(room?.expiresAt||0)<=serverNow())await remove(ref(db,`duels/${code}`));}

function bind(){
  $('accountButton')?.addEventListener('click',()=>openAuth('login'));
  $('authCloseButton')?.addEventListener('click',()=>closeOverlay('authOverlay'));
  $('loginTabButton')?.addEventListener('click',()=>setAuthMode('login'));
  $('registerTabButton')?.addEventListener('click',()=>setAuthMode('register'));
  $('rankingButton')?.addEventListener('click',loadRanking);$('homeRankingButton')?.addEventListener('click',loadRanking);
  $('rankingBackButton')?.addEventListener('click',()=>showScreen('homeScreen'));$('rankingLoginButton')?.addEventListener('click',()=>openAuth('login'));
  $('authForm')?.addEventListener('submit',async e=>{e.preventDefault();hideAuthError();const email=$('authEmail').value.trim(),pass=$('authPassword').value;try{if(authMode==='register')await register(email,pass,$('authDisplayName').value);else await login(email,pass);closeOverlay('authOverlay');toast('Conta conectada','Seu progresso agora pode aparecer no ranking.');}catch(err){showAuthError(authErrorMessage(err));}});
  $('googleLoginButton')?.addEventListener('click',async()=>{hideAuthError();try{await googleLogin();closeOverlay('authOverlay');toast('Conta conectada','Login com Google concluído.');}catch(err){showAuthError(authErrorMessage(err));}});
  $('logoutButton')?.addEventListener('click',async()=>{await logout();closeOverlay('authOverlay');toast('Sessão encerrada','Você saiu da conta.');});
}

if(configured){
  try{
    app=initializeApp(CONFIG);auth=getAuth(app);db=getDatabase(app);
    serverOffsetUnsub=onValue(ref(db,'.info/serverTimeOffset'),s=>{serverOffsetMs=Number(s.val()||0);});
    connectedUnsub=onValue(ref(db,'.info/connected'),async s=>{
      firebaseConnected=Boolean(s.val());
      if(firebaseConnected){
        for(const h of duelPresence.values()){
          try{
            await h.disconnectPresence.remove();
            await h.disconnectLastSeen.set(serverTimestamp());
            await set(h.presenceRef,{sessionId:CLIENT_SESSION_ID,connectedAt:serverTimestamp(),heartbeatAt:serverTimestamp()});
            await update(h.playerRef,{lastSeen:serverNow(),connectionState:'online'});
          }catch{}
        }
      }
    });
    seasonUnsub=onValue(ref(db,'rankedConfig/currentSeason'),snap=>{currentSeason=normalizeSeason(snap.val()||DEFAULT_SEASON);if($('rankingSeasonBanner'))$('rankingSeasonBanner').innerHTML=`<b>🏁 ${escapeHtml(currentSeasonLabel())}</b><span>${escapeHtml(currentSeason.description||'Ranking da temporada atual')}</span>`;},()=>{currentSeason={...DEFAULT_SEASON};});
        onAuthStateChanged(auth,async user=>{
      currentUser=user||null;
      if(user){
        try{
          const snap=await get(ref(db,`profiles/${user.uid}`));const root=snap.val()||{},remote=root.profile||{};const merged=mergeProfiles(localProfile(),remote);const season=mergeSeasonProfiles(localProfile()?.seasonProfile||{},root.seasonProfile||{});
          CORE()?.replaceProfile?.({...merged,seasonProfile:season});await flushProfile({...merged,seasonProfile:season});
        }catch(e){console.warn('Profile restore:',e);}
      }
      updateAuthUI();window.dispatchEvent(new CustomEvent('gameguess:authchange',{detail:{user:currentUser}}));
    });
  }catch(e){console.error('Firebase init:',e);}
}

window.GameGuessRanked={record:recordRankedResult};
window.GameGuessFirebase={
  configured, appVersion:APP_VERSION, protocolVersion:PROTOCOL_VERSION, sessionId:CLIENT_SESSION_ID,
  ready:()=>configured&&Boolean(db), getUser:()=>currentUser, openAuth, loadRanking, login, register, googleLogin, logout,
  syncLocalProfile, ratingOf, serverNow, isConnected, newSubmissionId, recordRankedResult, getSeason:()=>({...currentSeason}),
  createDuelRoom, joinDuelRoom, startDuelRoom, leaveDuelRoom, ensureDuelHost, attachDuelPresence, detachDuelPresence, cleanupExpiredDuel,
  watchDuel, mutateDuel, deleteDuel,getRoom:async code=>configured?(await get(ref(db,`duels/${String(code||'').toUpperCase()}`))).val():null
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
if(!configured)setTimeout(()=>{if($('accountLabel'))$('accountLabel').textContent='Configurar';updateAuthUI();},0);
