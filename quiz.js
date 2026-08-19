(() => {
  'use strict';
  const $=id=>document.getElementById(id), CORE=()=>window.GameGuessCore, BANK=()=>window.GameGuessQuizBank;
  const PROFILE_KEY='gameGuessArcadeV4';
  const DIFF={easy:{label:'Fácil',icon:'🌱',seconds:25,mult:.9},normal:{label:'Normal',icon:'🎯',seconds:20,mult:1},hard:{label:'Difícil',icon:'🔥',seconds:15,mult:1.25}};
  let config={category:'random',difficulty:'normal',count:10};
  let state=null,timer=null,loading=false;
  function readProfile(){try{return CORE()?.getProfile?.()||JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}catch{return {}}}
  function saveProfile(p){CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();window.GameGuessFirebase?.syncLocalProfile?.(p);}
  function show(id){CORE()?.showScreen?.(id)}
  function meta(cat){return cat==='random'?{icon:'🎲',title:'Aleatório'}:(BANK()?.categories?.[cat]||{icon:'🧠',title:cat})}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function renderSetup(){
    const cats=$('quizCategoryChoices'),diffs=$('quizDifficultyChoices');
    if(cats){cats.innerHTML=`<button class="quiz-choice${config.category==='random'?' active':''}" data-quiz-category="random"><span>🎲</span><b>Aleatório</b><small>Mistura todas</small></button>`+Object.entries(BANK()?.categories||{}).map(([k,v])=>`<button class="quiz-choice${config.category===k?' active':''}" data-quiz-category="${k}"><span>${v.icon}</span><b>${esc(v.title)}</b><small>Categoria</small></button>`).join('');}
    if(diffs){diffs.innerHTML=Object.entries(DIFF).map(([k,v])=>`<button class="quiz-choice${config.difficulty===k?' active':''}" data-quiz-difficulty="${k}"><span>${v.icon}</span><b>${v.label}</b><small>${v.seconds}s por pergunta</small></button>`).join('');}
    if($('quizQuestionCount')){
      const sel=$('quizQuestionCount');
      const values=[5,10,15,20];
      if(!values.includes(config.count))config.count=config.category==='random'?10:10;
      sel.innerHTML=values.map(v=>`<option value="${v}">${v} perguntas</option>`).join('');
      sel.value=String(config.count);
    }
    updateSetupSummary();
  }
  function updateSetupSummary(){const c=meta(config.category),d=DIFF[config.difficulty];if($('quizSetupSummary'))$('quizSetupSummary').innerHTML=`<div><span>Categoria</span><b>${c.icon} ${esc(c.title)}</b></div><div><span>Dificuldade</span><b>${d.icon} ${d.label}</b></div><div><span>Perguntas</span><b>${config.count}</b></div><div><span>Tempo</span><b>${d.seconds}s por rodada</b></div>`;}
  function openSetup(){if(!BANK())return CORE()?.toast?.('Quiz ainda carregando','Tente novamente em um instante.');renderSetup();show('quizSetupScreen');}
  async function start(){
    if(loading)return;const bank=BANK();if(!bank)return CORE()?.toast?.('Quiz ainda carregando','Tente novamente em um instante.');
    loading=true;const btn=$('quizStartButton'),again=$('quizResultAgain');
    if(btn){btn.disabled=true;btn.dataset.old=btn.textContent;btn.textContent='BUSCANDO PERGUNTAS NOVAS...';}
    if(again){again.disabled=true;}
    try{
      const questions=bank.fetchQuestions?await bank.fetchQuestions({category:config.category,count:config.count,difficulty:config.difficulty}):bank.getQuestions({category:config.category,count:config.count});
      if(!Array.isArray(questions)||questions.length<5)throw new Error('Não consegui preparar perguntas suficientes agora.');
      state={questions,index:0,score:0,correct:0,wrong:0,streak:0,bestStreak:0,answered:false,startedAt:Date.now(),deadline:0};
      show('quizGameScreen');loadQuestion();
    }catch(e){CORE()?.toast?.('Quiz indisponível',e.message||'Tente novamente.','error');}
    finally{loading=false;if(btn){btn.disabled=false;btn.textContent=btn.dataset.old||'COMEÇAR QUIZ ▶';}if(again)again.disabled=false;}
  }
  function clearTimer(){if(timer){clearInterval(timer);timer=null}}
  function current(){return state?.questions?.[state.index]}
  function loadQuestion(){
    clearTimer();if(!state||state.index>=state.questions.length)return finish();
    state.answered=false;const q=current(),m=meta(q.category),d=DIFF[config.difficulty];
    if($('quizRound'))$('quizRound').textContent=`${state.index+1} / ${state.questions.length}`;
    if($('quizScore'))$('quizScore').textContent=state.score;
    if($('quizStreak'))$('quizStreak').textContent=`🔥 ${state.streak}`;
    if($('quizCategoryBadge'))$('quizCategoryBadge').textContent=`${m.icon} ${m.title}`;
    if($('quizQuestion'))$('quizQuestion').textContent=q.question;
    const opts=$('quizOptions');if(opts){opts.innerHTML=q.options.map((o,i)=>`<button class="quiz-option" data-answer="${esc(o)}"><span>${String.fromCharCode(65+i)}</span><b>${esc(o)}</b></button>`).join('');}
    if($('quizFeedback')){$('quizFeedback').className='quiz-feedback';$('quizFeedback').textContent='Escolha uma alternativa antes que o tempo acabe.';}
    state.deadline=Date.now()+d.seconds*1000;updateClock();timer=setInterval(updateClock,200);
  }
  function updateClock(){if(!state)return;const left=Math.max(0,Math.ceil((state.deadline-Date.now())/1000));if($('quizTimer'))$('quizTimer').textContent=`⏱️ ${left}`;if(left<=0&&!state.answered)answer(null,true);}
  function points(left){const d=DIFF[config.difficulty];return Math.max(100,Math.round((350+left*18+state.streak*25)*d.mult));}
  function answer(raw,timeout=false){
    if(!state||state.answered)return;state.answered=true;clearTimer();const q=current();const correct=raw===q.correct;const left=Math.max(0,Math.ceil((state.deadline-Date.now())/1000));
    document.querySelectorAll('#quizOptions .quiz-option').forEach(b=>{b.disabled=true;const val=b.dataset.answer;if(val===q.correct)b.classList.add('correct');else if(raw&&val===raw)b.classList.add('wrong');});
    if(correct){const pts=points(left);state.score+=pts;state.correct++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);CORE()?.playSound?.('win');if($('quizFeedback')){$('quizFeedback').className='quiz-feedback success';$('quizFeedback').innerHTML=`✅ Correto! <strong>+${pts} pontos</strong>`;}}
    else{state.wrong++;state.streak=0;CORE()?.playSound?.('error');if($('quizFeedback')){$('quizFeedback').className='quiz-feedback error';$('quizFeedback').innerHTML=timeout?`⏱️ Tempo esgotado. Resposta: <strong>${esc(q.correct)}</strong>`:`❌ Resposta errada. Correta: <strong>${esc(q.correct)}</strong>`;}}
    if($('quizScore'))$('quizScore').textContent=state.score;if($('quizStreak'))$('quizStreak').textContent=`🔥 ${state.streak}`;
    setTimeout(()=>{state.index++;loadQuestion();},1250);
  }
  function finish(){
    clearTimer();if(!state)return;const p=readProfile(),won=state.correct>=Math.ceil(state.questions.length*.6),cat=meta(config.category);
    p.gamesPlayed=Number(p.gamesPlayed||0)+1;if(won)p.gamesWon=Number(p.gamesWon||0)+1;p.highScore=Math.max(Number(p.highScore||0),state.score);p.bestStreak=Math.max(Number(p.bestStreak||0),state.bestStreak);p.modeWins={...(p.modeWins||{})};if(won)p.modeWins.quiz=Number(p.modeWins.quiz||0)+1;p.multiverseWins={...(p.multiverseWins||{})};if(won)p.multiverseWins.quiz=Number(p.multiverseWins.quiz||0)+1;
    window.GameGuessRanked?.record?.(p,{kind:'quiz',score:state.score,mode:'quiz',universe:'quiz',challenge:config.category==='random'?'misto':config.category,difficulty:config.difficulty,correct:state.correct,wrong:state.wrong,won});saveProfile(p);
    if(won)CORE()?.spawnConfetti?.();
    if($('quizResultTitle'))$('quizResultTitle').textContent=won?'Mandou bem!':'Fim do Quiz';
    if($('quizResultScore'))$('quizResultScore').textContent=`${state.score} pts`;
    if($('quizResultStats'))$('quizResultStats').innerHTML=`<div><span>✅ Acertos</span><b>${state.correct}/${state.questions.length}</b></div><div><span>🎯 Aproveitamento</span><b>${Math.round(state.correct/state.questions.length*100)}%</b></div><div><span>🔥 Sequência</span><b>${state.bestStreak}</b></div><div><span>📚 Categoria</span><b>${cat.icon} ${esc(cat.title)}</b></div>`;
    $('quizResultOverlay')?.classList.add('active');$('quizResultOverlay')?.setAttribute('aria-hidden','false');
  }
  function closeResult(){$('quizResultOverlay')?.classList.remove('active');$('quizResultOverlay')?.setAttribute('aria-hidden','true');}
  function openArena(){window.GameGuessDuel?.open?.();setTimeout(()=>{const u=$('duelUniverseSelect');if(u){u.value='quiz';u.dispatchEvent(new Event('change'));}},80);}
  function bind(){
    $('homeQuizButton')?.addEventListener('click',openSetup);$('homeQuizArenaButton')?.addEventListener('click',openArena);$('quizBackButton')?.addEventListener('click',()=>show('homeScreen'));$('quizQuitButton')?.addEventListener('click',()=>{clearTimer();show('homeScreen');});$('quizStartButton')?.addEventListener('click',start);
    $('quizCategoryChoices')?.addEventListener('click',e=>{const b=e.target.closest('[data-quiz-category]');if(!b)return;config.category=b.dataset.quizCategory;renderSetup();});
    $('quizDifficultyChoices')?.addEventListener('click',e=>{const b=e.target.closest('[data-quiz-difficulty]');if(!b)return;config.difficulty=b.dataset.quizDifficulty;renderSetup();});
    $('quizQuestionCount')?.addEventListener('change',e=>{config.count=Math.max(5,Math.min(20,Number(e.target.value)||10));updateSetupSummary();});
    $('quizOptions')?.addEventListener('click',e=>{const b=e.target.closest('.quiz-option');if(!b||b.disabled)return;answer(b.dataset.answer,false);});
    $('quizResultAgain')?.addEventListener('click',()=>{closeResult();start();});$('quizResultHome')?.addEventListener('click',()=>{closeResult();show('homeScreen');});
  }
  window.GameGuessQuiz={open:openSetup,start};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
