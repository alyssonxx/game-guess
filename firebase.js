import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getDatabase, ref, set, get, update, onValue, query, orderByChild,
  limitToLast, runTransaction, remove
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js';

const CONFIG = window.GAME_GUESS_FIREBASE_CONFIG || {};
const configured = Boolean(
  CONFIG.apiKey && CONFIG.databaseURL && CONFIG.projectId && CONFIG.appId &&
  !String(CONFIG.apiKey).includes('COLE_') && !String(CONFIG.projectId).includes('SEU-PROJETO')
);

const $ = id => document.getElementById(id);
const CORE = () => window.GameGuessCore;
const PROFILE_KEY = 'gameGuessArcadeV4';
let app = null, auth = null, db = null, currentUser = null;
let authMode = 'login';
let rankingUnsub = null;
let syncTimer = null;
let pendingProfile = null;

function showScreen(id) { CORE()?.showScreen?.(id); }
function toast(a,b,t='') { CORE()?.toast?.(a,b,t); }
function openOverlay(id){const el=$(id);if(!el)return;el.classList.add('active');el.setAttribute('aria-hidden','false');}
function closeOverlay(id){const el=$(id);if(!el)return;el.classList.remove('active');el.setAttribute('aria-hidden','true');}
function localProfile(){try{return CORE()?.getProfile?.() || JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}catch{return {}}}
function cleanName(v){return String(v||'Jogador').trim().replace(/[<>]/g,'').slice(0,20)||'Jogador';}
function num(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:0;}
function mapMax(a={},b={}){const out={...a};for(const [k,v] of Object.entries(b||{}))out[k]=Math.max(num(out[k]),num(v));return out;}
function mergeAchievements(a={},b={}){return {...a,...b};}

function compactProfile(p={}){
  return {
    coins:num(p.coins), highScore:num(p.highScore), gamesPlayed:num(p.gamesPlayed), gamesWon:num(p.gamesWon),
    bestStreak:num(p.bestStreak), achievements:p.achievements||{}, platformWins:p.platformWins||{}, modeWins:p.modeWins||{},
    modeRecords:p.modeRecords||{}, multiverseWins:p.multiverseWins||{}, termPlayed:num(p.termPlayed), termWins:num(p.termWins),
    termBestStreak:num(p.termBestStreak), termCurrentStreak:num(p.termCurrentStreak), duelWins:num(p.duelWins),
    duelLosses:num(p.duelLosses), duelPlayed:num(p.duelPlayed), duelBestScore:num(p.duelBestScore)
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
    termCurrentStreak:Math.max(l.termCurrentStreak,r.termCurrentStreak),
    duelWins:Math.max(l.duelWins,r.duelWins), duelLosses:Math.max(l.duelLosses,r.duelLosses), duelPlayed:Math.max(l.duelPlayed,r.duelPlayed),
    duelBestScore:Math.max(l.duelBestScore,r.duelBestScore)
  };
}

function ratingOf(p={}){
  const mv=Object.values(p.multiverseWins||{}).reduce((a,b)=>a+num(b),0);
  return Math.max(0,Math.round(
    num(p.highScore) + num(p.gamesWon)*18 + num(p.bestStreak)*30 + num(p.termWins)*15 + mv*8 + num(p.duelWins)*350
  ));
}

function leaderboardRow(profile, user=currentUser){
  const p=compactProfile(profile);
  return {
    displayName:cleanName(user?.displayName || user?.email?.split('@')[0] || 'Jogador'),
    rating:ratingOf(p), wins:p.gamesWon, played:p.gamesPlayed, bestStreak:p.bestStreak,
    duelWins:p.duelWins, duelLosses:p.duelLosses, updatedAt:Date.now()
  };
}

async function flushProfile(profile){
  if(!configured || !currentUser || !db)return;
  const p=compactProfile(profile||localProfile());
  const displayName=cleanName(currentUser.displayName || currentUser.email?.split('@')[0] || 'Jogador');
  await Promise.all([
    set(ref(db,`profiles/${currentUser.uid}`),{displayName,email:currentUser.email||'',profile:p,updatedAt:Date.now()}),
    set(ref(db,`leaderboard/${currentUser.uid}`),leaderboardRow(p,currentUser))
  ]).catch(e=>console.warn('Firebase sync:',e));
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
    const p=localProfile();if($('signedInStats'))$('signedInStats').innerHTML=`<span>🏆 Rating <b>${ratingOf(p)}</b></span><span>⚔️ 1x1 <b>${num(p.duelWins)}V / ${num(p.duelLosses)}D</b></span>`;
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
async function logout(){if(auth)await signOut(auth);}

function rankingHTML(rows){
  if(!rows.length)return '<div class="ranking-empty">Ainda não há jogadores no ranking.</div>';
  return rows.map((x,i)=>{
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`;
    const me=currentUser&&x.uid===currentUser.uid;
    return `<div class="ranking-row${me?' me':''}"><b class="rank-pos">${medal}</b><div class="rank-player"><span>${escapeHtml(x.displayName)}</span><small>${x.wins||0} acertos • melhor sequência ${x.bestStreak||0}</small></div><strong>${x.rating||0}</strong><span>⚔️ ${x.duelWins||0}V/${x.duelLosses||0}D</span></div>`;
  }).join('');
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function loadRanking(){
  showScreen('rankingScreen');
  if(rankingUnsub){rankingUnsub();rankingUnsub=null;}
  if(!configured){$('rankingList').innerHTML='<div class="ranking-empty">Configure o Firebase para ativar o ranking global.</div>';return;}
  if(!currentUser){$('rankingList').innerHTML='<div class="ranking-empty">Entre na sua conta para carregar o ranking.</div>';$('myRankCard').innerHTML='<span>Faça login para aparecer no ranking.</span>';return;}
  const q=query(ref(db,'leaderboard'),orderByChild('rating'),limitToLast(100));
  rankingUnsub=onValue(q,snap=>{
    const raw=snap.val()||{};const rows=Object.entries(raw).map(([uid,v])=>({uid,...v})).sort((a,b)=>(b.rating||0)-(a.rating||0));
    if($('rankingList'))$('rankingList').innerHTML=rankingHTML(rows);
    const idx=rows.findIndex(x=>x.uid===currentUser.uid);const me=rows[idx];
    if($('myRankCard'))$('myRankCard').innerHTML=me?`<b>#${idx+1}</b><span>${escapeHtml(me.displayName)}</span><strong>${me.rating} pts</strong><small>⚔️ ${me.duelWins||0} vitórias 1x1</small>`:'<span>Jogue uma partida para entrar no ranking.</span>';
  },e=>{$('rankingList').innerHTML=`<div class="ranking-empty">Não consegui ler o ranking: ${escapeHtml(e.message)}</div>`;});
}

function roomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let out='';for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out;}
async function createDuelRoom(payload){
  if(!currentUser)throw new Error('Faça login antes de criar um duelo.');
  for(let tries=0;tries<8;tries++){
    const code=roomCode(),r=ref(db,`duels/${code}`),exists=(await get(r)).exists();if(exists)continue;
    const name=cleanName(currentUser.displayName||currentUser.email?.split('@')[0]);
    const room={
      code,hostUid:currentUser.uid,status:'waiting',createdAt:Date.now(),updatedAt:Date.now(),roundIndex:0,roundDeadline:0,
      config:payload.config||{},questions:payload.questions||[],
      players:{[currentUser.uid]:{uid:currentUser.uid,name,lives:3,correct:0,score:0,wrong:0,roundWrong:0,roundSolved:false,lastRound:-1}}
    };
    await set(r,room);return code;
  }
  throw new Error('Não consegui gerar um código de sala. Tente novamente.');
}

async function joinDuelRoom(code){
  if(!currentUser){
    throw new Error('Faça login antes de entrar no duelo.');
  }

  code = String(code || '')
    .trim()
    .toUpperCase();

  if(!/^[A-Z2-9]{6}$/.test(code)){
    throw new Error('Código inválido.');
  }

  const r = ref(db, `duels/${code}`);
  const name = cleanName(
    currentUser.displayName ||
    currentUser.email?.split('@')[0]
  );

  // IMPORTANTE:
  // primeiro carrega a sala do servidor antes da transação.
  const initialSnapshot = await get(r);

  if(!initialSnapshot.exists()){
    throw new Error('Sala não encontrada.');
  }

  const initialRoom = initialSnapshot.val();

  if(initialRoom.hostUid === currentUser.uid){
    throw new Error(
      'Esta sala foi criada por esta mesma conta. Entre com outra conta no segundo aparelho.'
    );
  }

  if(initialRoom.status === 'finished'){
    throw new Error('Esta sala já foi finalizada.');
  }

  if(
    initialRoom.guestUid &&
    initialRoom.guestUid !== currentUser.uid
  ){
    throw new Error('Esta sala já está cheia.');
  }

  // Agora que a sala está carregada,
  // fazemos a transação para evitar dois jogadores
  // entrarem simultaneamente.
  const result = await runTransaction(
    r,
    room => {
      if(!room){
        return;
      }

      if(room.status === 'finished'){
        return;
      }

      if(
        room.guestUid &&
        room.guestUid !== currentUser.uid
      ){
        return;
      }

      room.guestUid = currentUser.uid;

      room.players = room.players || {};

      room.players[currentUser.uid] =
        room.players[currentUser.uid] || {
          uid: currentUser.uid,
          name,
          lives: 3,
          correct: 0,
          score: 0,
          wrong: 0,
          roundWrong: 0,
          roundSolved: false,
          lastRound: -1
        };

      room.status = 'playing';
      room.roundDeadline = Date.now() + 35000;
      room.updatedAt = Date.now();

      return room;
    },
    {
      applyLocally: false
    }
  );

  if(!result.committed){
    throw new Error(
      'Não foi possível entrar. A sala pode ter sido ocupada por outro jogador.'
    );
  }

  return code;
}
function watchDuel(code,cb){if(!db)return()=>{};return onValue(ref(db,`duels/${code}`),s=>cb(s.val()),e=>cb(null,e));}
async function mutateDuel(code,fn){
  if(!currentUser)throw new Error('Sessão expirada. Entre novamente.');
  const result=await runTransaction(ref(db,`duels/${code}`),room=>{
    if(!room)return;
    const uid=currentUser.uid;if(uid!==room.hostUid&&uid!==room.guestUid)return;
    const next=fn(room,uid);if(!next)return;next.updatedAt=Date.now();return next;
  });
  return {committed:result.committed,value:result.snapshot?.val()||null};
}
async function deleteDuel(code){if(!currentUser||!code)return;const snap=await get(ref(db,`duels/${code}`));const room=snap.val();if(room?.hostUid===currentUser.uid)await remove(ref(db,`duels/${code}`));}

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
    onAuthStateChanged(auth,async user=>{
      currentUser=user||null;
      if(user){
        try{
          const snap=await get(ref(db,`profiles/${user.uid}`));const remote=snap.val()?.profile||{};const merged=mergeProfiles(localProfile(),remote);
          CORE()?.replaceProfile?.(merged);await flushProfile(merged);
        }catch(e){console.warn('Profile restore:',e);}
      }
      updateAuthUI();window.dispatchEvent(new CustomEvent('gameguess:authchange',{detail:{user:currentUser}}));
    });
  }catch(e){console.error('Firebase init:',e);}
}

window.GameGuessFirebase={
  configured, ready:()=>configured&&Boolean(db), getUser:()=>currentUser, openAuth, loadRanking, login, register, googleLogin, logout,
  syncLocalProfile, ratingOf, createDuelRoom, joinDuelRoom, watchDuel, mutateDuel, deleteDuel,
  getRoom:async code=>configured?(await get(ref(db,`duels/${String(code||'').toUpperCase()}`))).val():null
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
if(!configured)setTimeout(()=>{if($('accountLabel'))$('accountLabel').textContent='Configurar';updateAuthUI();},0);
