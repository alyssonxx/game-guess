(() => {
  'use strict';
  const C = (id,name,team,style,moves,combo,tip='') => ({id,name,team,style,moves,combo,tip});
  const M = (name,command,note='') => ({name,command,note});
  const S = (name,command,macro=null,note='') => ({name,command,macro,note});
  const Seq = (steps,button,extra={}) => Object.assign({ activateMax:true, steps: String(steps).trim().split(/\s+/).filter(Boolean), button }, extra);
  const QCF2 = button => Seq('↓ ↘ → ↓ ↘ →', button);
  const QCB2 = button => Seq('↓ ↙ ← ↓ ↙ ←', button);
  const QCF_HCB = button => Seq('↓ ↘ → ↘ ↓ ↙ ←', button);
  const QCB_HCF = button => Seq('↓ ↙ ← ↙ ↓ ↘ →', button);
  const HCF_HCB = button => Seq('→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←', button);
  const HCB_HCF = button => Seq('← ↙ ↓ ↘ → ← ↙ ↓ ↘ →', button);
  const AIR = macro => Object.assign({}, macro || {}, { air:true, jump:true });
  const pickAutoButton = command => /B\/D/.test(command) ? 'd' : /A\/C/.test(command) ? 'c' : /\+\s*B/.test(command) ? 'b' : /\+\s*A/.test(command) ? 'a' : /\+\s*D/.test(command) ? 'd' : 'c';
  const buildMacroFromCommand = (command, button = null, activateMax = false) => {
    const cmd = String(command || '');
    if (!cmd || /rota|stance|transforma|Unchain|BC|MAX/i.test(cmd)) return null;
    const steps = (cmd.match(/[↓↘→↗↑↖←↙]/g) || []).filter(Boolean);
    const finalButton = button || pickAutoButton(cmd);
    if (!steps.length && !finalButton) return null;
    return { activateMax, steps, button: finalButton, jump: /no ar/i.test(cmd) };
  };
  const genericHsdm = fighter => S(`${fighter.name} HSDM / MAX2`, 'A+B+C+D (atalho Magic Plus II)', { activateMax:false, steps:[], button:'abcd' }, 'Atalho geral do Magic Plus II. O golpe resultante depende do personagem e do estado de jogo.');
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

  const Macro = (name, command, steps, button, opts={}) => S(name, command, Object.assign({ steps: String(steps || '').trim().split(/\s+/).filter(Boolean), button, activateMax:false }, opts));
  const Script = (name, command, script, opts={}) => S(name, command, Object.assign({ script, activateMax:false }, opts));

  const sdmById = {
    kyo: [Macro('Orochi Nagi MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C','↓ ↙ ← ↙ ↓ ↘ →','ac',{activateMax:true})],
    benimaru: [Macro('Raikou Ken MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    daimon: [Macro('Jigoku Gokuraku Otoshi MAX','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','ac',{activateMax:true,close:true})],
    terry: [Macro('Triple Power Geyser','↓ ↙ ← ↙ → + A+C','↓ ↙ ← ↙ →','ac',{activateMax:true})],
    andy: [Macro('Chou Reppa Dan MAX','↓ ↙ ← ↙ ↓ ↘ → + B+D','↓ ↙ ← ↙ ↓ ↘ →','bd',{activateMax:true})],
    joe: [Macro('Screw Upper MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    ryo: [Script('Ryuuko Ranbu MAX','↓ ↘ → + C, A',['↓','↘','→','c','a'],{activateMax:true})],
    robert: [Macro('Ryuuko Ranbu MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C','↓ ↘ → ↘ ↓ ↙ ←','ac',{activateMax:true})],
    takuma: [Macro('Ryuuko Ranbu MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C','↓ ↘ → ↘ ↓ ↙ ←','ac',{activateMax:true})],
    athena: [Macro('Shining Crystal Bit MAX','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','ac',{activateMax:true})],
    kensou: [Macro('Senki Hakkei','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true,close:true})],
    chin: [Macro('Gouran Enpou MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    leona: [Macro('V-Slasher MAX','no ar ↓ ↘ → ↘ ↓ ↙ ← + A+C','↓ ↘ → ↘ ↓ ↙ ←','ac',{activateMax:true,jump:true})],
    ralf: [Macro('Bari Bari Vulcan Punch MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C','↓ ↘ → ↘ ↓ ↙ ←','ac',{activateMax:true})],
    clark: [Macro('Ultra Argentine Backbreaker MAX','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','ac',{activateMax:true,close:true})],
    mai: [Macro('Chou Hissatsu Shinobi Bachi MAX','↓ ↙ ← ↙ ↓ ↘ → + B+D','↓ ↙ ← ↙ ↓ ↘ →','bd',{activateMax:true})],
    yuri: [Macro('Metsu Oni Zan Kouga','↓ ↘ → ↓ ↘ → + B+D','↓ ↘ → ↓ ↘ →','bd',{activateMax:true})],
    maylee: [Script('Disposition Frog','A+C, B+D, A+B+C',['ac','bd','abc'],{activateMax:true})],
    kim: [Macro('Houou Kyaku MAX','no ar ↓ ↙ ← ↙ → + B+D','↓ ↙ ← ↙ →','bd',{activateMax:true,jump:true})],
    chang: [Macro('Tekkyuu Dai Assatsu MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    choi: [Macro('Houou Kyaku MAX','↓ ↘ → ↘ ↓ ↙ ← + B+D','↓ ↘ → ↘ ↓ ↙ ←','bd',{activateMax:true})],
    iori: [Macro('Ya Otome MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C','↓ ↘ → ↘ ↓ ↙ ←','ac',{activateMax:true})],
    mature: [Macro('Nocturnal Lights MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    vice: [Macro('Withering Surface MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    yamazaki: [Macro('Guillotine MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    mary: [Script('M. Dynamite Swing MAX','A, A, ←, B, C',['a','a','←','b','c'],{activateMax:true})],
    billy: [Macro('Dai Senpuu MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    yashiro: [Macro('Final Impact MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    shermie: [Macro('Shermie Flash MAX','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','ac',{activateMax:true,close:true})],
    chris: [Macro('Chain Slide Touch MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    "k": [Macro('Chain Drive MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C','↓ ↘ → ↘ ↓ ↙ ←','ac',{activateMax:true})],
    maxima: [Macro('Maxima Revenger MAX','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + B+D','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','bd',{activateMax:true,close:true})],
    whip: [Macro('Sonic Slaughter MAX','↓ ↙ ← ↙ ↓ ↘ → + C','↓ ↙ ← ↙ ↓ ↘ →','c',{activateMax:true})],
    vanessa: [Macro('Crazy Puncher MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C','↓ ↙ ← ↙ ↓ ↘ →','ac',{activateMax:true})],
    seth: [Macro('Shichimin Koroshi MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C','↓ ↘ → ↘ ↓ ↙ ←','ac',{activateMax:true})],
    ramon: [Macro('Tiger Spin MAX','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','ac',{activateMax:true,close:true})],
    kula: [Macro('Freeze Execution','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','ac',{activateMax:true})],
    k9999: [Macro('Power... Goes Wild!','↓ → ↘ + A+B+C+D','↓ → ↘','abcd',{activateMax:true})],
    angel: [Macro('Winds Fairground / Blue Monday Parade','← → ↓ ↘ + B+D','← → ↓ ↘','bd',{activateMax:true,conditional:true})],
    'orochi-yashiro': [Macro('Ankoku Jigoku Gokuraku Otoshi MAX','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','ac',{activateMax:true,close:true})],
    'orochi-shermie': [Macro('Ankoku Raikouken MAX','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    'orochi-chris': [Macro('Daichi o Harau Gouka MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C','↓ ↙ ← ↙ ↓ ↘ →','ac',{activateMax:true})],
    kusanagi: [Macro('Orochi Nagi MAX','↓ ↙ ← ↙ ↓ ↘ → + A+C','↓ ↙ ← ↙ ↓ ↘ →','ac',{activateMax:true})],
    rugal: [Macro('Gigantic Pressure MAX','↓ ↘ → ↘ ↓ ↙ ← + A+C','↓ ↘ → ↘ ↓ ↙ ←','ac',{activateMax:true})]
  };

  const hsdmById = {
    kyo: [Macro('Shinjin','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','ac',{activateMax:true,close:true})],
    kusanagi: [Macro('Saishuu Kessen Ougi "Mu Shiki"','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    benimaru: [Macro('Raijinkuu','→ ↙ ↘ ← → + A+C','→ ↙ ↘ ← →','ac',{activateMax:true})],
    daimon: [Macro('Earthquake','→ ↓ ↘ ← ↓ ↙ + B+C','→ ↓ ↘ ← ↓ ↙','bc',{activateMax:true})],
    terry: [Macro('Rising Force','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    andy: [Script('Zan-ei Shitou Reppadan','↓ ↘ → ↓ ↘ → + A+C, depois B+C+D',['↓','↘','→','↓','↘','→','ac','bcd'],{activateMax:true})],
    joe: [Macro('Double Cyclone Upper','↓ ↘ → ↓ ↘ → + B+D','↓ ↘ → ↓ ↘ →','bd',{activateMax:true})],
    kim: [Macro('Zero-Distance Houou Kyaku','perto ↓ ↙ ← ↙ → + A+B+C+D','↓ ↙ ← ↙ →','abcd',{activateMax:true,close:true})],
    chang: [Script('Time Machine','B, A, ↘, C, A',['b','a','↘','c','a'],{activateMax:true})],
    choi: [Macro('Shin! Engetsuzan Kai','no ar ↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true,jump:true})],
    athena: [Script('Psycho Medley','↓ ↘ → + ABCD, D,C,B,D,C,B,A, ↓ ↘ → + A+B',['↓','↘','→','abcd','d','c','b','d','c','b','a','↓','↘','→','ab'],{activateMax:true})],
    kensou: [Macro('Geki Choukyuudan','↓ ↘ → ↓ ↘ → + B+D','↓ ↘ → ↓ ↘ →','bd',{activateMax:true})],
    chin: [Macro('Remote Control Gouran Enpou','↓ ↘ → ↓ ↘ → + B+D','↓ ↘ → ↓ ↘ →','bd',{activateMax:true})],
    leona: [Macro('Rebel Spark MAX2','desperta ↓ ↙ ← ↙ ↓ ↘ → + B+D','↓ ↙ ← ↙ ↓ ↘ →','bd',{activateMax:true,conditional:true})],
    ralf: [Macro('Become a Star in the Sky','↓ ↙ ← ↙ ↓ ↘ → ↓ ↘ → + A+D','↓ ↙ ← ↙ ↓ ↘ → ↓ ↘ →','ad',{activateMax:true})],
    clark: [Macro('Running Three MAX2','perto ← ↙ ↓ ↘ → ← ↙ ↓ ↘ → + B+D','← ↙ ↓ ↘ → ← ↙ ↓ ↘ →','bd',{activateMax:true,close:true})],
    ryo: [Macro('Tenchi Haoh Ken','↓ ↘ → ↓ ↘ → + A+C','↓ ↘ → ↓ ↘ →','ac',{activateMax:true})],
    robert: [Macro('Original Ryuuko Ranbu','↓ ↘ → ↘ ↓ ↙ ← + B+D','↓ ↘ → ↘ ↓ ↙ ←','bd',{activateMax:true})],
    takuma: [Macro('MAX2','← → ↓ ↘ + A+C','← → ↓ ↘','ac',{activateMax:true})],
    mai: [Script('Shiranui-ryuu Kyuubi','D, B, C, C, ↑',['d','b','c','c','↑'],{activateMax:true})],
    yuri: [Macro('Old Hien Houou Kyaku','→ ← → ↘ ↓ ↙ ← + B+D','→ ← → ↘ ↓ ↙ ←','bd',{activateMax:true})],
    maylee: [Script('Double Kick MAX2','→, B, C, →, C',['→','b','c','→','c'],{activateMax:true})],
    iori: [Macro('Homurabotogi','↓ ↙ ← ↙ ↓ ↘ → ← → + A+C','↓ ↙ ← ↙ ↓ ↘ → ← →','ac',{activateMax:true})],
    mature: [Script('Eternal Illusion','→, D, C, B, →',['→','d','c','b','→'],{activateMax:true})],
    vice: [Macro('Withering Art Race','no ar/perto ← ↙ ↓ ↘ → ← ↙ ↓ ↘ → + A+C','← ↙ ↓ ↘ → ← ↙ ↓ ↘ →','ac',{activateMax:true,jump:true,close:true})],
    yamazaki: [Macro('...!!','perto → ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + B+D','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','bd',{activateMax:true,close:true})],
    mary: [Macro('M. Typhoon','↙ ↓ ↘ → ↗ ↑ ↓ + B+D','↙ ↓ ↘ → ↗ ↑ ↓','bd',{activateMax:true})],
    billy: [Macro('Ifrit Crisis','↓ ↙ ← ↙ ↓ ↘ → + B+D','↓ ↙ ← ↙ ↓ ↘ →','bd',{activateMax:true})],
    yashiro: [Macro('ERROR code 2002','↓ ↙ ← ↙ ↓ ↘ → + B+D','↓ ↙ ← ↙ ↓ ↘ →','bd',{activateMax:true})],
    shermie: [Macro('Lightning Wizard','perto ↓ ↘ → ↓ ↘ → + B+D','↓ ↘ → ↓ ↘ →','bd',{activateMax:true,close:true})],
    chris: [Macro('Awakening MAX2','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ← + A+C','→ ↘ ↓ ↙ ← → ↘ ↓ ↙ ←','ac',{activateMax:true})],
    "k": [Script('Crimson Star Road','↓ ↙ ← + C, A',['↓','↙','←','c','a'],{activateMax:true})],
    maxima: [Script('Maxima Scratcher','→, B, C, →, C',['→','b','c','→','c'],{activateMax:true})],
    whip: [Script('Yamato Gun','←, B, C, ←, C',['←','b','c','←','c'],{activateMax:true})],
    vanessa: [Macro('Gaia Gear','→ ← ↙ ↓ ↘ → + A+C','→ ← ↙ ↓ ↘ →','ac',{activateMax:true})],
    seth: [Macro('MAX2','perto → ← ↙ ↓ ↘ → + A+C','→ ← ↙ ↓ ↘ →','ac',{activateMax:true,close:true})],
    ramon: [Macro('That Is My Tiger','↓ ↙ ← ↙ ↓ ↘ → + A+C','↓ ↙ ← ↙ ↓ ↘ →','ac',{activateMax:true})],
    kula: [Script('Freeze Completion','A+C, B+D, A+B+C',['ac','bd','abc'],{activateMax:true})],
    k9999: [Macro('Return to Nothing','← → ← → ← → ← →','← → ← → ← → ← →',null,{activateMax:true})],
    angel: [Script('People’s Elbow','após Blue Monday Parade: B+C+D',['bcd'],{activateMax:true,conditional:true})],
    'orochi-yashiro': [Script('Armageddon','B, D, A, A+B+C',['b','d','a','abc'],{activateMax:true})],
    'orochi-shermie': [Script('Russian Roulette','B, A, ←, A, A',['b','a','←','a','a'],{activateMax:true})],
    'orochi-chris': [Script('Return to Nothing','D, C, ↓, C, D',['d','c','↓','c','d'],{activateMax:true})],
    rugal: [Macro('Kaiser Nova','← ↙ ↓ ↘ → ← ↙ ↓ ↘ → + A+C','← ↙ ↓ ↘ → ← ↙ ↓ ↘ →','ac',{activateMax:true})]
  };

  const dmOverrides = {
    kula: [Macro('Diamond Edge','↓ ↘ → ↓ ↘ → + C','↓ ↘ → ↓ ↘ →','c')],
    k9999: [Macro('Moon...','↙ → ↘ ↓ ↙ ← ↘ + C','↙ → ↘ ↓ ↙ ← ↘','c')],
    angel: [Macro('Loyalty Test for the Liberalists','durante Unchain: ← → ↓ ↘ + C','← → ↓ ↘','c',{conditional:true})]
  };

  for (const fighter of roster) {
    const dmCandidates = dmOverrides[fighter.id] || (fighter.moves || []).filter(m => /super/i.test(String(m.note || ''))).map(m => S(m.name, m.command, buildMacroFromCommand(m.command, null, false), 'DM / super comum do personagem'));
    fighter.dmMoves = dmCandidates;
    fighter.dm = dmCandidates[0] || null;
    fighter.sdmMoves = sdmById[fighter.id] || [];
    fighter.sdm = fighter.sdmMoves[0] || null;
    fighter.hsdmMoves = hsdmById[fighter.id] || [];
    fighter.hsdm = fighter.hsdmMoves[0] || null;
  }


  window.GG_KOF_CATALOG = Object.freeze({
    version: '19.9.1',
    notation: {
      A:'soco fraco', B:'chute fraco', C:'soco forte', D:'chute forte',
      MAX:'B + C', ESQUIVA:'A + B', DM:'Super comum do personagem', SDM:'Super Desperation Move do personagem', HSDM:'Hidden SDM / MAX2 do personagem',
      note:'Perfis ajustados para KOF 2002 Magic Plus II. DM executa o super comum; SDM ativa MAX com B+C e executa o MAX super; HSDM/MAX2 ativa MAX e executa o comando oculto, mas ainda respeita condições do jogo como vida vermelha, distância, ar, transformação ou contra-ataque.'
    },
    roster
  });
})();
