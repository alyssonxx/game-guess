(() => {
  'use strict';
  const $=id=>document.getElementById(id), CORE=()=>window.GameGuessCore, FB=()=>window.GameGuessFirebase;
  const PROFILE_KEY='gameGuessArcadeV4';
  const ROUND_SECONDS=35, TOTAL_ROUNDS=15, MIN_PLAYERS=2, MAX_PLAYERS=8; // V11: Arena 2–8 + anti-scroll + trava de resposta + mosaico super escuro
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
  function show(id){
    const target=$(id);
    if(target?.classList.contains('active'))return;
    if(CORE()?.showScreen)CORE().showScreen(id);
    else{
      document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('active',el.id===id));
      window.scrollTo({top:0,behavior:'auto'});
    }
  }
  function toast(a,b,t=''){CORE()?.toast?.(a,b,t);}
  function user(){return FB()?.getUser?.()||null;}
  function playerList(r=room){return r?Object.values(r.players||{}):[];}
  function me(r=room){const u=user();return u&&r?.players?.[u.uid]||null;}
  function rival(r=room){const u=user();return playerList(r).find(p=>p.uid!==u?.uid&&!p.left)||null;}
  function activePlayers(r=room){return playerList(r).filter(p=>!p.left&&!p.eliminated);}
  function roomMaxPlayers(r=room){return Math.max(MIN_PLAYERS,Math.min(MAX_PLAYERS,Number(r?.config?.maxPlayers||2)));}
  function isHost(r=room){return Boolean(user()&&r?.hostUid===user().uid);}
  function arenaName(count){return count===2?'1x1':Array.from({length:count},()=> '1').join('x');}
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


  // ===== Mosaico progressivo do duelo 1x1 =====
  function ensureDuelMosaicStyles(){
    if(document.getElementById('gameGuessDuelMosaicStyles'))return;

    const style=document.createElement('style');
    style.id='gameGuessDuelMosaicStyles';

    style.textContent=`
      /* =========================================
         GAME GUESS 1x1 — MOSAICO SUPER ESCURO
         Os blocos escondidos são praticamente
         opacos para impedir enxergar o personagem.
      ========================================= */

      .duel-image-shell{
        position:relative !important;
        overflow:hidden !important;
        isolation:isolate !important;
        background:#01020a !important;
      }

      .duel-image-shell #duelQuestionImage{
        position:relative !important;
        z-index:1 !important;
        display:block !important;
        width:100% !important;
        height:100% !important;
        object-fit:cover !important;
      }

      .duel-mosaic-mask{
        position:absolute !important;
        inset:0 !important;
        display:grid !important;
        grid-template-columns:repeat(3,1fr) !important;
        grid-template-rows:repeat(2,1fr) !important;
        width:100% !important;
        height:100% !important;
        z-index:50 !important;
        pointer-events:none !important;
        background:transparent !important;
      }

      .duel-mosaic-mask.hidden{
        display:none !important;
      }

      .duel-mosaic-piece{
        position:relative !important;

        /* Fundo 100% opaco: não deixa a imagem vazar */
        background:
          radial-gradient(
            circle at 50% 42%,
            #0a0e1d 0%,
            #040610 52%,
            #010208 100%
          ) !important;

        border:1px solid rgba(120,145,210,.16) !important;

        opacity:1 !important;
        visibility:visible !important;

        filter:none !important;
        -webkit-filter:none !important;

        -webkit-backdrop-filter:none !important;
        backdrop-filter:none !important;

        box-shadow:
          inset 0 0 40px rgba(0,0,0,.92),
          inset 0 0 8px rgba(90,120,190,.08) !important;

        transition:
          opacity .28s ease,
          visibility .28s ease !important;
      }

      .duel-mosaic-piece::before{
        content:'';
        position:absolute;
        inset:0;
        background:
          linear-gradient(
            135deg,
            rgba(255,255,255,.018),
            rgba(255,255,255,0) 35%,
            rgba(0,0,0,.28)
          );
        pointer-events:none;
      }

      .duel-mosaic-piece::after{
        content:'?';
        position:absolute;
        inset:0;
        display:grid;
        place-items:center;

        color:rgba(190,205,255,.18);

        text-shadow:
          0 0 12px rgba(120,155,255,.08);

        font-family:'Orbitron',sans-serif;
        font-size:2rem;
        font-weight:900;
      }

      /* Fragmento revelado = bloco desaparece por completo */
      .duel-mosaic-piece.revealed{
        opacity:0 !important;
        visibility:hidden !important;
      }

      /* Fallback de imagem sempre acima de tudo */
      .duel-image-cover{
        position:absolute !important;
        inset:0 !important;
        z-index:60 !important;
      }
    `;

    document.head.appendChild(style);
  }

  function duelMosaicOrder(q){
    const key=String(q?.id||q?.name||'gameguess');
    let seed=0;
    for(let i=0;i<key.length;i++)seed=((seed*31)+key.charCodeAt(i))>>>0;
    const order=[0,1,2,3,4,5];
    for(let i=order.length-1;i>0;i--){
      seed=(seed*1664525+1013904223)>>>0;
      const j=seed%(i+1);
      [order[i],order[j]]=[order[j],order[i]];
    }
    return order;
  }

  function prepareDuelMosaic(q,enabled){
    const shell=$('duelImageShell');
    if(!shell)return;
    ensureDuelMosaicStyles();

    let mask=$('duelMosaicMask');

    if(!mask){
      mask=document.createElement('div');
      mask.id='duelMosaicMask';
      mask.className='duel-mosaic-mask';

      for(let i=0;i<6;i++){
        const piece=document.createElement('div');
        piece.className='duel-mosaic-piece';
        piece.dataset.piece=String(i);

        // Fallback inline: mesmo se outro CSS interferir,
        // o fragmento escondido continua totalmente opaco.
        piece.style.background='#02040c';
        piece.style.opacity='1';

        mask.appendChild(piece);
      }

      shell.appendChild(mask);
    }

    mask.classList.toggle('hidden',!enabled);

    // Reforço inline para evitar que estilos antigos/cacheados escondam o mosaico.
    mask.style.display=enabled?'grid':'none';
    mask.style.zIndex='50';
    mask.style.position='absolute';
    mask.style.inset='0';

    if(!enabled)return;

    const key=String(q?.id||q?.name||'gameguess');

    if(mask.dataset.question!==key){
      mask.dataset.question=key;
      mask.dataset.order=duelMosaicOrder(q).join(',');

      [...mask.children].forEach(
        piece=>piece.classList.remove('revealed')
      );
    }
  }

  function updateDuelMosaic(q,player){
    const mask=$('duelMosaicMask');

    if(
      !mask ||
      q?.challenge!=='image' ||
      mask.classList.contains('hidden')
    ){
      return;
    }

    const order=String(mask.dataset.order||'')
      .split(',')
      .map(Number)
      .filter(Number.isFinite);

    const wrong=Number(player?.roundWrong||0);

    // 1 fragmento no começo + 1 novo fragmento a cada erro.
    // Ao acertar/pular/encerrar a rodada, a imagem é totalmente revelada.
    const revealCount=player?.roundSolved
      ? 6
      : Math.min(6,1+wrong);

    const revealed=new Set(
      order.slice(0,revealCount)
    );

    [...mask.children].forEach(
      (piece,index)=>
        piece.classList.toggle(
          'revealed',
          revealed.has(index)
        )
    );
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

  function ensureArenaUI(){
    if(!document.getElementById('gameGuessArenaStyles')){
      const style=document.createElement('style');
      style.id='gameGuessArenaStyles';
      style.textContent=`
        .arena-waiting-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:14px 0;}
        .arena-waiting-player{padding:10px 12px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.035);display:flex;align-items:center;gap:8px;min-width:0;}
        .arena-waiting-player b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .arena-host-badge{font-size:.72rem;opacity:.75;}
        .arena-start-row{display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:12px;}
        .arena-players-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))!important;gap:10px!important;align-items:stretch!important;}
        .arena-player-card{border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:10px 12px;background:rgba(255,255,255,.035);display:grid;gap:5px;min-width:0;}
        .arena-player-card.me{border-color:rgba(91,238,224,.48);box-shadow:inset 0 0 0 1px rgba(91,238,224,.08);}
        .arena-player-card.eliminated{opacity:.48;filter:grayscale(.55);}
        .arena-player-card .arena-player-head{display:flex;align-items:center;gap:7px;min-width:0;}
        .arena-player-card .arena-player-head b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .arena-player-card small{opacity:.82;}
        .arena-player-status{font-size:.78rem;opacity:.88;}
        .arena-final-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;width:100%;}
        .arena-final-player{border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:12px;background:rgba(255,255,255,.035);display:grid;gap:4px;}
        .arena-final-player.winner{border-color:rgba(255,221,92,.48);}
        .arena-answer-locked{opacity:.72;}
        @media (max-width:640px){
          .arena-players-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
          .arena-player-card{padding:8px 9px;}
        }
      `;
      document.head.appendChild(style);
    }

    const createBtn=$('createDuelButton');
    if(createBtn && !$('duelMaxPlayersSelect')){
      const label=document.createElement('label');
      label.id='duelMaxPlayersField';
      label.innerHTML=`Jogadores na arena
        <select id="duelMaxPlayersSelect">
          <option value="2">⚔️ 2 jogadores — 1x1</option>
          <option value="3">⚔️ 3 jogadores — 1x1x1</option>
          <option value="4">⚔️ 4 jogadores — 1x1x1x1</option>
          <option value="5">⚔️ 5 jogadores</option>
          <option value="6">⚔️ 6 jogadores</option>
          <option value="7">⚔️ 7 jogadores</option>
          <option value="8">⚔️ 8 jogadores</option>
        </select>`;
      createBtn.parentElement?.insertBefore(label,createBtn);
    }

    const waiting=$('duelRoomWaiting');
    if(waiting && !$('duelWaitingPlayers')){
      const list=document.createElement('div');
      list.id='duelWaitingPlayers';
      list.className='arena-waiting-list';
      waiting.appendChild(list);

      const row=document.createElement('div');
      row.className='arena-start-row';
      row.innerHTML=`
        <button class="primary-btn hidden" id="duelStartButton">COMEÇAR PARTIDA</button>
        <small id="duelStartHelp">Aguardando pelo menos 2 jogadores.</small>`;
      waiting.appendChild(row);
      $('duelStartButton')?.addEventListener('click',startRoom);
    }

    const topLabel=document.querySelector('#duelButton b');
    if(topLabel)topLabel.textContent='VS';

    const homeBtn=$('homeDuelButton');
    if(homeBtn)homeBtn.textContent='⚔️ ENTRAR NA ARENA';

    const lobby=$('duelLobbyScreen');
    const eyebrow=lobby?.querySelector('.section-heading .eyebrow');
    const title=lobby?.querySelector('.section-heading h2');
    const desc=lobby?.querySelector('.section-heading p:not(.eyebrow)');
    if(eyebrow)eyebrow.textContent='⚔️ ARENA ONLINE • 2 A 8 JOGADORES';
    if(title)title.textContent='Todos contra todos. Um vencedor.';
    if(desc)desc.textContent='Crie uma sala para 2 a 8 jogadores. O anfitrião pode começar assim que houver pelo menos 2 pessoas, ou a partida começa automaticamente quando a sala lotar.';
  }

  function setAnswerLocked(locked,message=''){
    const input=$('duelGuessInput');
    const send=$('duelGuessButton');
    const skip=$('duelSkipButton');
    const box=input?.closest('.guess-box');

    if(input){
      input.disabled=Boolean(locked);
      input.readOnly=Boolean(locked);
      input.placeholder=locked?'Aguardando a próxima rodada...':'Digite sua resposta...';
      if(locked && document.activeElement===input)input.blur();
    }
    if(send)send.disabled=Boolean(locked);
    if(skip)skip.disabled=Boolean(locked);
    box?.classList.toggle('arena-answer-locked',Boolean(locked));

    if(message && $('duelFeedback'))$('duelFeedback').textContent=message;
  }

  function shouldAutofocus(){
    return Boolean(window.matchMedia?.('(hover:hover) and (pointer:fine)').matches);
  }

  function waitingPlayerHTML(p,r){
    return `<div class="arena-waiting-player">
      <span>${p.uid===r.hostUid?'👑':'👤'}</span>
      <b>${esc(p.name||'Jogador')}</b>
      ${p.uid===r.hostUid?'<span class="arena-host-badge">HOST</span>':''}
    </div>`;
  }

  function renderWaitingRoom(){
    ensureArenaUI();
    show('duelLobbyScreen');
    $('duelRoomWaiting')?.classList.remove('hidden');

    const players=playerList().filter(p=>!p.left).sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0));
    const max=roomMaxPlayers();
    const count=players.length;

    if($('duelRoomCode'))$('duelRoomCode').textContent=room.code||roomCode;
    if($('duelWaitingTitle'))$('duelWaitingTitle').textContent=`${count}/${max} jogadores na sala`;
    if($('duelWaitingText'))$('duelWaitingText').textContent=`${UNIVERSE_LABELS[room.config?.universe]||'🌌 Arena'} • ${room.questions?.length||TOTAL_ROUNDS} rodadas • ${arenaName(count)} • ${duelUsesLives()?'3 vidas por jogador':'3 tentativas por rodada'}`;
    if($('duelWaitingPlayers'))$('duelWaitingPlayers').innerHTML=players.map(p=>waitingPlayerHTML(p,room)).join('');

    const start=$('duelStartButton');
    const help=$('duelStartHelp');
    if(start){
      const host=isHost();
      start.classList.toggle('hidden',!host);
      start.disabled=!host||count<MIN_PLAYERS;
      start.textContent=count>=MIN_PLAYERS?`COMEÇAR COM ${count} JOGADORES`:'AGUARDANDO JOGADORES';
    }
    if(help){
      if(isHost())help.textContent=count<MIN_PLAYERS?'Aguardando pelo menos 2 jogadores.':count<max?'Você já pode começar ou aguardar mais jogadores.':'Sala cheia — iniciando...';
      else help.textContent='Aguardando o anfitrião começar a partida.';
    }
  }

  function playerStatusText(p){
    if(p.left)return '🚪 Saiu da partida';
    if(p.eliminated)return '💀 Eliminado';
    if(p.roundSolved){
      if(p.roundResult==='correct')return '✅ Acertou';
      if(p.roundResult==='skip')return '⏭️ Pulou';
      if(p.roundResult==='failed')return '❌ Sem tentativas';
      if(p.roundResult==='timeout')return '⏱️ Tempo esgotado';
      return '⏳ Finalizou';
    }
    return '🎮 Jogando...';
  }

  function renderPlayersBoard(){
    const wrap=document.querySelector('.duel-versus');
    if(!wrap)return;

    const uid=user()?.uid;
    const players=playerList()
      .filter(p=>!p.left)
      .sort((a,b)=>{
        if(a.uid===uid)return -1;
        if(b.uid===uid)return 1;
        return (a.joinedAt||0)-(b.joinedAt||0);
      });

    wrap.classList.add('arena-players-grid');
    wrap.innerHTML=players.map(p=>{
      const lifeText=duelUsesLives()
        ? `${'❤️'.repeat(Math.max(0,p.lives||0))}${'🖤'.repeat(Math.max(0,3-(p.lives||0)))}`
        : `🎯 ${duelChanceLeft(p)} chances`;

      return `<div class="arena-player-card${p.uid===uid?' me':''}${p.eliminated?' eliminated':''}">
        <div class="arena-player-head">
          <span>${p.uid===room?.hostUid?'👑':p.uid===uid?'👤':'🎭'}</span>
          <b>${esc(p.name||'Jogador')}</b>
        </div>
        <small>${p.correct||0} acertos • ${p.score||0} pts</small>
        <strong>${lifeText}</strong>
        <span class="arena-player-status">${playerStatusText(p)}</span>
      </div>`;
    }).join('');
  }

  async function openLobby(){
    ensureArenaUI();
    show('duelLobbyScreen');
    $('duelRoomWaiting')?.classList.add('hidden');
    if(!FB()?.configured)toast('Firebase precisa ser configurado','Siga o arquivo FIREBASE-SETUP.md para ativar contas e duelos.','error');
  }

  async function createRoom(){
    if(!user())return FB()?.openAuth?.('login');
    ensureArenaUI();

    const maxPlayers=Math.max(MIN_PLAYERS,Math.min(MAX_PLAYERS,Number($('duelMaxPlayersSelect')?.value||2)));
    const config={
      universe:$('duelUniverseSelect').value,
      difficulty:$('duelDifficultySelect').value,
      challenge:$('duelChallengeSelect').value,
      rounds:TOTAL_ROUNDS,
      maxPlayers
    };

    const btn=$('createDuelButton');
    btn.disabled=true;
    btn.textContent='PREPARANDO PERGUNTAS...';

    try{
      const questions=await buildRoomQuestions(config);
      roomCode=await FB().createDuelRoom({config,questions});
      localStorage.setItem('gameGuessLastDuel',roomCode);
      watch(roomCode);
      toast('Sala criada',`Código ${roomCode} • até ${maxPlayers} jogadores.`);
    }catch(e){
      toast('Não consegui criar a sala',e.message,'error');
    }finally{
      btn.disabled=false;
      btn.textContent='CRIAR SALA';
    }
  }

  async function joinRoom(){
    if(!user())return FB()?.openAuth?.('login');
    const code=$('joinDuelCode').value.trim().toUpperCase();
    try{
      roomCode=await FB().joinDuelRoom(code);
      localStorage.setItem('gameGuessLastDuel',roomCode);
      watch(roomCode);
      toast('Entrou na sala','Aguardando o anfitrião iniciar a arena.');
    }catch(e){
      toast('Não consegui entrar',e.message,'error');
    }
  }

  async function startRoom(){
    if(!roomCode||!isHost())return;
    const btn=$('duelStartButton');
    if(btn){btn.disabled=true;btn.textContent='INICIANDO...';}
    try{
      await FB().startDuelRoom(roomCode);
    }catch(e){
      toast('Não consegui iniciar',e.message,'error');
      if(btn)btn.disabled=false;
    }
  }

  function watch(code){
    unsub?.();
    unsub=FB().watchDuel(code,(data,error)=>{
      if(error)return toast('Arena desconectada',error.message,'error');
      if(!data)return;
      room=data;
      renderRoom();
      hostControl();
    });
  }

  function renderRoom(){
    const u=user();
    if(!u||!room)return;

    if(room.status==='waiting'){
      renderWaitingRoom();
      return;
    }

    if(room.status==='finished'){
      showFinal();
      return;
    }

    // Só troca para a tela da partida uma única vez.
    // Atualizações do Firebase NÃO chamam scrollTo novamente.
    show('duelGameScreen');

    const mine=me();
    const idx=Number(room.roundIndex||0);
    const q=room.questions?.[idx];
    if(!q)return;

    if($('duelRoomBadge'))$('duelRoomBadge').textContent=`SALA ${room.code||roomCode}`;
    if($('duelRoundCounter'))$('duelRoundCounter').textContent=`RODADA ${idx+1} / ${room.questions.length}`;
    if($('duelChallengeBadge'))$('duelChallengeBadge').textContent=`${CH_LABELS[q.challenge]||q.challenge} • ${playerList().filter(p=>!p.left).length} jogadores`;

    renderPlayersBoard();

    if(idx!==renderedRound){
      renderedRound=idx;
      hintsUsed=0;
      localWrong=0;
      renderQuestion(q);
    }

    updateDuelMosaic(q,mine);

    const solved=Boolean(mine?.roundSolved);
    const eliminated=Boolean(mine?.eliminated)||(
      duelUsesLives()&&(mine?.lives||0)<=0
    );
    setAnswerLocked(solved||eliminated);

    $('duelWaitOpponent')?.classList.toggle('hidden',!solved&&!eliminated);

    if(solved||eliminated){
      const result=mine?.roundResult||'';

      if(result==='correct'){
        $('duelWaitOpponent').textContent='✅ Você acertou esta rodada. Aguardando os outros jogadores...';
        $('duelFeedback').textContent='✅ Resposta correta! Sua caixa de resposta ficará travada até a próxima rodada.';
      }else if(result==='skip'){
        $('duelWaitOpponent').textContent='⏭️ Você pulou esta rodada. Aguardando os outros jogadores...';
        $('duelFeedback').textContent='⏭️ Rodada pulada. A resposta fica bloqueada até a próxima rodada.';
      }else if(result==='failed'){
        $('duelWaitOpponent').textContent='❌ Suas tentativas acabaram. Aguardando os outros jogadores...';
        $('duelFeedback').textContent='❌ Você não acertou esta rodada. Aguarde a próxima.';
      }else if(result==='timeout'){
        $('duelWaitOpponent').textContent='⏱️ O tempo acabou. Aguardando os outros jogadores...';
        $('duelFeedback').textContent=duelUsesLives()?'⏱️ Tempo esgotado. Você perdeu 1 vida.':'⏱️ Tempo esgotado nesta rodada.';
      }else if(mine?.eliminated){
        $('duelWaitOpponent').textContent='💀 Você foi eliminado desta arena.';
        $('duelFeedback').textContent='Você pode acompanhar o restante da partida, mas não pode mais responder.';
      }else{
        $('duelWaitOpponent').textContent='⏳ Resposta registrada. Aguardando os outros jogadores...';
      }
    }

    startClock();
  }

  async function probe(url){if(!url)return false;try{const r=await fetch(url,{method:'HEAD',cache:'force-cache'});return r.ok&&r.headers.get('X-GameGuess-Fallback')!=='1';}catch{return false;}}

  async function renderQuestion(q){
    $('duelQuestionEyebrow').textContent=`${UNIVERSE_LABELS[realUniverse(q)]||'🌌 MULTIVERSO'} • ${CH_LABELS[q.challenge]||''}`;
    $('duelQuestionTitle').textContent=questionPrompt(q);
    $('duelQuestionSource').textContent=q.source||UNIVERSE_LABELS[realUniverse(q)]||'MULTIVERSO';

    $('duelGuessInput').value='';
    $('duelFeedback').textContent=duelUsesLives()?'Cada resposta errada enviada custa 1 vida.':'Fácil/Normal: cada erro gasta uma das 3 tentativas da rodada, sem corações.';
    $('duelWaitOpponent').classList.add('hidden');
    setAnswerLocked(false);

    const img=$('duelQuestionImage'),cover=$('duelImageCover');
    const imageAllowed=q.challenge!=='blind'&&await probe(q.image);
    img.classList.toggle('hidden',!imageAllowed);
    cover.classList.toggle('hidden',imageAllowed);

    if(imageAllowed){
      img.src=q.image;
      img.classList.toggle('silhouette',q.challenge==='silhouette');
      prepareDuelMosaic(q,q.challenge==='image');
      updateDuelMosaic(q,me());
    }else{
      prepareDuelMosaic(q,false);
      cover.innerHTML=q.challenge==='blind'?'🧠<span>DESAFIO SÓ POR PISTAS</span>':'🧠<span>IMAGEM INDISPONÍVEL • USE AS PISTAS</span>';
    }

    const primary=primaryClues(q);
    $('duelPrimaryHint').innerHTML=primary.length
      ? primary.map(c=>`<strong>${esc(c.label)}</strong> ${esc(c.text)}`).join('<hr>')
      : '<strong>🧩 Sem pista inicial.</strong> Use os botões abaixo.';

    const used=new Set(primary.map(c=>c.label));
    const box=$('duelHints');
    box.innerHTML='';

    (q.clues||[])
      .filter(c=>!used.has(c.label)&&c.kind!=='name')
      .slice(0,5)
      .forEach(c=>{
        const b=document.createElement('button');
        b.className='hint-btn';
        b.innerHTML=`<span>💡</span>${esc(c.label.replace(/^\S+\s*/,''))}`;
        b.onclick=()=>{
          if(b.disabled||me()?.roundSolved||me()?.eliminated)return;
          b.disabled=true;
          hintsUsed++;
          const d=document.createElement('div');
          d.className='duel-extra-hint';
          d.innerHTML=`<strong>${esc(c.label)}</strong> ${esc(c.text)}`;
          $('duelPrimaryHint').appendChild(d);
        };
        box.appendChild(b);
      });

    // Evita o teclado móvel forçar o scroll da tela.
    if(shouldAutofocus())setTimeout(()=>$('duelGuessInput')?.focus({preventScroll:true}),80);
  }

  function pointsForCorrect(){
    const d=room?.config?.difficulty||'normal';
    return Math.max(150,Math.round((900-hintsUsed*90-localWrong*140)*(DIFF_MULT[d]||1)));
  }

  async function submit(rawOverride=null,skip=false){
    if(isSubmitting||!room||room.status!=='playing')return;

    const mine=me();
    if(!mine||mine.roundSolved||mine.eliminated||(duelUsesLives()&&mine.lives<=0))return;

    const q=room.questions?.[room.roundIndex];
    if(!q)return;

    const raw=skip?'[PULOU]':String(rawOverride??$('duelGuessInput').value).trim();
    if(!skip&&raw.length<1)return;

    const correct=!skip&&isCorrect(raw,q);
    const idx=Number(room.roundIndex||0);
    const pts=correct?pointsForCorrect():0;

    isSubmitting=true;
    setAnswerLocked(true,'⏳ Registrando sua resposta...');

    try{
      const result=await FB().mutateDuel(roomCode,(r,uid)=>{
        if(r.status!=='playing'||Number(r.roundIndex)!==idx)return r;

        const p=r.players?.[uid];
        if(!p||p.roundSolved||p.eliminated||(duelUsesLives(r)&&p.lives<=0))return r;

        if(correct){
          p.correct=(p.correct||0)+1;
          p.score=(p.score||0)+pts;
          p.roundSolved=true;
          p.roundResult='correct';
          p.lastRound=idx;
          r.lastEvent={uid,type:'correct',at:Date.now(),round:idx};
        }else{
          p.wrong=(p.wrong||0)+1;
          p.roundWrong=Number(p.roundWrong||0)+1;

          const withLives=duelUsesLives(r);
          if(withLives)p.lives=Math.max(0,(p.lives||0)-1);

          if(skip){
            p.roundSolved=true;
            p.roundResult='skip';
          }else if(!withLives&&p.roundWrong>=3){
            p.roundSolved=true;
            p.roundResult='failed';
          }else{
            p.roundResult='wrong';
          }

          if(withLives&&p.lives<=0){
            p.eliminated=true;
            p.roundSolved=true;
            p.roundResult='eliminated';
          }

          r.lastEvent={uid,type:skip?'skip':'wrong',at:Date.now(),round:idx};
        }

        return r;
      });

      if(!result.committed){
        setAnswerLocked(false);
        return;
      }

      const updatedMine=result.value?.players?.[user()?.uid];

      if(correct){
        CORE()?.playSound?.('win');
        CORE()?.spawnConfetti?.();
        $('duelFeedback').innerHTML=`✅ <strong>ACERTOU!</strong> +${pts} pontos. Aguarde a próxima rodada.`;
      }else{
        localWrong++;
        CORE()?.playSound?.('error');

        if(updatedMine?.eliminated){
          $('duelFeedback').innerHTML='💀 <strong>Você foi eliminado.</strong> Agora pode acompanhar a arena.';
        }else if(skip){
          $('duelFeedback').innerHTML=duelUsesLives()
            ? '⏭️ Você pulou a rodada e perdeu <strong>1 ❤️</strong>.'
            : '⏭️ Você pulou a rodada.';
        }else{
          $('duelFeedback').innerHTML=duelUsesLives()
            ? '❌ Resposta incorreta. <strong>-1 ❤️</strong>'
            : `❌ Resposta incorreta. Restam ${Math.max(0,3-Number(updatedMine?.roundWrong||localWrong))} tentativa(s).`;
        }

        $('duelGuessInput').value='';
      }

      const keepLocked=Boolean(updatedMine?.roundSolved||updatedMine?.eliminated);
      setAnswerLocked(keepLocked);
    }catch(e){
      setAnswerLocked(false);
      toast('Falha ao enviar',e.message,'error');
    }finally{
      isSubmitting=false;
    }
  }

  function scoreVector(p,r){
    return duelUsesLives(r)
      ? [p.eliminated?0:1,p.correct||0,p.lives||0,p.score||0]
      : [p.correct||0,p.score||0];
  }

  function compareVectors(a,b){
    for(let i=0;i<Math.max(a.length,b.length);i++){
      const av=a[i]||0,bv=b[i]||0;
      if(av!==bv)return bv-av;
    }
    return 0;
  }

  function rankedPlayers(r){
    return playerList(r)
      .filter(p=>!p.left)
      .sort((a,b)=>compareVectors(scoreVector(a,r),scoreVector(b,r)));
  }

  function winnerOf(r){
    const ps=rankedPlayers(r);
    if(!ps.length)return 'tie';
    if(ps.length===1)return ps[0].uid;
    return compareVectors(scoreVector(ps[0],r),scoreVector(ps[1],r))===0?'tie':ps[0].uid;
  }

  function finalizeMutable(r,reason='complete'){
    r.status='finished';
    r.finishedAt=Date.now();
    r.finishReason=reason;
    r.winnerUid=winnerOf(r);
    return r;
  }

  function hostControl(){
    const u=user();
    if(!u||!room||room.status!=='playing'||!room.players?.[u.uid]||room.players[u.uid].left)return;

    const all=playerList();
    const active=activePlayers();

    if(all.filter(p=>!p.left).length>=2&&active.length<=1){
      FB().mutateDuel(roomCode,r=>r.status==='playing'?finalizeMutable(r,'last-player'):r);
      return;
    }

    if(active.length<1)return;

    if(active.every(p=>p.roundSolved)){
      clearTimeout(advanceTimer);
      const expected=Number(room.roundIndex||0);

      advanceTimer=setTimeout(()=>FB().mutateDuel(roomCode,r=>{
        if(r.status!=='playing'||Number(r.roundIndex)!==expected)return r;

        const activeNow=activePlayers(r);
        if(activeNow.length<=1)return finalizeMutable(r,'last-player');
        if(!activeNow.every(p=>p.roundSolved))return r;

        if(expected+1>=(r.questions||[]).length)return finalizeMutable(r,'rounds');

        r.roundIndex=expected+1;
        r.roundDeadline=Date.now()+ROUND_SECONDS*1000;
        r.timeoutRound=-1;

        for(const p of Object.values(r.players||{})){
          if(p.left||p.eliminated)continue;
          p.roundSolved=false;
          p.roundWrong=0;
          p.roundResult='';
          p.lastRound=expected;
        }

        r.lastEvent={type:'next',round:r.roundIndex,at:Date.now()};
        return r;
      }),900);
    }
  }

  function startClock(){
    if(clock)return;

    clock=setInterval(()=>{
      if(!room||room.status!=='playing')return;

      const left=Math.max(0,Math.ceil(((room.roundDeadline||0)-Date.now())/1000));
      if($('duelConnection'))$('duelConnection').textContent=`⏱️ ${left}s • 🟢 ${activePlayers().length} ativos`;

      const u=user();
      if(left<=0&&u&&room.players?.[u.uid]&&!room.players[u.uid].left){
        const expected=Number(room.roundIndex||0);

        FB().mutateDuel(roomCode,r=>{
          if(r.status!=='playing'||Number(r.roundIndex)!==expected||r.timeoutRound===expected)return r;

          r.timeoutRound=expected;

          for(const p of Object.values(r.players||{})){
            if(p.left||p.eliminated||p.roundSolved)continue;

            if(duelUsesLives(r)){
              p.lives=Math.max(0,(p.lives||0)-1);
              if(p.lives<=0)p.eliminated=true;
            }

            p.roundSolved=true;
            p.roundResult=p.eliminated?'eliminated':'timeout';
            p.roundWrong=Number(p.roundWrong||0)+1;
            p.wrong=(p.wrong||0)+1;
          }

          r.lastEvent={type:'timeout',round:expected,at:Date.now()};

          const activeNow=activePlayers(r);
          if(activeNow.length<=1)return finalizeMutable(r,'last-player');

          return r;
        });
      }
    },350);
  }

  function recordResult(){
    if(!room||!user())return;const key=`gameGuessDuelRecorded:${room.code||roomCode}:${user().uid}`;if(localStorage.getItem(key))return;localStorage.setItem(key,'1');
    const p=CORE()?.getProfile?.()||{};p.duelPlayed=Number(p.duelPlayed||0)+1;const mine=me(),winner=room.winnerUid;if(winner===user().uid)p.duelWins=Number(p.duelWins||0)+1;else if(winner!=='tie')p.duelLosses=Number(p.duelLosses||0)+1;p.duelBestScore=Math.max(Number(p.duelBestScore||0),Number(mine?.score||0));CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();FB()?.syncLocalProfile?.(p);
  }

  function showFinal(){
    clearInterval(clock);
    clock=null;
    recordResult();

    const winner=room.winnerUid;
    const isTie=winner==='tie';
    const won=winner===user()?.uid;
    const winnerPlayer=playerList().find(p=>p.uid===winner);

    $('duelResultIcon').textContent=isTie?'🤝':won?'🏆':'🎖️';
    $('duelResultTitle').textContent=isTie?'Empate!':won?'Você venceu!':`${winnerPlayer?.name||'Outro jogador'} venceu`;

    const ranked=rankedPlayers(room);
    $('duelFinalScore').innerHTML=`<div class="arena-final-grid">${
      ranked.map((p,i)=>`<div class="arena-final-player${p.uid===winner?' winner':''}">
        <b>${i===0?'🏆':`#${i+1}`} ${esc(p.name||'Jogador')}</b>
        <strong>${p.correct||0} acertos</strong>
        <span>${duelUsesLives()?`${p.lives||0} ❤️ • `:''}${p.score||0} pts</span>
        <small>${p.eliminated?'Eliminado':p.left?'Saiu':'Finalizou'}</small>
      </div>`).join('')
    }</div>`;

    if(room.finishReason==='last-player'){
      $('duelResultMessage').textContent='A arena terminou quando restou apenas um jogador ativo.';
    }else if(duelUsesLives()){
      $('duelResultMessage').textContent='Ranking final por sobrevivência, acertos, vidas restantes e pontuação.';
    }else{
      $('duelResultMessage').textContent='Ranking final por acertos e pontuação.';
    }

    const ov=$('duelResultOverlay');
    ov.classList.add('active');
    ov.setAttribute('aria-hidden','false');
  }

  async function quit(){
    if(!roomCode){
      show('homeScreen');
      return;
    }

    const u=user();

    if(room?.status==='waiting'){
      if(room.hostUid===u?.uid){
        await FB().deleteDuel(roomCode).catch(()=>{});
      }else{
        await FB().leaveDuelRoom(roomCode).catch(()=>{});
      }
      cleanup();
      show('homeScreen');
      return;
    }

    if(room?.status==='playing'){
      await FB().mutateDuel(roomCode,(r,uid)=>{
        if(r.status!=='playing')return r;

        const p=r.players?.[uid];
        if(!p)return r;

        p.left=true;
        p.eliminated=true;
        p.roundSolved=true;
        p.roundResult='left';

        if(r.hostUid===uid){
          const replacement=Object.values(r.players||{})
            .filter(x=>x.uid!==uid&&!x.left)
            .sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0))[0];
          if(replacement)r.hostUid=replacement.uid;
        }

        const remaining=Object.values(r.players||{}).filter(x=>!x.left&&!x.eliminated);
        if(remaining.length<=1)return finalizeMutable(r,'last-player');

        r.lastEvent={uid,type:'left',at:Date.now(),round:Number(r.roundIndex||0)};
        return r;
      }).catch(()=>{});
    }

    cleanup();
    show('homeScreen');
  }
  function cleanup(){unsub?.();unsub=null;clearInterval(clock);clock=null;clearTimeout(advanceTimer);advanceTimer=null;room=null;roomCode='';renderedRound=-1;}

  function bind(){
    ensureArenaUI();

    $('duelButton')?.addEventListener('click',openLobby);
    $('homeDuelButton')?.addEventListener('click',openLobby);

    $('duelBackButton')?.addEventListener('click',async()=>{
      if(room?.status==='waiting'&&roomCode){
        if(isHost())await FB().deleteDuel(roomCode).catch(()=>{});
        else await FB().leaveDuelRoom(roomCode).catch(()=>{});
      }
      cleanup();
      show('homeScreen');
    });

    $('createDuelButton')?.addEventListener('click',createRoom);
    $('joinDuelButton')?.addEventListener('click',joinRoom);

    $('joinDuelCode')?.addEventListener('input',e=>
      e.target.value=e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6)
    );

    $('copyDuelCode')?.addEventListener('click',()=>
      navigator.clipboard?.writeText(roomCode).then(()=>toast('Código copiado',roomCode))
    );

    $('duelGuessButton')?.addEventListener('click',()=>submit());

    $('duelGuessInput')?.addEventListener('keydown',e=>{
      if(e.key==='Enter'&&!e.currentTarget.disabled&&!me()?.roundSolved&&!me()?.eliminated)submit();
    });

    $('duelSkipButton')?.addEventListener('click',()=>submit(null,true));
    $('duelQuitButton')?.addEventListener('click',quit);

    $('duelHomeButton')?.addEventListener('click',()=>{
      document.getElementById('duelResultOverlay')?.classList.remove('active');
      cleanup();
      show('homeScreen');
    });

    $('duelRematchButton')?.addEventListener('click',()=>{
      document.getElementById('duelResultOverlay')?.classList.remove('active');
      cleanup();
      openLobby();
    });

    window.addEventListener('gameguess:authchange',e=>{
      if(!e.detail?.user&&roomCode){
        cleanup();
        show('homeScreen');
      }
    });
  }
  window.GameGuessDuel={open:openLobby};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
