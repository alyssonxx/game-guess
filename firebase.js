import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getDatabase, ref, set, get, update, onValue, query, orderByChild, orderByValue,
  limitToLast, runTransaction, remove, onDisconnect, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js';

const CONFIG = window.GAME_GUESS_FIREBASE_CONFIG || {};
const APP_VERSION = '18.0.0';
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
const fightPresence = new Map();
const geoPresence = new Map();
let authMode = 'login';
let socialPresenceHandle = null;
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
// ===== Arcade Ranked V2.6: RP competitivo começa em 0 =====
const ARCADE_RANK_VERSION=2;
const ARCADE_PLACEMENT_MATCHES=10;
function finite(v,fallback=0){const n=Number(v);return Number.isFinite(n)?n:fallback;}
function clampInt(v,min=0,max=999999){return Math.max(min,Math.min(max,Math.round(finite(v,0))));}
function blankArcadeCompetitive(){return {version:ARCADE_RANK_VERSION,rp:0,played:0,wins:0,losses:0,currentStreak:0,bestStreak:0,revision:0,updatedAt:0,lastMatchCode:'',lastDelta:0,games:{},appliedMatches:{}};}
function normalizeArcadeCompetitiveGame(v={}){return {rp:clampInt(v?.rp,0,999999),played:clampInt(v?.played,0,999999),wins:clampInt(v?.wins,0,999999),losses:clampInt(v?.losses,0,999999)};}
function normalizeArcadeCompetitive(v={}){
  if(Number(v?.version)!==ARCADE_RANK_VERSION)return blankArcadeCompetitive();
  const games={};for(const [k,g] of Object.entries(v?.games&&typeof v.games==='object'?v.games:{}))games[safeKey(k)]=normalizeArcadeCompetitiveGame(g);
  const applied={};for(const [k,t] of Object.entries(v?.appliedMatches&&typeof v.appliedMatches==='object'?v.appliedMatches:{})){if(/^[A-Z2-9]{6}$/.test(String(k)))applied[k]=clampInt(t,0,9999999999999);}
  const wins=clampInt(v.wins),losses=clampInt(v.losses),played=Math.max(clampInt(v.played),wins+losses);
  return {version:ARCADE_RANK_VERSION,rp:clampInt(v.rp,0,999999),played,wins,losses,currentStreak:clampInt(v.currentStreak),bestStreak:clampInt(v.bestStreak),revision:clampInt(v.revision),updatedAt:clampInt(v.updatedAt,0,9999999999999),lastMatchCode:String(v.lastMatchCode||''),lastDelta:Math.round(finite(v.lastDelta,0)),games,appliedMatches:applied};
}
function mergeArcadeCompetitive(a={},b={}){const A=normalizeArcadeCompetitive(a),B=normalizeArcadeCompetitive(b);if(B.revision>A.revision)return B;if(A.revision>B.revision)return A;return B.updatedAt>=A.updatedAt?B:A;}
function arcadeCompetitiveLeague(rp=0,played=0){
  rp=clampInt(rp);played=clampInt(played);
  const placement=Math.min(ARCADE_PLACEMENT_MATCHES,played);
  if(rp>=2000)return {key:'grandmaster',label:'Grão-Mestre',icon:'👑',min:2000,next:0,placement};
  if(rp>=1700)return {key:'master',label:'Mestre',icon:'🔥',min:1700,next:2000,placement};
  if(rp>=1400)return {key:'diamond',label:'Diamante',icon:'💎',min:1400,next:1700,placement};
  if(rp>=1100)return {key:'platinum',label:'Platina',icon:'💠',min:1100,next:1400,placement};
  if(rp>=800)return {key:'gold',label:'Ouro',icon:'🥇',min:800,next:1100,placement};
  if(rp>=500)return {key:'silver',label:'Prata',icon:'🥈',min:500,next:800,placement};
  if(rp>=200)return {key:'bronze',label:'Bronze',icon:'🥉',min:200,next:500,placement};
  return {key:'rookie',label:'Recruta',icon:'🎮',min:0,next:200,placement};
}
function arcadeCompetitiveTransfer(winnerRp=0,loserRp=0,winnerPlayed=0,loserPlayed=0){
  const diff=clampInt(winnerRp)-clampInt(loserRp);
  let points=diff>=600?6:diff>=300?10:diff>=100?14:diff>-100?20:diff>-300?28:diff>-600?36:48;
  if(clampInt(winnerPlayed)<ARCADE_PLACEMENT_MATCHES||clampInt(loserPlayed)<ARCADE_PLACEMENT_MATCHES)points=Math.min(56,points+8);
  return points;
}
function bestCompetitiveGameKey(map={}){return Object.entries(map&&typeof map==='object'?map:{}).map(([k,v])=>[k,normalizeArcadeCompetitiveGame(v)]).sort((a,b)=>(b[1].rp-a[1].rp)||(b[1].wins-a[1].wins)||(b[1].played-a[1].played))[0]?.[0]||'';}


// ===== Arcade Rewards V2.7: moedas, recompensas de rank, cosméticos e troféus =====
const ARCADE_REWARD_VERSION=1;
const ARCADE_REWARD_RANKS=Object.freeze([
  {key:'rookie',label:'Recruta',icon:'🎮',min:0,coins:0,unlocks:['title_rookie','frame_rookie']},
  {key:'bronze',label:'Bronze',icon:'🥉',min:200,coins:100,unlocks:['frame_bronze','avatar_gloves_bronze']},
  {key:'silver',label:'Prata',icon:'🥈',min:500,coins:200,unlocks:['frame_silver','title_competidor','avatar_jacket_competitor']},
  {key:'gold',label:'Ouro',icon:'🥇',min:800,coins:300,unlocks:['frame_gold','banner_gold','avatar_shoes_gold']},
  {key:'platinum',label:'Platina',icon:'💠',min:1100,coins:500,unlocks:['frame_platinum','banner_platinum','title_elite','avatar_outfit_neon']},
  {key:'diamond',label:'Diamante',icon:'💎',min:1400,coins:750,unlocks:['frame_diamond','effect_diamond','avatar_aura_diamond']},
  {key:'master',label:'Mestre',icon:'🔥',min:1700,coins:1000,unlocks:['frame_master','banner_master','title_mestre_arcade','effect_flame','avatar_pose_master']},
  {key:'grandmaster',label:'Grão-Mestre',icon:'👑',min:2000,coins:2000,unlocks:['frame_grandmaster','banner_grandmaster','title_grandmaster','effect_crown','avatar_crown_grandmaster']}
]);
const ARCADE_REWARD_CATALOG=Object.freeze({
  title_rookie:{id:'title_rookie',type:'title',name:'Novato do Arcade',icon:'🎮',price:0,source:'rank'},
  title_competidor:{id:'title_competidor',type:'title',name:'Competidor',icon:'⚔️',price:0,source:'rank'},
  title_elite:{id:'title_elite',type:'title',name:'Elite Arcade',icon:'💠',price:0,source:'rank'},
  title_mestre_arcade:{id:'title_mestre_arcade',type:'title',name:'Mestre Arcade',icon:'🔥',price:0,source:'rank'},
  title_grandmaster:{id:'title_grandmaster',type:'title',name:'Grão-Mestre',icon:'👑',price:0,source:'rank'},
  title_primeira_vitoria:{id:'title_primeira_vitoria',type:'title',name:'Primeira Vitória',icon:'🏁',price:0,source:'milestone'},
  title_classificado:{id:'title_classificado',type:'title',name:'Classificado',icon:'📊',price:0,source:'milestone'},
  title_em_chamas:{id:'title_em_chamas',type:'title',name:'Em Chamas',icon:'🔥',price:0,source:'milestone'},
  title_imparavel:{id:'title_imparavel',type:'title',name:'Imparável',icon:'⚡',price:0,source:'milestone'},
  title_centuriao:{id:'title_centuriao',type:'title',name:'Centurião Arcade',icon:'💯',price:0,source:'milestone'},
  title_campeao:{id:'title_campeao',type:'title',name:'Campeão de Torneio',icon:'🏆',price:0,source:'tournament'},
  frame_rookie:{id:'frame_rookie',type:'frame',name:'Moldura Recruta',icon:'🎮',price:0,source:'rank'},
  frame_bronze:{id:'frame_bronze',type:'frame',name:'Moldura Bronze',icon:'🥉',price:0,source:'rank'},
  frame_silver:{id:'frame_silver',type:'frame',name:'Moldura Prata',icon:'🥈',price:0,source:'rank'},
  frame_gold:{id:'frame_gold',type:'frame',name:'Moldura Ouro',icon:'🥇',price:0,source:'rank'},
  frame_platinum:{id:'frame_platinum',type:'frame',name:'Moldura Platina',icon:'💠',price:0,source:'rank'},
  frame_diamond:{id:'frame_diamond',type:'frame',name:'Moldura Diamante',icon:'💎',price:0,source:'rank'},
  frame_master:{id:'frame_master',type:'frame',name:'Moldura Mestre',icon:'🔥',price:0,source:'rank'},
  frame_grandmaster:{id:'frame_grandmaster',type:'frame',name:'Moldura Grão-Mestre',icon:'👑',price:0,source:'rank'},
  frame_champion:{id:'frame_champion',type:'frame',name:'Moldura Tricampeão',icon:'🏆',price:0,source:'tournament'},
  banner_gold:{id:'banner_gold',type:'banner',name:'Banner Ouro',icon:'🥇',price:0,source:'rank'},
  banner_platinum:{id:'banner_platinum',type:'banner',name:'Banner Platina',icon:'💠',price:0,source:'rank'},
  banner_master:{id:'banner_master',type:'banner',name:'Banner Mestre',icon:'🔥',price:0,source:'rank'},
  banner_grandmaster:{id:'banner_grandmaster',type:'banner',name:'Banner Grão-Mestre',icon:'👑',price:0,source:'rank'},
  banner_veteran:{id:'banner_veteran',type:'banner',name:'Banner Veterano',icon:'🛡️',price:0,source:'milestone'},
  effect_diamond:{id:'effect_diamond',type:'effect',name:'Brilho Diamante',icon:'💎',price:0,source:'rank'},
  effect_flame:{id:'effect_flame',type:'effect',name:'Aura de Mestre',icon:'🔥',price:0,source:'rank'},
  effect_crown:{id:'effect_crown',type:'effect',name:'Coroa Suprema',icon:'👑',price:0,source:'rank'},
  effect_streak:{id:'effect_streak',type:'effect',name:'Pulso de Sequência',icon:'⚡',price:0,source:'milestone'},
  title_desafiante:{id:'title_desafiante',type:'title',name:'Desafiante',icon:'🥊',price:150,source:'shop'},
  frame_neon:{id:'frame_neon',type:'frame',name:'Moldura Neon',icon:'🟦',price:250,source:'shop'},
  banner_retrowave:{id:'banner_retrowave',type:'banner',name:'Banner Retrowave',icon:'🌆',price:400,source:'shop'},
  effect_pulse:{id:'effect_pulse',type:'effect',name:'Pulso Arcade',icon:'💫',price:500,source:'shop'},
  frame_crimson:{id:'frame_crimson',type:'frame',name:'Moldura Crimson',icon:'🔴',price:650,source:'shop'},
  banner_cosmic:{id:'banner_cosmic',type:'banner',name:'Banner Cósmico',icon:'🌌',price:800,source:'shop'},
  effect_sparks:{id:'effect_sparks',type:'effect',name:'Faíscas de Campeão',icon:'✨',price:900,source:'shop'},
  title_lenda:{id:'title_lenda',type:'title',name:'Lenda do Arcade',icon:'🌟',price:1200,source:'shop'},
  title_giant_killer:{id:'title_giant_killer',type:'title',name:'Caçador de Gigantes',icon:'⚡',price:0,source:'milestone'},
  title_titan_slayer:{id:'title_titan_slayer',type:'title',name:'Matador de Titãs',icon:'🗿',price:0,source:'milestone'},
  title_season_champion:{id:'title_season_champion',type:'title',name:'Campeão da Temporada',icon:'🏆',price:0,source:'season'},
  frame_top10:{id:'frame_top10',type:'frame',name:'Moldura Top 10',icon:'💎',price:0,source:'season'},
  frame_podium:{id:'frame_podium',type:'frame',name:'Moldura Pódio',icon:'🥇',price:0,source:'season'},
  banner_top100:{id:'banner_top100',type:'banner',name:'Banner Top 100',icon:'🏅',price:0,source:'season'},
  banner_top50:{id:'banner_top50',type:'banner',name:'Banner Top 50',icon:'💠',price:0,source:'season'},
  banner_top10:{id:'banner_top10',type:'banner',name:'Banner Top 10',icon:'💎',price:0,source:'season'},
  effect_champion:{id:'effect_champion',type:'effect',name:'Aura de Campeão',icon:'🌟',price:0,source:'season'},
  avatar_gloves_bronze:{id:'avatar_gloves_bronze',type:'avatar',name:'Luvas Bronze',icon:'🥊',price:0,source:'rank'},
  avatar_jacket_competitor:{id:'avatar_jacket_competitor',type:'avatar',name:'Jaqueta Competidor',icon:'🧥',price:0,source:'rank'},
  avatar_shoes_gold:{id:'avatar_shoes_gold',type:'avatar',name:'Tênis Golden Fighter',icon:'👟',price:0,source:'rank'},
  avatar_outfit_neon:{id:'avatar_outfit_neon',type:'avatar',name:'Conjunto Neon',icon:'💠',price:0,source:'rank'},
  avatar_aura_diamond:{id:'avatar_aura_diamond',type:'avatar',name:'Aura Diamante 3D',icon:'💎',price:0,source:'rank'},
  avatar_pose_master:{id:'avatar_pose_master',type:'avatar',name:'Pose Mestre',icon:'🔥',price:0,source:'rank'},
  avatar_crown_grandmaster:{id:'avatar_crown_grandmaster',type:'avatar',name:'Coroa Grão-Mestre 3D',icon:'👑',price:0,source:'rank'},
  avatar_hair_pixel:{id:'avatar_hair_pixel',type:'avatar',name:'Cabelo Pixel',icon:'💇',price:300,source:'shop'},
  avatar_mask_shadow:{id:'avatar_mask_shadow',type:'avatar',name:'Máscara Shadow',icon:'🥷',price:450,source:'shop'},
  avatar_jacket_cyber:{id:'avatar_jacket_cyber',type:'avatar',name:'Jaqueta Cyber',icon:'🦾',price:600,source:'shop'},
  avatar_aura_neon:{id:'avatar_aura_neon',type:'avatar',name:'Aura Neon',icon:'💫',price:800,source:'shop'},
  avatar_pose_victory:{id:'avatar_pose_victory',type:'avatar',name:'Pose Vitória Arcade',icon:'🙌',price:900,source:'shop'},
  avatar_outfit_retrowave:{id:'avatar_outfit_retrowave',type:'avatar',name:'Conjunto Retrowave',icon:'🌆',price:1000,source:'shop'},
  avatar_dragon_aura:{id:'avatar_dragon_aura',type:'avatar',name:'Aura Dragão Neon',icon:'🐉',price:1400,source:'shop'},
  avatar_hair_season:{id:'avatar_hair_season',type:'avatar',name:'Cabelo Season One',icon:'⚡',price:0,source:'battlepass'},
  avatar_jacket_season:{id:'avatar_jacket_season',type:'avatar',name:'Jaqueta Season One',icon:'🧥',price:0,source:'battlepass'},
  avatar_mask_arcade:{id:'avatar_mask_arcade',type:'avatar',name:'Máscara Arcade',icon:'🎭',price:0,source:'battlepass'},
  avatar_aura_season:{id:'avatar_aura_season',type:'avatar',name:'Aura Season One',icon:'🌌',price:0,source:'battlepass'}
}
);
const ARCADE_FIGHT_GAMES=Object.freeze({
  kf2k2mp2:{label:'KOF 2002',icon:'🥊'}, samsh5spho:{label:'Samurai Shodown',icon:'⚔️'}, mvsc:{label:'Marvel vs. Capcom',icon:'🦸'}, xmvsfur1:{label:'X-Men vs. Street Fighter',icon:'✖️'}
});
const ARCADE_BADGE_RANKS=['bronze','silver','gold','platinum','diamond','master','grandmaster'];
const ARCADE_GAME_BADGE_CATALOG=Object.freeze(Object.fromEntries(Object.entries(ARCADE_FIGHT_GAMES).flatMap(([game,g])=>ARCADE_BADGE_RANKS.map(rank=>{
  const r=ARCADE_REWARD_RANKS.find(x=>x.key===rank);const id=`badge_${game}_${rank}`;return [id,{id,type:'badge',name:`${g.label} • ${r?.label||rank}`,icon:`${g.icon}${r?.icon||'🏅'}`,price:0,source:'game-rank',game,rank}];
}))));
const ARCADE_BATTLE_PASS_MAX_LEVEL=30;
const ARCADE_BATTLE_PASS_REWARDS=Object.freeze([
  {level:2,coins:50,unlocks:[]},{level:5,coins:100,unlocks:['avatar_hair_season']},{level:10,coins:150,unlocks:['avatar_jacket_season']},{level:15,coins:200,unlocks:['effect_pulse']},{level:20,coins:250,unlocks:['avatar_mask_arcade']},{level:25,coins:350,unlocks:['banner_cosmic']},{level:30,coins:500,unlocks:['avatar_aura_season','title_lenda']}
]);
const ARCADE_UPSET_REWARDS=Object.freeze([
  {gap:300,key:'giant_300',label:'Vencer rival +300 RP',coins:80,unlocks:['title_giant_killer']},
  {gap:500,key:'giant_500',label:'Vencer rival +500 RP',coins:150,unlocks:['effect_sparks']},
  {gap:700,key:'giant_700',label:'Vencer rival +700 RP',coins:250,unlocks:['title_titan_slayer']}
]);
const ARCADE_SEASON_PLACEMENT_REWARDS=Object.freeze([
  {max:1,label:'#1 da temporada',coins:2500,unlocks:['title_season_champion','frame_podium','effect_champion','avatar_aura_season']},
  {max:3,label:'Top 3',coins:1500,unlocks:['frame_podium','banner_top10']},
  {max:10,label:'Top 10',coins:1000,unlocks:['frame_top10','banner_top10']},
  {max:50,label:'Top 50',coins:500,unlocks:['banner_top50']},
  {max:100,label:'Top 100',coins:250,unlocks:['banner_top100']}
]);
function rewardCatalogItem(id){return ARCADE_REWARD_CATALOG[id]||ARCADE_GAME_BADGE_CATALOG[id]||null;}
function passLevelFromXp(xp=0){return Math.max(1,Math.min(ARCADE_BATTLE_PASS_MAX_LEVEL,Math.floor(clampInt(xp,0,999999)/100)+1));}
function normalizeBattlePass(v={},seasonId=currentSeasonId()){
  const sid=String(seasonId||currentSeasonId()).toUpperCase();if(String(v?.seasonId||'').toUpperCase()!==sid)return {seasonId:sid,xp:0,level:1,claims:{}};
  const xp=clampInt(v.xp,0,999999);return {seasonId:sid,xp,level:passLevelFromXp(xp),claims:rewardMap(v.claims)};
}
function applyBattlePassProgress(state,xpGain,now,grantUnlock,seasonId=currentSeasonId()){
  state.seasonPass=normalizeBattlePass(state.seasonPass,seasonId);state.seasonPass.xp=clampInt(state.seasonPass.xp+Math.max(0,Number(xpGain)||0),0,999999);state.seasonPass.level=passLevelFromXp(state.seasonPass.xp);
  let coins=0;const rewards=[];
  for(const reward of ARCADE_BATTLE_PASS_REWARDS){if(reward.level>state.seasonPass.level||state.seasonPass.claims[reward.level])continue;state.seasonPass.claims[reward.level]={at:now,level:reward.level,coins:reward.coins};coins+=reward.coins;for(const id of reward.unlocks||[])grantUnlock(id);rewards.push(reward.level);}
  return {coins,rewards,pass:{...state.seasonPass}};
}
const ARCADE_REWARD_MILESTONES=Object.freeze([
  {key:'first_win',label:'Primeira vitória',coins:25,test:s=>s.wins>=1,unlocks:['title_primeira_vitoria']},
  {key:'placement_10',label:'Classificação concluída',coins:100,test:s=>s.played>=10,unlocks:['title_classificado']},
  {key:'streak_5',label:'5 vitórias seguidas',coins:50,test:s=>s.currentStreak>=5,unlocks:['title_em_chamas']},
  {key:'streak_10',label:'10 vitórias seguidas',coins:120,test:s=>s.currentStreak>=10,unlocks:['effect_streak']},
  {key:'streak_20',label:'20 vitórias seguidas',coins:300,test:s=>s.currentStreak>=20,unlocks:['title_imparavel']},
  {key:'wins_25',label:'25 vitórias ranqueadas',coins:150,test:s=>s.wins>=25,unlocks:[]},
  {key:'wins_50',label:'50 vitórias ranqueadas',coins:250,test:s=>s.wins>=50,unlocks:['banner_veteran']},
  {key:'wins_100',label:'100 vitórias ranqueadas',coins:500,test:s=>s.wins>=100,unlocks:['title_centuriao']}
]);
function rewardMap(v={}){return v&&typeof v==='object'&&!Array.isArray(v)?{...v}:{}};
function blankArcadeRewards(){return {version:ARCADE_REWARD_VERSION,coins:0,earned:0,spent:0,revision:0,updatedAt:0,matchClaims:{},rankClaims:{},milestoneClaims:{},tournamentClaims:{},seasonPlacementClaims:{},purchases:{},unlocks:{title_rookie:1,frame_rookie:1},equipped:{title:'title_rookie',frame:'frame_rookie',banner:'',effect:''},seasonBadges:{},seasonPass:{seasonId:currentSeasonId(),xp:0,level:1,claims:{}},trophies:{tournaments:0}};}
function normalizeArcadeRewards(v={}){
  const base=blankArcadeRewards();if(Number(v?.version)!==ARCADE_REWARD_VERSION)return base;
  const unlocks=rewardMap(v.unlocks);unlocks.title_rookie=unlocks.title_rookie||1;unlocks.frame_rookie=unlocks.frame_rookie||1;
  const equipped={...base.equipped,...rewardMap(v.equipped)};
  for(const type of ['title','frame','banner','effect']){const id=String(equipped[type]||'');if(id&&!unlocks[id])equipped[type]='';}
  return {version:ARCADE_REWARD_VERSION,coins:clampInt(v.coins,0,9999999),earned:clampInt(v.earned,0,99999999),spent:clampInt(v.spent,0,99999999),revision:clampInt(v.revision,0,99999999),updatedAt:clampInt(v.updatedAt,0,9999999999999),matchClaims:rewardMap(v.matchClaims),rankClaims:rewardMap(v.rankClaims),milestoneClaims:rewardMap(v.milestoneClaims),tournamentClaims:rewardMap(v.tournamentClaims),seasonPlacementClaims:rewardMap(v.seasonPlacementClaims),purchases:rewardMap(v.purchases),unlocks,equipped,seasonBadges:rewardMap(v.seasonBadges),seasonPass:normalizeBattlePass(v.seasonPass,currentSeasonId()),trophies:{tournaments:clampInt(v?.trophies?.tournaments,0,999999)}};
}
function mergeArcadeRewards(a={},b={}){const A=normalizeArcadeRewards(a),B=normalizeArcadeRewards(b);if(B.revision>A.revision)return B;if(A.revision>B.revision)return A;return B.updatedAt>=A.updatedAt?B:A;}
function arcadeRewardRankByKey(key){return ARCADE_REWARD_RANKS.find(r=>r.key===key)||ARCADE_REWARD_RANKS[0];}
function arcadeRewardCatalogPublic(){return [...Object.values(ARCADE_REWARD_CATALOG),...Object.values(ARCADE_GAME_BADGE_CATALOG)].map(x=>({...x}));}
function rewardUnlock(state,id,at){if(rewardCatalogItem(id)&&!state.unlocks[id])state.unlocks[id]=at;}
function rewardEquipPublic(state){const s=normalizeArcadeRewards(state),out={};for(const type of ['title','frame','banner','effect']){const id=s.equipped?.[type]||'',item=rewardCatalogItem(id);out[type]=id;out[`${type}Label`]=item?.name||'';out[`${type}Icon`]=item?.icon||'';}return out;}
let arcadeRewardCache=blankArcadeRewards();

// Compatibilidade com o ranking Arcade legado. Esses campos antigos continuam sendo
// lidos por telas históricas, mas o competitivo V2.6 usa arcadeCompetitive.rp.
function arcadeRating(wins=0,losses=0){return Math.max(800,1000+num(wins)*35-num(losses)*18);}
function arcadeGameStat(v={}){const wins=num(v.wins),losses=num(v.losses),played=Math.max(num(v.played),wins+losses);return {played,wins,losses,rating:arcadeRating(wins,losses)};}
function normalizeArcadeGames(map={}){const out={};for(const [k,v] of Object.entries(map&&typeof map==='object'?map:{})){const key=safeKey(k);out[key]=arcadeGameStat(v);}return out;}
function mergeArcadeGames(a={},b={}){const A=normalizeArcadeGames(a),B=normalizeArcadeGames(b),out={};for(const k of new Set([...Object.keys(A),...Object.keys(B)])){const x=A[k]||{},y=B[k]||{},wins=Math.max(num(x.wins),num(y.wins)),losses=Math.max(num(x.losses),num(y.losses)),played=Math.max(num(x.played),num(y.played),wins+losses);out[k]={played,wins,losses,rating:arcadeRating(wins,losses)};}return out;}
function bestArcadeGameKey(map={}){return Object.entries(normalizeArcadeGames(map)).sort((a,b)=>(num(b[1].rating)-num(a[1].rating))||(num(b[1].wins)-num(a[1].wins))||(num(b[1].played)-num(a[1].played)))[0]?.[0]||'';}

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

function statMerge(a={},b={}){return {played:Math.max(num(a.played),num(b.played)),wins:Math.max(num(a.wins),num(b.wins)),bestScore:Math.max(num(a.bestScore),num(b.bestScore)),bestCorrect:Math.max(num(a.bestCorrect),num(b.bestCorrect)),rating:Math.max(num(a.rating)||1000,num(b.rating)||1000)};}
function mergeStatMap(a={},b={}){const out={};for(const k of new Set([...Object.keys(a||{}),...Object.keys(b||{})]))out[k]=statMerge(a?.[k],b?.[k]);return out;}
function normalizeRankedStats(s={}){return {bestMatch:s.bestMatch&&typeof s.bestMatch==='object'?s.bestMatch:{},modes:s.modes&&typeof s.modes==='object'?s.modes:{},universes:s.universes&&typeof s.universes==='object'?s.universes:{},challenges:s.challenges&&typeof s.challenges==='object'?s.challenges:{},difficulties:s.difficulties&&typeof s.difficulties==='object'?s.difficulties:{},arena:s.arena&&typeof s.arena==='object'?s.arena:{played:0,wins:0,losses:0,bestScore:0,maxPlayers:0,rating:1000},termo:s.termo&&typeof s.termo==='object'?s.termo:{modes:{}},overallRating:num(s.overallRating)||1000};}
function mergeRankedStats(a={},b={}){const A=normalizeRankedStats(a),B=normalizeRankedStats(b),bestA=num(A.bestMatch?.score),bestB=num(B.bestMatch?.score);return {bestMatch:bestB>bestA?B.bestMatch:A.bestMatch,modes:mergeStatMap(A.modes,B.modes),universes:mergeStatMap(A.universes,B.universes),challenges:mergeStatMap(A.challenges,B.challenges),difficulties:mergeStatMap(A.difficulties,B.difficulties),arena:{played:Math.max(num(A.arena.played),num(B.arena.played)),wins:Math.max(num(A.arena.wins),num(B.arena.wins)),losses:Math.max(num(A.arena.losses),num(B.arena.losses)),bestScore:Math.max(num(A.arena.bestScore),num(B.arena.bestScore)),maxPlayers:Math.max(num(A.arena.maxPlayers),num(B.arena.maxPlayers)),rating:Math.max(num(A.arena.rating)||1000,num(B.arena.rating)||1000)},termo:{modes:mergeStatMap(A.termo?.modes||{},B.termo?.modes||{})},overallRating:Math.max(num(A.overallRating)||1000,num(B.overallRating)||1000)};}
function bestStatKey(map={}){return Object.entries(map||{}).sort((a,b)=>(num(b[1]?.bestScore)-num(a[1]?.bestScore))||(num(b[1]?.wins)-num(a[1]?.wins)))[0]?.[0]||'';}
function bestNumericKey(map={}){return Object.entries(map||{}).sort((a,b)=>num(b[1])-num(a[1]))[0]?.[0]||'';}
function updateModeRating(ratingsBefore={},mode='',difficulty='normal',isWin=false){
  if(!window.GameGuessScoring?.updateRating)return ratingsBefore;
  const currentRating=num(ratingsBefore[mode]?.rating)||1000;
  const newRating=window.GameGuessScoring.updateRating(currentRating,isWin,difficulty);
  return {...ratingsBefore,[mode]:{...(ratingsBefore[mode]||{}),rating:newRating}};
}
function applyRankedDetail(target={},detail={}){
  const s=normalizeRankedStats(target.rankedStats),score=num(detail.score),correct=num(detail.correct),won=Boolean(detail.won);
  const bump=(map,key)=>{key=safeKey(key);const cur=map[key]||{played:0,wins:0,bestScore:0,bestCorrect:0,rating:1000};cur.played=num(cur.played)+1;if(won)cur.wins=num(cur.wins)+1;cur.bestScore=Math.max(num(cur.bestScore),score);cur.bestCorrect=Math.max(num(cur.bestCorrect),correct);map[key]=cur;};
  const mode=detail.mode||detail.kind||'geral';
  bump(s.modes,mode);bump(s.universes,detail.universe||'games');bump(s.challenges,detail.challenge||'geral');bump(s.difficulties,detail.difficulty||'normal');
  if(detail.kind==='arena'){s.arena.played=num(s.arena.played)+1;if(won)s.arena.wins=num(s.arena.wins)+1;else if(!detail.tie)s.arena.losses=num(s.arena.losses)+1;s.arena.bestScore=Math.max(num(s.arena.bestScore),score);s.arena.maxPlayers=Math.max(num(s.arena.maxPlayers),num(detail.players));s.arena.rating=updateModeRating({rating:num(s.arena.rating)||1000},'arena',detail.difficulty||'normal',won)['arena']?.rating||1000;}
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
  else if(kind==='kof'){s.kofPlayed=num(s.kofPlayed)+1;if(won)s.kofWins=num(s.kofWins)+1;else if(!detail.tie)s.kofLosses=num(s.kofLosses)+1;s.kofBestStreak=Math.max(num(s.kofBestStreak),num(detail.streak));s.kofRating=Math.max(1000,1000+num(s.kofWins)*35-num(s.kofLosses)*22);}
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
    kofPlayed:num(p.kofPlayed), kofWins:num(p.kofWins), kofLosses:num(p.kofLosses), kofBestStreak:num(p.kofBestStreak), kofCurrentStreak:num(p.kofCurrentStreak), kofRating:Math.max(1000,Number(p.kofRating)||1000),
    arcadePlayed:Math.max(num(p.arcadePlayed),num(p.kofPlayed)), arcadeWins:Math.max(num(p.arcadeWins),num(p.kofWins)), arcadeLosses:Math.max(num(p.arcadeLosses),num(p.kofLosses)), arcadeBestStreak:Math.max(num(p.arcadeBestStreak),num(p.kofBestStreak)), arcadeCurrentStreak:num(p.arcadeCurrentStreak), arcadeRating:arcadeRating(Math.max(num(p.arcadeWins),num(p.kofWins)),Math.max(num(p.arcadeLosses),num(p.kofLosses))), arcadeGames:normalizeArcadeGames(p.arcadeGames), arcadeCompetitive:normalizeArcadeCompetitive(p.arcadeCompetitive), arcadeRewards:normalizeArcadeRewards(p.arcadeRewards),
    geoPlayed:num(p.geoPlayed), geoWins:num(p.geoWins), geoBestScore:num(p.geoBestScore), nickname:String(p.nickname||''), bio:String(p.bio||''), favoriteGame:String(p.favoriteGame||''), avatar:p.avatar&&typeof p.avatar==='object'?p.avatar:{}, avatarOwned:Array.isArray(p.avatarOwned)?p.avatarOwned.slice(0,1000):[], avatarSpent:num(p.avatarSpent),
    rankedStats:normalizeRankedStats(p.rankedStats)
  };
}

function mergeProfiles(local={},remote={}){
  const l=compactProfile(local), r=compactProfile(remote);
  return {
    ...local,
    coins:Math.max(0,Math.max(l.coins+l.avatarSpent,r.coins+r.avatarSpent)-Math.max(l.avatarSpent,r.avatarSpent)), highScore:Math.max(l.highScore,r.highScore),
    gamesPlayed:Math.max(l.gamesPlayed,r.gamesPlayed), gamesWon:Math.max(l.gamesWon,r.gamesWon),
    bestStreak:Math.max(l.bestStreak,r.bestStreak),
    achievements:mergeAchievements(l.achievements,r.achievements),
    platformWins:mapMax(l.platformWins,r.platformWins), modeWins:mapMax(l.modeWins,r.modeWins), modeRecords:mapMax(l.modeRecords,r.modeRecords),
    multiverseWins:mapMax(l.multiverseWins,r.multiverseWins),
    termPlayed:Math.max(l.termPlayed,r.termPlayed), termWins:Math.max(l.termWins,r.termWins), termBestStreak:Math.max(l.termBestStreak,r.termBestStreak),
    termCurrentStreak:Math.max(l.termCurrentStreak,r.termCurrentStreak), termModeWins:mapMax(l.termModeWins,r.termModeWins),
    duelWins:Math.max(l.duelWins,r.duelWins), duelLosses:Math.max(l.duelLosses,r.duelLosses), duelPlayed:Math.max(l.duelPlayed,r.duelPlayed),
    duelBestScore:Math.max(l.duelBestScore,r.duelBestScore),
    kofPlayed:Math.max(l.kofPlayed,r.kofPlayed),kofWins:Math.max(l.kofWins,r.kofWins),kofLosses:Math.max(l.kofLosses,r.kofLosses),kofBestStreak:Math.max(l.kofBestStreak,r.kofBestStreak),kofCurrentStreak:Math.max(l.kofCurrentStreak,r.kofCurrentStreak),kofRating:Math.max(l.kofRating,r.kofRating,1000),
    arcadePlayed:Math.max(l.arcadePlayed,r.arcadePlayed,l.kofPlayed,r.kofPlayed),arcadeWins:Math.max(l.arcadeWins,r.arcadeWins,l.kofWins,r.kofWins),arcadeLosses:Math.max(l.arcadeLosses,r.arcadeLosses,l.kofLosses,r.kofLosses),arcadeBestStreak:Math.max(l.arcadeBestStreak,r.arcadeBestStreak,l.kofBestStreak,r.kofBestStreak),arcadeCurrentStreak:Math.max(l.arcadeCurrentStreak,r.arcadeCurrentStreak),arcadeRating:arcadeRating(Math.max(l.arcadeWins,r.arcadeWins,l.kofWins,r.kofWins),Math.max(l.arcadeLosses,r.arcadeLosses,l.kofLosses,r.kofLosses)),arcadeGames:mergeArcadeGames(l.arcadeGames,r.arcadeGames),arcadeCompetitive:mergeArcadeCompetitive(l.arcadeCompetitive,r.arcadeCompetitive),arcadeRewards:mergeArcadeRewards(l.arcadeRewards,r.arcadeRewards),
    geoPlayed:Math.max(l.geoPlayed,r.geoPlayed),geoWins:Math.max(l.geoWins,r.geoWins),geoBestScore:Math.max(l.geoBestScore,r.geoBestScore),nickname:l.nickname||r.nickname,bio:l.bio||r.bio,favoriteGame:l.favoriteGame||r.favoriteGame,avatar:Object.keys(l.avatar||{}).length?l.avatar:r.avatar,avatarOwned:[...new Set([...(l.avatarOwned||[]),...(r.avatarOwned||[])])],avatarSpent:Math.max(l.avatarSpent,r.avatarSpent),
    rankedStats:mergeRankedStats(l.rankedStats,r.rankedStats)
  };
}

function ratingOf(p={}){
  const mv=Object.values(p.multiverseWins||{}).reduce((a,b)=>a+num(b),0);
  return Math.max(0,Math.round(
    num(p.highScore) + num(p.gamesWon)*18 + num(p.bestStreak)*30 + num(p.termWins)*15 + mv*8 + num(p.duelWins)*350 + Math.max(num(p.arcadeWins),num(p.kofWins))*260 + num(p.geoWins)*120
  ));
}

function leaderboardRow(profile, user=currentUser){
  const p=compactProfile(profile),rs=normalizeRankedStats(p.rankedStats),best=rs.bestMatch||{};
  const legacyArcadePlayed=Math.max(num(p.arcadePlayed),num(p.kofPlayed)),legacyArcadeWins=Math.max(num(p.arcadeWins),num(p.kofWins)),legacyArcadeLosses=Math.max(num(p.arcadeLosses),num(p.kofLosses));
  const ac=normalizeArcadeCompetitive(p.arcadeCompetitive),league=arcadeCompetitiveLeague(ac.rp,ac.played),rewardState=normalizeArcadeRewards(p.arcadeRewards),rewardDecor=rewardEquipPublic(rewardState);
  const played=num(p.gamesPlayed)+num(p.termPlayed)+num(p.duelPlayed)+ac.played+num(p.geoPlayed),wins=num(p.gamesWon)+num(p.termWins)+num(p.duelWins)+ac.wins+num(p.geoWins);
  const bestArcadeGame=bestCompetitiveGameKey(ac.games);
  return {displayName:cleanName(p.nickname || user?.displayName || user?.email?.split('@')[0] || 'Jogador'),rating:ratingOf(p),wins:p.gamesWon,played:p.gamesPlayed,totalPlayed:played,totalWins:wins,bestStreak:p.bestStreak,duelWins:p.duelWins,duelLosses:p.duelLosses,bestScore:num(best.score)||p.highScore,bestMode:String(best.mode||bestStatKey(rs.modes)||bestNumericKey(p.modeRecords)||bestNumericKey(p.modeWins)||''),bestUniverse:String(best.universe||bestStatKey(rs.universes)||bestNumericKey(p.multiverseWins)||''),bestChallenge:String(best.challenge||bestStatKey(rs.challenges)||''),bestDifficulty:String(best.difficulty||bestStatKey(rs.difficulties)||''),arenaBestScore:num(rs.arena.bestScore)||p.duelBestScore,arenaMaxPlayers:num(rs.arena.maxPlayers),arenaPlayed:num(rs.arena.played)||p.duelPlayed,termBestMode:bestStatKey(rs.termo?.modes||{})||bestNumericKey(p.termModeWins),kofWins:p.kofWins,kofLosses:p.kofLosses,kofPlayed:p.kofPlayed,kofBestStreak:p.kofBestStreak,kofRating:p.kofRating,arcadeWins:ac.wins,arcadeLosses:ac.losses,arcadePlayed:ac.played,arcadeBestStreak:ac.bestStreak,arcadeCurrentStreak:ac.currentStreak,arcadeRp:ac.rp,arcadeRating:ac.rp,arcadeRankVersion:ARCADE_RANK_VERSION,arcadeDivision:league.label,arcadeDivisionIcon:league.icon,arcadePlacement:Math.min(ARCADE_PLACEMENT_MATCHES,ac.played),arcadePlacementTotal:ARCADE_PLACEMENT_MATCHES,arcadeGames:ac.games,bestArcadeGame,arcadeRewardTitle:rewardDecor.titleLabel,arcadeRewardTitleIcon:rewardDecor.titleIcon,arcadeRewardFrame:rewardDecor.frame,arcadeRewardBanner:rewardDecor.banner,arcadeRewardEffect:rewardDecor.effect,arcadeTournamentTrophies:rewardState.trophies.tournaments,legacyArcadePlayed,legacyArcadeWins,legacyArcadeLosses,geoWins:p.geoWins,geoPlayed:p.geoPlayed,geoBestScore:p.geoBestScore,accuracy:played?Math.round(wins/played*100):0,updatedAt:serverNow()};
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
  if($('accountLabel'))$('accountLabel').textContent=signed?cleanName(localProfile()?.nickname||currentUser.displayName||currentUser.email?.split('@')[0]):'Entrar';
  $('duelAuthWarning')?.classList.toggle('hidden',signed);
  $('rankingLoginButton')?.classList.toggle('hidden',signed);
  if($('createDuelButton'))$('createDuelButton').disabled=!signed||!configured;
  if($('joinDuelButton'))$('joinDuelButton').disabled=!signed||!configured;
  const form=$('authForm'),google=$('googleLoginButton'),divider=document.querySelector('.auth-divider'),panel=$('signedInPanel');
  form?.classList.toggle('hidden',signed);google?.classList.toggle('hidden',signed);divider?.classList.toggle('hidden',signed);panel?.classList.toggle('hidden',!signed);
  document.querySelector('.auth-tabs')?.classList.toggle('hidden',signed);
  if(signed){
    if($('signedInName'))$('signedInName').textContent=cleanName(localProfile()?.nickname||currentUser.displayName||currentUser.email?.split('@')[0]);
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
  for(const h of [...fightPresence.values()]){try{clearInterval(h.timer);await h.dp.cancel();await h.dl.cancel();if(h.dr)await h.dr.cancel();await remove(h.pr);if(h.rr)await remove(h.rr);}catch{}}
  fightPresence.clear();
  for(const h of [...geoPresence.values()]){
    try{
      clearInterval(h.timer);
      await h.disconnectPresence.cancel();
      await h.disconnectLastSeen.cancel();
      await remove(h.presenceRef);
    }catch{}
  }
  geoPresence.clear();
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
  if(list&&!$('rankingV12Filters')){const bar=document.createElement('div');bar.id='rankingV12Filters';bar.className='ranking-v12-filters';bar.innerHTML=`<button data-rank-mode="rating" class="active">🌍 Geral</button><button data-rank-mode="arcadeRp">🕹 Arcade Ranked</button><button data-rank-mode="bestScore">⭐ Melhor partida</button><button data-rank-mode="arenaBestScore">⚔️ Arena</button><button data-rank-mode="bestStreak">🔥 Sequência</button>`;list.parentElement?.insertBefore(bar,list);bar.addEventListener('click',e=>{const b=e.target.closest('[data-rank-mode]');if(!b)return;rankingMode=b.dataset.rankMode;bar.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));loadRanking();});}
  if(list&&!list.dataset.rankDetailsBound){list.dataset.rankDetailsBound='1';list.addEventListener('click',e=>{const btn=e.target.closest('.rank-detail-toggle');if(!btn)return;const entry=btn.closest('.ranking-entry');if(!entry)return;const open=entry.classList.toggle('open');btn.textContent=open?'FECHAR DETALHES':'VER DETALHES';btn.setAttribute('aria-expanded',String(open));});}
}
function labelKey(v){return String(v||'—').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
function prettyRankLabel(v){
  const k=String(v||'').toLowerCase();
  const map={classic:'Clássico',quick:'Rápido',survival:'Survival',blitz:'Blitz',mystery:'Mistério',decades:'Décadas',themed:'Temático',random:'Aleatório',chaos:'Caos',ladder:'Escalada',endless:'Maratona',single:'Uma Palavra',duet:'Dueto',quartet:'Quarteto',image:'Imagem',ability:'Habilidade',origin:'Origem/Nação',group:'Grupo/Afiliação',era:'Saga/Geração',role:'Classe/Papel',dossier:'Dossiê',blind:'Só Pistas',games:'Games',dragonball:'Dragon Ball',naruto:'Naruto',yugioh:'Yu-Gi-Oh!',saintseiya:'Cavaleiros',pokemon:'Pokémon',digimon:'Digimon',lol:'League of Legends',cartoons:'Desenhos',globinho:'TV Globinho',termo:'Termo',kof2002:'KOF 2002 Magic Plus II',kf2k2mp2:'KOF 2002 Magic Plus II',samsh5spho:'Samurai Shodown V Special',mvsc:'Marvel vs. Capcom',xmvsfur1:'X-Men vs. Street Fighter',neobombe:'Neo Bomberman',arcade:'Arcade',kof:'KOF',easy:'Fácil',normal:'Normal',hard:'Difícil',insane:'Insano'};
  return map[k]||labelKey(v);
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function rankingHTML(rows){
  if(!rows.length)return '<div class="ranking-empty">Ainda não há jogadores no ranking.</div>';
  return rows.map((x,i)=>{
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`,me=currentUser&&x.uid===currentUser.uid;
    const arena=x.arenaPlayed?`${x.duelWins||0}V/${x.duelLosses||0}D • até ${x.arenaMaxPlayers||2} jogadores`:'Sem partidas nesta temporada';
    const bestMode=prettyRankLabel(x.bestMode),bestUniverse=prettyRankLabel(x.bestUniverse),bestChallenge=prettyRankLabel(x.bestChallenge),bestDifficulty=prettyRankLabel(x.bestDifficulty),term=prettyRankLabel(x.termBestMode),bestArcade=prettyRankLabel(x.bestArcadeGame||'');
    const arcadeGameRanks=Object.entries(x.arcadeGames&&typeof x.arcadeGames==='object'?x.arcadeGames:{}).sort((a,b)=>Number(b[1]?.rp||0)-Number(a[1]?.rp||0)).slice(0,4).map(([k,v])=>`${prettyRankLabel(k)}: ${Number(v?.rp||0)} RP`).join(' • ')||'Sem partidas por jogo';
    const mainValue=rankingMode==='arcadeRp'?Number(x.arcadeRp||0):(x[rankingMode]??x.rating??0);
    const mainLabel=rankingMode==='arcadeRp'?`${mainValue} RP`:String(mainValue);
    return `<article class="ranking-entry${me?' me':''}"><div class="ranking-entry-main"><b class="rank-pos">${medal}</b><div class="rank-player"><span>${escapeHtml(x.displayName)}</span><small>${escapeHtml(x.arcadeDivisionIcon||'🎮')} ${escapeHtml(x.arcadeDivision||'Recruta')} • 🕹 ${x.arcadeWins||0}V/${x.arcadeLosses||0}D • ${x.arcadePlayed<10?`classificação ${x.arcadePlacement||0}/10`:`${x.arcadePlayed||0} partidas`}</small><div class="rank-player-meta"><span class="rank-chip">🕹 ${escapeHtml(bestArcade||'Sem partidas')}</span><span class="rank-chip">🎮 ${escapeHtml(bestMode)}</span><span class="rank-chip">🌌 ${escapeHtml(bestUniverse)}</span></div></div><strong>${escapeHtml(mainLabel)}</strong><button type="button" class="rank-detail-toggle" aria-expanded="false">VER DETALHES</button></div><div class="ranking-detail"><div><small>Arcade Ranked</small><b>${escapeHtml(x.arcadeDivisionIcon||'🎮')} ${escapeHtml(x.arcadeDivision||'Recruta')} • ${Number(x.arcadeRp||0)} RP</b></div><div><small>Campanha</small><b>${x.arcadeWins||0}V/${x.arcadeLosses||0}D • ${x.arcadePlayed||0} partidas</b></div><div><small>Classificação</small><b>${Math.min(10,Number(x.arcadePlayed||0))}/10 partidas iniciais</b></div><div><small>Melhor jogo Arcade</small><b>${escapeHtml(bestArcade||'—')}</b></div><div><small>RP por jogo</small><b>${escapeHtml(arcadeGameRanks)}</b></div><div><small>Partidas Arcade</small><b>${x.arcadePlayed||0}</b></div><div><small>Melhor modalidade</small><b>${escapeHtml(bestMode)}</b></div><div><small>Melhor universo</small><b>${escapeHtml(bestUniverse)}</b></div><div><small>Melhor desafio</small><b>${escapeHtml(bestChallenge)}</b></div><div><small>Dificuldade de destaque</small><b>${escapeHtml(bestDifficulty)}</b></div><div><small>Melhor pontuação</small><b>${x.bestScore||0} pts</b></div><div><small>Maior sequência</small><b>🔥 ${x.bestStreak||0}</b></div><div><small>Arena</small><b>${escapeHtml(arena)}</b></div><div><small>KOF legado</small><b>🥊 ${x.kofWins||0}V/${x.kofLosses||0}D • Elo ${x.kofRating||1000}</b></div><div><small>Termo de destaque</small><b>${escapeHtml(term)}</b></div></div></article>`;
  }).join('');
}
function loadRanking(mode=''){
  if(mode)rankingMode=String(mode);
  showScreen('rankingScreen');ensureRankingUI();
  const bar=$('rankingV12Filters');if(bar)bar.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.rankMode===rankingMode));
  if(rankingUnsub){rankingUnsub();rankingUnsub=null;}
  if(!configured){$('rankingList').innerHTML='<div class="ranking-empty">Configure o Firebase para ativar o ranking global.</div>';return;}
  if(!currentUser){$('rankingList').innerHTML='<div class="ranking-empty">Entre na sua conta para carregar o ranking.</div>';$('myRankCard').innerHTML='<span>Faça login para aparecer no ranking.</span>';return;}
  const orderField=['rating','arcadeRp','bestScore','arenaBestScore','bestStreak'].includes(rankingMode)?rankingMode:'rating';
  const q=query(ref(db,`rankedSeasons/${currentSeasonId()}/leaderboard`),orderByChild(orderField),limitToLast(100));
  rankingUnsub=onValue(q,snap=>{const raw=snap.val()||{},rows=Object.entries(raw).map(([uid,v])=>({uid,...v})).filter(x=>rankingMode!=='arcadeRp'||(Number(x.arcadeRankVersion||0)===ARCADE_RANK_VERSION&&(Number(x.arcadePlayed||0)>0||Number(x.arcadeRp||0)>0))).sort((a,b)=>(Number(b[rankingMode]||0)-Number(a[rankingMode]||0))||(Number(b.arcadeWins||0)-Number(a.arcadeWins||0))||((b.rating||0)-(a.rating||0)));if($('rankingList'))$('rankingList').innerHTML=rankingHTML(rows);const idx=rows.findIndex(x=>x.uid===currentUser.uid),mine=rows[idx];if($('myRankCard'))$('myRankCard').innerHTML=mine?`<b>#${idx+1}</b><span>${escapeHtml(mine.displayName)}</span><strong>${rankingMode==='arcadeRp'?(mine.arcadeRp||0)+' RP':(mine.rating||0)+' pts'}</strong><small>🕹 ${mine.arcadeWins||0}V/${mine.arcadeLosses||0}D • ${escapeHtml(prettyRankLabel(mine.bestArcadeGame||''))}</small>`:'<span>Jogue uma partida para entrar no ranking.</span>';},e=>{$('rankingList').innerHTML=`<div class="ranking-empty">Não consegui ler o ranking: ${escapeHtml(e.message)}</div>`;});
}


async function getQuizHistory(limit=50000){
  if(!configured||!currentUser||!db)return [];
  try{
    const qh=query(ref(db,`quizHistory/${currentUser.uid}/seen`),orderByValue(),limitToLast(Math.max(100,Math.min(50000,Number(limit)||50000))));
    const snap=await get(qh);return Object.keys(snap.val()||{});
  }catch(e){console.warn('Quiz history read:',e);return []}
}
async function markQuizHistory(items=[]){
  if(!configured||!currentUser||!db||!Array.isArray(items)||!items.length)return;
  const patch={},t=serverNow();
  for(const raw of items.slice(-100)){const key=String(raw||'').replace(/[.#$\[\]\/]/g,'').slice(0,80);if(key)patch[key]=t;}
  if(Object.keys(patch).length)await update(ref(db,`quizHistory/${currentUser.uid}/seen`),patch);
}

const FIGHT_PROTOCOL_VERSION=2;
async function waitFirebaseOnline(timeout=7000){
  if(firebaseConnected)return true;
  return await new Promise(resolve=>{
    let done=false,unsub=null;
    const finish=v=>{if(done)return;done=true;clearTimeout(timer);try{unsub?.()}catch{};resolve(Boolean(v));};
    const timer=setTimeout(()=>finish(false),timeout);
    try{unsub=onValue(ref(db,'.info/connected'),snap=>{if(snap.val()===true)finish(true)},()=>finish(false));}catch{finish(false)}
  });
}
async function fightGet(r,tries=3){
  let last;
  for(let i=0;i<tries;i++){
    try{return await get(r)}catch(e){last=e;if(i<tries-1)await new Promise(x=>setTimeout(x,350*(i+1)));}
  }
  throw last||new Error('Falha ao consultar o Firebase.');
}
function fightRoomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let out='';for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out;}
function fightGameId(code){let h=2166136261;for(const ch of String(code)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return 200000000+(h>>>0)%700000000;}
function fightRtcRoomName(code){
  const suffix=(globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^a-zA-Z0-9]/g,'').slice(-7).toUpperCase();
  return `GG-${String(code||'').toUpperCase()}-${suffix}`.slice(0,20);
}
function fightActiveSessions(room,uid){return Object.keys(room?.presence?.[uid]||{});}
function fightBoundSession(room,uid){if(uid===room?.hostUid)return String(room?.hostSessionId||'');if(uid===room?.guestUid)return String(room?.guestSessionId||'');return '';}
function fightPlayerOnline(room,uid){const sessions=fightActiveSessions(room,uid),bound=fightBoundSession(room,uid);return Boolean(sessions.length&&(!bound||sessions.includes(bound)));}
function fightPlayerReady(room,uid){const ready=room?.clientReady?.[uid],bound=fightBoundSession(room,uid);return Boolean(ready?.ready&&fightPlayerOnline(room,uid)&&(!bound||!ready.sessionId||String(ready.sessionId)===bound));}

async function restoreFightPresence(h){
  if(!h||!db||!currentUser||currentUser.uid!==h.uid)return false;
  await h.dp.remove();
  await h.dl.set(serverTimestamp());
  await h.dr.remove();
  await set(h.pr,{sessionId:CLIENT_SESSION_ID,connectedAt:serverTimestamp(),heartbeatAt:serverTimestamp()});
  await set(h.lr,serverNow()).catch(()=>{});
  return true;
}
async function attachFightPresence(code){
  if(!currentUser||!db||!code)return false;
  code=String(code).toUpperCase();
  const uid=currentUser.uid,key=`${code}:${uid}`;
  let h=fightPresence.get(key);
  if(!h){
    const pr=ref(db,`fightRooms/${code}/presence/${uid}/${CLIENT_SESSION_ID}`),lr=ref(db,`fightRooms/${code}/players/${uid}/lastSeen`),rr=ref(db,`fightRooms/${code}/clientReady/${uid}`);
    const dp=onDisconnect(pr),dl=onDisconnect(lr),dr=onDisconnect(rr);
    h={code,uid,pr,lr,rr,dp,dl,dr,timer:null,attaching:null};
    // Registra o handle antes da primeira escrita. Se a rede cair durante o attach,
    // o listener de .info/connected ainda consegue restaurar a presença depois.
    fightPresence.set(key,h);
  }
  if(h.attaching)return h.attaching;
  h.attaching=(async()=>{
    let lastError=null;
    for(let attempt=1;attempt<=3;attempt++){
      try{
        if(!currentUser||currentUser.uid!==uid)throw new Error('A conta mudou durante a conexão da sala.');
        await restoreFightPresence(h);
        if(!h.timer){
          h.timer=setInterval(()=>{
            if(!currentUser||currentUser.uid!==uid)return;
            update(h.pr,{heartbeatAt:serverTimestamp()}).catch(()=>{});
            set(h.lr,serverNow()).catch(()=>{});
          },8000);
        }
        return true;
      }catch(e){
        lastError=e;
        if(attempt<3)await new Promise(r=>setTimeout(r,350*attempt));
      }
    }
    throw lastError||new Error('Não foi possível registrar a presença na sala.');
  })().finally(()=>{h.attaching=null;});
  return h.attaching;
}
async function detachFightPresence(code){
  if(!db||!code)return;
  code=String(code).toUpperCase();
  const uid=currentUser?.uid;
  const entries=[...fightPresence.entries()].filter(([key,h])=>h.code===code&&(!uid||h.uid===uid));
  for(const [key,h] of entries){
    clearInterval(h.timer);
    await h.dp.cancel().catch(()=>{});await h.dl.cancel().catch(()=>{});await h.dr.cancel().catch(()=>{});
    await remove(h.pr).catch(()=>{});await remove(h.rr).catch(()=>{});
    fightPresence.delete(key);
  }
}
async function createFightRoom(options={}){
  if(!currentUser)throw new Error('Faça login antes de criar uma luta.');
  if(!await waitFirebaseOnline())throw new Error('Firebase offline. Verifique a internet e tente criar a sala novamente.');
  for(let tries=0;tries<10;tries++){
    const code=fightRoomCode(),rr=ref(db,`fightRooms/${code}`);if((await fightGet(rr)).exists())continue;const now=serverNow(),name=cleanName(localProfile()?.nickname||currentUser.displayName||currentUser.email?.split('@')[0]);
    const arcadeGame=String(options?.arcadeGame||'kf2k2mp2').trim().toLowerCase().slice(0,32)||'kf2k2mp2';
    // `game` permanece kf2k2mp2 para compatibilidade com as regras Firebase V17 já publicadas.
    // `arcadeGame` identifica o título real sem exigir nova função serverless nem mudança imediata das rules.
    const tournamentCode=/^[A-Z2-9]{6}$/.test(String(options?.tournamentCode||'').toUpperCase())?String(options.tournamentCode).toUpperCase():'';
    const tournamentMatchId=String(options?.tournamentMatchId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40);
    const room={code,protocolVersion:FIGHT_PROTOCOL_VERSION,game:'kf2k2mp2',arcadeGame,gameId:fightGameId(code),hostUid:currentUser.uid,guestUid:'',hostSessionId:CLIENT_SESSION_ID,guestSessionId:'',rtcRoomName:'',status:'waiting',launchState:'waiting',launchAt:0,createdAt:now,updatedAt:now,expiresAt:now+WAITING_TTL_MS,ranked:options?.ranked!==false,rankedSeasonId:currentSeasonId(),rankedSystemVersion:ARCADE_RANK_VERSION,tournamentCode,tournamentMatchId,players:{[currentUser.uid]:{uid:currentUser.uid,name,role:'host',joinedAt:now,lastSeen:now}},resultVotes:{},winnerUid:''};
    try{await set(rr,room);}catch(e){if(String(e?.code||e?.message||'').toLowerCase().includes('permission'))throw new Error('O Firebase recusou a sala KOF. Publique o database.rules.json atual.');throw e;}
    try{await attachFightPresence(code);}catch(e){
      console.warn('KOF presence host:',e);
      await remove(rr).catch(()=>{});
      throw new Error('A sala foi criada, mas este aparelho não conseguiu registrar presença no Firebase. Verifique as regras e a conexão e tente novamente.');
    }
    return code;
  }
  throw new Error('Não consegui gerar a sala KOF. Tente novamente.');
}
async function joinFightRoom(code,expectedGame=''){
  if(!currentUser)throw new Error('Faça login antes de entrar na luta.');
  if(!await waitFirebaseOnline())throw new Error('Firebase offline. Verifique a internet antes de entrar na sala.');code=String(code||'').trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))throw new Error('Código inválido.');
  const rr=ref(db,`fightRooms/${code}`),snap=await fightGet(rr);if(!snap.exists())throw new Error('Sala KOF não encontrada.');const initial=snap.val(),now=serverNow();
  if(Number(initial.protocolVersion)!==FIGHT_PROTOCOL_VERSION)throw new Error('Esta sala KOF usa outra versão do jogo.');
  const actualGame=String(initial.arcadeGame||'kf2k2mp2').toLowerCase();
  const wantedGame=String(expectedGame||'').trim().toLowerCase();
  if(wantedGame&&actualGame!==wantedGame)throw new Error('Este código pertence a outro jogo do Arcade.');
  if(initial.status==='finished')throw new Error('Esta luta já terminou.');if(Number(initial.expiresAt||0)<=now)throw new Error('Esta sala KOF expirou.');
  if(initial.players?.[currentUser.uid]){
    const active=fightActiveSessions(initial,currentUser.uid);
    const ownsHost=initial.hostUid===currentUser.uid;
    const ownsGuest=initial.guestUid===currentUser.uid;
    const boundSession=ownsHost?String(initial.hostSessionId||''):ownsGuest?String(initial.guestSessionId||''):'';
    if(active.length&&boundSession&&boundSession!==CLIENT_SESSION_ID){
      throw new Error('Esta mesma conta já está usando esta sala em outro aparelho. No X1 ranqueado, entre no segundo aparelho com outra conta.');
    }
    if(!active.length&&ownsHost&&boundSession!==CLIENT_SESSION_ID)await update(rr,{hostSessionId:CLIENT_SESSION_ID,updatedAt:now});
    if(!active.length&&ownsGuest&&boundSession!==CLIENT_SESSION_ID)await update(rr,{guestSessionId:CLIENT_SESSION_ID,updatedAt:now});
    try{await attachFightPresence(code);}catch(e){
      console.warn('KOF presence resume:',e);
      throw new Error('Você está na sala, mas a presença online não pôde ser restaurada. Verifique as regras do Firebase e tente novamente.');
    }
    return code;
  }
  const guestRef=ref(db,`fightRooms/${code}/guestUid`),claim=await runTransaction(guestRef,current=>{if(current===currentUser.uid)return current;if(current===null||current===undefined||current==='')return currentUser.uid;return;},{applyLocally:false});
  if(!claim.committed||claim.snapshot?.val()!==currentUser.uid)throw new Error('A sala KOF acabou de ficar cheia.');
  const name=cleanName(localProfile()?.nickname||currentUser.displayName||currentUser.email?.split('@')[0]),playerRef=ref(db,`fightRooms/${code}/players/${currentUser.uid}`);
  try{await set(playerRef,{uid:currentUser.uid,name,role:'guest',joinedAt:now,lastSeen:now});await update(rr,{guestSessionId:CLIENT_SESSION_ID,status:'ready',updatedAt:now,expiresAt:now+PLAYING_TTL_MS});}
  catch(e){await runTransaction(guestRef,current=>current===currentUser.uid?'':current,{applyLocally:false}).catch(()=>{});await remove(playerRef).catch(()=>{});if(String(e?.code||e?.message||'').toLowerCase().includes('permission'))throw new Error('O Firebase recusou a entrada no X1. Publique o database.rules.json atual.');throw e;}
  try{await attachFightPresence(code);}catch(e){
    console.warn('KOF presence guest:',e);
    await runTransaction(guestRef,current=>current===currentUser.uid?'':current,{applyLocally:false}).catch(()=>{});
    await remove(playerRef).catch(()=>{});
    await update(rr,{guestSessionId:'',status:'waiting',updatedAt:serverNow()}).catch(()=>{});
    throw new Error('Entrou na sala, mas este aparelho não conseguiu registrar presença online. Verifique as regras do Firebase e tente novamente.');
  }
  return code;
}
function watchFightRoom(code,cb){if(!db)return()=>{};return onValue(ref(db,`fightRooms/${String(code).toUpperCase()}`),s=>cb(s.val()),e=>cb(null,e));}
async function markFightReady(code,ready=true){
  if(!currentUser||!db||!code)return false;
  code=String(code).toUpperCase();
  const rr=ref(db,`fightRooms/${code}`),room=(await fightGet(rr)).val();
  if(!room?.players?.[currentUser.uid])return false;
  const target=ref(db,`fightRooms/${code}/clientReady/${currentUser.uid}`);
  if(!ready){await remove(target).catch(()=>{});return true;}
  // Ready só é válido se a presença deste mesmo aparelho estiver registrada.
  await attachFightPresence(code);
  await set(target,{ready:true,at:serverNow(),sessionId:CLIENT_SESSION_ID});
  return true;
}
async function requestFightLaunch(code){
  if(!currentUser||!db||!code)throw new Error('Sala KOF inválida.');
  code=String(code).toUpperCase();
  const rr=ref(db,`fightRooms/${code}`),room=(await fightGet(rr)).val();
  if(!room)throw new Error('Sala KOF não encontrada.');
  if(room.hostUid!==currentUser.uid||String(room.hostSessionId||CLIENT_SESSION_ID)!==CLIENT_SESSION_ID)throw new Error('Somente o aparelho HOST que criou esta sala pode iniciar a luta.');
  const ids=Object.keys(room.players||{});
  if(ids.length!==2)throw new Error('Aguarde o segundo jogador entrar.');
  const online=ids.filter(uid=>fightPlayerOnline(room,uid));
  if(online.length!==2)throw new Error('Os dois aparelhos precisam estar online na sessão correta.');
  const notReady=ids.filter(uid=>!fightPlayerReady(room,uid));
  if(notReady.length)throw new Error('Aguarde os dois aparelhos sincronizarem o estado de pronto.');
  const now=serverNow(),rtcRoomName=fightRtcRoomName(code);
  try{await update(rr,{status:'playing',launchState:'starting',launchAt:now,rtcRoomName,updatedAt:now,expiresAt:now+PLAYING_TTL_MS});}
  catch(e){
    const msg=String(e?.code||e?.message||'').toLowerCase();
    if(msg.includes('permission'))throw new Error('O Firebase recusou o sinal de início. Publique o database.rules.json atual no Realtime Database.');
    throw e;
  }
  return {ok:true,launchAt:now,gameId:Number(room.gameId||0),rtcRoomName,code};
}
async function claimFightRankedRecord(code){
  if(!currentUser||!db||!code)return false;
  code=String(code).toUpperCase();
  const room=(await get(ref(db,`fightRooms/${code}`))).val();
  if(!room?.players?.[currentUser.uid]||room.status!=='finished')return false;
  const rr=ref(db,`fightRooms/${code}/rankedRecorded/${currentUser.uid}`);
  const tx=await runTransaction(rr,current=>current?undefined:{at:serverNow(),sessionId:CLIENT_SESSION_ID},{applyLocally:false});
  return Boolean(tx.committed);
}
async function submitFightResult(code,winnerUid){
  if(!currentUser||!code||!winnerUid)throw new Error('Resultado inválido.');code=String(code).toUpperCase();const rr=ref(db,`fightRooms/${code}`),snap=await get(rr),room=snap.val();
  if(!room?.players?.[currentUser.uid]||!room?.players?.[winnerUid])throw new Error('Jogador não pertence a esta sala.');if(room.status==='finished')return room;
  await set(ref(db,`fightRooms/${code}/resultVotes/${currentUser.uid}`),winnerUid);const after=(await get(rr)).val();if(!after)return null;const ids=Object.keys(after.players||{}),votes=after.resultVotes||{};
  if(ids.length===2&&ids.every(uid=>votes[uid])&&new Set(ids.map(uid=>votes[uid])).size===1){
    const winner=votes[ids[0]],now=serverNow();
    await update(rr,{winnerUid:winner,status:'finished',finishedAt:now,updatedAt:now,expiresAt:now+FINISHED_TTL_MS});
    const finished=(await get(rr)).val();
    if(finished?.ranked!==false)await ensureArcadeRankedSettlement(code).catch(e=>console.warn('Arcade ranked settlement:',e));
    return finished;
  }
  return after;
}
async function leaveFightRoom(code){
  if(!currentUser||!code)return;code=String(code).toUpperCase();await detachFightPresence(code).catch(()=>{});const rr=ref(db,`fightRooms/${code}`),snap=await get(rr),room=snap.val();if(!room?.players?.[currentUser.uid])return;
  const patch={updatedAt:serverNow(),launchState:'waiting',launchAt:0,[`players/${currentUser.uid}`]:null,[`clientReady/${currentUser.uid}`]:null,[`resultVotes/${currentUser.uid}`]:null};
  if(room.hostUid===currentUser.uid){if(room.guestUid&&room.players?.[room.guestUid]){patch.hostUid=room.guestUid;patch.hostSessionId=String(room.guestSessionId||'');patch.guestUid='';patch.guestSessionId='';patch.rtcRoomName='';patch.status='waiting';patch[`players/${room.guestUid}/role`]='host';}else{return remove(rr).catch(()=>{});}}
  else if(room.guestUid===currentUser.uid){patch.guestUid='';patch.guestSessionId='';patch.rtcRoomName='';patch.status='waiting';}
  await update(rr,patch).catch(()=>{});
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
  for(let tries=0;tries<8;tries++){
    const code=roomCode(),r=ref(db,`duels/${code}`);if((await get(r)).exists())continue;
    const name=cleanName(localProfile()?.nickname||currentUser.displayName||currentUser.email?.split('@')[0]),maxPlayers=Math.max(2,Math.min(8,Number(payload?.config?.maxPlayers||2))),now=serverNow();
    const cleanPayload=JSON.parse(JSON.stringify(payload||{}));
    const questions=Array.isArray(cleanPayload.questions)?cleanPayload.questions.filter(q=>q&&q.id&&q.name&&(q.kind!=='quiz'||(q.prompt&&Array.isArray(q.options)&&q.options.length===4))).slice(0,30):[];
    if(questions.length<5)throw new Error('A Arena não recebeu perguntas suficientes para criar a sala.');
    const room={code,protocolVersion:PROTOCOL_VERSION,appVersion:APP_VERSION,hostUid:currentUser.uid,status:'waiting',roundState:'waiting',createdAt:now,updatedAt:now,expiresAt:now+WAITING_TTL_MS,startedAt:0,finishedAt:0,roundIndex:0,roundDeadline:0,revealUntil:0,timeoutRound:-1,roundHadSkip:false,config:{...(cleanPayload.config||{}),maxPlayers},questions,slots:{1:currentUser.uid},players:{[currentUser.uid]:{uid:currentUser.uid,name,slot:1,joinedAt:now,lastSeen:now,connectionState:'online',controlSessionId:CLIENT_SESSION_ID,lives:3,correct:0,score:0,wrong:0,roundWrong:0,roundSolved:false,roundResult:'',eliminated:false,left:false,lastRound:-1,lastSubmissionId:''}}};
    try{await set(r,room);}catch(error){
      const msg=String(error?.code||error?.message||'').toLowerCase();
      if(msg.includes('permission'))throw new Error('O Firebase recusou a criação da Arena. Publique o database.rules.json da V17 no Realtime Database.');
      throw error;
    }
    // Presença é importante, mas não deve transformar uma sala já criada em "erro ao criar".
    // Se falhar momentaneamente, a conexão/reconexão tentará registrá-la novamente.
    attachDuelPresence(code).catch(e=>console.warn('Arena presence attach:',e));
    return code;
  }
  throw new Error('Não consegui gerar um código de sala. Tente novamente.');
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
  const slot=claim.slot,name=cleanName(localProfile()?.nickname||currentUser.displayName||currentUser.email?.split('@')[0]),now=serverNow(),playerRef=ref(db,`duels/${code}/players/${currentUser.uid}`),player={uid:currentUser.uid,name,slot,joinedAt:now,lastSeen:now,connectionState:'online',controlSessionId:CLIENT_SESSION_ID,lives:3,correct:0,score:0,wrong:0,roundWrong:0,roundSolved:false,roundResult:'',eliminated:false,left:false,lastRound:-1,lastSubmissionId:''};
  try{
    await set(playerRef,player);
    await claim.disconnectSlot.cancel();
  }catch(error){
    await claim.disconnectSlot.cancel().catch(()=>{});
    await releaseDuelSlot(code,slot);
    const msg=String(error?.code||error?.message||'').toLowerCase();
    console.warn('Arena join failed at players write',{code,slot,uid:currentUser.uid,error});
    if(msg.includes('permission'))throw new Error('O Firebase recusou a entrada na Arena. Publique o database.rules.json da V17 no Realtime Database.');
    throw error;
  }
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


// ===== Arcade Ranked / Torneios =====
const ARCADE_TOURNAMENT_PROTOCOL_VERSION=2;
const ARCADE_TOURNAMENT_TTL_MS=36*60*60*1000;
function arcadeTournamentCode(){return fightRoomCode();}
function arcadeTournamentRef(code){return ref(db,`arcadeTournaments/${String(code||'').trim().toUpperCase()}`);}
function validArcadeTournamentGame(game){return ['kf2k2mp2','samsh5spho','mvsc','xmvsfur1'].includes(String(game||'').toLowerCase());}
function arcadeRankStateRef(seasonId,uid){return ref(db,`arcadeRankedPlayers/${String(seasonId||currentSeasonId()).toUpperCase()}/${uid}`);}
async function readArcadeRankState(seasonId,uid){if(!uid)return blankArcadeCompetitive();const snap=await get(arcadeRankStateRef(seasonId,uid));return normalizeArcadeCompetitive(snap.val()||{});}
function arcadeSettlementPlayer(state,gameState,won,transfer,gameTransfer){
  const globalDelta=won?transfer:-Math.min(state.rp,transfer),gameDelta=won?gameTransfer:-Math.min(gameState.rp,gameTransfer);
  return {result:won?'win':'loss',beforeRp:state.rp,delta:globalDelta,afterRp:Math.max(0,state.rp+globalDelta),beforePlayed:state.played,beforeGameRp:gameState.rp,gameDelta,afterGameRp:Math.max(0,gameState.rp+gameDelta),beforeGamePlayed:gameState.played};
}
async function ensureArcadeRankedSettlement(code){
  if(!db||!code)return null;code=String(code).trim().toUpperCase();
  const room=(await get(ref(db,`fightRooms/${code}`))).val();
  if(!room||room.status!=='finished'||!room.winnerUid||room.ranked===false)return null;
  const ids=Object.keys(room.players||{});if(ids.length!==2||!ids.includes(room.winnerUid))throw new Error('A luta não possui dois jogadores válidos.');
  const loserUid=ids.find(uid=>uid!==room.winnerUid);if(!loserUid)throw new Error('Não foi possível identificar o perdedor.');
  const seasonId=String(room.rankedSeasonId||currentSeasonId()).toUpperCase(),game=safeKey(room.arcadeGame||'kf2k2mp2');
  const mr=ref(db,`arcadeRankedMatches/${seasonId}/${code}`),existing=await get(mr);
  let settlement=existing.val();
  if(!settlement){
    const [winnerState,loserState]=await Promise.all([readArcadeRankState(seasonId,room.winnerUid),readArcadeRankState(seasonId,loserUid)]);
    const wg=normalizeArcadeCompetitiveGame(winnerState.games?.[game]),lg=normalizeArcadeCompetitiveGame(loserState.games?.[game]);
    const transfer=arcadeCompetitiveTransfer(winnerState.rp,loserState.rp,winnerState.played,loserState.played);
    const gameTransfer=arcadeCompetitiveTransfer(wg.rp,lg.rp,wg.played,lg.played);
    const now=serverNow();
    const candidate={version:ARCADE_RANK_VERSION,code,seasonId,game,winnerUid:room.winnerUid,loserUid,createdAt:now,finishedAt:Number(room.finishedAt||now),sourceRoomCode:code,players:{
      [room.winnerUid]:{uid:room.winnerUid,...arcadeSettlementPlayer(winnerState,wg,true,transfer,gameTransfer)},
      [loserUid]:{uid:loserUid,...arcadeSettlementPlayer(loserState,lg,false,transfer,gameTransfer)}
    }};
    const tx=await runTransaction(mr,current=>current||candidate,{applyLocally:false});settlement=tx.snapshot?.val()||candidate;
  }
  const inboxPatch={};for(const uid of ids)inboxPatch[`arcadeRankedInbox/${uid}/${code}`]={seasonId,code,createdAt:Number(settlement.createdAt||serverNow())};
  await update(ref(db),inboxPatch).catch(e=>console.warn('Arcade ranked inbox:',e));
  return settlement;
}
function applyArcadeSettlementToState(current={},settlement={},uid=''){
  const state=normalizeArcadeCompetitive(current),entry=settlement?.players?.[uid];if(!entry)return state;
  const code=String(settlement.code||'').toUpperCase();if(state.appliedMatches?.[code])return state;
  const won=entry.result==='win',game=safeKey(settlement.game||'arcade'),games={...state.games},g=normalizeArcadeCompetitiveGame(games[game]||{});
  state.rp=Math.max(0,state.rp+Math.round(finite(entry.delta,0)));state.played+=1;if(won){state.wins+=1;state.currentStreak+=1;state.bestStreak=Math.max(state.bestStreak,state.currentStreak);}else{state.losses+=1;state.currentStreak=0;}
  g.rp=Math.max(0,g.rp+Math.round(finite(entry.gameDelta,0)));g.played+=1;if(won)g.wins+=1;else g.losses+=1;games[game]=g;state.games=games;
  state.revision+=1;state.updatedAt=serverNow();state.lastMatchCode=code;state.lastDelta=Math.round(finite(entry.delta,0));state.appliedMatches={...(state.appliedMatches||{}),[code]:Number(settlement.finishedAt||state.updatedAt)};
  return state;
}

function arcadeRewardProfileRef(uid=currentUser?.uid){return uid&&db?ref(db,`arcadeRewardProfiles/${uid}`):null;}
async function mirrorArcadeRewards(state,{flush=true}={}){
  state=normalizeArcadeRewards(state);arcadeRewardCache=state;
  const local=localProfile(),next={...local,arcadeRewards:state};CORE()?.replaceProfile?.(next);
  if(flush)await flushProfile(next).catch(()=>{});
  window.dispatchEvent(new CustomEvent('gameguess:arcade-rewards',{detail:{state}}));
  return state;
}
async function ensureArcadeRewardProfile(){
  if(!currentUser||!db)return normalizeArcadeRewards(localProfile()?.arcadeRewards||{});
  const rr=arcadeRewardProfileRef();
  const tx=await runTransaction(rr,current=>current?normalizeArcadeRewards(current):normalizeArcadeRewards(localProfile()?.arcadeRewards||{}),{applyLocally:false});
  return mirrorArcadeRewards(tx.snapshot?.val()||blankArcadeRewards());
}
async function transactArcadeRewards(mutator){
  if(!currentUser||!db)throw new Error('Faça login para usar as recompensas Arcade.');
  const rr=arcadeRewardProfileRef();
  const tx=await runTransaction(rr,current=>{
    const state=normalizeArcadeRewards(current||localProfile()?.arcadeRewards||{}),next=mutator(state);
    if(!next)return;
    next.version=ARCADE_REWARD_VERSION;next.revision=clampInt(state.revision)+1;next.updatedAt=serverNow();return normalizeArcadeRewards(next);
  },{applyLocally:false});
  const state=normalizeArcadeRewards(tx.snapshot?.val()||{});arcadeRewardCache=state;
  if(tx.committed)await mirrorArcadeRewards(state);else await mirrorArcadeRewards(state,{flush:false});
  return {committed:tx.committed,state};
}
async function applyArcadeRankedRewards(settlement,rankState,entry){
  if(!currentUser||!settlement?.code||!entry)return {awarded:false};
  const seasonId=String(settlement.seasonId||currentSeasonId()).toUpperCase(),code=String(settlement.code).toUpperCase(),claimKey=`${seasonId}_${code}`,won=entry.result==='win';
  const result=await transactArcadeRewards(state=>{
    if(state.matchClaims[claimKey])return;
    const now=serverNow(),unlocked=[],rankUps=[],milestones=[],upsets=[];let bonusCoins=0;
    const baseCoins=won?10:3;
    const grantUnlock=id=>{if(rewardCatalogItem(id)&&!state.unlocks[id]){rewardUnlock(state,id,now);unlocked.push(id);}};
    for(const rank of ARCADE_REWARD_RANKS){
      if(rank.min<=0||rankState.rp<rank.min)continue;
      const key=`${seasonId}_${rank.key}`;if(state.rankClaims[key])continue;
      state.rankClaims[key]={at:now,rank:rank.key,rp:rankState.rp,coins:rank.coins};bonusCoins+=rank.coins;rankUps.push(rank.key);for(const id of rank.unlocks)grantUnlock(id);
    }
    for(const m of ARCADE_REWARD_MILESTONES){
      const key=`${seasonId}_${m.key}`;if(state.milestoneClaims[key]||!m.test(rankState))continue;
      state.milestoneClaims[key]={at:now,key:m.key,coins:m.coins};bonusCoins+=m.coins;milestones.push(m.key);for(const id of m.unlocks)grantUnlock(id);
    }
    const league=arcadeCompetitiveLeague(rankState.rp,rankState.played),oldBadge=state.seasonBadges[seasonId],oldMin=arcadeRewardRankByKey(oldBadge?.rankKey).min;
    if(!oldBadge||league.min>=oldMin)state.seasonBadges[seasonId]={seasonId,rankKey:league.key,label:league.label,icon:league.icon,rp:Math.max(clampInt(oldBadge?.rp),rankState.rp),updatedAt:now};
    const gameState=normalizeArcadeCompetitiveGame(rankState.games?.[settlement.game]),gameLeague=arcadeCompetitiveLeague(gameState.rp,gameState.played);
    for(const gameRank of ARCADE_REWARD_RANKS){if(gameRank.min<=0||gameState.rp<gameRank.min)continue;grantUnlock(`badge_${safeKey(settlement.game)}_${gameRank.key}`);}
    const opponentUid=Object.keys(settlement.players||{}).find(uid=>uid!==currentUser.uid),opponent=opponentUid?settlement.players?.[opponentUid]:null,upsetGap=won&&opponent?Math.max(0,clampInt(opponent.beforeRp)-clampInt(entry.beforeRp)):0;
    for(const u of ARCADE_UPSET_REWARDS){const key=`${seasonId}_${u.key}`;if(upsetGap<u.gap||state.milestoneClaims[key])continue;state.milestoneClaims[key]={at:now,key:u.key,coins:u.coins,gap:upsetGap};bonusCoins+=u.coins;upsets.push(u.key);for(const id of u.unlocks)grantUnlock(id);}
    const pass=applyBattlePassProgress(state,won?35:20,now,grantUnlock,seasonId);bonusCoins+=pass.coins;
    const totalCoins=baseCoins+bonusCoins;state.coins+=totalCoins;state.earned+=totalCoins;
    state.matchClaims[claimKey]={at:now,code,seasonId,result:won?'win':'loss',baseCoins,bonusCoins,totalCoins,rankUps,milestones,upsets,passXp:won?35:20,passRewards:pass.rewards,unlocked};
    return state;
  });
  const claim=result.state.matchClaims?.[claimKey];
  return {awarded:Boolean(result.committed),...(claim||{}),coins:result.state.coins,state:result.state};
}
async function claimArcadeTournamentReward(code){
  if(!currentUser||!db||!code)return {awarded:false};code=String(code).toUpperCase();
  const t=(await get(arcadeTournamentRef(code))).val();if(!t||t.status!=='finished'||t.championUid!==currentUser.uid)return {awarded:false,reason:'not-champion'};
  const result=await transactArcadeRewards(state=>{
    if(state.tournamentClaims[code])return;
    const now=serverNow(),unlocked=[];const grant=id=>{if(rewardCatalogItem(id)&&!state.unlocks[id]){rewardUnlock(state,id,now);unlocked.push(id);}};state.trophies.tournaments=clampInt(state.trophies.tournaments)+1;
    for(const id of ['title_campeao',...(state.trophies.tournaments>=3?['frame_champion']:[])])grant(id);
    const pass=applyBattlePassProgress(state,150,now,grant),coins=300+pass.coins;state.coins+=coins;state.earned+=coins;
    state.tournamentClaims[code]={at:now,coins,trophies:state.trophies.tournaments,passXp:150,passRewards:pass.rewards,unlocked};return state;
  });
  return {awarded:Boolean(result.committed),claim:result.state.tournamentClaims?.[code],coins:result.state.coins,state:result.state};
}
async function buyArcadeRewardItem(itemId){
  itemId=String(itemId||'');const item=rewardCatalogItem(itemId);if(!item||item.source!=='shop'||!item.price)throw new Error('Item inválido.');
  const before=await ensureArcadeRewardProfile();if(before.unlocks[itemId])return {bought:false,reason:'owned',state:before};if(before.coins<item.price)return {bought:false,reason:'coins',need:item.price-before.coins,state:before};
  const result=await transactArcadeRewards(state=>{if(state.unlocks[itemId]||state.coins<item.price)return;const now=serverNow();state.coins-=item.price;state.spent+=item.price;state.purchases[itemId]={at:now,price:item.price};rewardUnlock(state,itemId,now);return state;});
  return {bought:Boolean(result.committed),item,state:result.state};
}
async function equipArcadeRewardItem(itemId){
  itemId=String(itemId||'');const item=rewardCatalogItem(itemId);if(!item)throw new Error('Cosmético inválido.');if(!['title','frame','banner','effect'].includes(item.type))throw new Error('Este item é usado no editor de Avatar 3D.');
  const result=await transactArcadeRewards(state=>{if(!state.unlocks[itemId])return;state.equipped[item.type]=itemId;return state;});
  return {equipped:Boolean(result.committed),item,state:result.state};
}
function getArcadeRewards(){return normalizeArcadeRewards(arcadeRewardCache||localProfile()?.arcadeRewards||{});}
function watchArcadeRewards(cb=()=>{}){
  if(!currentUser||!db){const state=normalizeArcadeRewards(localProfile()?.arcadeRewards||{});arcadeRewardCache=state;cb(state);return()=>{};}
  return onValue(arcadeRewardProfileRef(),snap=>{const state=normalizeArcadeRewards(snap.val()||{});arcadeRewardCache=state;mirrorArcadeRewards(state).catch(()=>{});cb(state);},e=>console.warn('Arcade rewards listener:',e));
}
async function applyArcadeSettlementForCurrentUser(settlement){
  if(!currentUser||!settlement?.code)return {recorded:false,reason:'invalid'};
  const uid=currentUser.uid,entry=settlement.players?.[uid];if(!entry)return {recorded:false,reason:'not-player'};
  const seasonId=String(settlement.seasonId||currentSeasonId()).toUpperCase(),sr=arcadeRankStateRef(seasonId,uid);
  const tx=await runTransaction(sr,current=>{const cur=normalizeArcadeCompetitive(current||{});if(cur.appliedMatches?.[settlement.code])return;return applyArcadeSettlementToState(cur,settlement,uid);},{applyLocally:false});
  let state=normalizeArcadeCompetitive(tx.snapshot?.val()||{});
  if(!tx.committed){state=await readArcadeRankState(seasonId,uid);await saveArcadeSeasonHistory(state,seasonId).catch(()=>{});
  const reward=await applyArcadeRankedRewards(settlement,state,entry).catch(e=>{console.warn('Arcade rewards backfill:',e);return {awarded:false};});await remove(ref(db,`arcadeRankedInbox/${uid}/${settlement.code}`)).catch(()=>{});return {recorded:false,reason:'already-recorded',reward,state};}
  const local=localProfile(),seasonLocal=(local?.seasonProfile&&String(local.seasonProfile.seasonId||'').toUpperCase()===seasonId)?local.seasonProfile:{};
  const next={...local,arcadeCompetitive:state,seasonProfile:{...seasonLocal,seasonId,seasonLabel:currentSeasonLabel(),arcadeCompetitive:state}};
  CORE()?.replaceProfile?.(next);await flushProfile(next);
  await remove(ref(db,`arcadeRankedInbox/${uid}/${settlement.code}`)).catch(()=>{});
  await saveArcadeSeasonHistory(state,seasonId).catch(()=>{});
  const league=arcadeCompetitiveLeague(state.rp,state.played),gameState=normalizeArcadeCompetitiveGame(state.games?.[settlement.game]);
  const reward=await applyArcadeRankedRewards(settlement,state,entry).catch(e=>{console.warn('Arcade rewards:',e);return {awarded:false,error:String(e?.message||e)};});
  return {recorded:true,won:entry.result==='win',game:settlement.game,delta:Math.round(finite(entry.delta,0)),gameDelta:Math.round(finite(entry.gameDelta,0)),rp:state.rp,gameRp:gameState.rp,division:league.label,divisionIcon:league.icon,placement:Math.min(ARCADE_PLACEMENT_MATCHES,state.played),placementTotal:ARCADE_PLACEMENT_MATCHES,reward,state};
}
async function recordArcadeMatchResult(code,gameKey=''){
  if(!currentUser||!db||!code)throw new Error('Faça login para registrar a partida ranqueada.');code=String(code).toUpperCase();
  const room=(await get(ref(db,`fightRooms/${code}`))).val();if(!room?.players?.[currentUser.uid]||room.status!=='finished'||!room.winnerUid)throw new Error('A partida ainda não possui resultado confirmado.');
  if(room.ranked===false)return {recorded:false,reason:'casual'};
  const settlement=await ensureArcadeRankedSettlement(code);if(!settlement)throw new Error('Não foi possível gerar o resultado competitivo.');
  return applyArcadeSettlementForCurrentUser(settlement);
}
async function syncPendingArcadeRanked(){
  if(!currentUser||!db)return 0;const uid=currentUser.uid,snap=await get(ref(db,`arcadeRankedInbox/${uid}`)).catch(()=>null),items=Object.values(snap?.val?.()||{}).sort((a,b)=>Number(a.createdAt||0)-Number(b.createdAt||0)).slice(0,25);let done=0;
  for(const item of items){try{const seasonId=String(item.seasonId||currentSeasonId()).toUpperCase(),code=String(item.code||'').toUpperCase();if(!code)continue;const settlement=(await get(ref(db,`arcadeRankedMatches/${seasonId}/${code}`))).val()||await ensureArcadeRankedSettlement(code);if(settlement){await applyArcadeSettlementForCurrentUser(settlement);done++;}}catch(e){console.warn('Arcade ranked pending:',item,e);}}
  return done;
}

async function createArcadeTournament(options={}){
  if(!currentUser)throw new Error('Faça login para criar um torneio.');
  if(!await waitFirebaseOnline())throw new Error('Firebase offline.');
  const game=String(options.game||'kf2k2mp2').toLowerCase();if(!validArcadeTournamentGame(game))throw new Error('Este jogo não está habilitado para torneios de luta.');
  const maxPlayers=[4,8,16].includes(Number(options.maxPlayers))?Number(options.maxPlayers):4;
  const bestOf=[1,3,5].includes(Number(options.bestOf))?Number(options.bestOf):3;
  const name=String(options.name||'Torneio Arcade').trim().slice(0,42)||'Torneio Arcade';
  const visibility=String(options.visibility||'public')==='private'?'private':'public';
  for(let tries=0;tries<12;tries++){
    const code=arcadeTournamentCode(),rr=arcadeTournamentRef(code);if((await get(rr)).exists())continue;
    const now=serverNow(),playerName=cleanName(localProfile()?.nickname||currentUser.displayName||currentUser.email?.split('@')[0]);
    const room={code,protocolVersion:ARCADE_TOURNAMENT_PROTOCOL_VERSION,name,visibility,hostUid:currentUser.uid,game,maxPlayers,bestOf,format:'single_elimination',status:'waiting',createdAt:now,updatedAt:now,expiresAt:now+ARCADE_TOURNAMENT_TTL_MS,championUid:'',participants:{[currentUser.uid]:{uid:currentUser.uid,name:playerName,joinedAt:now,seed:1}},matches:{}};
    await set(rr,room);return code;
  }
  throw new Error('Não consegui gerar o código do torneio.');
}
async function joinArcadeTournament(code){
  if(!currentUser)throw new Error('Faça login para entrar no torneio.');code=String(code||'').trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))throw new Error('Código inválido.');
  const rr=arcadeTournamentRef(code),name=cleanName(localProfile()?.nickname||currentUser.displayName||currentUser.email?.split('@')[0]);
  const tx=await runTransaction(rr,t=>{
    if(!t||Number(t.protocolVersion)!==ARCADE_TOURNAMENT_PROTOCOL_VERSION||t.status!=='waiting'||Number(t.expiresAt||0)<serverNow())return;
    t.participants=t.participants||{};if(t.participants[currentUser.uid])return t;
    const count=Object.keys(t.participants).length;if(count>=Number(t.maxPlayers||4))return;
    t.participants[currentUser.uid]={uid:currentUser.uid,name,joinedAt:serverNow(),seed:count+1};t.updatedAt=serverNow();return t;
  },{applyLocally:false});
  if(!tx.committed||!tx.snapshot?.val()?.participants?.[currentUser.uid])throw new Error('O torneio não existe, já iniciou ou está cheio.');return code;
}
function watchArcadeTournament(code,cb){if(!db)return()=>{};return onValue(arcadeTournamentRef(code),s=>cb?.(s.val()||null,null),e=>cb?.(null,e));}
function buildArcadeTournamentMatches(t){
  const players=Object.values(t.participants||{}).sort((a,b)=>Number(a.seed||999)-Number(b.seed||999)||Number(a.joinedAt||0)-Number(b.joinedAt||0));
  const size=Number(t.maxPlayers||4),rounds=Math.log2(size),matches={};
  for(let r=1;r<=rounds;r++){
    const count=size/Math.pow(2,r);
    for(let i=0;i<count;i++){
      const id=`r${r}m${i+1}`;matches[id]={id,round:r,index:i+1,status:'waiting',player1Uid:r===1?(players[i*2]?.uid||''):'',player2Uid:r===1?(players[i*2+1]?.uid||''):'',score1:0,score2:0,winnerUid:'',fightRoomCode:'',completedFightRooms:{}};
    }
  }
  return matches;
}
async function startArcadeTournament(code){
  if(!currentUser)throw new Error('Faça login.');code=String(code||'').toUpperCase();
  const tx=await runTransaction(arcadeTournamentRef(code),t=>{
    if(!t||t.hostUid!==currentUser.uid||t.status!=='waiting')return;
    if(Object.keys(t.participants||{}).length!==Number(t.maxPlayers||0))return;
    t.matches=buildArcadeTournamentMatches(t);t.status='playing';t.startedAt=serverNow();t.updatedAt=serverNow();return t;
  },{applyLocally:false});
  if(!tx.committed)throw new Error('Somente o host pode iniciar quando todas as vagas estiverem preenchidas.');return tx.snapshot?.val()||null;
}
async function linkArcadeTournamentFightRoom(code,matchId,fightCode){
  if(!currentUser)throw new Error('Faça login.');code=String(code||'').toUpperCase();matchId=String(matchId||'');fightCode=String(fightCode||'').toUpperCase();
  const tx=await runTransaction(arcadeTournamentRef(code),t=>{
    const m=t?.matches?.[matchId];if(!m||t.status!=='playing'||m.winnerUid||m.player1Uid!==currentUser.uid)return;
    if(m.fightRoomCode&&m.fightRoomCode!==fightCode)return;
    m.fightRoomCode=fightCode;m.status='playing';m.updatedAt=serverNow();t.updatedAt=serverNow();return t;
  },{applyLocally:false});
  if(!tx.committed)throw new Error('Não foi possível vincular a sala ao confronto.');return tx.snapshot?.val()||null;
}
async function recordArcadeTournamentFightResult(code,matchId,fightCode,winnerUid){
  if(!currentUser||!code||!matchId||!fightCode||!winnerUid)return null;code=String(code).toUpperCase();fightCode=String(fightCode).toUpperCase();
  const tx=await runTransaction(arcadeTournamentRef(code),t=>{
    const m=t?.matches?.[matchId];if(!m||t.status!=='playing'||m.winnerUid||![m.player1Uid,m.player2Uid].includes(winnerUid)||![m.player1Uid,m.player2Uid].includes(currentUser.uid))return;
    m.completedFightRooms=m.completedFightRooms||{};if(m.completedFightRooms[fightCode])return t;
    m.completedFightRooms[fightCode]={winnerUid,at:serverNow()};if(winnerUid===m.player1Uid)m.score1=num(m.score1)+1;else m.score2=num(m.score2)+1;
    const target=Math.ceil(Number(t.bestOf||3)/2);m.fightRoomCode='';m.status='waiting';m.updatedAt=serverNow();
    if(Number(m.score1)>=target||Number(m.score2)>=target){
      m.winnerUid=winnerUid;m.status='finished';const rounds=Math.log2(Number(t.maxPlayers||4));
      if(Number(m.round)>=rounds){t.championUid=winnerUid;t.status='finished';t.finishedAt=serverNow();}
      else{
        const nextId=`r${Number(m.round)+1}m${Math.floor((Number(m.index)-1)/2)+1}`,next=t.matches?.[nextId];
        if(next){if(Number(m.index)%2===1)next.player1Uid=winnerUid;else next.player2Uid=winnerUid;next.updatedAt=serverNow();}
      }
    }
    t.updatedAt=serverNow();return t;
  },{applyLocally:false});
  const value=tx.snapshot?.val()||null;
  if(value?.status==='finished'&&value?.championUid===currentUser.uid)await claimArcadeTournamentReward(code).catch(e=>console.warn('Tournament reward:',e));
  return value;
}


// ===== Competitive Hub V3.0: Avatar 3D, histórico, temporadas e rankings por jogo =====
const ARCADE_AVATAR_VERSION=1;
function normalizeHexColor(v,fallback){v=String(v||'').trim();return /^#[0-9a-fA-F]{6}$/.test(v)?v.toUpperCase():fallback;}
function normalizeArcadeAvatar3D(v={}){
  const pick=(x,allowed,fallback)=>allowed.includes(String(x||''))?String(x):fallback;
  return {version:ARCADE_AVATAR_VERSION,body:pick(v.body,['classic','athletic','compact'],'classic'),skin:normalizeHexColor(v.skin,'#C98B65'),hair:pick(v.hair,['short','spiky','mohawk','long','pixel'],'short'),hairColor:normalizeHexColor(v.hairColor,'#171717'),top:pick(v.top,['fighter','jacket','hoodie','samurai','cyber','neon','retrowave','season'],'fighter'),topColor:normalizeHexColor(v.topColor,'#335CFF'),pants:pick(v.pants,['fighter','street','samurai','cyber','neon'],'fighter'),pantsColor:normalizeHexColor(v.pantsColor,'#171A24'),shoes:pick(v.shoes,['classic','gold','neon','high'],'classic'),gloves:pick(v.gloves,['classic','bronze','neon','cyber'],'classic'),accent:normalizeHexColor(v.accent,'#B7FF4A'),accessory:pick(v.accessory,['none','visor','mask','crown','arcade-mask'],'none'),aura:pick(v.aura,['none','diamond','flame','neon','season','dragon'],'none'),pose:pick(v.pose,['idle','guard','victory','master'],'idle'),updatedAt:clampInt(v.updatedAt,0,9999999999999)};
}
function arcadeAvatarRef(uid=currentUser?.uid){return uid&&db?ref(db,`arcadeAvatars/${uid}`):null;}
const ARCADE_AVATAR_REQUIREMENTS=Object.freeze({
  hair:{pixel:['avatar_hair_pixel','avatar_hair_season']},
  top:{jacket:['avatar_jacket_competitor'],cyber:['avatar_jacket_cyber'],neon:['avatar_outfit_neon'],retrowave:['avatar_outfit_retrowave'],season:['avatar_jacket_season']},
  pants:{neon:['avatar_outfit_neon']},
  shoes:{gold:['avatar_shoes_gold'],neon:['avatar_outfit_neon']},
  gloves:{bronze:['avatar_gloves_bronze'],neon:['avatar_outfit_neon'],cyber:['avatar_jacket_cyber']},
  accessory:{mask:['avatar_mask_shadow'],'arcade-mask':['avatar_mask_arcade'],crown:['avatar_crown_grandmaster']},
  aura:{diamond:['avatar_aura_diamond'],flame:['effect_flame'],neon:['avatar_aura_neon'],season:['avatar_aura_season'],dragon:['avatar_dragon_aura']},
  pose:{victory:['avatar_pose_victory'],master:['avatar_pose_master']}
});
function missingArcadeAvatarUnlock(config,unlocks={}){for(const [field,values] of Object.entries(ARCADE_AVATAR_REQUIREMENTS)){const req=values?.[config?.[field]];if(req&&!req.some(id=>unlocks?.[id]))return req[0];}return '';}
async function saveArcadeAvatar3D(config={}){if(!currentUser||!db)throw new Error('Faça login para salvar seu Avatar 3D.');const normalized=normalizeArcadeAvatar3D(config),rewards=await ensureArcadeRewardProfile(),missing=missingArcadeAvatarUnlock(normalized,rewards?.unlocks||{});if(missing){const item=rewardCatalogItem(missing);throw new Error(`Item bloqueado: ${item?.name||missing}. Desbloqueie antes de equipar.`);}const value={...normalized,uid:currentUser.uid,name:publicName(),updatedAt:serverNow()};await set(arcadeAvatarRef(),value);return value;}
async function getArcadeAvatar3D(uid=currentUser?.uid){if(!uid||!db)return normalizeArcadeAvatar3D({});const snap=await get(arcadeAvatarRef(uid));return {...normalizeArcadeAvatar3D(snap.val()||{}),uid,name:cleanName(snap.val()?.name||'Jogador')};}
function watchArcadeAvatar3D(uid,cb=()=>{}){uid=uid||currentUser?.uid;if(!uid||!db){cb(normalizeArcadeAvatar3D({}));return()=>{};}return onValue(arcadeAvatarRef(uid),snap=>cb({...normalizeArcadeAvatar3D(snap.val()||{}),uid,name:cleanName(snap.val()?.name||'Jogador')}),e=>console.warn('Avatar 3D:',e));}
async function saveArcadeSeasonHistory(state,seasonId=currentSeasonId()){
  if(!currentUser||!db)return null;state=normalizeArcadeCompetitive(state);seasonId=String(seasonId||currentSeasonId()).toUpperCase();const league=arcadeCompetitiveLeague(state.rp,state.played),hr=ref(db,`arcadeSeasonHistory/${currentUser.uid}/${seasonId}`);
  const tx=await runTransaction(hr,current=>{const c=current||{},peak=Math.max(clampInt(c.peakRp),state.rp);return {seasonId,label:seasonId,currentRp:state.rp,peakRp:peak,played:state.played,wins:state.wins,losses:state.losses,bestStreak:state.bestStreak,division:league.label,divisionIcon:league.icon,games:state.games||{},updatedAt:serverNow()};},{applyLocally:false});return tx.snapshot?.val()||null;
}
async function getArcadeSeasonHistory(uid=currentUser?.uid){if(!uid||!db)return{};return (await get(ref(db,`arcadeSeasonHistory/${uid}`))).val()||{};}
async function getArcadeMatchHistory(uid=currentUser?.uid,seasonId=currentSeasonId(),take=30){if(!uid||!db)return[];seasonId=String(seasonId||currentSeasonId()).toUpperCase();const snap=await get(ref(db,`arcadeRankedMatches/${seasonId}`));return Object.values(snap.val()||{}).filter(m=>m?.players?.[uid]).sort((a,b)=>Number(b.finishedAt||b.createdAt||0)-Number(a.finishedAt||a.createdAt||0)).slice(0,Math.max(1,Math.min(100,Number(take)||30)));}
async function getArcadeRivalries(uid=currentUser?.uid,seasonId=currentSeasonId()){
  if(!uid)return[];const matches=await getArcadeMatchHistory(uid,seasonId,100),map={};for(const m of matches){const opp=Object.keys(m.players||{}).find(x=>x!==uid);if(!opp)continue;const r=map[opp]||(map[opp]={uid:opp,played:0,wins:0,losses:0,lastAt:0});r.played++;if(m.winnerUid===uid)r.wins++;else r.losses++;r.lastAt=Math.max(r.lastAt,Number(m.finishedAt||0));}
  const names=(await get(ref(db,'publicProfiles'))).val()||{};return Object.values(map).map(r=>({...r,name:cleanName(names[r.uid]?.name||'Rival')})).sort((a,b)=>b.played-a.played||b.lastAt-a.lastAt);
}
async function getArcadeIdentity(uid=currentUser?.uid){
  if(!uid||!db)return null;const seasonId=currentSeasonId(),self=uid===currentUser?.uid;const [rowSnap,avatar,publicSnap]=await Promise.all([get(ref(db,`rankedSeasons/${seasonId}/leaderboard/${uid}`)),getArcadeAvatar3D(uid),get(ref(db,`publicProfiles/${uid}`))]);let rewards=null;if(self)rewards=await ensureArcadeRewardProfile().catch(()=>getArcadeRewards());return {uid,season:{...currentSeason},row:rowSnap.val()||{},avatar,publicProfile:publicSnap.val()||{},rewards};
}
async function getArcadeCompetitiveProfile(uid=currentUser?.uid){
  if(!uid||!db)return null;const seasonId=currentSeasonId();const self=uid===currentUser?.uid;const [rowSnap,avatar,history,matches,rivals,publicSnap,finalRankSnap]=await Promise.all([
    get(ref(db,`rankedSeasons/${seasonId}/leaderboard/${uid}`)),getArcadeAvatar3D(uid),getArcadeSeasonHistory(uid),getArcadeMatchHistory(uid,seasonId,30),getArcadeRivalries(uid,seasonId),get(ref(db,`publicProfiles/${uid}`)),get(ref(db,`rankedSeasons/${seasonId}/finalRanks/${uid}`)).catch(()=>null)
  ]);let rewards=null;if(self)rewards=await ensureArcadeRewardProfile().catch(()=>getArcadeRewards());return {uid,season:{...currentSeason},row:rowSnap.val()||{},avatar,history,matches,rivals,publicProfile:publicSnap.val()||{},rewards,finalRank:finalRankSnap?.val?.()||null};
}
async function claimArcadeSeasonPlacementReward(seasonId=currentSeasonId()){
  if(!currentUser||!db)throw new Error('Faça login.');seasonId=String(seasonId||currentSeasonId()).toUpperCase();const [metaSnap,rankSnap]=await Promise.all([get(ref(db,`rankedSeasons/${seasonId}/meta`)),get(ref(db,`rankedSeasons/${seasonId}/finalRanks/${currentUser.uid}`))]);const meta=metaSnap.val()||{},rank=Number(rankSnap.val()?.rank||rankSnap.val()||0);if(!meta.finalized||!rank)throw new Error('A classificação final desta temporada ainda não foi publicada.');const reward=ARCADE_SEASON_PLACEMENT_REWARDS.find(x=>rank<=x.max);if(!reward)return {awarded:false,reason:'outside-top100'};
  const result=await transactArcadeRewards(state=>{if(state.seasonPlacementClaims[seasonId])return;const now=serverNow(),unlocked=[];const grant=id=>{if(rewardCatalogItem(id)&&!state.unlocks[id]){rewardUnlock(state,id,now);unlocked.push(id);}};for(const id of reward.unlocks)grant(id);state.coins+=reward.coins;state.earned+=reward.coins;state.seasonPlacementClaims[seasonId]={at:now,rank,coins:reward.coins,label:reward.label,unlocked};return state;});return {awarded:Boolean(result.committed),rank,reward,claim:result.state.seasonPlacementClaims?.[seasonId],state:result.state};
}
function listenArcadeGameRanking(gameKey,limit=20,cb=()=>{}){if(!configured||!currentUser||!db){cb([]);return()=>{};}gameKey=safeKey(gameKey);const take=Math.max(1,Math.min(100,Number(limit)||20)),q=query(ref(db,`rankedSeasons/${currentSeasonId()}/leaderboard`),orderByChild(`arcadeGames/${gameKey}/rp`),limitToLast(Math.max(take,40)));return onValue(q,snap=>{const rows=Object.entries(snap.val()||{}).map(([uid,v])=>({uid,...v,gameRp:clampInt(v?.arcadeGames?.[gameKey]?.rp),gamePlayed:clampInt(v?.arcadeGames?.[gameKey]?.played),gameWins:clampInt(v?.arcadeGames?.[gameKey]?.wins),gameLosses:clampInt(v?.arcadeGames?.[gameKey]?.losses)})).filter(x=>x.gamePlayed>0||x.gameRp>0).sort((a,b)=>b.gameRp-a.gameRp||b.gameWins-a.gameWins).slice(0,take);cb(rows);},e=>{console.warn('Game ranking:',e);cb([]);});}
async function listArcadePublicTournaments(){if(!currentUser||!db)return[];const snap=await get(ref(db,'arcadeTournaments')),now=serverNow();return Object.values(snap.val()||{}).filter(t=>t?.visibility!=='private'&&['waiting','playing'].includes(t?.status)&&Number(t.expiresAt||0)>now).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0)).slice(0,30);}

// ===== GeoGuess Arena =====
// Scores are still calculated by the game client, but room access, lifecycle and
// presence are scoped to authenticated members of the room.
const GEO_PROTOCOL_VERSION=1;
const GEO_REGIONS=new Set(['brazil','world','americas','europe','asia','africa','oceania']);
function geoRoomCode(){return roomCode();}
function geoRoomRef(code){return ref(db,'geoRooms/'+String(code||'').trim().toUpperCase());}
function validGeoCode(code){return /^[A-Z2-9]{6}$/.test(String(code||'').trim().toUpperCase());}
function geoPlayerOnline(room,uid){return Object.keys(room?.presence?.[uid]||{}).length>0;}
function geoChoice(value,choices,fallback){const v=String(value||'').toLowerCase();return choices.has(v)?v:fallback;}
function geoText(value,max=80){return String(value??'').trim().slice(0,max);}
function geoBoundedInt(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback;}
function cleanGeoQuestion(raw){
  const id=geoText(raw?.id,160),imageId=geoText(raw?.imageId,100),lat=Number(raw?.lat),lng=Number(raw?.lng);
  if(!id||!imageId||!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180)return null;
  const heading=Number(raw?.heading);
  return {
    id,imageId,lat,lng,
    country:geoText(raw?.country,80),
    city:geoText(raw?.city,100),
    region:geoChoice(raw?.region,GEO_REGIONS,'world'),
    heading:Number.isFinite(heading)?heading:0,
    cameraType:geoText(raw?.cameraType,40),
    provider:geoText(raw?.provider,30)||'mapillary'
  };
}
function newGeoPlayer(uid,name,slot,now){
  return {
    uid,name,slot,joinedAt:now,lastSeen:now,connectionState:'online',controlSessionId:CLIENT_SESSION_ID,
    score:0,roundScore:0,distanceKm:0,submittedRound:-1,guessLat:null,guessLng:null,steps:0,timedOut:false,left:false
  };
}
async function attachGeoPresence(code){
  if(!currentUser||!db||!validGeoCode(code))return;
  code=String(code).trim().toUpperCase();
  const key=code+':'+currentUser.uid;
  if(geoPresence.has(key))return;
  const presenceRef=ref(db,'geoRooms/'+code+'/presence/'+currentUser.uid+'/'+CLIENT_SESSION_ID);
  const playerRef=ref(db,'geoRooms/'+code+'/players/'+currentUser.uid);
  const lastSeenRef=ref(db,'geoRooms/'+code+'/players/'+currentUser.uid+'/lastSeen');
  const disconnectPresence=onDisconnect(presenceRef),disconnectLastSeen=onDisconnect(lastSeenRef);
  try{
    await disconnectPresence.remove();
    await disconnectLastSeen.set(serverTimestamp());
    await set(presenceRef,{sessionId:CLIENT_SESSION_ID,connectedAt:serverTimestamp(),heartbeatAt:serverTimestamp()});
    await update(playerRef,{controlSessionId:CLIENT_SESSION_ID,lastSeen:serverNow(),connectionState:'online'});
    const timer=setInterval(async()=>{
      if(!currentUser)return;
      await update(presenceRef,{heartbeatAt:serverTimestamp()}).catch(()=>{});
      await set(lastSeenRef,serverNow()).catch(()=>{});
    },8000);
    geoPresence.set(key,{code,presenceRef,playerRef,lastSeenRef,disconnectPresence,disconnectLastSeen,timer});
  }catch(error){
    await disconnectPresence.cancel().catch(()=>{});
    await disconnectLastSeen.cancel().catch(()=>{});
    throw error;
  }
}
async function detachGeoPresence(code){
  if(!currentUser||!db||!validGeoCode(code))return;
  code=String(code).trim().toUpperCase();
  const key=code+':'+currentUser.uid,h=geoPresence.get(key);
  if(h){
    clearInterval(h.timer);
    await h.disconnectPresence.cancel().catch(()=>{});
    await h.disconnectLastSeen.cancel().catch(()=>{});
    await remove(h.presenceRef).catch(()=>{});
    geoPresence.delete(key);
    return;
  }
  await remove(ref(db,'geoRooms/'+code+'/presence/'+currentUser.uid+'/'+CLIENT_SESSION_ID)).catch(()=>{});
}
async function cleanupExpiredGeoRoom(code){
  if(!db||!validGeoCode(code))return false;
  const roomRef=geoRoomRef(code),snap=await get(roomRef),room=snap.val();
  if(room?.expiresAt&&Number(room.expiresAt)<=serverNow()){
    await remove(roomRef).catch(()=>{});
    return true;
  }
  return false;
}
async function createGeoRoom(payload={}){
  if(!currentUser||!db)throw new Error('Faça login antes de criar a sala GeoGuess.');
  if(!await waitFirebaseOnline())throw new Error('Firebase offline. Verifique a internet e tente novamente.');
  const requestConfig=payload?.config&&typeof payload.config==='object'?payload.config:{};
  const rawQuestions=Array.isArray(payload?.questions)?payload.questions:[];
  const requestedRounds=Number(payload?.rounds??requestConfig.rounds);
  const roundLimit=Number.isFinite(requestedRounds)?geoBoundedInt(requestedRounds,3,8,5):geoBoundedInt(rawQuestions.length,3,8,3);
  const maxPlayers=geoBoundedInt(payload?.maxPlayers??requestConfig.maxPlayers,2,8,2);
  const questions=rawQuestions.map(cleanGeoQuestion).filter(Boolean).slice(0,roundLimit);
  if(questions.length<3)throw new Error('Não há rodadas GeoGuess válidas o suficiente para criar a sala.');
  const region=geoChoice(payload?.region??requestConfig.region,GEO_REGIONS,'world');
  const difficulty='normal'; // Retained only for compatibility with saved rooms/rankings.
  const timerSec=300;
  for(let attempt=0;attempt<8;attempt++){
    const code=geoRoomCode(),roomRef=geoRoomRef(code),now=serverNow();
    const name=cleanName(localProfile()?.nickname||currentUser.displayName||currentUser.email?.split('@')[0]);
    const room={
      code,protocolVersion:GEO_PROTOCOL_VERSION,appVersion:APP_VERSION,hostUid:currentUser.uid,
      status:'waiting',roundState:'waiting',createdAt:now,updatedAt:now,expiresAt:now+WAITING_TTL_MS,
      startedAt:0,finishedAt:0,roundIndex:0,roundDeadline:0,winnerUid:'',
      config:{maxPlayers,region,difficulty,timerSec,rounds:questions.length},
      questions,slots:{1:currentUser.uid},
      players:{[currentUser.uid]:newGeoPlayer(currentUser.uid,name,1,now)}
    };
    try{
      const result=await runTransaction(roomRef,current=>current?undefined:room,{applyLocally:false});
      if(!result.committed)continue;
      attachGeoPresence(code).catch(error=>console.warn('GeoGuess presence:',error));
      return code;
    }catch(error){
      const message=String(error?.code||error?.message||'').toLowerCase();
      if(message.includes('permission'))throw new Error('O Firebase recusou a criação da Arena GeoGuess. Publique as regras atuais do Realtime Database.');
      throw error;
    }
  }
  throw new Error('Não consegui gerar um código de sala. Tente novamente.');
}
async function claimGeoSlot(code,maxPlayers){
  for(let slot=1;slot<=maxPlayers;slot++){
    const slotRef=ref(db,'geoRooms/'+code+'/slots/'+slot);
    const result=await runTransaction(slotRef,current=>{
      if(current===currentUser.uid)return current;
      if(current===null||current===undefined)return currentUser.uid;
      return;
    },{applyLocally:false});
    if(result.committed&&result.snapshot?.val()===currentUser.uid){
      const disconnectSlot=onDisconnect(slotRef);
      try{
        await disconnectSlot.remove();
        return {slot,disconnectSlot};
      }catch(error){
        await runTransaction(slotRef,current=>current===currentUser.uid?null:current,{applyLocally:false}).catch(()=>{});
        throw error;
      }
    }
  }
  return null;
}
async function releaseGeoSlot(code,slot){
  if(!slot)return;
  await runTransaction(ref(db,'geoRooms/'+code+'/slots/'+slot),current=>current===currentUser?.uid?null:current,{applyLocally:false}).catch(()=>{});
}
async function joinGeoRoom(code){
  if(!currentUser||!db)throw new Error('Faça login antes de entrar no GeoGuess.');
  if(!await waitFirebaseOnline())throw new Error('Firebase offline. Verifique a internet antes de entrar na sala.');
  code=String(code||'').trim().toUpperCase();
  if(!validGeoCode(code))throw new Error('Código inválido.');
  const roomRef=geoRoomRef(code),snap=await get(roomRef);
  if(!snap.exists())throw new Error('Sala não encontrada.');
  const initial=snap.val();
  if(Number(initial.protocolVersion||0)!==GEO_PROTOCOL_VERSION)throw new Error('Esta sala usa uma versão incompatível. Atualize a página.');
  if(initial.expiresAt&&Number(initial.expiresAt)<=serverNow()){
    await cleanupExpiredGeoRoom(code);
    throw new Error('Esta sala expirou. Crie uma nova sala.');
  }
  if(initial.status==='finished')throw new Error('Esta partida já foi finalizada.');
  if(initial.players?.[currentUser.uid]){
    attachGeoPresence(code).catch(error=>console.warn('GeoGuess presence:',error));
    return code;
  }
  if(initial.status!=='waiting')throw new Error('Esta partida já começou.');
  const maxPlayers=Math.max(2,Math.min(8,Number(initial.config?.maxPlayers||2)));
  if(Object.values(initial.players||{}).filter(player=>!player.left).length>=maxPlayers)throw new Error('A sala está lotada.');
  const claim=await claimGeoSlot(code,maxPlayers);
  if(!claim)throw new Error('A sala acabou de ficar cheia.');
  const now=serverNow();
  const name=cleanName(localProfile()?.nickname||currentUser.displayName||currentUser.email?.split('@')[0]);
  const player=newGeoPlayer(currentUser.uid,name,claim.slot,now);
  try{
    await set(ref(db,'geoRooms/'+code+'/players/'+currentUser.uid),player);
    await claim.disconnectSlot.cancel();
  }catch(error){
    await claim.disconnectSlot.cancel().catch(()=>{});
    await releaseGeoSlot(code,claim.slot);
    const message=String(error?.code||error?.message||'').toLowerCase();
    if(message.includes('permission'))throw new Error('O Firebase recusou a entrada na Arena GeoGuess. Publique as regras atuais do Realtime Database.');
    throw error;
  }
  const after=(await get(roomRef)).val();
  if(!after||after.status!=='waiting'||Number(after.protocolVersion)!==GEO_PROTOCOL_VERSION){
    await remove(ref(db,'geoRooms/'+code+'/players/'+currentUser.uid)).catch(()=>{});
    await releaseGeoSlot(code,claim.slot);
    throw new Error('A sala iniciou enquanto você entrava. Tente novamente.');
  }
  attachGeoPresence(code).catch(error=>console.warn('GeoGuess presence:',error));
  await update(roomRef,{updatedAt:serverNow()}).catch(()=>{});
  return code;
}
function watchGeoRoom(code,cb){
  if(!db||!validGeoCode(code))return()=>{};
  return onValue(geoRoomRef(code),snapshot=>cb?.(snapshot.val()||null,null),error=>cb?.(null,error));
}
async function startGeoRoom(code){
  if(!currentUser||!db)throw new Error('Sessão expirada.');
  code=String(code||'').trim().toUpperCase();
  if(!validGeoCode(code))throw new Error('Código inválido.');
  const result=await runTransaction(geoRoomRef(code),room=>{
    if(!room||Number(room.protocolVersion)!==GEO_PROTOCOL_VERSION||room.hostUid!==currentUser.uid||!room.players?.[currentUser.uid]||room.status!=='waiting')return;
    const players=Object.values(room.players||{}).filter(player=>!player.left);
    if(players.length<2)return;
    const now=serverNow(),timerSec=300;
    room.config.timerSec=timerSec;
    room.config.difficulty='normal';
    room.status='playing';
    room.roundState='playing';
    room.startedAt=now;
    room.finishedAt=0;
    room.winnerUid='';
    room.roundIndex=0;
    room.roundDeadline=now+timerSec*1000;
    room.updatedAt=now;
    room.expiresAt=now+PLAYING_TTL_MS;
    for(const player of players){
      player.score=Number.isFinite(Number(player.score))?Number(player.score):0;
      player.submittedRound=-1;
      player.roundScore=0;
      player.distanceKm=0;
      player.guessLat=null;
      player.guessLng=null;
      player.steps=0;
      player.timedOut=false;
      player.left=false;
    }
    return room;
  },{applyLocally:false});
  if(!result.committed)throw new Error('Não consegui iniciar. Verifique se há pelo menos 2 jogadores e se você é o host.');
  return result.snapshot?.val()||null;
}
async function mutateGeoRoom(code,fn){
  if(!currentUser||!db)throw new Error('Sessão expirada.');
  if(typeof fn!=='function')throw new Error('Atualização de sala inválida.');
  code=String(code||'').trim().toUpperCase();
  if(!validGeoCode(code))throw new Error('Código inválido.');
  const result=await runTransaction(geoRoomRef(code),room=>{
    if(!room||Number(room.protocolVersion)!==GEO_PROTOCOL_VERSION)return;
    const player=room.players?.[currentUser.uid];
    if(!player||player.left)return;
    if(player.controlSessionId&&player.controlSessionId!==CLIENT_SESSION_ID)return;
    const before=JSON.stringify(room);
    const next=fn(room,currentUser.uid);
    if(!next||typeof next!=='object'||JSON.stringify(next)===before)return;
    next.updatedAt=serverNow();
    return next;
  },{applyLocally:false});
  return {committed:result.committed,value:result.snapshot?.val()||null};
}
async function ensureGeoHost(code){
  if(!currentUser||!db||!validGeoCode(code))return;
  code=String(code).trim().toUpperCase();
  await runTransaction(geoRoomRef(code),room=>{
    if(!room||Number(room.protocolVersion)!==GEO_PROTOCOL_VERSION||!room.players?.[currentUser.uid]||room.status==='finished')return;
    const host=room.players?.[room.hostUid];
    const stale=!host||host.left||(!geoPlayerOnline(room,room.hostUid)&&(serverNow()-Number(host?.lastSeen||0)>=HOST_GRACE_MS));
    if(!stale)return;
    const replacement=Object.values(room.players||{}).filter(player=>!player.left).sort((a,b)=>(Number(a.slot||99)-Number(b.slot||99))||(Number(a.joinedAt||0)-Number(b.joinedAt||0)))[0];
    if(!replacement)return;
    room.hostUid=replacement.uid;
    room.updatedAt=serverNow();
    return room;
  },{applyLocally:false}).catch(()=>{});
}
async function leaveGeoRoom(code){
  if(!currentUser||!db||!validGeoCode(code))return;
  code=String(code).trim().toUpperCase();
  await detachGeoPresence(code).catch(()=>{});
  await runTransaction(geoRoomRef(code),room=>{
    if(!room||!room.players?.[currentUser.uid])return;
    const player=room.players[currentUser.uid],slot=player.slot;
    delete room.players[currentUser.uid];
    if(slot&&room.slots?.[slot]===currentUser.uid)delete room.slots[slot];
    if(room.presence?.[currentUser.uid])delete room.presence[currentUser.uid];
    if(room.hostUid===currentUser.uid){
      const replacement=Object.values(room.players||{}).filter(item=>!item.left).sort((a,b)=>(Number(a.slot||99)-Number(b.slot||99))||(Number(a.joinedAt||0)-Number(b.joinedAt||0)))[0];
      if(replacement)room.hostUid=replacement.uid;
    }
    if(!Object.keys(room.players||{}).length)return null;
    room.updatedAt=serverNow();
    return room;
  },{applyLocally:false}).catch(()=>{});
}

function bind(){
  $('accountButton')?.addEventListener('click',()=>openAuth('login'));
  $('authCloseButton')?.addEventListener('click',()=>closeOverlay('authOverlay'));
  $('loginTabButton')?.addEventListener('click',()=>setAuthMode('login'));
  $('registerTabButton')?.addEventListener('click',()=>setAuthMode('register'));
  $('rankingButton')?.addEventListener('click',()=>loadRanking());$('homeRankingButton')?.addEventListener('click',()=>loadRanking());
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
        for(const h of fightPresence.values()){
          try{
            await restoreFightPresence(h);
            // clientReady é removido pelo onDisconnect. Não o recriamos aqui: o
            // frontend valida o aparelho novamente e grava uma nova sessão pronta.
          }catch(e){console.warn('Fight presence restore:',h.code,e);}
        }
        for(const h of geoPresence.values()){
          try{
            await h.disconnectPresence.remove();
            await h.disconnectLastSeen.set(serverTimestamp());
            await set(h.presenceRef,{sessionId:CLIENT_SESSION_ID,connectedAt:serverTimestamp(),heartbeatAt:serverTimestamp()});
            await update(h.playerRef,{lastSeen:serverNow(),connectionState:'online'});
          }catch{}
        }
        if(socialPresenceHandle&&currentUser?.uid===socialPresenceHandle.uid){try{await socialPresenceHandle.d.remove();await set(socialPresenceHandle.pr,{sessionId:CLIENT_SESSION_ID,online:true,at:serverTimestamp()});}catch(e){console.warn('Social presence restore:',e);}}
      }
    });
    seasonUnsub=onValue(ref(db,'rankedConfig/currentSeason'),snap=>{currentSeason=normalizeSeason(snap.val()||DEFAULT_SEASON);if($('rankingSeasonBanner'))$('rankingSeasonBanner').innerHTML=`<b>🏁 ${escapeHtml(currentSeasonLabel())}</b><span>${escapeHtml(currentSeason.description||'Ranking da temporada atual')}</span>`;},()=>{currentSeason={...DEFAULT_SEASON};});
        onAuthStateChanged(auth,async user=>{
      if(socialPresenceHandle&&(!user||socialPresenceHandle.uid!==user.uid))await detachSocialPresence().catch(()=>{});
      currentUser=user||null;
      if(user){
        try{
          const snap=await get(ref(db,`profiles/${user.uid}`));const root=snap.val()||{},remote=root.profile||{};const merged=mergeProfiles(localProfile(),remote);const season=mergeSeasonProfiles(localProfile()?.seasonProfile||{},root.seasonProfile||{});
          CORE()?.replaceProfile?.({...merged,seasonProfile:season});await flushProfile({...merged,seasonProfile:season});await syncPublicProfile();await attachSocialPresence();await ensureArcadeRewardProfile().catch(e=>console.warn('Arcade rewards sync:',e));await syncPendingArcadeRanked().catch(e=>console.warn('Arcade ranked sync:',e));
        }catch(e){console.warn('Profile restore:',e);}
      }
      updateAuthUI();window.dispatchEvent(new CustomEvent('gameguess:authchange',{detail:{user:currentUser}}));
    });
  }catch(e){console.error('Firebase init:',e);}
}


// ===== V17 Social: perfis públicos, amigos, presença e convites =====
function publicName(){const p=localProfile();return cleanName(p.nickname||currentUser?.displayName||currentUser?.email?.split('@')[0]||'Jogador');}
async function syncPublicProfile(){
  if(!currentUser||!db)return;
  const p=localProfile();
  await set(ref(db,`publicProfiles/${currentUser.uid}`),{uid:currentUser.uid,name:publicName(),nickname:String(p.nickname||''),avatar:p.avatar&&typeof p.avatar==='object'?p.avatar:{},favoriteGame:String(p.favoriteGame||'Game Guess'),updatedAt:serverNow()}).catch(e=>console.warn('Public profile:',e));
}
async function detachSocialPresence(){
  const h=socialPresenceHandle;if(!h)return;socialPresenceHandle=null;clearInterval(h.timer);try{await h.d.cancel()}catch{}try{await remove(h.pr)}catch{}
}
async function attachSocialPresence(){
  if(!currentUser||!db)return false;
  const uid=currentUser.uid;
  if(socialPresenceHandle?.uid===uid)return true;
  if(socialPresenceHandle)await detachSocialPresence();
  const pr=ref(db,`userPresence/${uid}/${CLIENT_SESSION_ID}`),d=onDisconnect(pr);
  try{
    await d.remove();
    // Evita escrever no UID antigo quando a conta muda enquanto uma operação async
    // de presença ainda está em andamento.
    if(!currentUser||currentUser.uid!==uid||auth?.currentUser?.uid!==uid){await d.cancel().catch(()=>{});return false;}
    await set(pr,{sessionId:CLIENT_SESSION_ID,online:true,at:serverTimestamp()});
    const timer=setInterval(()=>{
      if(!currentUser||currentUser.uid!==uid)return;
      update(pr,{at:serverTimestamp(),online:true}).catch(()=>{});
    },12000);
    socialPresenceHandle={uid,pr,d,timer};
    return true;
  }catch(e){
    await d.cancel().catch(()=>{});
    console.warn('Social presence unavailable:',e);
    return false;
  }
}
async function searchPlayers(term=''){
  if(!currentUser||!db)return[];term=String(term||'').trim().toLowerCase();if(term.length<2)return[];const [ps,fs,prs]=await Promise.all([get(ref(db,'publicProfiles')),get(ref(db,`friends/${currentUser.uid}`)),get(ref(db,'userPresence'))]);const friends=fs.val()||{},presence=prs.val()||{};return Object.values(ps.val()||{}).filter(x=>x?.uid&&x.uid!==currentUser.uid&&String(x.name||x.nickname||'').toLowerCase().includes(term)).slice(0,20).map(x=>({...x,isFriend:Boolean(friends[x.uid]),online:Boolean(Object.keys(presence[x.uid]||{}).length)}));
}
async function sendFriendRequest(targetUid){
  if(!currentUser||!db)throw new Error('Faça login para adicionar amigos.');targetUid=String(targetUid||'');if(!targetUid||targetUid===currentUser.uid)throw new Error('Jogador inválido.');const existing=(await get(ref(db,`friends/${currentUser.uid}/${targetUid}`))).val();if(existing)throw new Error('Este jogador já está na sua lista de amigos.');await set(ref(db,`friendRequests/${targetUid}/${currentUser.uid}`),{fromUid:currentUser.uid,fromName:publicName(),createdAt:serverNow()});
}
async function respondFriendRequest(fromUid,accept=true){
  if(!currentUser||!db)throw new Error('Faça login.');fromUid=String(fromUid||'');const request=(await get(ref(db,`friendRequests/${currentUser.uid}/${fromUid}`))).val();if(!request)throw new Error('Pedido não encontrado.');if(!accept){await remove(ref(db,`friendRequests/${currentUser.uid}/${fromUid}`));return;}
  const friendProfile=(await get(ref(db,`publicProfiles/${fromUid}`))).val()||{};const now=serverNow(),updates={};updates[`friendRequests/${currentUser.uid}/${fromUid}`]=null;updates[`friends/${currentUser.uid}/${fromUid}`]={uid:fromUid,name:cleanName(friendProfile.name||request.fromName),since:now};updates[`friends/${fromUid}/${currentUser.uid}`]={uid:currentUser.uid,name:publicName(),since:now};await update(ref(db),updates);
}
async function removeFriend(friendUid){if(!currentUser||!db)return;friendUid=String(friendUid||'');const u={};u[`friends/${currentUser.uid}/${friendUid}`]=null;u[`friends/${friendUid}/${currentUser.uid}`]=null;await update(ref(db),u);}
async function getSocialData(){
  if(!currentUser||!db)return{friends:[],requests:[],invites:[]};const [fs,rs,is,ps,prs]=await Promise.all([get(ref(db,`friends/${currentUser.uid}`)),get(ref(db,`friendRequests/${currentUser.uid}`)),get(ref(db,`gameInvites/${currentUser.uid}`)),get(ref(db,'publicProfiles')),get(ref(db,'userPresence'))]);const profiles=ps.val()||{},presence=prs.val()||{},now=serverNow();const friends=Object.keys(fs.val()||{}).map(uid=>({...profiles[uid],uid,name:cleanName(profiles[uid]?.name||(fs.val()||{})[uid]?.name),online:Boolean(Object.keys(presence[uid]||{}).length)}));const requests=Object.values(rs.val()||{}).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));const invites=Object.values(is.val()||{}).filter(x=>Number(x.expiresAt||0)>now).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));return{friends,requests,invites};
}
async function sendGameInvite(targetUid,payload={}){
  if(!currentUser||!db)throw new Error('Faça login.');targetUid=String(targetUid||'');if(!(await get(ref(db,`friends/${currentUser.uid}/${targetUid}`))).exists())throw new Error('Convites são enviados apenas para amigos.');const game=String(payload.game||'arena').slice(0,24),roomCode=String(payload.roomCode||'').trim().toUpperCase().slice(0,12),now=serverNow();await set(ref(db,`gameInvites/${targetUid}/${currentUser.uid}`),{fromUid:currentUser.uid,fromName:publicName(),game,roomCode,createdAt:now,expiresAt:now+15*60*1000});
}
async function dismissGameInvite(fromUid){if(!currentUser||!db)return;await remove(ref(db,`gameInvites/${currentUser.uid}/${String(fromUid||'')}`));}
function watchSocialInbox(cb){
  if(!currentUser||!db)return()=>{};const uid=currentUser.uid;let timer=0;const fire=()=>{clearTimeout(timer);timer=setTimeout(async()=>{try{cb?.(await getSocialData())}catch{}},80)};const a=onValue(ref(db,`friendRequests/${uid}`),fire),b=onValue(ref(db,`gameInvites/${uid}`),fire),c=onValue(ref(db,`friends/${uid}`),fire);fire();return()=>{clearTimeout(timer);a?.();b?.();c?.()};
}

async function listenToRanking(limit=100,cb){
  if(!currentUser||!db)return()=>{};
  const transform=snap=>{
    const data=snap.val()||{};
    const rows=Object.entries(data).map(([uid,profile])=>{
      const p=profile.profile||{};
      const r=normalizeRankedStats(p.rankedStats||{});
      const totalPlayed=Object.values(r.modes||{}).reduce((sum,m)=>sum+(num(m.played)||0),0);
      const totalWins=Object.values(r.modes||{}).reduce((sum,m)=>sum+(num(m.wins)||0),0);
      const accuracy=totalPlayed>0?Math.round(totalWins/totalPlayed*100):0;
      return{
        uid,displayName:cleanName(p.nickname||profile.name||'Jogador'),
        rating:num(r.overallRating)||1000,
        bestScore:num(r.bestMatch?.score)||0,
        bestCorrect:num(r.bestMatch?.correct)||0,
        bestStreak:num(p.bestStreak)||0,
        totalPlayed,accuracy,
        duelWins:num(r.modes?.duel?.wins)||0,
        kofWins:num(r.modes?.kof?.wins)||0,
        gamesWon:num(r.modes?.gameGuess?.wins)||0,
        termWins:num(r.modes?.termo?.wins)||0,
        geoWins:num(r.modes?.geoguess?.wins)||0
      };
    }).sort((a,b)=>Number(b.rating||0)-Number(a.rating||0)).slice(0,limit);
    cb?.(rows);
  };
  const q=query(ref(db,'publicProfiles'),orderByValue());
  const unsub=onValue(q,transform,err=>console.warn('Ranking listen error:',err));
  return unsub;
}

function listenToArcadeRanking(limit=10,cb=()=>{}){
  if(!configured||!currentUser||!db){cb([]);return()=>{};}
  const take=Math.max(1,Math.min(100,Number(limit)||10));
  const q=query(ref(db,`rankedSeasons/${currentSeasonId()}/leaderboard`),orderByChild('arcadeRp'),limitToLast(Math.max(take,40)));
  return onValue(q,snap=>{
    const rows=Object.entries(snap.val()||{}).map(([uid,v])=>({uid,...v,arcadeWins:num(v.arcadeWins),arcadeLosses:num(v.arcadeLosses),arcadePlayed:num(v.arcadePlayed),arcadeRp:clampInt(v.arcadeRp),arcadeRating:clampInt(v.arcadeRp),bestArcadeGame:String(v.bestArcadeGame||''),arcadeDivision:String(v.arcadeDivision||arcadeCompetitiveLeague(v.arcadeRp,v.arcadePlayed).label),arcadeDivisionIcon:String(v.arcadeDivisionIcon||arcadeCompetitiveLeague(v.arcadeRp,v.arcadePlayed).icon),arcadeRankVersion:Number(v.arcadeRankVersion||0)}))
      .filter(v=>v.arcadeRankVersion===ARCADE_RANK_VERSION&&(v.arcadePlayed>0||v.arcadeRp>0))
      .sort((a,b)=>(b.arcadeRp-a.arcadeRp)||(b.arcadeWins-a.arcadeWins)||(a.arcadeLosses-b.arcadeLosses)||(Number(a.updatedAt||0)-Number(b.updatedAt||0))).slice(0,take);
    cb(rows);
  },e=>{console.warn('Arcade ranking listener:',e);cb([]);});
}

window.GameGuessRanked={record:recordRankedResult};
window.GameGuessFirebase={
  configured, appVersion:APP_VERSION, protocolVersion:PROTOCOL_VERSION, sessionId:CLIENT_SESSION_ID,
  ready:()=>configured&&Boolean(db), getUser:()=>currentUser, openAuth, loadRanking, login, register, googleLogin, logout,
  syncLocalProfile, ratingOf, serverNow, isConnected, newSubmissionId, recordRankedResult, getSeason:()=>({...currentSeason}), getQuizHistory, markQuizHistory,
  createDuelRoom, joinDuelRoom, startDuelRoom, leaveDuelRoom, ensureDuelHost, attachDuelPresence, detachDuelPresence, cleanupExpiredDuel,
  watchDuel, mutateDuel, deleteDuel,getRoom:async code=>configured?(await get(ref(db,`duels/${String(code||'').toUpperCase()}`))).val():null,
  fightProtocolVersion:FIGHT_PROTOCOL_VERSION, arcadeRankVersion:ARCADE_RANK_VERSION, arcadeRankInfo:(rp,played)=>arcadeCompetitiveLeague(rp,played), arcadeRankTransfer:arcadeCompetitiveTransfer, createFightRoom, joinFightRoom, watchFightRoom, markFightReady, requestFightLaunch, submitFightResult, claimFightRankedRecord, ensureArcadeRankedSettlement, recordArcadeMatchResult, syncPendingArcadeRanked, leaveFightRoom, attachFightPresence, detachFightPresence, getFightRoom:async code=>configured?(await get(ref(db,`fightRooms/${String(code||'').toUpperCase()}`))).val():null,
  arcadeRewardVersion:ARCADE_REWARD_VERSION, arcadeRewardCatalog:arcadeRewardCatalogPublic, arcadeRewardRanks:()=>ARCADE_REWARD_RANKS.map(x=>({...x,unlocks:[...x.unlocks]})), arcadeRewardMilestones:()=>[...ARCADE_REWARD_MILESTONES.map(x=>({key:x.key,label:x.label,coins:x.coins,unlocks:[...x.unlocks]})),...ARCADE_UPSET_REWARDS.map(x=>({key:x.key,label:x.label,coins:x.coins,unlocks:[...x.unlocks]}))], arcadeBattlePass:()=>({maxLevel:ARCADE_BATTLE_PASS_MAX_LEVEL,rewards:ARCADE_BATTLE_PASS_REWARDS.map(x=>({...x,unlocks:[...x.unlocks]}))}), getArcadeRewards, watchArcadeRewards, ensureArcadeRewardProfile, buyArcadeRewardItem, equipArcadeRewardItem, claimArcadeTournamentReward, claimArcadeSeasonPlacementReward,
  arcadeTournamentProtocolVersion:ARCADE_TOURNAMENT_PROTOCOL_VERSION, createArcadeTournament, joinArcadeTournament, watchArcadeTournament, startArcadeTournament, linkArcadeTournamentFightRoom, recordArcadeTournamentFightResult, getArcadeTournament:async code=>configured?(await get(arcadeTournamentRef(code))).val():null, listArcadePublicTournaments, listenToArcadeRanking, listenArcadeGameRanking,
  avatar3dVersion:ARCADE_AVATAR_VERSION, saveArcadeAvatar3D, getArcadeAvatar3D, watchArcadeAvatar3D, getArcadeIdentity, getArcadeSeasonHistory, getArcadeMatchHistory, getArcadeRivalries, getArcadeCompetitiveProfile,
  geoProtocolVersion:GEO_PROTOCOL_VERSION, createGeoRoom, joinGeoRoom, watchGeoRoom, startGeoRoom, mutateGeoRoom, ensureGeoHost, leaveGeoRoom, attachGeoPresence, detachGeoPresence, cleanupExpiredGeoRoom, getGeoRoom:async code=>configured?(await get(ref(db,'geoRooms/'+String(code||'').toUpperCase()))).val():null,
  syncPublicProfile, searchPlayers, sendFriendRequest, respondFriendRequest, removeFriend, getSocialData, sendGameInvite, dismissGameInvite, watchSocialInbox, listenToRanking
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
if(!configured)setTimeout(()=>{if($('accountLabel'))$('accountLabel').textContent='Configurar';updateAuthUI();},0);
