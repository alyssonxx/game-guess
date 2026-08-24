(() => {
  'use strict';
  const C = (id,name,team,style,moves,combo,tip='') => ({id,name,team,style,moves,combo,tip});
  const M = (name,command,note='') => ({name,command,note});
  const S = (name,command,macro=null,note='') => ({name,command,macro,note});
  const roster = [
    C('kyo','Kyo Kusanagi','Japan Team','Pressão / rushdown',[M('Oniyaki','→ ↓ ↘ + A/C','anti-aéreo'),M('Aragami','↓ ↘ → + A','inicia rekka'),M('75 Shiki Kai','↓ ↘ → + B/D, B/D','lança para combo'),M('Orochi Nagi','↓ ↙ ← ↙ ↓ ↘ → + A/C','super')],'pulo C → C perto → →+B → Aragami → continuação','Use 75 Shiki Kai para manter o rival no ar.'),
    C('benimaru','Benimaru Nikaido','Japan Team','Mobilidade / eletricidade',[M('Raijin Ken','↓ ↘ → + A/C'),M('Shinkuu Katategoma','↓ ↙ ← + A/C'),M('Iai Geri','↓ ↘ → + B/D'),M('Raikou Ken','↓ ↘ → ↓ ↘ → + A','super')],'pulo D → C perto → Iai Geri → continuação','Excelente alcance no ar e boa pressão curta.'),
    C('daimon','Goro Daimon','Japan Team','Grappler / contra-ataque',[M('Jirai Shin','→ ↓ ↘ + A/C','golpe no chão'),M('Chou Oosotogari','← ↙ ↓ ↘ → + B/D','arremesso'),M('Tenchi Gaeshi','→ ↘ ↓ ↙ ← → + A/C','command grab'),M('Jigoku Gokuraku Otoshi','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A/C','super grab')],'C perto → command grab / Jirai Shin','Jogue perto: Daimon recompensa leitura e agarrões.'),

    C('terry','Terry Bogard','Fatal Fury Team','Equilibrado / pressão',[M('Power Wave','↓ ↘ → + A/C'),M('Burn Knuckle','↓ ↙ ← + A/C'),M('Rising Tackle','segure ↓, ↑ + A/C','anti-aéreo'),M('Power Geyser','↓ ↙ ← ↙ → + A/C','super')],'pulo D → C perto → →+A → Burn Knuckle','Power Wave controla o chão; Rising Tackle protege o alto.'),
    C('andy','Andy Bogard','Fatal Fury Team','Rushdown / anti-aéreo',[M('Hishou Ken','↓ ↙ ← + A/C'),M('Shouryuu Dan','→ ↓ ↘ + A/C'),M('Kuuha Dan','← ↙ ↓ ↘ → + B/D'),M('Chou Reppa Dan','↓ ↙ ← ↓ ↙ ← + B/D','super')],'pulo C → C perto → Shouryuu Dan','Forte em entradas rápidas e punição anti-aérea.'),
    C('joe','Joe Higashi','Fatal Fury Team','Pressão / Muay Thai',[M('Hurricane Upper','↓ ↘ → + A/C'),M('Tiger Kick','→ ↓ ↘ + B/D'),M('Slash Kick','← ↙ ↓ ↘ → + B/D'),M('Screw Upper','↓ ↘ → ↓ ↘ → + A/C','super')],'B baixo → A baixo → Tiger Kick','Use pokes longos e confirme em Tiger Kick.'),

    C('ryo','Ryo Sakazaki','Art of Fighting Team','Fundamentos / dano',[M("Ko'ou Ken",'↓ ↘ → + A/C'),M('Kohou','→ ↓ ↘ + A/C','anti-aéreo'),M('Hien Shippuu Kyaku','↓ ↙ ← + B/D'),M('Ryuuko Ranbu','↓ ↘ → ↘ ↓ ↙ ← + A/C','super')],'pulo C → C perto → Hien Shippuu Kyaku','Muito dano com confirmações simples.'),
    C('robert','Robert Garcia','Art of Fighting Team','Footsies / chutes',[M('Ryuugeki Ken','↓ ↘ → + A/C'),M('Ryuuga','→ ↓ ↘ + A/C'),M('Ryuu Hanshuu','↓ ↘ → + B/D'),M('Ryuuko Ranbu','↓ ↘ → ↘ ↓ ↙ ← + A/C','super')],'pulo D → C perto → Ryuu Hanshuu','Controle distância com chutes e projétil.'),
    C('takuma','Takuma Sakazaki','Art of Fighting Team','Dano / pressão',[M("Ko'ou Ken",'↓ ↘ → + A/C'),M('Zanretsu Ken','→ ← → + A/C'),M('Hien Shippuu Kyaku','↓ ↙ ← + B/D'),M('Haou Shikou Ken','→ ← ↙ ↓ ↘ → + A/C','super')],'C perto → Zanretsu Ken → pressão','Punidor forte; confirme golpes pesados.'),

    C('athena','Athena Asamiya','Psycho Soldier Team','Zoning / mobilidade',[M('Psycho Ball','↓ ↙ ← + A/C'),M('Psycho Sword','→ ↓ ↘ + A/C'),M('Phoenix Arrow','no ar ↓ ↙ ← + B/D'),M('Shining Crystal Bit','← ↙ ↓ ↘ → ← ↙ ↓ ↘ → + A/C','super')],'B baixo → A baixo → Psycho Sword','Misture teleporte/mobilidade com Psycho Ball.'),
    C('kensou','Sie Kensou','Psycho Soldier Team','Rushdown / projétil',[M('Choukyuudan','↓ ↙ ← + A/C'),M('Ryuu Gakusai','→ ↓ ↘ + B/D'),M('Ryuu Renga','↓ ↘ → + A/C'),M('Shinryuu Seikouzan','↓ ↘ → ↓ ↘ → + A/C','super')],'pulo D → C perto → Ryuu Renga','Bom equilíbrio entre pressão e projétil.'),
    C('chin','Chin Gentsai','Psycho Soldier Team','Evasivo / stance',[M('Hyoutan Geki','↓ ↙ ← + A/C'),M('Kaiten Tekitotsu','← ↙ ↓ ↘ → + A/C'),M('Suikan Kanou','↓ ↓ + A/C','postura'),M('Gouran Enpou','↓ ↘ → ↓ ↘ → + A/C','super')],'A baixo → A → Hyoutan Geki','Use postura e movimentos irregulares para quebrar ritmo.'),

    C('leona','Leona Heidern','Ikari Team','Charge / explosão',[M('Moon Slasher','segure ↓, ↑ + A/C'),M('Baltic Launcher','segure ←, → + A/C'),M('X-Calibur','segure ←, → + B/D'),M('V-Slasher','no ar ↓ ↘ → ↘ ↓ ↙ ← + A/C','super')],'B baixo → A baixo → Moon Slasher','Guarde carga enquanto se movimenta defensivamente.'),
    C('ralf','Ralf Jones','Ikari Team','Dano bruto / pressão',[M('Vulcan Punch','A/C repetidamente'),M('Gatling Attack','segure ←, → + A/C'),M('Ralf Kick','← ↙ ↓ ↘ → + B/D'),M('Galactica Phantom','↓ ↘ → ↓ ↘ → + A/C','super')],'C perto → Gatling Attack','Poucos golpes, muito dano; jogue por punição.'),
    C('clark','Clark Still','Ikari Team','Grappler móvel',[M('Super Argentine Backbreaker','→ ↘ ↓ ↙ ← + B/D'),M('Frankensteiner','→ ↓ ↘ + B/D'),M('Gatling Attack','segure ←, → + A/C'),M('Ultra Argentine Backbreaker','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A/C','super')],'A baixo → corrida curta → command grab','Misture ataques rápidos com agarrões.'),

    C('mai','Mai Shiranui','Women Fighters Team','Mobilidade / zoning',[M('Kachousen','↓ ↘ → + A/C'),M('Ryuu Enbu','↓ ↙ ← + A/C'),M('Hissatsu Shinobi Bachi','← ↙ ↓ ↘ → + B/D'),M('Chou Hissatsu Shinobi Bachi','↓ ↙ ← ↙ ↓ ↘ → + B/D','super')],'pulo D → C perto → Ryuu Enbu','Muito móvel no ar; Kachousen força aproximação.'),
    C('yuri','Yuri Sakazaki','Women Fighters Team','Rushdown / mix',[M("Ko'ou Ken",'↓ ↘ → + A/C'),M('Yuri Chou Upper','→ ↓ ↘ + A/C'),M('Raiou Ken','no ar ↓ ↘ → + B/D'),M('Hien Houou Kyaku','↓ ↘ → ↘ ↓ ↙ ← + B/D','super')],'pulo D → C perto → Yuri Chou Upper','Misture saltos curtos com anti-aéreo.'),
    C('maylee','May Lee Jinju','Women Fighters Team','Stance / rushdown',[M('Lightning Needle','↓ ↘ → + A/C'),M('Approach Kick','↓ ↙ ← + B/D'),M('Hero Mode','BC / rota de transformação','muda opções'),M('May Lee Dynamic','rota MAX','super')],'B baixo → A perto → rota de stance','Personagem técnico: treine as transições entre os modos.'),

    C('kim','Kim Kaphwan','Korea Team','Rushdown / chutes',[M('Hangetsuzan','↓ ↙ ← + B/D'),M('Hien Zan','segure ↓, ↑ + B/D'),M('Hishou Kyaku','no ar ↓ ↘ → + B/D'),M('Houou Kyaku','↓ ↙ ← ↙ ↓ ↘ → + B/D','super')],'B baixo → A baixo → Hangetsuzan','Pressão forte com chutes e excelente confirmação.'),
    C('chang','Chang Koehan','Korea Team','Tanque / alcance',[M('Tekkyuu Dai Kaiten','A/C repetidamente'),M('Tekkyuu Funsai Geki','segure ←, → + A/C'),M('Dai Hakai Nage','→ ↘ ↓ ↙ ← + B/D'),M('Tekkyuu Dai Bousou','↓ ↘ → ↘ ↓ ↙ ← + A/C','super')],'C longe → avanço → command grab','Use o enorme alcance e trocas favoráveis.'),
    C('choi','Choi Bounge','Korea Team','Velocidade / aéreo',[M('Kaiten Hien Zan','segure ↓, ↑ + B/D'),M('Hishou Kyaku','no ar ↓ ↘ → + B/D'),M('Tatsumaki Shippuuzan','segure ←, → + A/C'),M('Shin! Chouzetsu Tatsumaki','↓ ↘ → ↓ ↘ → + A/C','super')],'B baixo → A baixo → Kaiten Hien Zan','Velocidade e mudança de lado são sua principal arma.'),

    C('iori','Iori Yagami','96 Team','Rushdown / rekka',[M('Yami Barai','↓ ↘ → + A/C'),M('Oniyaki','→ ↓ ↘ + A/C'),M('Aoi Hana','↓ ↙ ← + A/C ×3'),M('Ya Otome','↓ ↘ → ↘ ↓ ↙ ← + A/C','super')],'pulo C → C perto → →+A → Aoi Hana ×3','Um dos melhores para pressão curta e confirmação.'),
    C('mature','Mature','96 Team','Mobilidade / cortes',[M('Ebony Tears','↓ ↘ → + A/C'),M('Death Row','↓ ↙ ← + A/C'),M('Despair','→ ↓ ↘ + A/C'),M('Heaven’s Gate','↓ ↙ ← ↙ ↓ ↘ → + B/D','super')],'B baixo → A baixo → Death Row','Forte em velocidade e controle horizontal.'),
    C('vice','Vice','96 Team','Grappler / explosão',[M('Deicide','↓ ↙ ← + A/C'),M('Gore Fest','→ ↘ ↓ ↙ ← + A/C','agarrão'),M('Mayhem','↓ ↙ ← + B/D'),M('Negative Gain','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + B/D','super')],'C perto → Gore Fest / Mayhem','Misture normals pesados com command grabs.'),

    C('yamazaki','Ryuji Yamazaki','97 Team','Controle / contra',[M('Serpent Slash','↓ ↙ ← + A/B/C (segure)'),M('Double Return','↓ ↘ → + A/C'),M('Sadomazo','↓ ↙ ← + B/D','contra'),M('Guillotine','↓ ↘ → ↓ ↘ → + A/C','super')],'A baixo → Serpent Slash curto','Excelente para controlar espaço e punir impulsividade.'),
    C('mary','Blue Mary','97 Team','Grappler / mobilidade',[M('Spin Fall','↓ ↙ ← + B/D'),M('Straight Slicer','segure ←, → + B/D'),M('Vertical Arrow','→ ↓ ↘ + B/D'),M('M. Typhoon','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + B/D','super')],'B baixo → A baixo → Vertical Arrow','Use mobilidade para entrar e alternar agarrões.'),
    C('billy','Billy Kane','97 Team','Alcance / zoning',[M('Sansetsukon Chuudan Uchi','← ↙ ↓ ↘ → + A/C'),M('Senpuu Kon','↓ ↙ ← + A/C'),M('Suzume Otoshi','↓ ↙ ← + A/C','anti-aéreo'),M('Dai Senpuu','↓ ↘ → ↓ ↘ → + A/C','super')],'C longe → especial de bastão','Mantenha o oponente na ponta do bastão.'),

    C('yashiro','Yashiro Nanakase','98 Team','Brawler / pressão',[M('Jet Counter','← ↙ ↓ ↘ → + A/C'),M('Upper Duel','→ ↓ ↘ + A/C'),M('Missile Might Bash','↓ ↙ ← + A/C'),M('Final Impact','↓ ↘ → ↓ ↘ → + A/C','super')],'C perto → →+A → Jet Counter','Normals fortes e ótimo dano de confirmação.'),
    C('shermie','Shermie','98 Team','Grappler / mix',[M('Shermie Spiral','→ ↘ ↓ ↙ ← + A/C'),M('Shermie Clutch','→ ↓ ↘ + B/D'),M('Shermie Whip','↓ ↙ ← + A/C'),M('Shermie Flash','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A/C','super')],'B baixo → corrida → Shermie Spiral','Ameace agarrão depois de qualquer aproximação.'),
    C('chris','Chris','98 Team','Velocidade / mix',[M('Slide Touch','↓ ↘ → + A/C'),M('Hunting Air','→ ↓ ↘ + B/D'),M('Shooting Dancer','→ ↘ ↓ ↙ ← + A/C ou B/D'),M('Chain Slide Touch','↓ ↘ → ↓ ↘ → + A/C','super')],'B baixo → A baixo → Slide Touch','Muito rápido; abuse de saltos curtos e mudança de lado.'),

    C('k','K’','99 Team','Setplay / pressão',[M('Ein Trigger','↓ ↘ → + A/C'),M('Second Shoot','após Ein Trigger → + B'),M('Crow Bites','→ ↓ ↘ + A/C'),M('Heat Drive','↓ ↘ → ↓ ↘ → + A/C','super')],'B baixo → A baixo → Ein Trigger → Second Shoot','Ein Trigger é o centro do jogo de pressão.'),
    C('maxima','Maxima','99 Team','Armadura / dano',[M('Vapor Cannon','↓ ↙ ← + A/C'),M('Maxima Press','→ ↘ ↓ ↙ ← + B/D'),M('System 1: Maxima Scramble','↓ ↘ → + A/C'),M('Bunker Buster','↓ ↘ → ↓ ↘ → + A/C','super')],'C perto → Vapor Cannon','Troque golpes usando armadura e alto dano.'),
    C('whip','Whip','99 Team','Long range / controle',[M('Boomerang Shot','← ↙ ↓ ↘ → + A/C'),M('String Shot','↓ ↙ ← + A/B/C'),M('Assassin Strike','segure ↓, ↑ + A/C'),M('Sonic Slaughter','↓ ↙ ← ↙ ↓ ↘ → + A/C','super')],'C longe → String Shot','Controle a distância e evite ficar presa no corpo a corpo.'),

    C('vanessa','Vanessa','2000 Team','Boxe / rushdown',[M('Puncher Straight','↓ ↘ → + A/C'),M('Forbidden Eagle','→ ↓ ↘ + A/C'),M('Machine Gun Punch','← ↙ ↓ ↘ → + A/C'),M('Crazy Puncher','↓ ↘ → ↓ ↘ → + A/C','super')],'B baixo → A baixo → Puncher Straight','Pressão rápida e cancels curtos.'),
    C('seth','Seth','2000 Team','Mix / mobilidade',[M('Shoot Kick','↓ ↘ → + B/D'),M('Rolling Sobat','↓ ↙ ← + B/D'),M('Body Blow','← ↙ ↓ ↘ → + A/C'),M('Doh-Koh','↓ ↙ ← ↓ ↙ ← + B/D','super')],'B baixo → A → Shoot Kick','Troque níveis de ataque e use a mobilidade.'),
    C('ramon','Ramon','2000 Team','Grappler veloz',[M('Tiger Neck Chancery','→ ↘ ↓ ↙ ← + A/C'),M('Rolling Sobat','↓ ↙ ← + B/D'),M('Tiger Road','↓ ↙ ← + A/C'),M('El Diablo Amarillo Ramon','↓ ↘ → ↓ ↘ → + A/C','super')],'A baixo → corrida → Tiger Neck Chancery','Grappler muito móvel; ameace corrida + agarrão.'),

    C('kula','Kula Diamond','2001 Team','Controle / gelo',[M('Diamond Breath','↓ ↘ → + A/C'),M('Crow Bites','→ ↓ ↘ + A/C'),M('Ray Spin','↓ ↙ ← + B/D'),M('Diamond Edge','↓ ↘ → ↓ ↘ → + A/C','super')],'B baixo → A baixo → Diamond Breath','Congele ritmo do rival e confirme em Ray Spin.'),
    C('k9999','K9999','2001 Team','Dano / alcance especial',[M('Get Lost!','↓ ↘ → + A/C'),M('Shut Up!','↓ ↙ ← + A/C'),M('Moon…','→ ↓ ↘ + A/C'),M('This Is… Me!','rota de super / MAX','super')],'B baixo → A baixo → especial curto','Moveset incomum: memorize o alcance de cada braço transformado.'),
    C('angel','Ángel','2001 Team','Unchain / mix técnico',[M('Unchain Start','normais específicos → rota Unchain'),M('Formalists’ Blue','→ + B'),M('Senseless Fists','rota Unchain + A/C'),M('Winds Fairground','rota MAX','super')],'B baixo → A → entrada Unchain → finalizador','Técnica: aprenda 1 rota curta antes de tentar sequências longas.'),

    C('orochi-yashiro','Orochi Yashiro','Orochi Team','Grappler / potência',[M('Niragu Daichi','→ ↘ ↓ ↙ ← + A/C'),M('Odoru Daichi','↓ ↙ ← + B/D'),M('Musebu Daichi','→ ↓ ↘ + A/C'),M('Ankoku Jigoku Gokuraku Otoshi','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A/C','super')],'C perto → command grab','Mais focado em agarrões que o Yashiro normal.'),
    C('orochi-shermie','Orochi Shermie','Orochi Team','Zoning / eletricidade',[M('Mugetsu no Rai','↓ ↙ ← + A/C'),M('Yatanagi no Muchi','↓ ↘ → + A/C'),M('Shajitsu no Odori','→ ↓ ↘ + B/D'),M('Ankoku Raikouken','↓ ↘ → ↓ ↘ → + A/C','super')],'A baixo → Yatanagi no Muchi','Controle tela com eletricidade e punições de média distância.'),
    C('orochi-chris','Orochi Chris','Orochi Team','Rushdown / fogo',[M('Taiyou o Iru Honoo','↓ ↘ → + A/C'),M('Tsuki o Tsumu Honoo','→ ↓ ↘ + A/C'),M('Shishi o Kamu Honoo','↓ ↙ ← + A/C'),M('Daichi o Harau Gouka','↓ ↘ → ↓ ↘ → + A/C','super')],'B baixo → A baixo → Taiyou o Iru Honoo','Rushdown muito rápido com ótima conversão.'),

    C('kusanagi','Kusanagi','Edit Character','Pressão / Kyo clássico',[M('Yami Barai','↓ ↘ → + A/C'),M('Oniyaki','→ ↓ ↘ + A/C'),M('75 Shiki Kai','↓ ↘ → + B/D, B/D'),M('Orochi Nagi','↓ ↙ ← ↙ ↓ ↘ → + A/C','super')],'pulo C → C perto → 75 Shiki Kai','Versão clássica de Kyo: simples e agressiva.'),
    C('rugal','Omega Rugal','Boss','Boss / zoning / dano',[M('Reppuken','↓ ↘ → + A/C'),M('Genocide Cutter','→ ↓ ↘ + B/D','anti-aéreo'),M('God Press','← ↙ ↓ ↘ → + A/C'),M('Gigantic Pressure','↓ ↘ → ↘ ↓ ↙ ← + A/C','super')],'C perto → God Press / Genocide Cutter','Alcance, dano e anti-aéreo muito fortes.')
  ];


  // V19.10.0 — perfis refeitos a partir da command list dedicada ao
  // The King of Fighters 2002 Magic Plus II (Bootleg), páginas 5–49.
  // As direções são RELATIVAS (f = frente; b = trás) para que o macro possa ser espelhado.
  const QCF = ['d','df','f'];
  const QCB = ['d','db','b'];
  const HCF = ['b','db','d','df','f'];
  const HCB = ['f','df','d','db','b'];
  const CAT = (...parts) => parts.flat().filter((token,index,all) => index === 0 || token !== all[index-1]);
  const DIR = dir => ({dir});
  const BTN = btn => ({btn});
  const WAIT = frames => ({wait:frames});
  const HOLD = (btn,frames=12) => ({holdBtn:btn,frames});
  const Rel = (name,command,steps,button,page,opts={}) => S(
    name,
    command,
    Object.assign({type:'relative',steps:[...(steps||[])],button,activateMax:false,source:'KOF 2002 Magic Plus II',sourcePage:page},opts),
    opts.note || ''
  );
  const Script = (name,command,script,page,opts={}) => S(
    name,
    command,
    Object.assign({type:'script',script:[...(script||[])],activateMax:false,source:'KOF 2002 Magic Plus II',sourcePage:page},opts),
    opts.note || ''
  );

  const magicPlusSpecials = {
    kyo: { page:5,
      dm: Rel('Ura 108 Shiki: Orochi Nagi','↓ ↙ ← ↙ ↓ ↘ → + C',CAT(QCB,HCF),'c',5),
      sdm: Rel('Ura 108 Shiki: Orochi Nagi MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',5,{activateMax:true}),
      hsdm: Rel('524 Shiki: Kamukura','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',5,{activateMax:true,close:true}) },
    benimaru: { page:6,
      dm: Rel('Raikou Ken','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',6),
      sdm: Rel('Raikou Ken MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',6,{activateMax:true}),
      hsdm: Rel('Raijin Ten','→ ↙ ↘ ← → + A', ['f','db','df','b','f'],'a',6,{activateMax:true}) },
    daimon: { page:7,
      dm: Rel('Jigoku Gokuraku Otoshi','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',7,{close:true}),
      sdm: Rel('Jigoku Gokuraku Otoshi MAX','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',7,{activateMax:true,close:true}),
      hsdm: Rel('Fuurinkazan','→ ↓ ↘ ← ↓ ↙ + B+C',['f','d','df','b','d','db'],'bc',7,{activateMax:true}) },
    terry: { page:8,
      dm: Rel('Power Geyser','↓ ↙ ← ↙ → + C',['d','db','b','db','f'],'c',8),
      sdm: Rel('Power Geyser MAX','↓ ↙ ← ↙ → + A+C',['d','db','b','db','f'],'ac',8,{activateMax:true}),
      hsdm: Rel('Rising Force','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',8,{activateMax:true}) },
    andy: { page:9,
      dm: Rel('Chou Reppa Dan','↓ ↙ ← ↙ ↓ ↘ → + D',CAT(QCB,HCF),'d',9),
      sdm: Rel('Chou Reppa Dan MAX','↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',9,{activateMax:true}),
      hsdm: Script('Zan-ei Shitou Reppadan','↓ ↘ → ↓ ↘ → + A+C, depois B+C+D',[...QCF.map(DIR),...QCF.map(DIR),BTN('ac'),WAIT(2),BTN('bcd')],9,{activateMax:true}) },
    joe: { page:10,
      dm: Rel('Screw Upper','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',10),
      sdm: Rel('Screw Upper MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',10,{activateMax:true}),
      hsdm: Rel('Cross Gigantes','↓ ↘ → ↓ ↘ → + B+D',CAT(QCF,QCF),'bd',10,{activateMax:true}) },
    ryo: { page:11,
      dm: Rel('Haoh Shokou Ken','→ ← ↙ ↓ ↘ → + C',CAT(['f'],HCF),'c',11),
      sdm: Script('Ryuuko Ranbu MAX','↓ ↘ → + C, A',[...QCF.map(DIR),BTN('c'),WAIT(1),BTN('a')],11,{activateMax:true}),
      hsdm: Rel('Tenchi Haoh Ken','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',11,{activateMax:true}) },
    robert: { page:12,
      dm: Rel('Haoh Shokou Ken','→ ← ↙ ↓ ↘ → + C',CAT(['f'],HCF),'c',12),
      sdm: Rel('Ryuuko Ranbu MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',12,{activateMax:true}),
      hsdm: Rel('Gansou Ryuuko Ranbu','↓ ↘ → ↘ ↓ ↙ ← + B+D',CAT(QCF,HCB),'bd',12,{activateMax:true}) },
    takuma: { page:13,
      dm: Rel('Ryuuko Ranbu','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',13),
      sdm: Rel('Ryuuko Ranbu MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',13,{activateMax:true}),
      hsdm: Rel('Mouko Shin Kishin Geki','← → ↓ ↘ + A+C',['b','f','d','df'],'ac',13,{activateMax:true}) },
    leona: { page:14,
      dm: Rel('V-Slasher','no ar ↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',14,{air:true}),
      sdm: Rel('V-Slasher MAX','no ar ↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',14,{activateMax:true,air:true}),
      hsdm: Rel('Rebel Spark','modo Orochi: ↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',14,{activateMax:true,conditional:'Requer Leona em Orochi Mode.',preScript:[DIR('u'),DIR('d'),DIR('u'),DIR('d'),DIR('u'),DIR('d'),BTN('bd'),WAIT(10)]}) },
    ralf: { page:15,
      dm: Rel('Bari Bari Vulcan Punch','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',15),
      sdm: Rel('Bari Bari Vulcan Punch MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',15,{activateMax:true}),
      hsdm: Rel('Umanori Galactica Phantom','↓ ↙ ← ↙ ↓ ↘ → ↓ ↘ → + A+D',CAT(QCB,HCF,QCF),'ad',15,{activateMax:true}) },
    clark: { page:16,
      dm: Rel('Ultra Argentine Backbreaker','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',16,{close:true}),
      sdm: Rel('Ultra Argentine Backbreaker MAX','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',16,{activateMax:true,close:true}),
      hsdm: Rel('Running Pirate','← ↙ ↓ ↘ → ← ↙ ↓ ↘ → + B+D',CAT(HCF,HCF),'bd',16,{activateMax:true}) },
    athena: { page:17,
      dm: Rel('Shining Crystal Bit','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',17),
      sdm: Rel('Shining Crystal Bit MAX','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',17,{activateMax:true}),
      hsdm: Script('Psycho Medley','↓ ↘ → + A+B+C+D · D,C,B,D,C,B,A · ↓ ↘ → + B+C',[...QCF.map(DIR),BTN('abcd'),WAIT(2),BTN('d'),BTN('c'),BTN('b'),BTN('d'),BTN('c'),BTN('b'),BTN('a'),...QCF.map(DIR),BTN('bc')],17,{activateMax:true}) },
    kensou: { page:18,
      dm: Rel('Shinryuu Seioh Rekkyaku','↓ ↘ → ↘ ↓ ↙ ← + B',CAT(QCF,HCB),'b',18),
      sdm: Rel('Senki Hakkei','perto ↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',18,{activateMax:true,close:true}),
      hsdm: Rel('Seigan Rai Ryuu','↓ ↘ → ↓ ↘ → + B+D',CAT(QCF,QCF),'bd',18,{activateMax:true}) },
    chin: { page:19,
      dm: Rel('Gouran Enpou','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',19),
      sdm: Rel('Gouran Enpou MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',19,{activateMax:true}),
      hsdm: Rel('Suisou Enbu','↓ ↘ → ↓ ↘ → + B+D',CAT(QCF,QCF),'bd',19,{activateMax:true}) },
    mai: { page:20,
      dm: Rel('Chou Hissatsu Shinobi Bachi','↓ ↙ ← ↙ ↓ ↘ → + D',CAT(QCB,HCF),'d',20),
      sdm: Rel('Chou Hissatsu Shinobi Bachi MAX','↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',20,{activateMax:true}),
      hsdm: Script('Shiranui-ryuu: Kubi no Kitsune','D, B, C, C, ↑',[BTN('d'),BTN('b'),BTN('c'),BTN('c'),DIR('u')],20,{activateMax:true}) },
    yuri: { page:21,
      dm: Rel('Hien Houou Kyaku','↓ ↘ → ↘ ↓ ↙ ← + D',CAT(QCF,HCB),'d',21),
      sdm: Rel('Shin! Chou Upper','↓ ↘ → ↓ ↘ → + B+D',CAT(QCF,QCF),'bd',21,{activateMax:true}),
      hsdm: Rel('"Ei!" Hien Houou Kyaku','→ ← → ↘ ↓ ↙ ← + B+D',['f','b',...HCB],'bd',21,{activateMax:true}) },
    maylee: { page:22,
      dm: Rel('Beast God Kick','↓ ↙ ← ↓ ↙ ← + D',CAT(QCB,QCB),'d',22),
      sdm: Script('Disposition Frog','A+C · B+D · A+B+C',[BTN('ac'),WAIT(1),BTN('bd'),WAIT(1),BTN('abc')],22,{activateMax:true}),
      hsdm: Script('Key of Victory','Hero Mode: →, B, C, →, C',[DIR('f'),BTN('b'),BTN('c'),DIR('f'),BTN('c')],22,{activateMax:true,conditional:'Requer Hero Mode.',preScript:[BTN('abc'),WAIT(8)]}) },
    kim: { page:23,
      dm: Rel('Houou Kyaku','↓ ↙ ← ↙ → + D',['d','db','b','db','f'],'d',23),
      sdm: Rel('Kuuchuu Houou Kyaku','no ar ↓ ↙ ← ↙ → + B+D',['d','db','b','db','f'],'bd',23,{activateMax:true,air:true}),
      hsdm: Rel('Zero Kyori Houou Kyaku','perto ↓ ↙ ← ↙ → + A+B+C+D',['d','db','b','db','f'],'abcd',23,{activateMax:true,close:true}) },
    chang: { page:24,
      dm: Rel('Tekkyuu Dai Bousou','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',24),
      sdm: Rel('Tekkyuu Dai Assatsu','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',24,{activateMax:true}),
      hsdm: Script('Tekkyuu Dai Sekai','B, A, ↘, C, A',[BTN('b'),BTN('a'),DIR('df'),BTN('c'),BTN('a')],24,{activateMax:true}) },
    choi: { page:25,
      dm: Rel('Shin! Chouzetsu Tatsumaki Shinkuu Zan','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',25),
      sdm: Rel('Houou Kyaku MAX','↓ ↘ → ↘ ↓ ↙ ← + B+D',CAT(QCF,HCB),'bd',25,{activateMax:true}),
      hsdm: Rel('Shakushi','no ar ← ↙ ↓ ↘ → ← ↙ ↓ ↘ → + A+C',CAT(HCF,HCF),'ac',25,{activateMax:true,air:true}) },
    iori: { page:26,
      dm: Rel('Kin 1211 Shiki: Ya Otome','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',26),
      sdm: Rel('Kin 1211 Shiki: Ya Otome MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',26,{activateMax:true}),
      hsdm: Rel('Ura 1219 Shiki: En’ou','↓ ↙ ← ↙ ↓ ↘ → ← → + A+C',CAT(QCB,HCF,['b','f']),'ac',26,{activateMax:true}) },
    mature: { page:27,
      dm: Rel('Heaven’s Gate','↓ ↙ ← ↙ ↓ ↘ → + D',CAT(QCB,HCF),'d',27),
      sdm: Rel('Heaven’s Gate MAX','↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',27,{activateMax:true}),
      hsdm: Script('Ecstasy 816','→, D, C, B, →',[DIR('f'),BTN('d'),BTN('c'),BTN('b'),DIR('f')],27,{activateMax:true}) },
    vice: { page:28,
      dm: Rel('Negative Gain','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + D',CAT(HCB,HCB),'d',28,{close:true}),
      sdm: Rel('Negative Gain MAX','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + B+D',CAT(HCB,HCB),'bd',28,{activateMax:true,close:true}),
      hsdm: Rel('Overkill','no ar/perto ↙ ↓ ↘ → ↗ ↑ ↓ + A+C',['db','d','df','f','uf','u','d'],'ac',28,{activateMax:true,air:true,close:true}) },
    yamazaki: { page:29,
      dm: Rel('Guillotine','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',29),
      sdm: Rel('Guillotine MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',29,{activateMax:true}),
      hsdm: Rel('….!!','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + B+D',CAT(HCB,HCB),'bd',29,{activateMax:true,close:true}) },
    mary: { page:30,
      dm: Rel('M. Splash Rose','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',30),
      sdm: Script('M. Dynamite Swing','A, A, ←, B, C',[BTN('a'),BTN('a'),DIR('b'),BTN('b'),BTN('c')],30,{activateMax:true}),
      hsdm: Rel('M. Typhoon','↙ ↓ ↘ → ↗ ↑ ↓ + B+D',['db','d','df','f','uf','u','d'],'bd',30,{activateMax:true,close:true}) },
    billy: { page:31,
      dm: Rel('Chou Kaen Senpuu Kon','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',31),
      sdm: Rel('Dai Senpuu MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',31,{activateMax:true}),
      hsdm: Rel('Liar Elemental / Ifrit Crisis','↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',31,{activateMax:true}) },
    yashiro: { page:32,
      dm: Rel('Final Impact','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',32),
      sdm: Rel('Final Impact MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',32,{activateMax:true}),
      hsdm: Rel('[ERROR] CODE 2002','↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',32,{activateMax:true}) },
    shermie: { page:33,
      dm: Rel('Shermie Flash','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',33,{close:true}),
      sdm: Rel('Shermie Flash MAX','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',33,{activateMax:true,close:true}),
      hsdm: Rel('Inazuma Leg Lariat','perto ↓ ↘ → → ↓ ↘ + B+D',['d','df','f','f','d','df'],'bd',33,{activateMax:true,close:true}) },
    chris: { page:34,
      dm: Rel('Chain Slide Touch','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',34),
      sdm: Rel('Chain Slide Touch MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',34,{activateMax:true}),
      hsdm: Rel('Honoo no Sadame no Chris','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',34,{activateMax:true,conditional:'Transforma Chris em Orochi Chris.'}) },
    "k": { page:35,
      dm: Rel('Heat Drive','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',35),
      sdm: Rel('Chain Drive MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',35,{activateMax:true}),
      hsdm: Script('Crimson Star Road','↓ ↙ ← + C~A',[...QCB.map(DIR),BTN('c'),WAIT(1),BTN('a')],35,{activateMax:true}) },
    maxima: { page:36,
      dm: Rel('Bunker Buster','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',36),
      sdm: Rel('Maxima Revenger','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + B+D',CAT(HCB,HCB),'bd',36,{activateMax:true,close:true}),
      hsdm: Script('Arc Enemy','→, B, C, →, C',[DIR('f'),BTN('b'),BTN('c'),DIR('f'),BTN('c')],36,{activateMax:true}) },
    whip: { page:37,
      dm: Rel('Sonic Slaughter','↓ ↙ ← ↙ ↓ ↘ → + C',CAT(QCB,HCF),'c',37),
      sdm: Rel('Sonic Slaughter MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',37,{activateMax:true}),
      hsdm: Script('Super Black Hawk','←, B, C, ←, C',[DIR('b'),BTN('b'),BTN('c'),DIR('b'),BTN('c')],37,{activateMax:true}) },
    vanessa: { page:38,
      dm: Rel('Crazy Puncher','↓ ↙ ← ↙ ↓ ↘ → + C',CAT(QCB,HCF),'c',38),
      sdm: Rel('Crazy Puncher MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',38,{activateMax:true}),
      hsdm: Rel('Gaia Gear','→ ← ↙ ↓ ↘ → + A+C',CAT(['f'],HCF),'ac',38,{activateMax:true}) },
    seth: { page:39,
      dm: Rel('Morote Sho-Yoh','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',39),
      sdm: Rel('Doh-Tori-Shichimonsatsu','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',39,{activateMax:true}),
      hsdm: Rel('Sigure-Rangiku','perto → ← ↙ ↓ ↘ → + A+C',CAT(['f'],HCF),'ac',39,{activateMax:true,close:true}) },
    ramon: { page:40,
      dm: Rel('Savage Fire Cat','↓ ↘ → ↘ ↓ ↙ ← + D',CAT(QCF,HCB),'d',40),
      sdm: Rel('Tiger Spin','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',40,{activateMax:true,close:true}),
      hsdm: Rel('Hypnotic Tiger','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',40,{activateMax:true}) },
    kula: { page:41,
      dm: Rel('Diamond Edge','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',41),
      sdm: Rel('Freeze Execution','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',41,{activateMax:true}),
      hsdm: Script('Freeze Completion','A+C · B+D · A+B+C',[BTN('ac'),WAIT(1),BTN('bd'),WAIT(1),BTN('abc')],41,{activateMax:true}) },
    k9999: { page:42,
      dm: Rel('Moon…','↙ → ↘ ↓ ↙ ← ↘ + C',['db','f','df','d','db','b','df'],'c',42),
      sdm: Rel('Power… Goes Wild!','↓ → ↘ + A+B+C+D',['d','f','df'],'abcd',42,{activateMax:true}),
      hsdm: Rel('Kore wa, maru de…!!','→ ← → ← → ← → ←',['f','b','f','b','f','b','f','b'],null,42,{activateMax:true}) },
    angel: { page:43,
      dm: Rel('Loyalty Test for the Liberalists','UC Circle: ← → ↓ ↘ + C',['b','f','d','df'],'c',43,{conditional:'Requer estar no Unchain Circle (UC Circle).'}),
      sdm: Rel('Wind’s Fairground','contra ataque terrestre: ← → ↓ ↘ + B+D',['b','f','d','df'],'bd',43,{activateMax:true,conditional:'É um contra-ataque: precisa receber ataque terrestre na janela.'}),
      hsdm: Script('Survivor’s Banquet','Blue Monday Parade contra ataque aéreo (← → ↓ ↘ + B+D), depois B+C+D',[DIR('b'),DIR('f'),DIR('d'),DIR('df'),BTN('bd'),WAIT(3),HOLD('bcd',12)],43,{activateMax:true,conditional:'Precisa disparar Blue Monday Parade contra um ataque aéreo e então pressionar B+C+D.'}) },
    'orochi-yashiro': { page:45,
      dm: Rel('Ankoku Jigoku Gokuraku Otoshi','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',45,{close:true}),
      sdm: Rel('Ankoku Jigoku Gokuraku Otoshi MAX','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',45,{activateMax:true,close:true}),
      hsdm: Script('Armageddon / Final Battle','B · D · A · A+B+C',[BTN('b'),BTN('d'),BTN('a'),BTN('abc')],45,{activateMax:true}) },
    'orochi-shermie': { page:46,
      dm: Rel('Ankoku Raikou Ken','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',46),
      sdm: Rel('Ankoku Raikou Ken MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',46,{activateMax:true}),
      hsdm: Script('Raikou / Unmei no Ya','B · A · ← · A · A/B/C/D',[BTN('b'),BTN('a'),DIR('b'),BTN('a'),BTN('c')],46,{activateMax:true}) },
    'orochi-chris': { page:47,
      dm: Rel('Ankoku Orochi Nagi','↓ ↙ ← ↙ ↓ ↘ → + C',CAT(QCB,HCF),'c',47),
      sdm: Rel('Ankoku Orochi Nagi MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',47,{activateMax:true}),
      hsdm: Script('Sanagi wo Yaburi Chou wa Mau','D · C · ↓ · C · D',[BTN('d'),BTN('c'),DIR('d'),BTN('c'),BTN('d')],47,{activateMax:true}) },
    kusanagi: { page:48,
      dm: Rel('Ura 108 Shiki: Orochi Nagi','↓ ↙ ← ↙ ↓ ↘ → + C',CAT(QCB,HCF),'c',48),
      sdm: Rel('Ura 108 Shiki: Orochi Nagi MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',48,{activateMax:true}),
      hsdm: Rel('Saishuu Kessen Ougi: Mu Shiki','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',48,{activateMax:true}) },
    rugal: { page:49,
      dm: Rel('Gigantic Pressure','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',49),
      sdm: Rel('Gigantic Pressure MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',49,{activateMax:true}),
      hsdm: Rel('Kaiser Phoenix','← ↙ ↓ ↘ → ← ↙ ↓ ↘ → + A+C',CAT(HCF,HCF),'ac',49,{activateMax:true}) }
  };

  for (const fighter of roster) {
    const profile = magicPlusSpecials[fighter.id];
    fighter.magicPlusPage = profile?.page || null;
    fighter.specialSource = 'The King of Fighters 2002 Magic Plus II - Arcade - Commands/Moves (GamesDatabase)';
    fighter.dm = profile?.dm || null;
    fighter.sdm = profile?.sdm || null;
    fighter.hsdm = profile?.hsdm || null;
    fighter.dmMoves = fighter.dm ? [fighter.dm] : [];
    fighter.sdmMoves = fighter.sdm ? [fighter.sdm] : [];
    fighter.hsdmMoves = fighter.hsdm ? [fighter.hsdm] : [];
  }

  window.GG_KOF_CATALOG = Object.freeze({
    version: '19.10.0',
    notation: {
      A:'soco fraco', B:'chute fraco', C:'soco forte', D:'chute forte',
      MAX:'B + C', ESQUIVA:'A + B', DM:'Super comum do personagem', SDM:'Super Desperation Move / MAX do personagem', HSDM:'Hidden SDM / MAX2 do personagem',
      note:'V19.10.0: DM, SDM/MAX e HSDM/MAX2 refeitos personagem por personagem pela command list dedicada ao KOF 2002 Magic Plus II (Bootleg). Os macros usam direções relativas ao lado para espelhar automaticamente os comandos.'
    },
    roster
  });
})();
