(() => {
  'use strict';
  const $=id=>document.getElementById(id), CORE=()=>window.GameGuessCore, FB=()=>window.GameGuessFirebase;
  const PROFILE_KEY='gameGuessArcadeV4';
  const ROUND_SECONDS=35, TOTAL_ROUNDS=15;
  let roomCode='', room=null, unsub=null, renderedRound=-1, clock=null, advanceTimer=null, hintsUsed=0, localWrong=0, isSubmitting=false;

  const UNIVERSE_LABELS={random:'🌌 Caos Multiverso',games:'🎮 Games IGDB',dragonball:'🐉 Dragon Ball',naruto:'🍥 Naruto',yugioh:'🃏 Yu-Gi-Oh!',saintseiya:'♈ Cavaleiros',lol:'⚔️ League of Legends',pokemon:'🔴 Pokémon',digimon:'🔵 Digimon',cartoons:'📺 Desenhos clássicos',globinho:'☀️ TV Globinho'};
  const CH_LABELS={random:'🎲 Aleatório',image:'🧩 Imagem',ability:'💥 Habilidade',origin:'🌍 Origem/Nação',group:'🛡️ Grupo/Afiliação',era:'🕰️ Saga/Geração',role:'🎭 Classe/Papel',dossier:'🕵️ Dossiê',blind:'🧠 Só pistas'};
  const DIFF_MULT={easy:.9,normal:1,hard:1.25,insane:1.5};
  const PROMPTS={
    games:{image:'Qual é o jogo escondido nesta imagem?',ability:'Que jogo combina com esta característica de gameplay?',origin:'Qual jogo combina com esta plataforma/origem?',group:'Qual jogo pertence a esta plataforma?',era:'Qual jogo foi lançado nesta época?',role:'Que jogo pertence a este gênero?',dossier:'Plataforma, gênero e época: qual é o jogo?',blind:'Sem imagem: descubra o jogo apenas pelas pistas.'},
    dragonball:{image:'Qual personagem de Dragon Ball está escondido?',ability:'Quem usa esta técnica, poder ou transformação?',origin:'Qual personagem corresponde a esta raça, planeta ou origem?',group:'Quem pertence a este grupo, família ou exército?',era:'Quem aparece nesta saga de Dragon Ball?',role:'Qual personagem exerce este papel?',dossier:'Saga, poder e origem: quem é?',blind:'Sem imagem: quem é o personagem de Dragon Ball?'},
    naruto:{image:'Qual ninja está escondido?',ability:'Quem usa este jutsu, modo ou kekkei genkai?',origin:'Qual ninja vem desta vila, clã ou nação?',group:'Quem faz parte deste time, clã ou organização?',era:'Quem aparece nesta fase de Naruto?',role:'Qual ninja ocupa esta função ou patente?',dossier:'Jutsu, vila e afiliação: quem é?',blind:'Sem imagem: descubra o shinobi pelas pistas.'},
    yugioh:{image:'Qual duelista está escondido?',ability:'Quem é associado a este deck, carta ou estilo?',origin:'Qual duelista combina com esta academia ou origem?',group:'Quem pertence a este grupo ou escola?',era:'Quem duelou nesta geração?',role:'Qual duelista exerce este papel?',dossier:'Geração, deck e perfil: quem é?',blind:'Sem imagem: quem é o duelista?'},
    saintseiya:{image:'Qual guerreiro do Cosmo está escondido?',ability:'De quem é esta técnica?',origin:'Quem vem deste reino, exército ou origem?',group:'Quem pertence a esta ordem ou exército?',era:'Quem aparece nesta saga?',role:'Qual personagem corresponde a esta armadura ou classe?',dossier:'Armadura, técnica e saga: quem é?',blind:'Sem imagem: eleve o Cosmo e descubra.'},
    pokemon:{image:'Qual Pokémon está escondido?',ability:'Qual Pokémon possui estas habilidades?',origin:'Qual Pokémon corresponde a este tipo/perfil?',group:'Use tipo e características para descobrir o Pokémon.',era:'De qual geração é este Pokémon? Agora diga quem é.',role:'Qual Pokémon corresponde a estes tipos?',dossier:'Tipo, geração e corpo: qual é o Pokémon?',blind:'Sem arte: qual Pokémon é descrito pelas pistas?'},
    digimon:{image:'Qual Digimon está escondido?',ability:'Qual Digimon possui estas habilidades?',origin:'Qual Digimon corresponde a este atributo?',group:'Nível, tipo e atributo: qual é o Digimon?',era:'Qual Digimon está neste nível evolutivo?',role:'Qual Digimon corresponde a este nível/tipo?',dossier:'Nível, atributo e habilidade: quem é?',blind:'Sem imagem: descubra o Digimon.'},
    lol:{image:'Qual campeão está na splash art?',ability:'Que campeão combina com este estilo de combate?',origin:'Qual campeão combina com esta origem/perfil?',group:'Qual campeão pertence a esta função?',era:'Qual campeão combina com este perfil?',role:'Quem joga nesta função?',dossier:'Função, título e atributos: qual é o campeão?',blind:'Sem splash art: qual é o campeão?'},
    cartoons:{image:'Qual personagem clássico está escondido?',ability:'Quem combina com esta característica marcante?',origin:'De qual desenho ou universo vem este personagem?',group:'Quem faz parte deste desenho ou grupo?',era:'Quem marcou esta época da TV?',role:'Qual personagem exerce este papel?',dossier:'Desenho, época e característica: quem é?',blind:'Sem imagem: descubra o personagem clássico.'},
    globinho:{image:'Quem aparecia nas manhãs da TV Globinho?',ability:'Qual personagem combina com esta característica?',origin:'De qual atração da TV Globinho vem este personagem?',group:'Quem fazia parte deste desenho ou grupo?',era:'Quem marcou esta fase da TV Globinho?',role:'Qual personagem corresponde a este papel?',dossier:'Programa, época e característica: quem é?',blind:'Sem imagem: quanto você lembra da TV Globinho?'},
    random:{image:'Quem caiu no Multiverso?',ability:'Quem combina com esta habilidade ou característica?',origin:'De quem é esta origem?',group:'Quem pertence a este grupo?',era:'Quem se encaixa nesta saga ou época?',role:'Quem corresponde a este papel?',dossier:'Cruze as pistas e descubra.',blind:'Sem imagem: descubra apenas pelas pistas.'}
  };

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');}
  function lev(a,b){const m=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=m[0];m[0]=i;for(let j=1;j<=b.length;j++){const t=m[j];m[j]=Math.min(m[j]+1,m[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=t}}return m[b.length]}
  function isCorrect(raw,q){const n=norm(raw);if(!n)return false;return [q.name,...(q.aliases||[])].map(norm).some(a=>n===a||(Math.min(n.length,a.length)>=5&&1-lev(n,a)/Math.max(n.length,a.length)>=.9));}
  function show(id){CORE()?.showScreen?.(id);window.scrollTo({top:0,behavior:'smooth'});}
  function toast(a,b,t=''){CORE()?.toast?.(a,b,t);}
  function user(){return FB()?.getUser?.()||null;}
  function playerList(r=room){return r?Object.values(r.players||{}):[];}
  function me(r=room){const u=user();return u&&r?.players?.[u.uid]||null;}
  function rival(r=room){const u=user();return playerList(r).find(p=>p.uid!==u?.uid)||null;}
  function realUniverse(q){return q?.universe||q?.meta?.universeKey||room?.config?.universe||'random';}
  function duelUsesLives(r=room){const d=r?.config?.difficulty||'normal';return d==='hard'||d==='insane'}
  function duelChanceLeft(p){return Math.max(0,3-Number(p?.roundWrong||0))}
  function questionPrompt(q){const u=realUniverse(q),ch=q?.challenge||'image';return PROMPTS[u]?.[ch]||PROMPTS.random[ch]||'Descubra antes do seu rival.';}
  function clueFor(q,kind){return (q?.clues||[]).find(c=>c.kind===kind)||null;}
  function pick(a){return a[Math.floor(Math.random()*a.length)];}
  function resolveChallenge(item,wanted){
    if(wanted&&wanted!=='random')return wanted;
    const kinds=new Set((item.clues||[]).map(c=>c.kind));const pool=['image','dossier','blind'];
    if(kinds.has('ability'))pool.push('ability');if(kinds.has('origin'))pool.push('origin');if(kinds.has('group'))pool.push('group');if(kinds.has('era'))pool.push('era');if(kinds.has('role')||kinds.has('armor'))pool.push('role');
    return pick(pool);
  }
  function primaryClues(q){
    const ch=q.challenge||'image', cs=q.clues||[];let out=[];
    const by=k=>cs.find(c=>c.kind===k);
    if(ch==='ability')out=[by('ability')||cs[0]];
    else if(ch==='origin')out=[by('origin')||by('group')||cs[0]];
    else if(ch==='group')out=[by('group')||by('origin')||cs[0]];
    else if(ch==='era')out=[by('era')||cs[0]];
    else if(ch==='role')out=[by('role')||by('armor')||cs[0]];
    else if(ch==='dossier')out=cs.filter(Boolean).slice(0,2);
    else if(ch==='blind')out=cs.filter(Boolean).slice(0,1);
    return out.filter(Boolean);
  }

  function igdbImg(img,size='screenshot_big'){const id=img?.image_id;if(id)return `/api/image?id=${encodeURIComponent(id)}&size=${size}`;return '';}
  function gameToQuestion(g){
    const plats=(g.platforms||[]).map(x=>x.name).filter(Boolean),genres=(g.genres||[]).map(x=>x.name).filter(Boolean),themes=(g.themes||[]).map(x=>x.name).filter(Boolean);
    const year=g.first_release_date?new Date(g.first_release_date*1000).getUTCFullYear():null;
    const dev=(g.involved_companies||[]).filter(x=>x.developer).map(x=>x.company?.name).filter(Boolean);
    const clues=[
      plats.length&&{kind:'group',label:'🎮 Plataforma',text:plats.slice(0,4).join(' • ')},
      genres.length&&{kind:'role',label:'🎭 Gênero',text:genres.slice(0,3).join(' • ')},
      year&&{kind:'era',label:'📅 Lançamento',text:`Lançado por volta de ${year}.`},
      dev.length&&{kind:'origin',label:'🏢 Estúdio',text:dev.slice(0,2).join(' • ')},
      themes.length&&{kind:'ability',label:'🌌 Tema/experiência',text:themes.slice(0,3).join(' • ')}
    ].filter(Boolean);
    return {id:`game:${g.id}`,name:g.name,aliases:[],image:igdbImg((g.screenshots||[])[0])||igdbImg(g.cover,'cover_big_2x'),source:'IGDB',universe:'games',clues,result:[plats[0]||'',year?String(year):'',genres[0]||''].filter(Boolean)};
  }
  function universeToQuestion(x,universe){return {id:x.id,name:x.name,aliases:x.aliases||[],image:x.image||'',source:x.source||UNIVERSE_LABELS[universe],universe:x.meta?.universeKey||universe,meta:x.meta||{},clues:(x.clues||[]).slice(0,8),result:(x.result||[]).slice(0,6)};}

  async function fetchQuestions(config){
    const universe=config.universe;
    if(universe==='games'){
      const ids=[7,8,9,48,167,11,12,49,169,6,18,19,4,21,5,41,130];
      const r=await fetch('/api/igdb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'session',platformIds:ids,startYear:1985,endYear:new Date().getFullYear()+1,category:'all',limit:32})});const d=await r.json();if(!r.ok)throw new Error(d.error||'IGDB indisponível.');
      return (d.games||[]).slice(0,22).map(gameToQuestion);
    }
    const r=await fetch('/api/universe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({universe,filter:'all',limit:30})});const d=await r.json();if(!r.ok)throw new Error(d.detail||d.error||'Universo indisponível.');
    return (d.items||[]).map(x=>universeToQuestion(x,universe));
  }

  async function buildRoomQuestions(config){
    const base=await fetchQuestions(config);if(base.length<5)throw new Error('Poucas perguntas disponíveis para este duelo.');
    for(let i=base.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[base[i],base[j]]=[base[j],base[i]];}
    return base.slice(0,Math.min(TOTAL_ROUNDS,base.length)).map(q=>({...q,challenge:resolveChallenge(q,config.challenge)}));
  }

  async function openLobby(){
    show('duelLobbyScreen');$('duelRoomWaiting')?.classList.add('hidden');
    if(!FB()?.configured){toast('Firebase precisa ser configurado','Siga o arquivo FIREBASE-SETUP.md para ativar contas e duelos.','error');}
  }
  async function createRoom(){
    if(!user())return FB()?.openAuth?.('login');
    const config={universe:$('duelUniverseSelect').value,difficulty:$('duelDifficultySelect').value,challenge:$('duelChallengeSelect').value,rounds:TOTAL_ROUNDS};
    const btn=$('createDuelButton');btn.disabled=true;btn.textContent='PREPARANDO PERGUNTAS...';
    try{
      const questions=await buildRoomQuestions(config);roomCode=await FB().createDuelRoom({config,questions});localStorage.setItem('gameGuessLastDuel',roomCode);
      $('duelRoomWaiting').classList.remove('hidden');$('duelRoomCode').textContent=roomCode;$('duelWaitingTitle').textContent='Esperando adversário...';$('duelWaitingText').textContent=`${UNIVERSE_LABELS[config.universe]} • ${questions.length} rodadas • ${['hard','insane'].includes(config.difficulty)?'3 vidas':'3 tentativas por rodada'}`;
      watch(roomCode);
    }catch(e){toast('Não consegui criar a sala',e.message,'error');}finally{btn.disabled=false;btn.textContent='CRIAR SALA';}
  }
  async function joinRoom(){
    if(!user())return FB()?.openAuth?.('login');const code=$('joinDuelCode').value.trim().toUpperCase();
    try{roomCode=await FB().joinDuelRoom(code);localStorage.setItem('gameGuessLastDuel',roomCode);watch(roomCode);toast('Sala encontrada','Conectando ao adversário...');}catch(e){toast('Não consegui entrar',e.message,'error');}
  }

  function watch(code){
    unsub?.();unsub=FB().watchDuel(code,(data,error)=>{if(error)return toast('Duelo desconectado',error.message,'error');if(!data)return;room=data;renderRoom();hostControl();});
  }

  function renderRoom(){
    const u=user();if(!u||!room)return;
    if(room.status==='waiting'){
      show('duelLobbyScreen');$('duelRoomWaiting').classList.remove('hidden');$('duelRoomCode').textContent=room.code||roomCode;$('duelWaitingTitle').textContent='Esperando adversário...';return;
    }
    if(room.status==='finished')return showFinal();
    show('duelGameScreen');
    const mine=me(),other=rival(),idx=Number(room.roundIndex||0),q=room.questions?.[idx];if(!q)return;
    $('duelRoomBadge').textContent=`SALA ${room.code||roomCode}`;$('duelRoundCounter').textContent=`RODADA ${idx+1} / ${room.questions.length}`;$('duelChallengeBadge').textContent=CH_LABELS[q.challenge]||q.challenge;
    $('duelMeName').textContent=mine?.name||'Você';$('duelMeScore').textContent=`${mine?.correct||0} acertos • ${mine?.score||0} pts`;$('duelMeLives').textContent=duelUsesLives()?'❤️'.repeat(mine?.lives||0)+'🖤'.repeat(Math.max(0,3-(mine?.lives||0))):`🎯 ${duelChanceLeft(mine)} chances`; 
    $('duelRivalName').textContent=other?.name||'Aguardando...';$('duelRivalScore').textContent=`${other?.correct||0} acertos • ${other?.score||0} pts`;$('duelRivalLives').textContent=duelUsesLives()?'❤️'.repeat(other?.lives||0)+'🖤'.repeat(Math.max(0,3-(other?.lives||0))):`🎯 ${duelChanceLeft(other)} chances`; 
    if(idx!==renderedRound){renderedRound=idx;hintsUsed=0;localWrong=0;renderQuestion(q);}
    const solved=Boolean(mine?.roundSolved),eliminated=duelUsesLives()&&(mine?.lives||0)<=0;$('duelGuessInput').disabled=solved||eliminated;$('duelGuessButton').disabled=solved||eliminated;$('duelSkipButton').disabled=solved||eliminated;
    $('duelWaitOpponent').classList.toggle('hidden',!solved);if(solved)$('duelFeedback').textContent='✅ Resposta registrada. O rival ainda está jogando esta rodada.';
    startClock();
  }

  async function probe(url){if(!url)return false;try{const r=await fetch(url,{method:'HEAD',cache:'force-cache'});return r.ok&&r.headers.get('X-GameGuess-Fallback')!=='1';}catch{return false;}}
  async function renderQuestion(q){
    $('duelQuestionEyebrow').textContent=`${UNIVERSE_LABELS[realUniverse(q)]||'🌌 MULTIVERSO'} • ${CH_LABELS[q.challenge]||''}`;
    $('duelQuestionTitle').textContent=questionPrompt(q);$('duelQuestionSource').textContent=q.source||UNIVERSE_LABELS[realUniverse(q)]||'MULTIVERSO';
    $('duelGuessInput').value='';$('duelFeedback').textContent=duelUsesLives()?'Cada resposta errada enviada custa 1 vida.':'Fácil/Normal: cada erro gasta uma das 3 tentativas da rodada, sem corações.';$('duelWaitOpponent').classList.add('hidden');
    const img=$('duelQuestionImage'),cover=$('duelImageCover');const imageAllowed=q.challenge!=='blind'&&await probe(q.image);
    img.classList.toggle('hidden',!imageAllowed);cover.classList.toggle('hidden',imageAllowed);if(imageAllowed){img.src=q.image;img.classList.toggle('silhouette',q.challenge==='silhouette');}else{cover.innerHTML=q.challenge==='blind'?'🧠<span>DESAFIO SÓ POR PISTAS</span>':'🧠<span>IMAGEM INDISPONÍVEL • USE AS PISTAS</span>';}
    const primary=primaryClues(q);$('duelPrimaryHint').innerHTML=primary.length?primary.map(c=>`<strong>${esc(c.label)}</strong> ${esc(c.text)}`).join('<hr>'):'<strong>🧩 Sem pista inicial.</strong> Use os botões abaixo.';
    const used=new Set(primary.map(c=>c.label));const box=$('duelHints');box.innerHTML='';(q.clues||[]).filter(c=>!used.has(c.label)&&c.kind!=='name').slice(0,5).forEach(c=>{const b=document.createElement('button');b.className='hint-btn';b.innerHTML=`<span>💡</span>${esc(c.label.replace(/^\S+\s*/,''))}`;b.onclick=()=>{if(b.disabled)return;b.disabled=true;hintsUsed++;const d=document.createElement('div');d.className='duel-extra-hint';d.innerHTML=`<strong>${esc(c.label)}</strong> ${esc(c.text)}`;$('duelPrimaryHint').appendChild(d);};box.appendChild(b);});
    setTimeout(()=>$('duelGuessInput')?.focus(),80);
  }

  function pointsForCorrect(){const d=room?.config?.difficulty||'normal';return Math.max(150,Math.round((900-hintsUsed*90-localWrong*140)*(DIFF_MULT[d]||1)));}
  async function submit(rawOverride=null,skip=false){
    if(isSubmitting||!room||room.status!=='playing')return;const mine=me();if(!mine||mine.roundSolved||(duelUsesLives()&&mine.lives<=0))return;
    const q=room.questions?.[room.roundIndex];if(!q)return;const raw=skip?'[PULOU]':String(rawOverride??$('duelGuessInput').value).trim();if(!skip&&raw.length<1)return;
    const correct=!skip&&isCorrect(raw,q);isSubmitting=true;
    try{
      const idx=Number(room.roundIndex||0),pts=correct?pointsForCorrect():0;
      const result=await FB().mutateDuel(roomCode,(r,uid)=>{
        if(r.status!=='playing'||Number(r.roundIndex)!==idx)return r;const p=r.players?.[uid];if(!p||p.roundSolved||(duelUsesLives(r)&&p.lives<=0))return r;
        if(correct){p.correct=(p.correct||0)+1;p.score=(p.score||0)+pts;p.roundSolved=true;p.lastRound=idx;r.lastEvent={uid,type:'correct',at:Date.now(),round:idx};}
        else{p.wrong=(p.wrong||0)+1;p.roundWrong=Number(p.roundWrong||0)+1;const withLives=duelUsesLives(r);if(withLives)p.lives=Math.max(0,(p.lives||0)-1);if(skip||(!withLives&&p.roundWrong>=3))p.roundSolved=true;r.lastEvent={uid,type:skip?'skip':'wrong',at:Date.now(),round:idx};if(withLives&&p.lives<=0)p.eliminated=true;}
        return r;
      });
      if(!result.committed)return;
      if(correct){CORE()?.playSound?.('win');CORE()?.spawnConfetti?.();$('duelFeedback').innerHTML=`✅ <strong>ACERTOU!</strong> +${pts} pontos. Esperando o rival...`;}
      else{localWrong++;CORE()?.playSound?.('error');$('duelFeedback').innerHTML=duelUsesLives()?`❌ ${skip?'Você pulou.':'Resposta incorreta.'} <strong>-1 ❤️</strong>`:`❌ ${skip?'Você pulou a rodada.':'Resposta incorreta.'} ${skip?'':`Restam ${Math.max(0,3-localWrong)} tentativa(s).`}`;$('duelGuessInput').value='';}
    }catch(e){toast('Falha ao enviar',e.message,'error');}finally{isSubmitting=false;}
  }

  function winnerOf(r){const ps=playerList(r);if(ps.length<2)return ps[0]?.uid||'';const [a,b]=ps;const score=p=>duelUsesLives(r)?[p.correct||0,p.lives||0,p.score||0]:[p.correct||0,p.score||0];const A=score(a),B=score(b);for(let i=0;i<A.length;i++){if(A[i]>B[i])return a.uid;if(B[i]>A[i])return b.uid;}return 'tie';}
  function finalizeMutable(r,reason='complete'){r.status='finished';r.finishedAt=Date.now();r.finishReason=reason;r.winnerUid=winnerOf(r);return r;}

  function hostControl(){
    const u=user();if(!u||!room||room.hostUid!==u.uid||room.status!=='playing')return;const ps=playerList();if(ps.length<2)return;
    if(duelUsesLives()&&ps.some(p=>(p.lives||0)<=0)){FB().mutateDuel(roomCode,r=>r.status==='playing'?finalizeMutable(r,'lives'):r);return;}
    if(ps.every(p=>p.roundSolved)){
      clearTimeout(advanceTimer);const expected=Number(room.roundIndex||0);advanceTimer=setTimeout(()=>FB().mutateDuel(roomCode,r=>{
        if(r.status!=='playing'||Number(r.roundIndex)!==expected)return r;const players=Object.values(r.players||{});if(!players.every(p=>p.roundSolved))return r;
        if(expected+1>=(r.questions||[]).length)return finalizeMutable(r,'rounds');r.roundIndex=expected+1;r.roundDeadline=Date.now()+ROUND_SECONDS*1000;for(const p of players){p.roundSolved=false;p.roundWrong=0;p.lastRound=expected;}r.lastEvent={type:'next',round:r.roundIndex,at:Date.now()};return r;
      }),850);
    }
  }

  function startClock(){
    if(clock)return;clock=setInterval(()=>{
      if(!room||room.status!=='playing')return;const left=Math.max(0,Math.ceil(((room.roundDeadline||0)-Date.now())/1000));$('duelConnection').textContent=`⏱️ ${left}s • 🟢 Online`;
      const u=user();if(left<=0&&u&&room.hostUid===u.uid){const expected=Number(room.roundIndex||0);FB().mutateDuel(roomCode,r=>{
        if(r.status!=='playing'||Number(r.roundIndex)!==expected||r.timeoutRound===expected)return r;r.timeoutRound=expected;const ps=Object.values(r.players||{});for(const p of ps){if(!p.roundSolved&&(!duelUsesLives(r)||p.lives>0)){if(duelUsesLives(r))p.lives=Math.max(0,p.lives-1);p.roundSolved=true;p.roundWrong=Number(p.roundWrong||0)+1;p.wrong=(p.wrong||0)+1;}}r.lastEvent={type:'timeout',round:expected,at:Date.now()};if(duelUsesLives(r)&&ps.some(p=>p.lives<=0))return finalizeMutable(r,'lives');return r;
      });}
    },350);
  }

  function recordResult(){
    if(!room||!user())return;const key=`gameGuessDuelRecorded:${room.code||roomCode}:${user().uid}`;if(localStorage.getItem(key))return;localStorage.setItem(key,'1');
    const p=CORE()?.getProfile?.()||{};p.duelPlayed=Number(p.duelPlayed||0)+1;const mine=me(),winner=room.winnerUid;if(winner===user().uid)p.duelWins=Number(p.duelWins||0)+1;else if(winner!=='tie')p.duelLosses=Number(p.duelLosses||0)+1;p.duelBestScore=Math.max(Number(p.duelBestScore||0),Number(mine?.score||0));CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);
  }

  function showFinal(){
    clearInterval(clock);clock=null;recordResult();const mine=me(),other=rival(),winner=room.winnerUid,isTie=winner==='tie',won=winner===user()?.uid;
    $('duelResultIcon').textContent=isTie?'🤝':won?'🏆':'💔';$('duelResultTitle').textContent=isTie?'Empate!':won?'Você venceu!':'Seu rival venceu';
    $('duelFinalScore').innerHTML=`<div><b>${esc(mine?.name||'Você')}</b><strong>${mine?.correct||0}</strong><span>acertos • ${duelUsesLives()?`${mine?.lives||0} ❤️ • `:''}${mine?.score||0} pts</span></div><div class="duel-final-vs">X</div><div><b>${esc(other?.name||'Rival')}</b><strong>${other?.correct||0}</strong><span>acertos • ${duelUsesLives()?`${other?.lives||0} ❤️ • `:''}${other?.score||0} pts</span></div>`;
    $('duelResultMessage').innerHTML=room.finishReason==='lives'?'O duelo terminou porque um jogador perdeu as 3 vidas.':(duelUsesLives()?'As rodadas terminaram; o desempate considera acertos, vidas e pontuação.':'As rodadas terminaram; no Fácil/Normal o desempate considera acertos e pontuação.');
    const ov=$('duelResultOverlay');ov.classList.add('active');ov.setAttribute('aria-hidden','false');
  }

  async function quit(){
    if(!roomCode){show('homeScreen');return;}const u=user();
    if(room?.status==='waiting'&&room?.hostUid===u?.uid){await FB().deleteDuel(roomCode).catch(()=>{});cleanup();show('homeScreen');return;}
    if(room?.status==='playing')await FB().mutateDuel(roomCode,(r,uid)=>{if(r.status!=='playing')return r;const other=Object.values(r.players||{}).find(p=>p.uid!==uid);r.status='finished';r.finishReason='abandon';r.winnerUid=other?.uid||'tie';r.finishedAt=Date.now();return r;}).catch(()=>{});
    cleanup();show('homeScreen');
  }
  function cleanup(){unsub?.();unsub=null;clearInterval(clock);clock=null;clearTimeout(advanceTimer);advanceTimer=null;room=null;roomCode='';renderedRound=-1;}

  function bind(){
    $('duelButton')?.addEventListener('click',openLobby);$('homeDuelButton')?.addEventListener('click',openLobby);$('duelBackButton')?.addEventListener('click',()=>{cleanup();show('homeScreen')});
    $('createDuelButton')?.addEventListener('click',createRoom);$('joinDuelButton')?.addEventListener('click',joinRoom);$('joinDuelCode')?.addEventListener('input',e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6));
    $('copyDuelCode')?.addEventListener('click',()=>navigator.clipboard?.writeText(roomCode).then(()=>toast('Código copiado',roomCode)));
    $('duelGuessButton')?.addEventListener('click',()=>submit());$('duelGuessInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')submit()});$('duelSkipButton')?.addEventListener('click',()=>submit(null,true));$('duelQuitButton')?.addEventListener('click',quit);
    $('duelHomeButton')?.addEventListener('click',()=>{document.getElementById('duelResultOverlay')?.classList.remove('active');cleanup();show('homeScreen')});$('duelRematchButton')?.addEventListener('click',()=>{document.getElementById('duelResultOverlay')?.classList.remove('active');cleanup();openLobby()});
    window.addEventListener('gameguess:authchange',e=>{if(!e.detail?.user&&roomCode){cleanup();show('homeScreen')}});
  }
  window.GameGuessDuel={open:openLobby};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
