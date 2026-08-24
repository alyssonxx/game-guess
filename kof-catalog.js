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
      hsdm: Rel('524 Shiki: Kamukura','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',5,{activateMax:false,close:true}) },
    benimaru: { page:6,
      dm: Rel('Raikou Ken','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',6),
      sdm: Rel('Raikou Ken MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',6,{activateMax:true}),
      hsdm: Rel('Raijin Ten','→ ↙ ↘ ← → + A', ['f','db','df','b','f'],'a',6,{activateMax:false}) },
    daimon: { page:7,
      dm: Rel('Jigoku Gokuraku Otoshi','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',7,{close:true}),
      sdm: Rel('Jigoku Gokuraku Otoshi MAX','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',7,{activateMax:true,close:true}),
      hsdm: Rel('Fuurinkazan','→ ↓ ↘ ← ↓ ↙ + B+C',['f','d','df','b','d','db'],'bc',7,{activateMax:false}) },
    terry: { page:8,
      dm: Rel('Power Geyser','↓ ↙ ← ↙ → + C',['d','db','b','db','f'],'c',8),
      sdm: Rel('Power Geyser MAX','↓ ↙ ← ↙ → + A+C',['d','db','b','db','f'],'ac',8,{activateMax:true}),
      hsdm: Rel('Rising Force','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',8,{activateMax:false}) },
    andy: { page:9,
      dm: Rel('Chou Reppa Dan','↓ ↙ ← ↙ ↓ ↘ → + D',CAT(QCB,HCF),'d',9),
      sdm: Rel('Chou Reppa Dan MAX','↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',9,{activateMax:true}),
      hsdm: Script('Zan-ei Shitou Reppadan','↓ ↘ → ↓ ↘ → + A+C, depois B+C+D',[...QCF.map(DIR),...QCF.map(DIR),BTN('ac'),WAIT(2),BTN('bcd')],9,{activateMax:false}) },
    joe: { page:10,
      dm: Rel('Screw Upper','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',10),
      sdm: Rel('Screw Upper MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',10,{activateMax:true}),
      hsdm: Rel('Cross Gigantes','↓ ↘ → ↓ ↘ → + B+D',CAT(QCF,QCF),'bd',10,{activateMax:false}) },
    ryo: { page:11,
      dm: Rel('Haoh Shokou Ken','→ ← ↙ ↓ ↘ → + C',CAT(['f'],HCF),'c',11),
      sdm: Script('Ryuuko Ranbu MAX','↓ ↘ → + C, A',[...QCF.map(DIR),BTN('c'),WAIT(1),BTN('a')],11,{activateMax:true}),
      hsdm: Rel('Tenchi Haoh Ken','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',11,{activateMax:false}) },
    robert: { page:12,
      dm: Rel('Haoh Shokou Ken','→ ← ↙ ↓ ↘ → + C',CAT(['f'],HCF),'c',12),
      sdm: Rel('Ryuuko Ranbu MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',12,{activateMax:true}),
      hsdm: Rel('Gansou Ryuuko Ranbu','↓ ↘ → ↘ ↓ ↙ ← + B+D',CAT(QCF,HCB),'bd',12,{activateMax:false}) },
    takuma: { page:13,
      dm: Rel('Ryuuko Ranbu','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',13),
      sdm: Rel('Ryuuko Ranbu MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',13,{activateMax:true}),
      hsdm: Rel('Mouko Shin Kishin Geki','← → ↓ ↘ + A+C',['b','f','d','df'],'ac',13,{activateMax:false}) },
    leona: { page:14,
      dm: Rel('V-Slasher','no ar ↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',14,{air:true}),
      sdm: Rel('V-Slasher MAX','no ar ↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',14,{activateMax:true,air:true}),
      hsdm: Rel('Rebel Spark','modo Orochi: ↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',14,{activateMax:false,conditional:'Requer Leona em Orochi Mode.',preScript:[DIR('u'),DIR('d'),DIR('u'),DIR('d'),DIR('u'),DIR('d'),BTN('bd'),WAIT(10)]}) },
    ralf: { page:15,
      dm: Rel('Bari Bari Vulcan Punch','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',15),
      sdm: Rel('Bari Bari Vulcan Punch MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',15,{activateMax:true}),
      hsdm: Rel('Umanori Galactica Phantom','↓ ↙ ← ↙ ↓ ↘ → ↓ ↘ → + A+D',CAT(QCB,HCF,QCF),'ad',15,{activateMax:false}) },
    clark: { page:16,
      dm: Rel('Ultra Argentine Backbreaker','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',16,{close:true}),
      sdm: Rel('Ultra Argentine Backbreaker MAX','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',16,{activateMax:true,close:true}),
      hsdm: Rel('Running Pirate','← ↙ ↓ ↘ → ← ↙ ↓ ↘ → + B+D',CAT(HCF,HCF),'bd',16,{activateMax:false}) },
    athena: { page:17,
      dm: Rel('Shining Crystal Bit','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',17),
      sdm: Rel('Shining Crystal Bit MAX','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',17,{activateMax:true}),
      hsdm: Script('Psycho Medley','↓ ↘ → + A+B+C+D · D,C,B,D,C,B,A · ↓ ↘ → + B+C',[...QCF.map(DIR),BTN('abcd'),WAIT(2),BTN('d'),BTN('c'),BTN('b'),BTN('d'),BTN('c'),BTN('b'),BTN('a'),...QCF.map(DIR),BTN('bc')],17,{activateMax:false}) },
    kensou: { page:18,
      dm: Rel('Shinryuu Seioh Rekkyaku','↓ ↘ → ↘ ↓ ↙ ← + B',CAT(QCF,HCB),'b',18),
      sdm: Rel('Senki Hakkei','perto ↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',18,{activateMax:true,close:true}),
      hsdm: Rel('Seigan Rai Ryuu','↓ ↘ → ↓ ↘ → + B+D',CAT(QCF,QCF),'bd',18,{activateMax:false}) },
    chin: { page:19,
      dm: Rel('Gouran Enpou','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',19),
      sdm: Rel('Gouran Enpou MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',19,{activateMax:true}),
      hsdm: Rel('Suisou Enbu','↓ ↘ → ↓ ↘ → + B+D',CAT(QCF,QCF),'bd',19,{activateMax:false}) },
    mai: { page:20,
      dm: Rel('Chou Hissatsu Shinobi Bachi','↓ ↙ ← ↙ ↓ ↘ → + D',CAT(QCB,HCF),'d',20),
      sdm: Rel('Chou Hissatsu Shinobi Bachi MAX','↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',20,{activateMax:true}),
      hsdm: Script('Shiranui-ryuu: Kubi no Kitsune','D, B, C, C, ↑',[BTN('d'),BTN('b'),BTN('c'),BTN('c'),DIR('u')],20,{activateMax:false}) },
    yuri: { page:21,
      dm: Rel('Hien Houou Kyaku','↓ ↘ → ↘ ↓ ↙ ← + D',CAT(QCF,HCB),'d',21),
      sdm: Rel('Mekki Zan Kuuga / Shin! Chou Upper','↓ ↘ → ↓ ↘ → + B+D',CAT(QCF,QCF),'bd',21,{activateMax:true}),
      hsdm: Rel('"Ei!" Hien Houou Kyaku','→ ← → ↘ ↓ ↙ ← + B+D',['f','b',...HCB],'bd',21,{activateMax:false}) },
    maylee: { page:22,
      dm: Rel('Shinjuu Kyaku (Beast God Kick)','↓ ↙ ← ↓ ↙ ← + D',CAT(QCB,QCB),'d',22),
      sdm: Script('Disposition Frog','D · A+B+C (atalho Magic Plus II)',[BTN('d'),WAIT(1),BTN('abc')],22,{activateMax:true,note:'Atalho simplificado do Magic Plus II. Sequência completa também aceita: A+C · B+D · A+B+C.'}),
      hsdm: Script('Key of Victory','Hero Mode: →, B, C, →, C',[DIR('f'),BTN('b'),BTN('c'),DIR('f'),BTN('c')],22,{activateMax:false,conditional:'Requer Hero Mode.',preScript:[BTN('abc'),WAIT(8)]}) },
    kim: { page:23,
      dm: Rel('Houou Kyaku','↓ ↙ ← ↙ → + D',['d','db','b','db','f'],'d',23),
      sdm: Rel('Kuuchuu Houou Kyaku','no ar ↓ ↙ ← ↙ → + B+D',['d','db','b','db','f'],'bd',23,{activateMax:true,air:true}),
      hsdm: Rel('Zero Kyori Houou Kyaku','perto ↓ ↙ ← ↙ → + A+B+C+D',['d','db','b','db','f'],'abcd',23,{activateMax:false,close:true}) },
    chang: { page:24,
      dm: Rel('Tekkyuu Dai Bousou','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',24),
      sdm: Rel('Tekkyuu Dai Assatsu','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',24,{activateMax:true}),
      hsdm: Script('Tekkyuu Dai Sekai','B, A, ↘, C, A',[BTN('b'),BTN('a'),DIR('df'),BTN('c'),BTN('a')],24,{activateMax:false}) },
    choi: { page:25,
      dm: Rel('Shin! Chouzetsu Tatsumaki Shinkuu Zan','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',25),
      sdm: Rel('Houou Kyaku MAX','↓ ↘ → ↘ ↓ ↙ ← + B+D',CAT(QCF,HCB),'bd',25,{activateMax:true}),
      hsdm: Rel('Shakushi','no ar ← ↙ ↓ ↘ → ← ↙ ↓ ↘ → + A+C',CAT(HCF,HCF),'ac',25,{activateMax:false,air:true}) },
    iori: { page:26,
      dm: Rel('Kin 1211 Shiki: Ya Otome','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',26),
      sdm: Rel('Kin 1211 Shiki: Ya Otome MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',26,{activateMax:true}),
      hsdm: Rel('Ura 1219 Shiki: En’ou','↓ ↙ ← ↙ ↓ ↘ → ← → + A+C',CAT(QCB,HCF,['b','f']),'ac',26,{activateMax:false}) },
    mature: { page:27,
      dm: Rel('Heaven’s Gate','↓ ↙ ← ↙ ↓ ↘ → + D',CAT(QCB,HCF),'d',27),
      sdm: Rel('Heaven’s Gate MAX','↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',27,{activateMax:true}),
      hsdm: Script('Ecstasy 816','→, D, C, B, →',[DIR('f'),BTN('d'),BTN('c'),BTN('b'),DIR('f')],27,{activateMax:false}) },
    vice: { page:28,
      dm: Rel('Negative Gain','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + D',CAT(HCB,HCB),'d',28,{close:true}),
      sdm: Rel('Negative Gain MAX','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + B+D',CAT(HCB,HCB),'bd',28,{activateMax:true,close:true}),
      hsdm: Rel('Overkill','no ar/perto ↙ ↓ ↘ → ↗ ↑ ↓ + A+C',['db','d','df','f','uf','u','d'],'ac',28,{activateMax:false,air:true,close:true}) },
    yamazaki: { page:29,
      dm: Rel('Guillotine','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',29),
      sdm: Rel('Guillotine MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',29,{activateMax:true}),
      hsdm: Rel('….!!','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + B+D',CAT(HCB,HCB),'bd',29,{activateMax:false,close:true}) },
    mary: { page:30,
      dm: Rel('M. Splash Rose','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',30),
      sdm: Script('M. Dynamite Swing','A, A, ←, B, C',[BTN('a'),BTN('a'),DIR('b'),BTN('b'),BTN('c')],30,{activateMax:true}),
      hsdm: Rel('M. Typhoon','↙ ↓ ↘ → ↗ ↑ ↓ + B+D',['db','d','df','f','uf','u','d'],'bd',30,{activateMax:false,close:true}) },
    billy: { page:31,
      dm: Rel('Chou Kaen Senpuu Kon','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',31),
      sdm: Rel('Dai Senpuu MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',31,{activateMax:true}),
      hsdm: Rel('Liar Elemental / Ifrit Crisis','↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',31,{activateMax:false}) },
    yashiro: { page:32,
      dm: Rel('Final Impact','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',32),
      sdm: Rel('Final Impact MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',32,{activateMax:true}),
      hsdm: Rel('[ERROR] CODE 2002','↓ ↙ ← ↙ ↓ ↘ → + B+D',CAT(QCB,HCF),'bd',32,{activateMax:false}) },
    shermie: { page:33,
      dm: Rel('Shermie Flash','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',33,{close:true}),
      sdm: Rel('Shermie Flash MAX','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',33,{activateMax:true,close:true}),
      hsdm: Rel('Inazuma Leg Lariat','perto ↓ ↘ → → ↓ ↘ + B+D',['d','df','f','f','d','df'],'bd',33,{activateMax:false,close:true}) },
    chris: { page:34,
      dm: Rel('Chain Slide Touch','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',34),
      sdm: Rel('Chain Slide Touch MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',34,{activateMax:true}),
      hsdm: Rel('Honoo no Sadame no Chris','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',34,{activateMax:false,conditional:'Transforma Chris em Orochi Chris.'}) },
    "k": { page:35,
      dm: Rel('Heat Drive','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',35),
      sdm: Rel('Chain Drive MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',35,{activateMax:true}),
      hsdm: Script('Crimson Star Road','↓ ↙ ← + C~A',[...QCB.map(DIR),BTN('c'),WAIT(1),BTN('a')],35,{activateMax:false}) },
    maxima: { page:36,
      dm: Rel('Bunker Buster','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',36),
      sdm: Rel('Maxima Revenger','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + B+D',CAT(HCB,HCB),'bd',36,{activateMax:true,close:true}),
      hsdm: Script('Arc Enemy','→, B, C, →, C',[DIR('f'),BTN('b'),BTN('c'),DIR('f'),BTN('c')],36,{activateMax:false}) },
    whip: { page:37,
      dm: Rel('Sonic Slaughter','↓ ↙ ← ↙ ↓ ↘ → + C',CAT(QCB,HCF),'c',37),
      sdm: Rel('Sonic Slaughter MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',37,{activateMax:true}),
      hsdm: Script('Super Black Hawk','←, B, C, ←, C',[DIR('b'),BTN('b'),BTN('c'),DIR('b'),BTN('c')],37,{activateMax:false}) },
    vanessa: { page:38,
      dm: Rel('Crazy Puncher','↓ ↙ ← ↙ ↓ ↘ → + C',CAT(QCB,HCF),'c',38),
      sdm: Rel('Crazy Puncher MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',38,{activateMax:true}),
      hsdm: Rel('Gaia Gear','→ ← ↙ ↓ ↘ → + A+C',CAT(['f'],HCF),'ac',38,{activateMax:false}) },
    seth: { page:39,
      dm: Rel('Morote Sho-Yoh','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',39),
      sdm: Rel('Doh-Tori-Shichimonsatsu','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',39,{activateMax:true}),
      hsdm: Rel('Sigure-Rangiku','perto → ← ↙ ↓ ↘ → + A+C',CAT(['f'],HCF),'ac',39,{activateMax:false,close:true}) },
    ramon: { page:40,
      dm: Rel('Savage Fire Cat','↓ ↘ → ↘ ↓ ↙ ← + D',CAT(QCF,HCB),'d',40),
      sdm: Rel('Tiger Spin','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',40,{activateMax:true,close:true}),
      hsdm: Rel('Hypnotic Tiger','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',40,{activateMax:false}) },
    kula: { page:41,
      dm: Rel('Diamond Edge','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',41),
      sdm: Rel('Freeze Execution','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',41,{activateMax:true}),
      hsdm: Script('Freeze Completion','D · A+B+C (atalho Magic Plus II)',[BTN('d'),BTN('abc')],41,{activateMax:false,note:'Atalho simplificado do Magic Plus II. Sequência completa também aceita: A+C · B+D · A+B+C.'}) },
    k9999: { page:42,
      dm: Rel('Moon…','↙ → ↘ ↓ ↙ ← ↘ + C',['db','f','df','d','db','b','df'],'c',42),
      sdm: Rel('Power… Goes Wild!','↓ → ↘ + A+B+C+D',['d','f','df'],'abcd',42,{activateMax:true}),
      hsdm: Rel('Kore wa, maru de…!!','→ ← → ← → ← → ←',['f','b','f','b','f','b','f','b'],null,42,{activateMax:false}) },
    angel: { page:43,
      dm: Rel('Loyalty Test for the Liberalists','UC Circle: ← → ↓ ↘ + C',['b','f','d','df'],'c',43,{conditional:'Requer estar no Unchain Circle (UC Circle).'}),
      sdm: Rel('Wind’s Fairground','contra ataque terrestre: ← → ↓ ↘ + B+D',['b','f','d','df'],'bd',43,{activateMax:true,conditional:'É um contra-ataque: precisa receber ataque terrestre na janela.'}),
      hsdm: Script('Survivor’s Banquet','Blue Monday Parade contra ataque aéreo (← → ↓ ↘ + B+D), depois B+C+D',[DIR('b'),DIR('f'),DIR('d'),DIR('df'),BTN('bd'),WAIT(3),HOLD('bcd',12)],43,{activateMax:false,conditional:'Precisa disparar Blue Monday Parade contra um ataque aéreo e então pressionar B+C+D.'}) },
    'orochi-yashiro': { page:45,
      dm: Rel('Ankoku Jigoku Gokuraku Otoshi','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + C',CAT(HCB,HCB),'c',45,{close:true}),
      sdm: Rel('Ankoku Jigoku Gokuraku Otoshi MAX','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C',CAT(HCB,HCB),'ac',45,{activateMax:true,close:true}),
      hsdm: Script('Armageddon / Final Battle','A · A+B+C (atalho Magic Plus II)',[BTN('a'),BTN('abc')],45,{activateMax:false,note:'Atalho simplificado do Magic Plus II. Sequência completa também aceita: B · D · A · A+B+C.'}) },
    'orochi-shermie': { page:46,
      dm: Rel('Ankoku Raikou Ken','↓ ↘ → ↓ ↘ → + C',CAT(QCF,QCF),'c',46),
      sdm: Rel('Ankoku Raikou Ken MAX','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',46,{activateMax:true}),
      hsdm: Script('Raikou / Unmei no Ya','B · A · ← · A · A/B/C/D',[BTN('b'),BTN('a'),DIR('b'),BTN('a'),BTN('c')],46,{activateMax:false}) },
    'orochi-chris': { page:47,
      dm: Rel('Ankoku Orochi Nagi','↓ ↙ ← ↙ ↓ ↘ → + C',CAT(QCB,HCF),'c',47),
      sdm: Rel('Ankoku Orochi Nagi MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',47,{activateMax:true}),
      hsdm: Script('Sanagi wo Yaburi Chou wa Mau','D · C · ↓ · C · D',[BTN('d'),BTN('c'),DIR('d'),BTN('c'),BTN('d')],47,{activateMax:false}) },
    kusanagi: { page:48,
      dm: Rel('Ura 108 Shiki: Orochi Nagi','↓ ↙ ← ↙ ↓ ↘ → + C',CAT(QCB,HCF),'c',48),
      sdm: Rel('Ura 108 Shiki: Orochi Nagi MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C',CAT(QCB,HCF),'ac',48,{activateMax:true}),
      hsdm: Rel('Saishuu Kessen Ougi: Mu Shiki','↓ ↘ → ↓ ↘ → + A+C',CAT(QCF,QCF),'ac',48,{activateMax:false}) },
    rugal: { page:49,
      dm: Rel('Gigantic Pressure','↓ ↘ → ↘ ↓ ↙ ← + C',CAT(QCF,HCB),'c',49),
      sdm: Rel('Gigantic Pressure MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C',CAT(QCF,HCB),'ac',49,{activateMax:true}),
      hsdm: Rel('Kaiser Phoenix','← ↙ ↓ ↘ → ← ↙ ↓ ↘ → + A+C',CAT(HCF,HCF),'ac',49,{activateMax:false}) }
  };


  // V19.10.3 — auditoria completa DM + SDM/MAX + HSDM/MAX2 do hack Magic Plus II.
  // HSDM/MAX2 continua usando a auditoria de atalhos da V19.10.2; abaixo, DM e SDM/MAX
  // também recebem marcação de fonte/página e os atalhos simplificados confirmados do MP2.
  // A nomenclatura comunitária "U para frente/trás" é convertida para eixos cardinais,
  // porque o hack aceita esses atalhos sem exigir todas as diagonais do KOF 2002 base.
  const U_FORWARD = ['b','d','f'];   // "U para frente" = trás, baixo, frente
  const U_BACK = ['f','d','b'];      // "U para trás"   = frente, baixo, trás
  const HOOK_FORWARD = ['f','d','f'];
  const TWICE = seq => [...seq,...seq];

  function applyMagicPlusHsdmShortcut(id, command, macro, auditNote='') {
    const profile = magicPlusSpecials[id];
    if (!profile?.hsdm || !macro) return;
    const nativeCommand = profile.hsdm.command;
    const nativeMacro = profile.hsdm.macro;
    profile.hsdm.nativeCommand = nativeCommand;
    profile.hsdm.nativeMacro = nativeMacro;
    profile.hsdm.command = command;
    profile.hsdm.macro = Object.assign({}, macro, {
      activateMax:false,
      shortcut:true,
      inputMode:'magic-plus-ii-shortcut',
      nativeCommand,
      source:'KOF 2002 Magic Plus II — HSDM shortcut audit'
    });
    profile.hsdm.note = `${auditNote || 'Atalho simplificado do Magic Plus II.'} Comando nativo preservado como alternativa: ${nativeCommand}`;
  }

  function markHsdmAuditedNative(id, reason='Comando simplificado varia entre revisões do hack; mantido o comando nativo para evitar falso atalho.') {
    const profile = magicPlusSpecials[id];
    if (!profile?.hsdm) return;
    profile.hsdm.macro = Object.assign({}, profile.hsdm.macro || {}, {
      activateMax:false,
      shortcut:false,
      inputMode:'native-reviewed',
      source:'KOF 2002 Magic Plus II — HSDM shortcut audit'
    });
    profile.hsdm.note = reason;
  }

  // Japan Team
  applyMagicPlusHsdmShortcut('kyo','U trás ×2 + A+C', Rel('x','x',TWICE(U_BACK),'ac',5).macro,
    'Atalho MP2: duas voltas/U para trás + A+C.');
  markHsdmAuditedNative('benimaru','Benimaru possui listas Magic Plus conflitantes para o atalho (BC/CD e variantes). Mantido o comando específico já cadastrado para não disparar um golpe incorreto.');
  applyMagicPlusHsdmShortcut('daimon','U frente ×2 + B+C', Rel('x','x',TWICE(U_FORWARD),'bc',7).macro,
    'Atalho MP2: duas voltas/U para frente + B+C.');

  // Fatal Fury
  applyMagicPlusHsdmShortcut('terry','U frente ×2 + A+C', Rel('x','x',TWICE(U_FORWARD),'ac',8).macro);
  applyMagicPlusHsdmShortcut('andy','gancho frente ×2 + A+C → U frente ×2 + A+B+C+D',
    Script('x','x',[...TWICE(HOOK_FORWARD).map(DIR),BTN('ac'),WAIT(4),...TWICE(U_FORWARD).map(DIR),BTN('abcd')],9).macro,
    'Atalho MP2 em duas etapas; o segundo trecho é enviado após o primeiro contato.');
  applyMagicPlusHsdmShortcut('joe','U trás → U frente + B+D', Rel('x','x',[...U_BACK,...U_FORWARD],'bd',10).macro);

  // Art of Fighting
  applyMagicPlusHsdmShortcut('ryo','gancho frente ×2 + A+C', Rel('x','x',TWICE(HOOK_FORWARD),'ac',11).macro);
  applyMagicPlusHsdmShortcut('robert','U frente → U trás + B+D', Rel('x','x',[...U_FORWARD,...U_BACK],'bd',12).macro);
  applyMagicPlusHsdmShortcut('takuma','U trás ×2 + A+C', Rel('x','x',TWICE(U_BACK),'ac',13).macro);

  // Psycho Soldier
  markHsdmAuditedNative('athena','Athena usa uma cadeia longa e as fontes Magic Plus divergem na ordem C/D/B e no fechamento AB/BC. Mantida a sequência específica já cadastrada.');
  applyMagicPlusHsdmShortcut('kensou','U frente ×2 + B+D', Rel('x','x',TWICE(U_FORWARD),'bd',18).macro);
  applyMagicPlusHsdmShortcut('chin','U frente ×2 + B+D', Rel('x','x',TWICE(U_FORWARD),'bd',19).macro);

  // Ikari
  applyMagicPlusHsdmShortcut('leona','↑ ↓ ↑ ↓ ↑ ↓ + B+D → U trás → U frente + B+D',
    Rel('x','x',[...U_BACK,...U_FORWARD],'bd',14,{preScript:[DIR('u'),DIR('d'),DIR('u'),DIR('d'),DIR('u'),DIR('d'),BTN('bd'),WAIT(10)]}).macro,
    'Atalho MP2: transforma em Orochi Leona e usa U trás → U frente + B+D.');
  applyMagicPlusHsdmShortcut('ralf','↓ ← ↓ → ↓ → + A+D', Rel('x','x',['d','b','d','f','d','f'],'ad',15).macro,
    'Sequência curta usada nos tutoriais Magic Plus para o especial oculto de Ralf.');
  applyMagicPlusHsdmShortcut('clark','U trás → U frente + B+D', Rel('x','x',[...U_BACK,...U_FORWARD],'bd',16).macro);

  // Women Fighters
  // Mai já estava cadastrada no formato curto D,B,C,C,↑; apenas marcamos como auditada.
  if (magicPlusSpecials.mai?.hsdm?.macro) Object.assign(magicPlusSpecials.mai.hsdm.macro,{shortcut:true,inputMode:'magic-plus-ii-shortcut',source:'KOF 2002 Magic Plus II — HSDM shortcut audit'});
  magicPlusSpecials.mai.hsdm.note = 'Atalho Magic Plus: D → B → C → C → ↑.';
  applyMagicPlusHsdmShortcut('yuri','U frente → U trás + B+D', Rel('x','x',[...U_FORWARD,...U_BACK],'bd',21).macro);
  applyMagicPlusHsdmShortcut('maylee','A+B+C (Hero Mode) → frente + B+D',
    Script('x','x',[BTN('abc'),WAIT(8),DIR('f'),BTN('bd')],22,{conditional:'Entra em Hero Mode antes do comando.'}).macro,
    'Atalho MP2: entra em Hero Mode com A+B+C e executa frente + B+D.');

  // Korea
  applyMagicPlusHsdmShortcut('kim','↓ ← ↓ → + A+B+C+D', Rel('x','x',['d','b','d','f'],'abcd',23).macro,
    'Sequência curta demonstrada para Magic Plus.');
  applyMagicPlusHsdmShortcut('chang','U frente + A+C', Rel('x','x',U_FORWARD,'ac',24).macro);
  applyMagicPlusHsdmShortcut('choi','no ar U frente ×2 + A+C', Rel('x','x',TWICE(U_FORWARD),'ac',25,{air:true}).macro,
    'O atalho continua exigindo Choi no ar; o macro faz um pulo curto antes da sequência.');

  // Iori / Mature / Vice
  applyMagicPlusHsdmShortcut('iori','↓ → ← → + A+C', Rel('x','x',['d','f','b','f'],'ac',26).macro,
    'Sequência curta demonstrada especificamente para Iori em Magic Plus.');
  applyMagicPlusHsdmShortcut('mature','C → B → frente + B+C', Script('x','x',[BTN('c'),BTN('b'),DIR('f'),BTN('bc')],27).macro);
  applyMagicPlusHsdmShortcut('vice','trás → ↓ → frente → ↑ → ↓ + A+C',
    Script('x','x',[DIR('b'),DIR('d'),DIR('f'),DIR('u'),DIR('d'),BTN('ac')],28,{conditional:'Começa no chão e termina a entrada no ar; exige proximidade.'}).macro,
    'Sequência prática Magic Plus; não força salto automático antes, pois a própria entrada leva Vice ao trecho aéreo.');

  // 97 Team
  applyMagicPlusHsdmShortcut('yamazaki','U trás ×2 + B+D', Rel('x','x',TWICE(U_BACK),'bd',29,{close:true}).macro);
  applyMagicPlusHsdmShortcut('mary','U frente ×2 + B+D', Rel('x','x',TWICE(U_FORWARD),'bd',30,{close:true}).macro);
  applyMagicPlusHsdmShortcut('billy','↓ ← ↓ → + B+D', Rel('x','x',['d','b','d','f'],'bd',31).macro,
    'Sequência curta demonstrada especificamente para Billy em Magic Plus.');

  // 98 Team
  applyMagicPlusHsdmShortcut('yashiro','↓ ← ↓ → + B+D', Rel('x','x',['d','b','d','f'],'bd',32).macro,
    'Sequência curta demonstrada para Yashiro normal em Magic Plus.');
  applyMagicPlusHsdmShortcut('shermie','U frente ×2 + B+D', Rel('x','x',TWICE(U_FORWARD),'bd',33,{close:true}).macro);
  applyMagicPlusHsdmShortcut('chris','U trás ×2 + A+B', Rel('x','x',TWICE(U_BACK),'ab',34).macro,
    'Atalho MP2 do Chris normal: transforma em Orochi Chris. O ataque oculto do Orochi Chris tem perfil próprio.');

  // NESTS / 99 / 2000
  applyMagicPlusHsdmShortcut('k','U trás + A+C', Rel('x','x',U_BACK,'ac',35).macro);
  applyMagicPlusHsdmShortcut('maxima','frente + B+C', Rel('x','x',['f'],'bc',36).macro,
    'Atalho extremamente curto documentado para Maxima no Magic Plus.');
  applyMagicPlusHsdmShortcut('whip','B → C → trás + C',
    Script('x','x',[BTN('b'),BTN('c'),DIR('b'),BTN('c')],37).macro,
    'Usa a sequência curta de Magic Plus; o final trás+C também cobre a variante ainda mais abreviada do hack.');
  applyMagicPlusHsdmShortcut('vanessa','frente → trás → ↓ → frente + A+C', Rel('x','x',['f','b','d','f'],'ac',38).macro,
    'Sequência curta demonstrada especificamente para Vanessa em Magic Plus.');
  applyMagicPlusHsdmShortcut('seth','frente → U frente + A+B', Rel('x','x',['f',...U_FORWARD],'ab',39,{close:true}).macro,
    'Atalho Magic Plus listado para Seth; exige estar perto.');
  applyMagicPlusHsdmShortcut('ramon','↓ ← ↓ → + A+C', Rel('x','x',['d','b','d','f'],'ac',40).macro,
    'Sequência curta demonstrada para Ramón em Magic Plus.');

  // 2001
  applyMagicPlusHsdmShortcut('kula','D → A+B+C', Script('x','x',[BTN('d'),BTN('abc')],41).macro,
    'Atalho simplificado confirmado para Freeze Completion no Magic Plus II.');
  applyMagicPlusHsdmShortcut('k9999','no ar: trás ↔ frente ×3 (sem botão)',
    Rel('x','x',['b','f','b','f','b','f'],null,42,{air:true}).macro,
    'Atalho Magic Plus: no ar, alterna trás/frente três vezes sem botão final.');
  applyMagicPlusHsdmShortcut('angel','trás → frente → gancho frente + B+C+D',
    Rel('x','x',['b','f',...HOOK_FORWARD],'bcd',43).macro,
    'Atalho comunitário do Magic Plus; Ángel continua sendo sensível ao estado/contra-ataque.');

  // Orochi Team / edit / boss
  applyMagicPlusHsdmShortcut('orochi-yashiro','A → A+B+C', Script('x','x',[BTN('a'),BTN('abc')],45).macro,
    'Atalho simplificado confirmado para Armageddon/Final Battle no Magic Plus II.');
  markHsdmAuditedNative('orochi-shermie','Há três sequências diferentes publicadas para Orochi Shermie em variantes Magic Plus. Mantida a sequência específica já cadastrada para não escolher um atalho errado.');
  applyMagicPlusHsdmShortcut('orochi-chris','↓ + D', Rel('x','x',['d'],'d',47).macro,
    'Atalho simplificado usado para Orochi Chris no Magic Plus.');
  applyMagicPlusHsdmShortcut('kusanagi','U frente ×2 + A+C', Rel('x','x',TWICE(U_FORWARD),'ac',48).macro);
  markHsdmAuditedNative('rugal','As listas Magic Plus divergem entre duas U para frente e duas U para trás no Rugal. Mantido o comando específico já cadastrado até haver uma referência inequívoca para kf2k2mp2.');

  // Auditoria DM / SDM(MAX) — 44 personagens, usando a command list dedicada ao Magic Plus II.
  // Não convertemos comandos do KOF 2002 base/UM. Quando o MP2 publica uma entrada compacta,
  // essa entrada é mantida como principal. SDM continua acionando MAX (B+C) antes do comando.
  const DM_SDM_SHORTCUTS = new Set(['ryo:sdm','maylee:sdm']);
  for (const [id, profile] of Object.entries(magicPlusSpecials)) {
    for (const tier of ['dm','sdm']) {
      const move = profile?.[tier];
      if (!move?.macro) continue;
      const key = `${id}:${tier}`;
      const shortcut = DM_SDM_SHORTCUTS.has(key);
      move.macro = Object.assign({}, move.macro, {
        audit:'v19.10.3',
        audited:true,
        shortcut: shortcut || !!move.macro.shortcut,
        inputMode: shortcut ? 'magic-plus-ii-shortcut' : 'magic-plus-ii-audited',
        source:'KOF 2002 Magic Plus II — 51-page command list + MP2 manual cross-check',
        sourcePage:profile.page,
        nativeCommand:move.macro.nativeCommand || move.command
      });
      // DM nunca deve entrar em MAX; SDM/MAX deve fazer B+C antes da entrada, exceto se um perfil
      // futuro declarar explicitamente activateMax:false por exigência do hack.
      if (tier === 'dm') move.macro.activateMax = false;
      else if (typeof move.macro.activateMax !== 'boolean') move.macro.activateMax = true;
    }
  }

  // A entrada completa da May Lee é preservada para consulta mesmo usando o atalho D -> ABC.
  if (magicPlusSpecials.maylee?.sdm) {
    magicPlusSpecials.maylee.sdm.nativeCommand = 'A+C · B+D · A+B+C';
    magicPlusSpecials.maylee.sdm.macro.nativeCommand = 'A+C · B+D · A+B+C';
  }

  for (const fighter of roster) {
    const profile = magicPlusSpecials[fighter.id];
    fighter.magicPlusPage = profile?.page || null;
    fighter.specialSource = 'Magic Plus II 51-page command list + auditoria DM/SDM/MAX + auditoria de atalhos HSDM/MAX2';
    fighter.dm = profile?.dm || null;
    fighter.sdm = profile?.sdm || null;
    fighter.hsdm = profile?.hsdm || null;
    fighter.dmMoves = fighter.dm ? [fighter.dm] : [];
    fighter.sdmMoves = fighter.sdm ? [fighter.sdm] : [];
    fighter.hsdmMoves = fighter.hsdm ? [fighter.hsdm] : [];
  }

  window.GG_KOF_CATALOG = Object.freeze({
    version: '19.10.3',
    notation: {
      A:'soco fraco', B:'chute fraco', C:'soco forte', D:'chute forte',
      MAX:'B + C', ESQUIVA:'A + B', DM:'Super comum do personagem', SDM:'Super Desperation Move / MAX do personagem', HSDM:'Hidden SDM / MAX2 do personagem',
      note:'V19.10.3: auditoria completa dos 44 personagens nos três níveis DM, SDM/MAX e HSDM/MAX2. DM/SDM usam a command list específica do Magic Plus II e os atalhos MP2 confirmados; HSDM mantém a auditoria de atalhos simplificados. SDM aciona MAX com B+C antes do comando; HSDM não injeta MAX automaticamente.'
    },
    roster
  });
})();
