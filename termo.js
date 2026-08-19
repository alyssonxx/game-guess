(() => {
  'use strict';
  const $=id=>document.getElementById(id), CORE=()=>window.GameGuessCore;
  const PROFILE_KEY='gameGuessArcadeV4', WORD_API='/api/word';
  const SOLUTIONS=["abafo", "abalo", "abano", "abate", "abeto", "abrir", "abril", "abuso", "acaso", "aceno", "aceso", "achar", "acima", "adega", "adeus", "adiar", "adubo", "afeto", "afiar", "agora", "agudo", "ainda", "alado", "algas", "algoz", "altar", "aluno", "amada", "amado", "amora", "andar", "anexo", "animo", "antes", "apelo", "apoio", "apito", "areia", "arfar", "arame", "arcar", "arder", "ardor", "aroma", "arroz", "astro", "atado", "ativo", "autor", "aviso", "aviao", "azedo", "babar", "bacia", "balao", "balde", "banco", "banda", "banho", "barba", "barco", "barro", "basta", "bater", "beber", "beijo", "berro", "bicho", "bloco", "bolsa", "bomba", "borda", "botao", "brasa", "bravo", "breve", "briga", "brisa", "broto", "busca", "caber", "cabra", "cacho", "caixa", "calor", "campo", "canal", "canoa", "canto", "capaz", "carga", "cargo", "carne", "carro", "carta", "casco", "causa", "cavar", "cerca", "cerco", "certo", "cesto", "chave", "cheio", "chuva", "cifra", "cinco", "cinto", "civil", "claro", "clima", "clube", "cobra", "coisa", "colar", "comer", "conta", "coral", "corpo", "corte", "couro", "cravo", "credo", "crime", "cruel", "culpa", "cunha", "dados", "danca", "dente", "dever", "digno", "disco", "drama", "duelo", "duplo", "exato", "falar", "falta", "farol", "favor", "feira", "feliz", "ferir", "festa", "fibra", "ficha", "filme", "final", "firme", "folha", "fonte", "forte", "fraco", "frase", "freio", "fruta", "fugir", "fuzil", "garfo", "garra", "gasto", "geral", "girar", "globo", "golpe", "gosto", "grave", "grama", "grito", "grupo", "hotel", "humor", "icone", "idade", "ideal", "igual", "imune", "janta", "jogar", "jovem", "juros", "lapis", "largo", "laser", "lavar", "lebre", "legal", "leite", "lento", "lenda", "linha", "lista", "livro", "lugar", "lunar", "magia", "maior", "malha", "manga", "marco", "massa", "medio", "menor", "mente", "metal", "metro", "milho", "minha", "minar", "monte", "moral", "morro", "motor", "mundo", "navio", "negro", "nervo", "nivel", "ninho", "nobre", "noite", "norma", "norte", "nuvem", "oeste", "olhar", "opaco", "ordem", "outro", "pacto", "padre", "palco", "papel", "pardo", "parte", "passo", "pausa", "pegar", "peito", "peixe", "pedra", "perda", "perna", "perto", "piano", "pinga", "pires", "pista", "plano", "poder", "polvo", "pomar", "ponte", "porta", "praia", "prato", "prazo", "preco", "preso", "preta", "preto", "prima", "primo", "prova", "pulso", "queda", "radar", "raiva", "regra", "reino", "renda", "rival", "ritmo", "roupa", "saber", "sabao", "sabor", "sacar", "sagaz", "salsa", "salto", "santo", "saude", "selva", "senha", "senso", "serra", "signo", "sinal", "sitio", "sobra", "solar", "sonar", "sonho", "sorte", "suado", "subir", "sujar", "super", "surdo", "tarde", "tecla", "tempo", "tenis", "termo", "terra", "terno", "texto", "tigre", "tinta", "tocar", "tocha", "torre", "total", "trigo", "troco", "turma", "vapor", "velar", "velho", "vento", "verba", "verde", "verso", "vidro", "vigor", "vinho", "viral", "viver", "vocal", "volta", "zebra", "zelar", "zumbi", "abria", "acido", "acude", "adora", "afago", "agito", "aguar", "aliar", "amido", "amplo", "aparo", "arado", "arara", "ardil", "armar", "assim", "atear", "atrio", "baixo", "balir", "banal", "banir", "barca", "beata", "bento", "bocal", "bolha", "bolso", "brabo", "broca", "bruxa", "bucal", "cacau", "calar", "calda", "calmo", "capim", "carma", "catar", "cauda", "ceder", "celta", "censo", "cetim", "chaga", "chama", "chato", "checo", "choro", "cisco", "cisne", "citar", "coala", "cofre", "comum", "coroa", "cupom", "curva", "danar", "debil", "dedal", "denso", "dieta", "dizer", "dobra", "doido", "dorso", "dreno", "ecoar", "elite", "enjoa", "etapa", "exibe", "faixa", "fardo", "farto", "febre", "feixe", "feraz", "ferro", "fiapo", "ficar", "fogao", "folga", "forca", "forma", "forno", "fosso", "frade", "frete", "frito", "funda", "furar", "gerar", "gesto", "giria", "glote", "grato", "greve", "gruta", "haver", "heroi", "hiena", "horta", "idoso", "ileso", "impar", "jarda", "jeito", "lagar", "lagoa", "lanca", "lapso", "larva", "lazer", "leigo", "leito", "lente", "levar", "lindo", "lombo", "louco", "luzir", "macho", "macio", "magoa", "malta", "manto", "marca", "matar", "meigo", "melar", "moeda", "morto", "natal", "nevoa", "ninar", "noivo", "optar", "orgao", "pavor", "pisar", "plebe", "porao", "quase", "quilo", "rapaz", "rasgo", "relva", "rimar", "risca", "roubo", "rubro", "salao", "secar", "sedar", "selar", "serio", "setor", "sigla", "socar", "sogra", "tenso", "topar", "trair", "trama", "trapo", "trevo", "urdir", "urubu", "vadio", "vagao", "varal", "vazio", "veado", "vicio", "vinha", "viuva", "gente", "ponto", "valor"];
  const VALID_LOCAL=new Set(SOLUTIONS);
  const KEY_ROWS=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
  const rank={absent:1,present:2,correct:3};
  const MODES={
    single:{title:'Uma palavra',icon:'1️⃣',targets:1,attempts:6,scoreBase:240},
    duet:{title:'Dueto',icon:'2️⃣',targets:2,attempts:7,scoreBase:460},
    quartet:{title:'Quarteto',icon:'4️⃣',targets:4,attempts:9,scoreBase:820}
  };
  let state={mode:'single',targets:[],guesses:[],solvedAt:[],cells:Array(5).fill(''),cursor:0,ended:false,won:false,sessionScore:0,checking:false,typedPulseIndex:-1,justSolvedBoards:[]};
  let keyboardLockY=0,keyboardBodyLocked=false;
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');}
  function readProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}catch{return {}}}
  function saveProfile(p){localStorage.setItem(PROFILE_KEY,JSON.stringify(p));CORE()?.syncProfile?.();window.GameGuessFirebase?.syncLocalProfile?.(p);}
  function unlock(p,id,title,reward){p.achievements={...(p.achievements||{})};if(p.achievements[id])return;p.achievements[id]=Date.now();p.coins=Number(p.coins||0)+reward;CORE()?.toast?.('Conquista desbloqueada!',`${title} • +${reward} moedas`,'achievement');CORE()?.playSound?.('achievement');}
  function pickTargets(count){const p=readProfile(),recent=Array.isArray(p.termRecent)?p.termRecent:[],chosen=[];let pool=SOLUTIONS.filter(w=>!recent.includes(w));if(pool.length<count)pool=SOLUTIONS.slice();while(chosen.length<count&&pool.length){const i=Math.floor(Math.random()*pool.length),w=pool.splice(i,1)[0];if(!chosen.includes(w))chosen.push(w);}p.termRecent=[...chosen,...recent.filter(x=>!chosen.includes(x))].slice(0,90);saveProfile(p);return chosen.length?chosen:['termo'];}
  function evaluate(guess,target){const g=[...norm(guess)],t=[...norm(target)],status=Array(5).fill('absent'),counts={};for(let i=0;i<5;i++){if(g[i]===t[i])status[i]='correct';else counts[t[i]]=(counts[t[i]]||0)+1;}for(let i=0;i<5;i++){if(status[i]==='correct')continue;if(counts[g[i]]>0){status[i]='present';counts[g[i]]--;}}return status;}
  function activeGuess(){return state.cells.join('').toLowerCase();}
  function solvedCount(){return state.solvedAt.filter(x=>x!==null).length;}
  function modeCfg(){return MODES[state.mode]||MODES.single;}
  function nativeInput(){return $('termoNativeInput');}
  // O input nativo funciona apenas como capturador do teclado do celular.
  // A palavra real fica em state.cells, permitindo preencher qualquer casa fora de ordem.
  function syncNativeInput(){const i=nativeInput();if(!i)return;if(i.value)i.value='';}
  function isTouchDevice(){return Boolean(window.matchMedia?.('(hover:none) and (pointer:coarse)').matches || navigator.maxTouchPoints>0);}
  function lockPageForKeyboard(){
    if(!isTouchDevice()||keyboardBodyLocked)return;
    keyboardLockY=window.scrollY||window.pageYOffset||0;
    const body=document.body;
    body.dataset.ggKeyboardLock='1';
    body.style.position='fixed';
    body.style.top=`-${keyboardLockY}px`;
    body.style.left='0';
    body.style.right='0';
    body.style.width='100%';
    body.style.overflow='hidden';
    keyboardBodyLocked=true;
  }
  function unlockPageForKeyboard(){
    if(!keyboardBodyLocked)return;
    const body=document.body;
    body.style.position='';body.style.top='';body.style.left='';body.style.right='';body.style.width='';body.style.overflow='';
    delete body.dataset.ggKeyboardLock;
    keyboardBodyLocked=false;
    requestAnimationFrame(()=>window.scrollTo({top:keyboardLockY,left:0,behavior:'auto'}));
  }
  function focusNativeInput(){
    const i=nativeInput();
    if(!i||state.ended)return;
    syncNativeInput();
    lockPageForKeyboard();
    try{i.focus({preventScroll:true});}catch{try{i.focus();}catch{}}
    setTimeout(updateMobileKeyboardState,30);
  }
  function updateMobileKeyboardState(){
    const screen=$('termoScreen');
    if(!screen)return;
    const vv=window.visualViewport;
    const focused=document.activeElement===nativeInput();
    const keyboardVisible=Boolean(focused && (!vv || (window.innerHeight-vv.height)>100));
    screen.classList.toggle('native-keyboard-open',keyboardVisible);
    document.documentElement.style.setProperty('--gg-visual-height',`${Math.round(vv?.height||window.innerHeight)}px`);
    if(!focused)unlockPageForKeyboard();
  }
  function releaseNativeKeyboard(){
    try{nativeInput()?.blur();}catch{}
    $('termoScreen')?.classList.remove('native-keyboard-open');
    unlockPageForKeyboard();
  }
  function renderBoards(){
    const host=$('termoBoards');if(!host)return;
    host.innerHTML='';host.className=`termo-boards mode-${state.mode}`;const cfg=modeCfg();
    state.targets.forEach((target,b)=>{
      const solved=state.solvedAt[b]!==null,justSolved=state.justSolvedBoards.includes(b),wrap=document.createElement('section');
      wrap.className='termo-board-wrap'+(solved?' solved':'')+(justSolved?' just-solved':'');
      const head=document.createElement('div');head.className='termo-board-head';
      head.innerHTML=`<b>${cfg.targets===1?'PALAVRA':`PALAVRA ${b+1}`}</b><span>${solved?'✅ RESOLVIDA':`${cfg.attempts-state.guesses.length} tentativas`}</span>`;
      wrap.appendChild(head);
      const board=document.createElement('div');board.className='termo-board';
      for(let r=0;r<cfg.attempts;r++){
        const row=document.createElement('div');row.className='termo-row';let letters=[],statuses=[];const solvedAt=state.solvedAt[b];
        if(state.guesses[r]&&(solvedAt===null||r<=solvedAt)){
          letters=[...norm(state.guesses[r]).toUpperCase()];statuses=evaluate(state.guesses[r],target);row.classList.add('submitted');
          if(justSolved && r===solvedAt)row.classList.add('winning-row');
        }else if(!solved&&r===state.guesses.length&&!state.ended){letters=state.cells;row.classList.add('editing');}
        for(let c=0;c<5;c++){
          const tile=document.createElement('button');tile.type='button';const active=!solved&&r===state.guesses.length&&!state.ended;
          tile.className='termo-tile'+(statuses[c]?` ${statuses[c]}`:'')+(letters[c]?' filled':'')+(active&&c===state.cursor?' selected':'')+(active&&c===state.typedPulseIndex?' typed-pulse':'')+(justSolved&&r===solvedAt?' win-tile':'');
          if(justSolved&&r===solvedAt)tile.style.setProperty('--win-delay',`${c*65}ms`);
          tile.textContent=letters[c]||'';
          tile.setAttribute('aria-label',`Palavra ${b+1}, linha ${r+1}, coluna ${c+1}${letters[c]?`, letra ${letters[c]}`:''}`);
          if(active)tile.onclick=()=>{state.cursor=c;renderBoards();focusNativeInput();};
          row.appendChild(tile);
        }
        board.appendChild(row);
      }
      wrap.appendChild(board);host.appendChild(wrap);
    });
    syncNativeInput();
  }
  function keyStates(){const map={};state.guesses.forEach((g,r)=>state.targets.forEach((t,b)=>{const solvedAt=state.solvedAt[b];if(solvedAt!==null&&r>solvedAt)return;const st=evaluate(g,t),letters=[...norm(g).toUpperCase()];letters.forEach((l,i)=>{const x=st[i];if(!map[l]||rank[x]>rank[map[l]])map[l]=x;});}));return map;}
  function renderKeyboard(){const box=$('termoKeyboard');if(!box)return;const states=keyStates();box.innerHTML='';KEY_ROWS.forEach((letters,idx)=>{const row=document.createElement('div');row.className='termo-key-row';if(idx===2){const enter=document.createElement('button');enter.className='termo-key wide';enter.textContent='ENTER';enter.onclick=()=>handle('ENTER');row.appendChild(enter);}for(const l of letters){const b=document.createElement('button');b.className='termo-key'+(states[l]?` ${states[l]}`:'');b.textContent=l;b.onclick=()=>handle(l);row.appendChild(b);}if(idx===2){const back=document.createElement('button');back.className='termo-key wide';back.textContent='⌫';back.onclick=()=>handle('BACKSPACE');row.appendChild(back);}box.appendChild(row);});}
  function renderStats(){const p=readProfile(),played=Number(p.termPlayed||0),wins=Number(p.termWins||0),best=Number(p.termBestStreak||0),streak=Number(p.termCurrentStreak||0),cfg=modeCfg();$('termoWins').textContent=wins;$('termoStreak').textContent=streak;$('termoBest').textContent=best;$('termoScore').textContent=state.sessionScore;$('termoPlayed').textContent=played;$('termoRate').textContent=played?`${Math.round(wins/played*100)}%`:'0%';$('termoSideBest').textContent=best;if($('termoProgress'))$('termoProgress').textContent=`🎯 ${solvedCount()}/${cfg.targets} • ${state.guesses.length}/${cfg.attempts}`;}
  function renderModeButtons(){document.querySelectorAll('[data-termo-mode]').forEach(b=>b.classList.toggle('active',b.dataset.termoMode===state.mode));}
  function render(){renderBoards();renderKeyboard();renderStats();renderModeButtons();$('termoNextButton').classList.toggle('hidden',!state.ended);$('termoClearButton')?.classList.toggle('hidden',state.ended);$('termoFocusButton')?.classList.toggle('hidden',state.ended);syncNativeInput();}
  function message(text,type=''){const el=$('termoMessage');if(!el)return;el.className='termo-message'+(type?` ${type}`:'');el.textContent=text;void el.offsetWidth;el.classList.add('pulse');}
  function clearLine(){if(state.ended||state.checking)return;state.cells=Array(5).fill('');state.cursor=0;message('Linha limpa. Clique em qualquer casa ou digite normalmente.');renderBoards();}
  function newRound(){const cfg=modeCfg();state.targets=pickTargets(cfg.targets);state.guesses=[];state.solvedAt=Array(cfg.targets).fill(null);state.cells=Array(5).fill('');state.cursor=0;state.ended=false;state.won=false;state.checking=false;state.typedPulseIndex=-1;state.justSolvedBoards=[];message(`${cfg.icon} ${cfg.title}: resolva ${cfg.targets===1?'a palavra':`as ${cfg.targets} palavras`} em até ${cfg.attempts} tentativas. Palavras inexistentes não contam.`);render();setTimeout(()=>syncNativeInput(),20);}
  function setMode(mode){if(!MODES[mode]||mode===state.mode&&!state.ended)return;state.mode=mode;newRound();}
  function endRound(won){releaseNativeKeyboard();state.ended=true;state.won=won;const cfg=modeCfg(),p=readProfile();p.termPlayed=Number(p.termPlayed||0)+1;p.termWins=Number(p.termWins||0)+(won?1:0);p.termCurrentStreak=won?Number(p.termCurrentStreak||0)+1:0;p.termBestStreak=Math.max(Number(p.termBestStreak||0),Number(p.termCurrentStreak||0));p.termModeWins={...(p.termModeWins||{})};if(won)p.termModeWins[state.mode]=Number(p.termModeWins[state.mode]||0)+1;let pts=0;if(won){pts=Math.max(80,cfg.scoreBase-(state.guesses.length-1)*28);state.sessionScore+=pts;p.coins=Number(p.coins||0)+Math.max(8,Math.round(pts/18));p.highScore=Math.max(Number(p.highScore||0),state.sessionScore);CORE()?.playSound?.('win');CORE()?.spawnConfetti?.();message(`✅ ${cfg.title} concluído em ${state.guesses.length}/${cfg.attempts} tentativas • +${pts} pontos`,'success');}else{CORE()?.playSound?.('lose');message(`💥 GAME OVER • Limite de ${cfg.attempts} tentativas atingido. Respostas: ${state.targets.map(x=>x.toUpperCase()).join(' • ')}`,'error');}if(Number(p.termWins||0)>=10)unlock(p,'wordsmith','🔤 Mestre das Palavras',140);if(Number(p.termBestStreak||0)>=5)unlock(p,'termoStreak','♾️ Sequência Infinita',190);window.GameGuessRanked?.record?.(p,{kind:'termo',score:pts,mode:state.mode,universe:'termo',challenge:'palavra',difficulty:'termo',correct:won?1:0,wrong:won?Math.max(0,state.guesses.length-1):state.guesses.length,won});saveProfile(p);render();}
  async function validateWord(word){if(VALID_LOCAL.has(word))return true;try{const r=await fetch(WORD_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word})});const d=await r.json();return Boolean(d.valid);}catch{return false;}}
  async function submit(){
    if(state.checking||state.ended)return;
    const guess=activeGuess(),cfg=modeCfg();
    if(guess.length!==5||state.cells.some(x=>!x)){message('Preencha as 5 casas antes de confirmar.','error');CORE()?.playSound?.('error');return;}
    state.checking=true;message('🔎 Verificando se a palavra existe...');const valid=await validateWord(guess);state.checking=false;
    if(!valid){message(`“${guess.toUpperCase()}” não foi reconhecida como palavra válida. A tentativa não foi consumida.`,'error');CORE()?.playSound?.('error');return;}
    const rowIndex=state.guesses.length,newlySolved=[];state.guesses.push(guess);
    state.targets.forEach((t,i)=>{if(state.solvedAt[i]===null&&guess===norm(t)){state.solvedAt[i]=rowIndex;newlySolved.push(i);}});
    state.justSolvedBoards=newlySolved;state.cells=Array(5).fill('');state.cursor=0;state.typedPulseIndex=-1;
    if(newlySolved.length){renderBoards();CORE()?.playSound?.('win');setTimeout(()=>{state.justSolvedBoards=[];},1050);}
    if(solvedCount()===cfg.targets)return setTimeout(()=>endRound(true),newlySolved.length?650:0);
    CORE()?.playSound?.('error');
    if(state.guesses.length>=cfg.attempts){render();return setTimeout(()=>endRound(false),220);}
    message(`Tentativa ${state.guesses.length}/${cfg.attempts} • ${solvedCount()}/${cfg.targets} palavra(s) resolvida(s).`,'error');render();
  }
  function placeLetter(k){
    const l=norm(k).toUpperCase();if(!/^[A-Z]$/.test(l))return;
    const typedAt=state.cursor;
    state.cells[typedAt]=l;
    state.typedPulseIndex=typedAt;

    // Depois de escrever, sugere a próxima casa vazia, mas sem obrigar ordem.
    // Se o jogador tocar em qualquer outra casa, o cursor muda imediatamente para ela.
    let next=-1;
    for(let i=typedAt+1;i<5;i++){if(!state.cells[i]){next=i;break;}}
    if(next<0){for(let i=0;i<typedAt;i++){if(!state.cells[i]){next=i;break;}}}
    if(next>=0)state.cursor=next;

    renderBoards();syncNativeInput();setTimeout(()=>{state.typedPulseIndex=-1;},220);
  }
  function backspace(){if(state.cells[state.cursor])state.cells[state.cursor]='';else if(state.cursor>0){state.cursor--;state.cells[state.cursor]='';}renderBoards();syncNativeInput();}
  function handle(k){if(state.ended||state.checking)return;if(k==='ENTER')return submit();if(k==='BACKSPACE')return backspace();if(k==='LEFT'){state.cursor=Math.max(0,state.cursor-1);return renderBoards();}if(k==='RIGHT'){state.cursor=Math.min(4,state.cursor+1);return renderBoards();}placeLetter(k);}
  function share(){if(!state.guesses.length){CORE()?.toast?.('Termo Arcade','Jogue ao menos uma tentativa antes de compartilhar.');return;}const cfg=modeCfg(),blocks=state.targets.map((t,b)=>{const end=state.solvedAt[b]===null?state.guesses.length:state.solvedAt[b]+1;const lines=state.guesses.slice(0,end).map(g=>evaluate(g,t).map(x=>x==='correct'?'🟩':x==='present'?'🟨':'⬛').join('')).join('\n');return `${cfg.targets>1?`PALAVRA ${b+1}\n`:''}${lines}`;}).join('\n\n');const text=`🔤 TERMO ARCADE ∞ • ${cfg.title}\n${state.won?`${state.guesses.length}/${cfg.attempts}`:`X/${cfg.attempts}`}\n${blocks}\n🔥 sequência ${Number(readProfile().termCurrentStreak||0)}`;navigator.clipboard?.writeText(text).then(()=>CORE()?.toast?.('Copiado','Resultado do Termo Arcade copiado.'));}
  function open(){
    CORE()?.showScreen?.('termoScreen');
    if(!state.targets.length||state.ended)newRound();else render();
    syncNativeInput();
    // No mobile o teclado só abre após toque explícito no botão ou em uma casa.
    // Isso evita que Safari/Chrome reposicionem a página ao entrar no Termo.
  }
  function resetStreak(){const p=readProfile();p.termCurrentStreak=0;saveProfile(p);state.sessionScore=0;message('Sequência reiniciada. O desafio atual continua valendo.');renderStats();}
  function bind(){if(!$('termoScreen'))return;
    $('termoQuitButton').onclick=()=>{releaseNativeKeyboard();CORE()?.showScreen?.('homeScreen');};$('termoNextButton').onclick=newRound;$('termoShareButton').onclick=share;$('termoResetButton').onclick=resetStreak;$('termoClearButton')&&($('termoClearButton').onclick=clearLine);$('termoFocusButton')&&($('termoFocusButton').onclick=()=>focusNativeInput());document.querySelectorAll('[data-termo-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.termoMode));
    const ni=nativeInput();if(ni){
      // beforeinput é o caminho principal no Safari iOS/Chrome Android.
      // Como o input fica sempre vazio, a letra é inserida diretamente na casa selecionada.
      ni.addEventListener('beforeinput',e=>{
        if(state.ended||state.checking)return;
        const type=String(e.inputType||'');
        if(type==='deleteContentBackward'||type==='deleteContentForward'){
          if(e.cancelable)e.preventDefault();
          handle('BACKSPACE');
          syncNativeInput();
          return;
        }
        if(type.startsWith('insert')&&e.data){
          const letters=[...norm(e.data).toUpperCase()].filter(x=>/^[A-Z]$/.test(x));
          // Se o navegador permite cancelar, tratamos aqui. Caso contrário,
          // deixamos o evento input de fallback processar para não duplicar letras.
          if(letters.length&&e.cancelable){
            e.preventDefault();
            letters.forEach(placeLetter);
            syncNativeInput();
          }
        }
      });

      // Fallback para teclados/navegadores que não entregam beforeinput corretamente.
      ni.addEventListener('input',()=>{
        if(state.ended||state.checking){syncNativeInput();return;}
        const letters=[...norm(ni.value).toUpperCase()].filter(x=>/^[A-Z]$/.test(x));
        ni.value='';
        letters.forEach(placeLetter);
      });

      ni.addEventListener('keydown',e=>{
        if(e.key==='Enter'){e.preventDefault();handle('ENTER')}
        else if(e.key==='Backspace'){e.preventDefault();handle('BACKSPACE')}
        else if(e.key==='ArrowLeft'){e.preventDefault();handle('LEFT')}
        else if(e.key==='ArrowRight'){e.preventDefault();handle('RIGHT')}
      });
      ni.addEventListener('focus',updateMobileKeyboardState);
      ni.addEventListener('blur',()=>setTimeout(updateMobileKeyboardState,30));
    }
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize',updateMobileKeyboardState,{passive:true});
    }
    window.addEventListener('orientationchange',()=>setTimeout(updateMobileKeyboardState,180),{passive:true});
    window.addEventListener('keydown',e=>{if(!$('termoScreen').classList.contains('active'))return;if(document.activeElement===ni)return;if(e.key==='Enter'){e.preventDefault();handle('ENTER');}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();handle('BACKSPACE');}else if(e.key==='ArrowLeft'){e.preventDefault();handle('LEFT');}else if(e.key==='ArrowRight'){e.preventDefault();handle('RIGHT');}else if(/^[a-zA-ZÀ-ÿ]$/.test(e.key))handle(e.key);});renderStats();renderModeButtons();syncNativeInput();}
  window.GameGuessTermo={open};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
