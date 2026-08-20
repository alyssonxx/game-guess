import { EXTRA_DRAGON_BALL, EXTRA_YUGIOH, EXTRA_NARUTO, SAINT_SEIYA, LEGACY_DETAILS } from '../server-data/expanded.js';
import { V8_DRAGON_BALL, V8_YUGIOH, V8_NARUTO, V8_SAINT_SEIYA, V8_CARTOONS } from '../server-data/v8-extra.js';
const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map();

function json(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sample(a,n){return shuffle(a).slice(0,n);}
function cap(s){s=String(s||'');return s? s[0].toUpperCase()+s.slice(1):s;}
async function getJson(url,timeout=9000){const c=new AbortController();const t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{signal:c.signal,headers:{'Accept':'application/json','User-Agent':'GameGuess-V8/1.0'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json();}finally{clearTimeout(t)}}
async function cached(key,fn){const x=cache.get(key);if(x&&Date.now()-x.at<CACHE_TTL)return x.data;const data=await fn();cache.set(key,{at:Date.now(),data});return data;}

const PT_TAG={Fighter:'Lutador',Tank:'Tanque',Mage:'Mago',Assassin:'Assassino',Marksman:'Atirador',Support:'Suporte'};
const PT_TYPE={normal:'Normal',fire:'Fogo',water:'Água',electric:'Elétrico',grass:'Planta',ice:'Gelo',fighting:'Lutador',poison:'Veneno',ground:'Terrestre',flying:'Voador',psychic:'Psíquico',bug:'Inseto',rock:'Pedra',ghost:'Fantasma',dragon:'Dragão',dark:'Sombrio',steel:'Aço',fairy:'Fada'};
const DIGI_LEVEL={rookie:'Novato',champion:'Campeão',ultimate:'Perfeito/Ultimate',mega:'Mega',fresh:'Bebê I','in training':'Bebê II','in-training':'Bebê II',armor:'Armadura',hybrid:'Híbrido'};

const CHARACTER_CLASSICS = [
 ['Goku','Dragon Ball','anos 90/2000','É um guerreiro conhecido por superar limites em batalhas cada vez maiores.','Sua história envolve treino, artes marciais e transformações marcantes.','Goku',['Son Goku']],
 ['Vegeta','Dragon Ball','anos 90/2000','Começa como rival orgulhoso e se torna um dos maiores defensores da Terra.','Seu orgulho e sua origem guerreira são partes centrais do personagem.','Vegeta',[]],
 ['Gohan','Dragon Ball','anos 90/2000','É filho de um grande guerreiro e demonstra enorme potencial desde criança.','Alterna vida de estudante com batalhas que definem o destino do planeta.','Son Gohan',['Gohan']],
 ['Ash Ketchum','Pokémon','anos 90/2000','Viaja por várias regiões buscando se tornar um grande treinador.','Seu parceiro mais conhecido é um Pokémon elétrico amarelo.','Ash Ketchum',['Ash','Satoshi']],
 ['Pikachu','Pokémon','anos 90/2000','É pequeno, amarelo e usa eletricidade.','Virou um dos mascotes mais reconhecíveis da cultura pop japonesa.','Pikachu',[]],
 ['Yugi Muto','Yu-Gi-Oh!','anos 2000','É associado a duelos de cartas e a uma personalidade ligada a um antigo faraó.','Um objeto egípcio tem papel decisivo em sua história.','Yugi Muto',['Yugi','Yami Yugi']],
 ['Naruto Uzumaki','Naruto','anos 2000','Sonha em ser reconhecido como líder de sua vila.','Carrega dentro de si uma poderosa criatura e usa técnicas ninja.','Naruto Uzumaki',['Naruto']],
 ['Sasuke Uchiha','Naruto','anos 2000','É um prodígio de um clã marcado por uma tragédia.','Sua rivalidade e amizade com o protagonista movem grande parte da história.','Sasuke Uchiha',['Sasuke']],
 ['Ben Tennyson','Ben 10','anos 2000','Um dispositivo no pulso permite que ele assuma várias formas alienígenas.','Começou suas aventuras ainda criança durante as férias.','Ben Tennyson',['Ben 10','Ben']],
 ['Johnny Bravo','Johnny Bravo','anos 90/2000','É extremamente vaidoso, musculoso e confiante demais.','Seu penteado loiro e óculos escuros são marcas registradas.','Johnny Bravo',[]],
 ['Dexter','O Laboratório de Dexter','anos 90/2000','É uma criança genial com um laboratório secreto.','Sua irmã costuma atrapalhar seus experimentos.','Dexter (Dexter’s Laboratory)',['Dexter']],
 ['Dee Dee','O Laboratório de Dexter','anos 90/2000','É a irmã curiosa que invade constantemente um laboratório secreto.','Seu jeito espontâneo costuma arruinar experiências científicas.','Dee Dee (Dexter’s Laboratory)',['Dee Dee']],
 ['Coragem','Coragem, o Cão Covarde','anos 90/2000','É um cachorro medroso que enfrenta situações assustadoras para proteger seus donos.','Vive numa casa isolada no meio do nada.','Courage the Cowardly Dog',['Courage','Coragem o Cão Covarde']],
 ['Scooby-Doo','Scooby-Doo','clássico','É um cão que investiga mistérios ao lado de um grupo de amigos.','Apesar de medroso, frequentemente ajuda a desmascarar vilões.','Scooby-Doo (character)',['Scooby']],
 ['Salsicha','Scooby-Doo','clássico','É o melhor amigo humano de um cão investigador e compartilha sua fome e covardia.','Costuma fugir dos monstros antes de acabar envolvido no mistério.','Shaggy Rogers',['Shaggy','Norville Rogers']],
 ['Bob Esponja','Bob Esponja Calça Quadrada','anos 2000','Vive no fundo do mar e trabalha como cozinheiro.','Mora numa casa em formato de abacaxi.','SpongeBob SquarePants (character)',['SpongeBob','Bob Esponja Calça Quadrada']],
 ['Patrick Estrela','Bob Esponja Calça Quadrada','anos 2000','É o melhor amigo do protagonista e vive debaixo de uma pedra.','É uma estrela-do-mar conhecida pela ingenuidade.','Patrick Star',['Patrick']],
 ['Aang','Avatar: A Lenda de Aang','anos 2000','É o último dobrador de ar de sua época e precisa dominar quatro elementos.','Carrega a responsabilidade de restaurar o equilíbrio do mundo.','Aang',['Avatar Aang']],
 ['Zuko','Avatar: A Lenda de Aang','anos 2000','Começa perseguindo o protagonista para recuperar sua honra.','É um príncipe ligado ao elemento fogo e passa por uma grande redenção.','Zuko',[]],
 ['Mordecai','Apenas um Show','anos 2010','Trabalha em um parque e costuma entrar em problemas absurdos com seu melhor amigo.','É uma ave azul alta.','Mordecai (Regular Show)',['Mordecai']],
 ['Rigby','Apenas um Show','anos 2010','É pequeno, impulsivo e trabalha num parque com seu melhor amigo.','É um guaxinim que frequentemente causa confusão.','Rigby (Regular Show)',['Rigby']],
 ['Finn','Hora de Aventura','anos 2010','É um jovem aventureiro que explora uma terra fantástica.','Seu companheiro principal é um cachorro com poderes elásticos.','Finn the Human',['Finn']],
 ['Jake','Hora de Aventura','anos 2010','É um cachorro mágico capaz de esticar e mudar o corpo.','É melhor amigo e parceiro de aventuras de um jovem humano.','Jake the Dog',['Jake']],
 ['Mônica','Turma da Mônica','clássico brasileiro','É conhecida por sua força, vestido vermelho e um coelho de pelúcia.','É uma das personagens mais famosas dos quadrinhos brasileiros.','Monica (Monica and Friends)',['Mônica']],
 ['Cebolinha','Turma da Mônica','clássico brasileiro','Cria planos infalíveis e troca uma letra ao falar.','Vive tentando se tornar o dono da rua.','Jimmy Five',['Cebolinha']],
 ['Cascão','Turma da Mônica','clássico brasileiro','É conhecido por evitar água e banho a qualquer custo.','É grande amigo do garoto que cria planos infalíveis.','Smudge (Monica and Friends)',['Cascão']],
 ['Magali','Turma da Mônica','clássico brasileiro','Tem um apetite enorme e adora melancia.','É uma das melhores amigas da protagonista da turma do bairro.','Maggy (Monica and Friends)',['Magali']],
 ['Pica-Pau','Pica-Pau','clássico','É uma ave bagunceira com uma risada extremamente reconhecível.','Frequentemente provoca confusões com outros personagens.','Woody Woodpecker',['Woody Woodpecker']],
 ['Tom','Tom e Jerry','clássico','É um gato que passa boa parte do tempo perseguindo um rato.','Seus planos quase sempre terminam em confusão física.','Tom Cat',['Tom']],
 ['Jerry','Tom e Jerry','clássico','É um rato pequeno e esperto que vive escapando de um gato.','Frequentemente transforma a perseguição em vantagem própria.','Jerry Mouse',['Jerry']],
 ['Fred Flintstone','Os Flintstones','clássico','Vive numa versão pré-histórica da vida suburbana moderna.','Trabalha numa pedreira e costuma se meter em confusão.','Fred Flintstone',['Fred']],
 ['Homer Simpson','Os Simpsons','anos 90/2000','É pai de família e trabalha numa usina nuclear.','É famoso por sua paixão por comida e decisões impulsivas.','Homer Simpson',['Homer']],
 ['Bart Simpson','Os Simpsons','anos 90/2000','É um garoto travesso conhecido por suas pegadinhas.','Anda de skate e vive provocando adultos.','Bart Simpson',['Bart']],
 ['Lindinha','As Meninas Superpoderosas','anos 90/2000','É a integrante mais doce e sensível de um trio de heroínas.','Seu visual é associado à cor azul.','Bubbles (The Powerpuff Girls)',['Bubbles','Lindinha']],
 ['Docinho','As Meninas Superpoderosas','anos 90/2000','É a integrante mais durona e explosiva de um trio de heroínas.','Seu visual é associado à cor verde.','Buttercup (The Powerpuff Girls)',['Buttercup','Docinho']],
 ['Florzinha','As Meninas Superpoderosas','anos 90/2000','É a líder estratégica de um trio de heroínas infantis.','Seu visual é associado à cor rosa.','Blossom (The Powerpuff Girls)',['Blossom','Florzinha']]
];

const GLOBINHO = [
 ['Kim Possible','Kim Possible','anos 2000','Combate criminosos enquanto tenta conciliar escola e vida pessoal.','É uma heroína ruiva que recebe missões por um comunicador.','Kim Possible',[]],
 ['Ron Stoppable','Kim Possible','anos 2000','É o parceiro atrapalhado de uma heroína adolescente.','Seu companheiro animal é um rato-toupeira-pelado.','Ron Stoppable',['Ron']],
 ['Goku','Dragon Ball','anos 2000','É um guerreiro de cabelos espetados conhecido por treinar e superar limites.','Transformações e artes marciais são marcas de suas batalhas.','Goku',['Son Goku']],
 ['Vegeta','Dragon Ball','anos 2000','É um príncipe guerreiro extremamente orgulhoso.','Começa como rival e acaba lutando ao lado dos heróis.','Vegeta',[]],
 ['Gohan','Dragon Ball','anos 2000','É filho do protagonista e demonstra potencial enorme desde criança.','Teve momentos decisivos contra inimigos que ameaçaram a Terra.','Son Gohan',['Gohan']],
 ['Hank','Caverna do Dragão','clássico','É o líder do grupo preso em outro mundo.','Recebe uma arma mágica que dispara energia à distância.','Hank (Dungeons & Dragons)',['Hank']],
 ['Eric','Caverna do Dragão','clássico','É sarcástico e costuma questionar as decisões do grupo.','Seu item mágico é um escudo poderoso.','Eric (Dungeons & Dragons)',['Eric']],
 ['Sheila','Caverna do Dragão','clássico','É uma jovem que recebe um item capaz de torná-la invisível.','Faz parte de um grupo de amigos transportados para outro mundo.','Sheila (Dungeons & Dragons)',['Sheila']],
 ['Mestre dos Magos','Caverna do Dragão','clássico','Surge com conselhos enigmáticos e desaparece rapidamente.','É o guia misterioso dos jovens presos no Reino.','Dungeon Master (Dungeons & Dragons)',['Dungeon Master']],
 ['Sam','Três Espiãs Demais','anos 2000','É inteligente, estratégica e integra um trio de agentes adolescentes.','Usa gadgets disfarçados em objetos comuns.','Sam (Totally Spies!)',['Samantha','Sam']],
 ['Clover','Três Espiãs Demais','anos 2000','É uma das três agentes adolescentes e gosta muito de moda.','Combate ameaças usando equipamentos fornecidos por uma agência secreta.','Clover (Totally Spies!)',['Clover']],
 ['Alex','Três Espiãs Demais','anos 2000','É atlética, otimista e faz parte de um trio de agentes.','Suas missões misturam escola, amizade e espionagem.','Alex (Totally Spies!)',['Alex']],
 ['Hamtaro','Hamtaro','anos 2000','É um pequeno hamster que vive aventuras com outros hamsters.','Adora sementes e ajudar seus amigos.','Hamtaro',[]],
 ['Yugi Muto','Yu-Gi-Oh!','anos 2000','É um jovem duelista ligado a um antigo espírito egípcio.','Um quebra-cabeça milenar muda sua vida.','Yugi Muto',['Yugi','Yami Yugi']],
 ['Seto Kaiba','Yu-Gi-Oh!','anos 2000','É um duelista rival, empresário e extremamente competitivo.','Seu monstro mais associado é um dragão branco.','Seto Kaiba',['Kaiba']],
 ['Jackie Chan','As Aventuras de Jackie Chan','anos 2000','É um arqueólogo e lutador que enfrenta organizações criminosas e magia.','Viaja pelo mundo em busca de artefatos especiais.','Jackie Chan Adventures',['Jackie']],
 ['Jade Chan','As Aventuras de Jackie Chan','anos 2000','É uma garota corajosa que insiste em participar das missões do tio.','Frequentemente ajuda a resolver problemas sobrenaturais.','Jade Chan',['Jade']],
 ['Bob Esponja','Bob Esponja Calça Quadrada','anos 2000/2010','Trabalha como cozinheiro no fundo do mar.','Mora em um abacaxi e é extremamente otimista.','SpongeBob SquarePants (character)',['SpongeBob']],
 ['Patrick Estrela','Bob Esponja Calça Quadrada','anos 2000/2010','É o melhor amigo do protagonista e vive debaixo de uma pedra.','É uma estrela-do-mar muito ingênua.','Patrick Star',['Patrick']],
 ['Capitão','Os Pinguins de Madagascar','anos 2010','É o líder de uma equipe de quatro pinguins especialistas em missões.','Costuma dar ordens rápidas e elaborar operações.','Skipper (Madagascar)',['Skipper','Capitão']],
 ['Kowalski','Os Pinguins de Madagascar','anos 2010','É o integrante mais científico e analítico de uma equipe de pinguins.','Normalmente cuida de cálculos, invenções e explicações.','Kowalski (Madagascar)',['Kowalski']],
 ['Po','Kung Fu Panda','anos 2010','É um panda apaixonado por artes marciais e comida.','Torna-se um guerreiro importante apesar de um começo improvável.','Po (Kung Fu Panda)',['Po']],
 ['Mestre Shifu','Kung Fu Panda','anos 2010','É um mestre rigoroso responsável por treinar grandes lutadores.','Inicialmente duvida bastante do protagonista panda.','Shifu',['Shifu']],
 ['Homem-Aranha','Ultimate Homem-Aranha','anos 2010','É um jovem herói que usa poderes de aranha e lança teias.','Tenta equilibrar responsabilidades pessoais e combate ao crime.','Spider-Man',['Spider-Man','Peter Parker']],
 ['Homem de Ferro','Os Vingadores','anos 2010','É um herói que depende de uma armadura tecnológica avançada.','Também é conhecido por ser inventor e empresário.','Iron Man',['Tony Stark','Iron Man']],
 ['Thor','Os Vingadores','anos 2010','É um guerreiro ligado à mitologia nórdica e empunha um martelo poderoso.','Faz parte de uma equipe de super-heróis.','Thor (Marvel Comics)',['Thor']],
 ['Hulk','Os Vingadores','anos 2010','É conhecido por força extrema e pele verde quando se transforma.','Sua outra identidade é um cientista.','Hulk',['Bruce Banner']],
 ['Soluço','Como Treinar o Seu Dragão','anos 2010','É um jovem viking que desafia a tradição de sua tribo sobre dragões.','Cria uma amizade profunda com um dragão raro.','Hiccup Horrendous Haddock III',['Hiccup','Soluço']],
 ['Banguela','Como Treinar o Seu Dragão','anos 2010','É um dragão negro raro e muito veloz.','Torna-se parceiro inseparável de um jovem viking.','Toothless (How to Train Your Dragon)',['Toothless','Banguela']],
 ['Emília','Sítio do Picapau Amarelo','anos 2010','É uma boneca falante conhecida por ser atrevida e curiosa.','Vive aventuras num sítio cheio de fantasia.','Emília (Sítio do Picapau Amarelo)',['Emília']],
 ['Visconde de Sabugosa','Sítio do Picapau Amarelo','anos 2010','É um personagem muito inteligente feito a partir de um vegetal.','Frequentemente representa o lado científico das aventuras.','Visconde de Sabugosa',['Visconde']],
 ['Smurfette','Os Smurfs','anos 2010','É uma das figuras mais conhecidas de uma pequena comunidade azul.','Vive numa vila de casas em forma de cogumelo.','Smurfette',['Smurfette']],
 ['Papai Smurf','Os Smurfs','anos 2010','É o líder mais velho de uma comunidade de pequenos seres azuis.','Usa barba branca e roupas vermelhas.','Papa Smurf',['Papai Smurf']],
 ['Garfield','Garfield','anos 2010','É um gato laranja preguiçoso e sarcástico.','Adora lasanha e não gosta de segundas-feiras.','Garfield (character)',['Garfield']]
];


const DRAGON_BALL = [
 ['Goku','classic','Dragon Ball clássico','Criado nas montanhas, é obcecado por treino e artes marciais.','Começa a aventura procurando esferas mágicas e cresce como um guerreiro extraordinário.','Goku',['Son Goku']],
 ['Bulma','classic','Dragon Ball clássico','É uma inventora brilhante e uma das primeiras companheiras do protagonista.','Sua busca por sete esferas dá início a uma das maiores aventuras da série.','Bulma',[]],
 ['Mestre Kame','classic','Dragon Ball clássico','É um lendário mestre de artes marciais que vive numa pequena ilha.','Treinou alguns dos lutadores mais importantes do início da história.','Master Roshi',['Kame Sennin','Muten Roshi']],
 ['Kuririn','classic','Dragon Ball clássico','Começa como rival de treinamento e vira um dos amigos mais leais do protagonista.','É um artista marcial humano conhecido pela coragem mesmo diante de inimigos muito superiores.','Krillin',['Krillin']],
 ['Yamcha','classic','Dragon Ball clássico','Surge como bandido do deserto antes de se juntar ao grupo principal.','Tem um companheiro animal que o acompanha desde o começo.','Yamcha',[]],
 ['Tenshinhan','classic','Dragon Ball clássico','É um lutador de três olhos que começa ligado a uma escola rival.','Depois passa a lutar ao lado dos heróis e mantém disciplina extrema.','Tien Shinhan',['Tien','Tenshinhan']],
 ['Chaos','classic','Dragon Ball clássico','É pequeno, pálido e possui poderes psíquicos.','Sua amizade com um guerreiro de três olhos é uma de suas marcas.','Chiaotzu',['Chiaotzu','Chaoz']],
 ['Chi-Chi','classic','Dragon Ball clássico','É filha de um rei e conhece o protagonista ainda criança.','Mais tarde forma uma família central para a história.','Chi-Chi (Dragon Ball)',['Chichi']],
 ['Piccolo Daimaoh','classic','Dragon Ball clássico','É uma ameaça demoníaca que busca recuperar juventude e dominar o mundo.','Sua existência está ligada diretamente a outro personagem verde muito importante.','King Piccolo',['Rei Piccolo','Piccolo Daimaoh']],
 ['Oolong','classic','Dragon Ball clássico','É um porquinho capaz de mudar de forma.','Participa das primeiras buscas pelas esferas e costuma agir de modo covarde.','Oolong (Dragon Ball)',['Oolong']],
 ['Puar','classic','Dragon Ball clássico','É um pequeno companheiro voador capaz de se transformar.','Costuma acompanhar um antigo bandido do deserto.','Puar (Dragon Ball)',['Pual']],
 ['Pilaf','classic','Dragon Ball clássico','É um pequeno vilão que sonha com dominar o mundo.','Busca as esferas desde os primeiros arcos da franquia.','Pilaf (Dragon Ball)',['Imperador Pilaf','Emperor Pilaf']],
 ['Tao Pai Pai','classic','Dragon Ball clássico','É um assassino mercenário extremamente perigoso.','Foi um dos primeiros inimigos a mostrar ao protagonista que treino não bastava sem estratégia.','Mercenary Tao',['Mercenary Tao','Tao']],

 ['Vegeta','z','Dragon Ball Z','É o príncipe de uma raça guerreira quase extinta e começa como invasor.','Orgulho, rivalidade e busca constante por superar Goku definem sua trajetória.','Vegeta',[]],
 ['Gohan','z','Dragon Ball Z','É filho de Goku e demonstra enorme poder quando suas emoções explodem.','Tem papel decisivo numa batalha contra uma forma de vida artificial perfeita.','Gohan',['Son Gohan']],
 ['Piccolo','z','Dragon Ball Z','É um guerreiro namekuseijin que começa como rival e vira mentor.','Cria um forte vínculo com o filho de Goku.','Piccolo (Dragon Ball)',['Piccolo']],
 ['Freeza','z','Dragon Ball Z','É um imperador galáctico responsável por destruir o planeta natal dos Saiyajins.','Seu confronto em Namekusei desencadeia uma transformação lendária.','Frieza',['Frieza','Freeza']],
 ['Cell','z','Dragon Ball Z','É um bioandroide criado a partir de células de grandes lutadores.','Busca absorver dois androides para atingir sua forma perfeita.','Cell (Dragon Ball)',['Perfect Cell']],
 ['Majin Boo','z','Dragon Ball Z','É uma criatura mágica capaz de regeneração e várias transformações.','Pode transformar inimigos em doces e possui versões muito diferentes de personalidade.','Majin Buu',['Majin Buu','Buu','Boo']],
 ['Trunks','z','Dragon Ball Z','É um guerreiro que chega do futuro para alertar sobre uma grande ameaça.','Usa espada em sua primeira aparição e é filho de dois personagens centrais.','Trunks (Dragon Ball)',['Future Trunks','Trunks do Futuro']],
 ['Goten','z','Dragon Ball Z','É o segundo filho de Goku e alcança uma transformação poderosa ainda criança.','É melhor amigo de Trunks e participa de uma famosa fusão.','Goten',[]],
 ['Androide 18','z','Dragon Ball Z','Foi transformada em androide por um cientista e inicialmente é uma ameaça.','Mais tarde forma família com um dos guerreiros humanos.','Android 18',['Android 18','Número 18']],
 ['Androide 17','z','Dragon Ball Z','É irmão gêmeo da Androide 18 e também foi modificado por um cientista.','Ganha importância ainda maior anos depois, em uma competição entre universos.','Android 17',['Android 17','Número 17']],
 ['Raditz','z','Dragon Ball Z','É o primeiro grande visitante Saiyajin a chegar à Terra no início de Z.','Revela informações fundamentais sobre a origem de Goku.','Raditz',[]],
 ['Nappa','z','Dragon Ball Z','É um Saiyajin alto e brutal que invade a Terra ao lado de Vegeta.','Seu poder causa enormes perdas entre os defensores do planeta.','Nappa',[]],
 ['Capitão Ginyu','z','Dragon Ball Z','Lidera uma tropa de elite do exército de Freeza.','Sua técnica mais incomum permite trocar de corpo com o adversário.','Captain Ginyu',['Ginyu']],
 ['Mr. Satan','z','Dragon Ball Z','É apresentado ao público como campeão mundial de artes marciais.','Apesar de não acompanhar o poder dos Guerreiros Z, acaba tendo papel inesperadamente importante.','Mr. Satan',['Hercule','Mister Satan']],
 ['Videl','z','Dragon Ball Z','É filha do campeão mundial e começa investigando a identidade de um herói mascarado.','Aprende a voar e se aproxima de Gohan.','Videl',[]],
 ['Dabura','z','Dragon Ball Z','É conhecido como rei do mundo dos demônios.','Serve a um feiticeiro durante o arco de Majin Boo.','Dabura',[]],

 ['Pan','gt','Dragon Ball GT','É neta de Goku e participa ativamente da viagem espacial do início da série.','Tem personalidade forte e acompanha a busca pelas Esferas do Dragão de Estrelas Negras.','Pan (Dragon Ball)',['Pan']],
 ['Uub','gt','Dragon Ball GT','É a reencarnação humana da forma maligna de Majin Boo.','Treina com Goku e depois recebe um grande aumento de poder.','Uub',['Oob','Majuub']],
 ['Baby','gt','Dragon Ball GT','É um parasita criado para se vingar dos Saiyajins.','Consegue possuir corpos e transforma Vegeta em seu hospedeiro mais poderoso.','Baby (Dragon Ball)',['Baby Vegeta']],
 ['Super 17','gt','Dragon Ball GT','Nasce da fusão de duas versões do mesmo androide.','Sua habilidade de absorver energia o torna extremamente perigoso.','Super 17',['Super Android 17']],
 ['Omega Shenlong','gt','Dragon Ball GT','É o mais poderoso dos dragões malignos formados pela energia negativa das esferas.','Representa a ameaça final da série GT.','Omega Shenron',['Omega Shenron','Syn Shenron']],
 ['Nuova Shenlong','gt','Dragon Ball GT','É um dos dragões malignos e está ligado à esfera de quatro estrelas.','Apesar de inimigo, demonstra um senso de honra incomum.','Nuova Shenron',['Nuova Shenron']],
 ['Eis Shenlong','gt','Dragon Ball GT','É um dragão maligno associado ao gelo e irmão de outro dragão mais honrado.','Usa ataques frios e estratégias desleais.','Eis Shenron',['Eis Shenron']],
 ['General Rilldo','gt','Dragon Ball GT','É um comandante mecânico encontrado durante a viagem espacial.','Consegue transformar matéria ao redor em metal.','General Rilldo',['Rilldo']],
 ['Giru','gt','Dragon Ball GT','É um pequeno robô que acompanha Goku, Pan e Trunks pelo espaço.','No começo causa problemas ao engolir um equipamento essencial para a viagem.','Giru',['Gill']],
 ['Majuub','gt','Dragon Ball GT','É resultado da união de Uub com uma parte bondosa de Majin Boo.','A fusão aumenta muito seu poder durante o confronto contra Baby.','Uub',['Majuub']],

 ['Bills','super','Dragon Ball Super','É um Deus da Destruição felino que desperta após um longo sono.','Procura um guerreiro ligado a uma antiga profecia de poder divino.','Beerus',['Beerus','Bills']],
 ['Whis','super','Dragon Ball Super','É um anjo responsável por acompanhar e treinar o Deus da Destruição do Universo 7.','Seu nível de poder e sua calma estão muito acima da maioria dos lutadores.','Whis',[]],
 ['Jiren','super','Dragon Ball Super','É um guerreiro extremamente poderoso do Universo 11.','Sua força é o principal obstáculo de Goku no Torneio do Poder.','Jiren',['Jiren the Gray']],
 ['Hit','super','Dragon Ball Super','É um assassino do Universo 6 conhecido por manipular pequenos intervalos de tempo.','Seu estilo de luta obriga Goku a se adaptar rapidamente.','Hit (Dragon Ball)',['Hit']],
 ['Goku Black','super','Dragon Ball Super','Tem a aparência de Goku, mas uma identidade e objetivo completamente diferentes.','Usa energia divina e trabalha ao lado de Zamasu.','Goku Black',['Black Goku']],
 ['Zamasu','super','Dragon Ball Super','É um aprendiz de Kaioshin que desenvolve desprezo pelos mortais.','Seu plano envolve imortalidade e versões alternativas da linha do tempo.','Zamasu',[]],
 ['Caulifla','super','Dragon Ball Super','É uma Saiyajin do Universo 6 confiante e talentosa.','Aprende rapidamente transformações que levaram outros personagens anos para dominar.','Caulifla',[]],
 ['Kale','super','Dragon Ball Super','É uma Saiyajin tímida do Universo 6 com uma transformação de poder explosivo.','Sua amizade com Caulifla é central em suas aparições.','Kale (Dragon Ball)',['Kale']],
 ['Cabba','super','Dragon Ball Super','É um Saiyajin do Universo 6 e soldado respeitoso.','Vegeta assume uma postura de mentor durante um torneio entre universos.','Cabba',['Kyabe']],
 ['Toppo','super','Dragon Ball Super','É líder dos Pride Troopers do Universo 11.','Durante o Torneio do Poder revela ligação com o cargo de Deus da Destruição.','Toppo',['Top']],
 ['Champa','super','Dragon Ball Super','É o Deus da Destruição do Universo 6 e irmão de Bills.','Sua rivalidade com o irmão leva a uma competição entre universos.','Champa',[]],
 ['Vados','super','Dragon Ball Super','É a anja assistente do Deus da Destruição do Universo 6.','É irmã de Whis e atua como sua contraparte em outro universo.','Vados',[]],
 ['Frost','super','Dragon Ball Super','É um lutador do Universo 6 visualmente parecido com Freeza.','Sua reputação inicialmente heroica esconde métodos menos nobres.','Frost (Dragon Ball)',['Frost']],
 ['Zen-Oh','super','Dragon Ball Super','É a autoridade máxima sobre todos os universos.','Apesar da aparência infantil, pode apagar universos inteiros instantaneamente.','Zeno (Dragon Ball)',['Zeno','Zenoh','Zeno Sama']],
 ['Grande Sacerdote','super','Dragon Ball Super','É uma das figuras mais poderosas do multiverso e pai dos anjos conhecidos.','Serve diretamente a Zen-Oh.','Grand Minister (Dragon Ball)',['Grand Priest','Daishinkan','Grande Sacerdote']]
];

const YUGIOH = [
 ['Yugi Muto','classic','Clássico • Duel Monsters','É um duelista gentil ligado ao Enigma do Milênio.','Divide o protagonismo com uma personalidade ancestral extremamente habilidosa nos duelos.','Yugi Mutou',['Yugi Muto','Yugi']],
 ['Atem','classic','Clássico • Duel Monsters','É um antigo faraó cuja memória está ligada ao Enigma do Milênio.','Durante os duelos, assume a aparência de uma versão mais confiante do protagonista.','Atem',['Yami Yugi','Faraó Atem']],
 ['Seto Kaiba','classic','Clássico • Duel Monsters','É um empresário genial e rival obcecado em superar Yugi.','Seu monstro favorito é um dragão branco de olhos azuis.','Seto Kaiba',['Kaiba']],
 ['Joey Wheeler','classic','Clássico • Duel Monsters','Começa como amigo briguento e cresce muito como duelista.','Seu deck é conhecido por guerreiros, dragões e cartas que envolvem sorte.','Joey Wheeler',['Jounouchi','Katsuya Jonouchi','Joey']],
 ['Téa Gardner','classic','Clássico • Duel Monsters','É amiga próxima de Yugi e sonha em seguir carreira na dança.','Costuma ser uma das principais vozes de apoio do grupo.','Téa Gardner',['Tea Gardner','Anzu Mazaki','Téa']],
 ['Tristan Taylor','classic','Clássico • Duel Monsters','É amigo de Yugi e Joey, mais conhecido pelo apoio ao grupo que por duelos.','Participa das aventuras do Reino dos Duelistas e Cidade das Batalhas.','Tristan Taylor',['Hiroto Honda','Tristan']],
 ['Ryo Bakura','classic','Clássico • Duel Monsters','É um estudante britânico gentil ligado ao Anel do Milênio.','O objeto guarda uma presença sombria que frequentemente assume seu corpo.','Ryo Bakura',['Bakura']],
 ['Yami Bakura','classic','Clássico • Duel Monsters','É a personalidade maligna ligada ao Anel do Milênio.','Manipula eventos por muito tempo e tem relação com o passado do faraó.','Yami Bakura',['Bakura do Mal']],
 ['Maximillion Pegasus','classic','Clássico • Duel Monsters','É o criador do jogo Duelo de Monstros e organizador do Reino dos Duelistas.','Possui um Item do Milênio que lhe dá vantagem assustadora.','Maximillion Pegasus',['Pegasus','Pegasus J. Crawford']],
 ['Mai Valentine','classic','Clássico • Duel Monsters','É uma duelista independente conhecida por um deck de amazonas e Harpias.','Começa como rival e passa a respeitar o grupo principal.','Mai Valentine',['Mai Kujaku','Mai']],
 ['Marik Ishtar','classic','Clássico • Duel Monsters','É herdeiro de uma família de guardiões de tumbas.','Tem ligação direta com uma das três Cartas de Deuses Egípcios.','Marik Ishtar',['Marik']],
 ['Yami Marik','classic','Clássico • Duel Monsters','É uma personalidade cruel surgida do trauma de Marik.','Seu estilo de duelo transforma partidas em jogos sombrios perigosos.','Marik Ishtar',['Yami Marik','Dark Marik']],
 ['Ishizu Ishtar','classic','Clássico • Duel Monsters','É irmã de Marik e portadora de um colar do Milênio.','Consegue vislumbrar possibilidades do futuro e tenta impedir uma tragédia familiar.','Ishizu Ishtar',['Ishizu']],
 ['Mokuba Kaiba','classic','Clássico • Duel Monsters','É o irmão mais novo de Seto Kaiba.','Mesmo sem ser o principal duelista, aparece constantemente ao lado do irmão.','Mokuba Kaiba',['Mokuba']],
 ['Weevil Underwood','classic','Clássico • Duel Monsters','É um duelista especializado em monstros inseto.','É conhecido por truques desonestos desde o Reino dos Duelistas.','Weevil Underwood',['Haga','Insector Haga','Weevil']],
 ['Rex Raptor','classic','Clássico • Duel Monsters','Seu deck é focado em dinossauros e criaturas pré-históricas.','Costuma aparecer ao lado de outro duelista trapaceiro especializado em insetos.','Rex Raptor',['Dinosaur Ryuzaki','Rex']],
 ['Bandit Keith','classic','Clássico • Duel Monsters','É um duelista americano conhecido por usar máquinas.','Entra no Reino dos Duelistas buscando vingança contra Pegasus.','Bandit Keith',['Keith Howard']],
 ['Duke Devlin','classic','Clássico • Duel Monsters','É criador de um jogo de dados que desafia Yugi fora do formato tradicional de cartas.','Depois se torna aliado recorrente do grupo.','Duke Devlin',['Ryuji Otogi','Duke']],

 ['Jaden Yuki','gx','Yu-Gi-Oh! GX','É um aluno da Academia de Duelos com talento natural e personalidade descontraída.','Seu deck começa fortemente associado aos Heróis Elementais.','Jaden Yuki',['Judai Yuki','Jaden']],
 ['Chazz Princeton','gx','Yu-Gi-Oh! GX','É um duelista orgulhoso que começa na elite da Academia.','Passa por uma grande queda e reinvenção, adotando cartas bem inesperadas.','Chazz Princeton',['Jun Manjoume','Chazz']],
 ['Alexis Rhodes','gx','Yu-Gi-Oh! GX','É uma das melhores duelistas da Academia e integrante do dormitório Obelisco Azul.','Tem ligação importante com o desaparecimento de seu irmão.','Alexis Rhodes',['Asuka Tenjoin','Alexis']],
 ['Syrus Truesdale','gx','Yu-Gi-Oh! GX','É amigo próximo de Jaden e começa bastante inseguro.','Seu deck usa veículos e máquinas conhecidas como Roid.','Syrus Truesdale',['Sho Marufuji','Syrus']],
 ['Zane Truesdale','gx','Yu-Gi-Oh! GX','É irmão mais velho de Syrus e uma estrela entre os duelistas da Academia.','Seu deck é famoso pelos Cyber Dragons.','Zane Truesdale',['Ryo Marufuji','Zane']],
 ['Bastion Misawa','gx','Yu-Gi-Oh! GX','É um aluno extremamente analítico que prepara estratégias para vários tipos de adversário.','Costuma abordar duelos de forma quase científica.','Bastion Misawa',['Daichi Misawa','Bastion']],
 ['Professor Crowler','gx','Yu-Gi-Oh! GX','É um professor da Academia de Duelos que inicialmente quer expulsar Jaden.','Seu deck usa monstros de engrenagens antigas.','Vellian Crowler',['Chronos de Medici','Crowler']],
 ['Jesse Anderson','gx','Yu-Gi-Oh! GX','É um duelista amigável que enxerga espíritos de monstros.','Seu deck gira em torno das Bestas de Cristal.','Jesse Anderson',['Johan Andersen','Jesse']],
 ['Aster Phoenix','gx','Yu-Gi-Oh! GX','É um duelista profissional jovem e extremamente habilidoso.','Usa uma linha de heróis diferente da de Jaden, ligada ao destino.','Aster Phoenix',['Edo Phoenix','Aster']],
 ['Yubel','gx','Yu-Gi-Oh! GX','É um espírito de monstro profundamente ligado ao passado de Jaden.','Amor, obsessão e sofrimento se misturam em sua relação com o protagonista.','Yubel',[]],
 ['Atticus Rhodes','gx','Yu-Gi-Oh! GX','É o irmão mais velho de Alexis e desaparece por um período misterioso.','Também assume uma identidade sombria durante parte da história.','Atticus Rhodes',['Fubuki Tenjoin','Atticus']],
 ['Axel Brodie','gx','Yu-Gi-Oh! GX','É um duelista disciplinado vindo de outra academia.','Seu deck usa monstros Vulcânicos e estratégias de dano por efeito.','Axel Brodie',['Austin O’Brien','Axel']],
 ['Jim Crocodile Cook','gx','Yu-Gi-Oh! GX','É um estudante australiano que anda acompanhado de um crocodilo.','Seu deck trabalha com fósseis e fusões ligadas ao cemitério do oponente.','Jim Crocodile Cook',['Jim Cook']],
 ['Adrian Gecko','gx','Yu-Gi-Oh! GX','É herdeiro de uma grande família e chega à Academia com forte ambição.','Sua busca por reconhecimento o leva a escolhas cada vez mais arriscadas.','Adrian Gecko',['Amon Garam','Adrian']],
 ['Tyranno Hassleberry','gx','Yu-Gi-Oh! GX','É um aluno com paixão absoluta por dinossauros e comportamento militar.','Torna-se um dos amigos mais próximos de Jaden.','Tyranno Hassleberry',['Kenzan Tyranno','Hassleberry']],
 ['Blair Flannigan','gx','Yu-Gi-Oh! GX','É uma duelista mais jovem que entra na Academia após aparições anteriores disfarçada.','Tem uma paixão evidente por Jaden.','Blair Flannigan',['Rei Saotome','Blair']]
];

const NARUTO = [
 ['Naruto Uzumaki','classic','Naruto clássico','É um ninja barulhento que sonha em se tornar Hokage para ser reconhecido.','Carrega dentro de si uma poderosa besta com cauda.','Naruto Uzumaki',['Naruto']],
 ['Sasuke Uchiha','classic','Naruto clássico','É um prodígio de um clã destruído e vive movido pela vingança.','Possui um dojutsu herdado de sua família.','Sasuke Uchiha',['Sasuke']],
 ['Sakura Haruno','classic','Naruto clássico','Integra o Time 7 e começa com excelente controle de chakra.','Mais tarde escolhe seguir os passos de uma lendária ninja médica.','Sakura Haruno',['Sakura']],
 ['Kakashi Hatake','classic','Naruto clássico','É o sensei do Time 7, famoso por copiar técnicas de outros ninjas.','Costuma esconder metade do rosto e carregar um livro.','Kakashi Hatake',['Kakashi']],
 ['Iruka Umino','classic','Naruto clássico','É professor da Academia Ninja e uma das primeiras pessoas a reconhecer Naruto de verdade.','Tem papel emocional muito importante no início da história.','Iruka Umino',['Iruka']],
 ['Gaara','classic','Naruto clássico','É um jovem da Areia capaz de controlar areia automaticamente para defesa.','Também carrega uma besta com cauda e começa como ameaça assustadora.','Gaara',['Gaara do Deserto']],
 ['Rock Lee','classic','Naruto clássico','Não consegue usar ninjutsu ou genjutsu de forma tradicional.','Compensa isso com treino extremo de taijutsu e pesos nas pernas.','Rock Lee',['Lee']],
 ['Neji Hyuga','classic','Naruto clássico','É um gênio do clã Hyuga que inicialmente acredita fortemente em destino.','Usa Byakugan e um estilo de luta que ataca pontos de chakra.','Neji Hyuga',['Neji']],
 ['Hinata Hyuga','classic','Naruto clássico','É uma kunoichi tímida do clã Hyuga que admira Naruto desde cedo.','Possui Byakugan e aprende a superar sua insegurança.','Hinata Hyuga',['Hinata']],
 ['Shikamaru Nara','classic','Naruto clássico','É extremamente inteligente, mas considera quase tudo trabalhoso.','Manipula sombras e se destaca como estrategista.','Shikamaru Nara',['Shikamaru']],
 ['Choji Akimichi','classic','Naruto clássico','É um ninja do clã Akimichi e grande amigo de Shikamaru.','Suas técnicas permitem aumentar partes do corpo e converter calorias em poder.','Choji Akimichi',['Choji','Chouji']],
 ['Ino Yamanaka','classic','Naruto clássico','Faz parte do trio Ino-Shika-Cho e possui técnicas mentais.','Tem uma rivalidade antiga com Sakura.','Ino Yamanaka',['Ino']],
 ['Kiba Inuzuka','classic','Naruto clássico','Luta ao lado de um cachorro ninja que o acompanha desde jovem.','Tem olfato apurado e técnicas inspiradas em feras.','Kiba Inuzuka',['Kiba']],
 ['Shino Aburame','classic','Naruto clássico','É reservado e usa insetos como parte de suas técnicas de combate.','Pertence ao mesmo time de Hinata e Kiba.','Shino Aburame',['Shino']],
 ['Jiraiya','classic','Naruto clássico','É um dos três ninjas lendários e mestre importante de Naruto.','É conhecido por invocações de sapos e por escrever livros.','Jiraiya',['Ero Sennin']],
 ['Tsunade','classic','Naruto clássico','É uma das três ninjas lendárias, médica excepcional e dona de força física enorme.','Assume a liderança de Konoha depois de um período longe da vila.','Tsunade',[]],
 ['Orochimaru','classic','Naruto clássico','É um dos três ninjas lendários e conduz experimentos em busca de imortalidade.','Tem interesse especial no corpo e nas habilidades de Sasuke.','Orochimaru',[]],
 ['Zabuza Momochi','classic','Naruto clássico','É um espadachim renegado da Névoa encontrado numa das primeiras grandes missões do Time 7.','Usa uma enorme espada e técnicas de água e névoa.','Zabuza Momochi',['Zabuza']],
 ['Haku','classic','Naruto clássico','É companheiro de Zabuza e possui uma kekkei genkai de gelo.','Seu jeito gentil contrasta com a vida como ferramenta de um ninja renegado.','Haku (Naruto)',['Haku']],
 ['Temari','classic','Naruto clássico','É uma kunoichi da Areia que luta usando um enorme leque.','É irmã de Gaara e especialista em ataques de vento a distância.','Temari (Naruto)',['Temari']],
 ['Kankuro','classic','Naruto clássico','É irmão de Gaara e usa marionetes em combate.','Pintura facial e roupas escuras marcam seu visual inicial.','Kankuro',['Kankurō']],
 ['Might Guy','classic','Naruto clássico','É mestre de Rock Lee e rival autodeclarado de Kakashi.','Sua especialidade é taijutsu levado ao extremo.','Might Guy',['Maito Gai','Guy']],

 ['Itachi Uchiha','shippuden','Naruto Shippuden','É o irmão mais velho de Sasuke e foi responsável por uma tragédia envolvendo o clã.','Sua verdadeira motivação é muito mais complexa do que parece no início.','Itachi Uchiha',['Itachi']],
 ['Pain','shippuden','Naruto Shippuden','É o rosto principal de uma organização criminosa durante o ataque a Konoha.','Controla vários corpos e busca impor paz através da dor.','Nagato (Naruto)',['Pain','Nagato','Pein']],
 ['Konan','shippuden','Naruto Shippuden','É uma kunoichi da Chuva e parceira de longa data de Nagato.','Suas técnicas transformam papel em armas, asas e armadilhas.','Konan (Naruto)',['Konan']],
 ['Deidara','shippuden','Naruto Shippuden','É um membro da Akatsuki que trata explosões como arte.','Molda argila explosiva usando bocas especiais nas mãos.','Deidara',['Deidara']],
 ['Sasori','shippuden','Naruto Shippuden','É um mestre de marionetes da Akatsuki originário da Areia.','Transformou o próprio corpo e vários inimigos em bonecos de combate.','Sasori',['Sasori da Areia Vermelha']],
 ['Kisame Hoshigaki','shippuden','Naruto Shippuden','É um espadachim da Névoa com aparência de tubarão e enorme reserva de chakra.','Empunha uma espada viva capaz de absorver energia.','Kisame Hoshigaki',['Kisame']],
 ['Hidan','shippuden','Naruto Shippuden','É um membro imortal da Akatsuki ligado a um culto religioso.','Seus rituais transformam ferimentos no próprio corpo em dano ao adversário.','Hidan',['Hidan']],
 ['Kakuzu','shippuden','Naruto Shippuden','É parceiro de Hidan e possui múltiplos corações.','Tem obsessão por dinheiro e uma longevidade anormal.','Kakuzu',['Kakuzu']],
 ['Obito Uchiha','shippuden','Naruto Shippuden','Foi companheiro de equipe de Kakashi e dado como morto quando jovem.','Anos depois, sua identidade e suas escolhas mudam o rumo da guerra ninja.','Obito Uchiha',['Obito','Tobi']],
 ['Madara Uchiha','shippuden','Naruto Shippuden','É um dos fundadores de Konoha e lendário rival do Primeiro Hokage.','Retorna como uma das maiores ameaças da Quarta Guerra Ninja.','Madara Uchiha',['Madara']],
 ['Killer B','shippuden','Naruto Shippuden','É jinchuriki do Oito-Caudas e luta com várias espadas ao mesmo tempo.','Também improvisa rimas constantemente.','Killer B',['Killer Bee','Bee']],
 ['Minato Namikaze','shippuden','Naruto Shippuden','É conhecido como Relâmpago Amarelo e foi o Quarto Hokage.','Sua técnica de teletransporte o tornou lendário durante a guerra.','Minato Namikaze',['Minato','Quarto Hokage']],
 ['Kushina Uzumaki','shippuden','Naruto Shippuden','É mãe de Naruto e antiga jinchuriki da Nove-Caudas.','Veio do clã Uzumaki e possui chakra especialmente forte.','Kushina Uzumaki',['Kushina']],
 ['Sai','shippuden','Naruto Shippuden','Entra no Time 7 durante a ausência de Sasuke.','Dá vida a desenhos usando tinta e tem dificuldade inicial com emoções sociais.','Sai (Naruto)',['Sai']],
 ['Yamato','shippuden','Naruto Shippuden','Assume temporariamente a liderança do Time 7.','É um dos raros ninjas capazes de usar Liberação de Madeira.','Yamato (Naruto)',['Yamato','Tenzo']],
 ['Kabuto Yakushi','shippuden','Naruto Shippuden','Começa como assistente de Orochimaru e especialista médico.','Ao longo da história modifica o próprio corpo em busca de identidade e poder.','Kabuto Yakushi',['Kabuto']],
 ['Hashirama Senju','shippuden','Naruto Shippuden','É o Primeiro Hokage e um dos fundadores de Konoha.','Sua Liberação de Madeira e seu poder natural são lendários.','Hashirama Senju',['Hashirama','Primeiro Hokage']],
 ['Tobirama Senju','shippuden','Naruto Shippuden','É o Segundo Hokage e irmão mais novo de Hashirama.','Criou várias técnicas que influenciaram gerações posteriores.','Tobirama Senju',['Tobirama','Segundo Hokage']],
 ['Danzo Shimura','shippuden','Naruto Shippuden','É uma figura política de Konoha que age nas sombras em nome da segurança da vila.','Lidera a Raiz e acumula poderes obtidos de maneira controversa.','Danzo Shimura',['Danzo','Danzō']],
 ['Suigetsu Hozuki','shippuden','Naruto Shippuden','É um espadachim capaz de transformar o corpo em água.','Integra a equipe formada por Sasuke depois de romper com Orochimaru.','Suigetsu Hozuki',['Suigetsu']],
 ['Karin Uzumaki','shippuden','Naruto Shippuden','É uma ninja sensorial com capacidade de detectar chakra a longas distâncias.','Também possui uma habilidade de cura incomum ligada ao próprio corpo.','Karin (Naruto)',['Karin']],
 ['Jugo','shippuden','Naruto Shippuden','É a origem de uma característica usada nos experimentos de Orochimaru.','Oscila entre personalidade gentil e impulsos violentos.','Jugo (Naruto)',['Jugo','Juugo']],
 ['Mei Terumi','shippuden','Naruto Shippuden','É a Quinta Mizukage e possui mais de uma kekkei genkai elemental.','Participa diretamente da aliança das cinco grandes vilas.','Mei Terumi',['Mei']],
 ['Onoki','shippuden','Naruto Shippuden','É o idoso Terceiro Tsuchikage e usuário de uma técnica extremamente destrutiva.','Apesar da idade, tem papel decisivo na Guerra Ninja.','Onoki',['Ōnoki','Ohnoki']],
 ['A Quarto Raikage','shippuden','Naruto Shippuden','É o líder da Vila da Nuvem e irmão adotivo de Killer B.','Combina velocidade extrema com uma armadura de relâmpago.','A (Fourth Raikage)',['Quarto Raikage','A']],
 ['Kaguya Otsutsuki','shippuden','Naruto Shippuden','É uma figura ancestral ligada à origem do chakra no mundo ninja.','Surge perto do fim como ameaça de escala completamente diferente.','Kaguya Ōtsutsuki',['Kaguya']]
];

function uniqueRows(rows){const seen=new Set();return rows.filter(r=>{const k=String(r?.[0]||'').toLowerCase();if(!k||seen.has(k))return false;seen.add(k);return true;});}
const DRAGON_BALL_V8=uniqueRows([...DRAGON_BALL,...EXTRA_DRAGON_BALL,...V8_DRAGON_BALL]);
const YUGIOH_V8=uniqueRows([...YUGIOH,...EXTRA_YUGIOH,...V8_YUGIOH]);
const NARUTO_V8=uniqueRows([...NARUTO,...EXTRA_NARUTO,...V8_NARUTO]);
const SAINT_SEIYA_V8=uniqueRows([...SAINT_SEIYA,...V8_SAINT_SEIYA]);
const CHARACTER_CLASSICS_V8=uniqueRows([...CHARACTER_CLASSICS,...V8_CARTOONS]);

function normalizeFranchiseCharacter(row,universe,seriesKey,source){
  const [name,filter,era,c1,c2,title,aliases=[],rawDetails={}]=row;
  const details={...(LEGACY_DETAILS?.[universe]?.[name]||{}),...(rawDetails||{})};
  const clues=[
    {kind:'era',label:'📺 Fase / saga',text:era},
    details.ability&&{kind:'ability',label:'💥 Habilidade / técnica',text:details.ability},
    details.origin&&{kind:'origin',label:'🌍 Origem / nação',text:details.origin},
    details.group&&{kind:'group',label:'🛡️ Grupo / afiliação',text:details.group},
    details.role&&{kind:'role',label:'🎭 Função / classe',text:details.role},
    details.armor&&{kind:'armor',label:'♈ Armadura / constelação',text:details.armor},
    details.variant&&{kind:'variant',label:'✨ Variação',text:details.variant},
    {kind:'trait',label:'🧩 Característica',text:c1},
    {kind:'trait',label:'🔎 Outra pista',text:c2},
    {kind:'name',label:'🔤 Nome',text:`O nome possui ${String(name).replace(/[^A-Za-zÀ-ÿ]/g,'').length} letras, sem contar espaços e símbolos.`}
  ].filter(Boolean);
  const result=[`📺 ${era}`,details.origin?`🌍 ${details.origin}`:'',details.group?`🛡️ ${details.group}`:'',details.ability?`💥 ${details.ability}`:'',`🌌 ${source}`].filter(Boolean);
  const alts=[name,...aliases].filter(Boolean).join('|');
  return {id:`${universe}:${filter}:${name}`,name,aliases,image:`/api/asset?src=franchise&series=${seriesKey}&title=${encodeURIComponent(title||name)}&context=${encodeURIComponent(era||source)}&alts=${encodeURIComponent(alts)}`,meta:{era,filter,universeKey:universe,...details},clues,result,source};
}
function franchiseSession(data,limit,filter,universe,seriesKey,source){let pool=data;if(filter==='variants')pool=pool.filter(x=>Boolean(x?.[7]?.variant));else if(filter&&filter!=='all')pool=pool.filter(x=>String(x[1]).toLowerCase()===filter);return sample(pool,limit).map(x=>normalizeFranchiseCharacter(x,universe,seriesKey,source));}

function normalizeCharacter(row,universe){const [name,show,era,c1,c2,wikiTitle,aliases=[]]=row;const alts=[name,...aliases].filter(Boolean).join('|');return {id:`${universe}:${name}`,name,aliases,image:`/api/asset?src=wiki&title=${encodeURIComponent(wikiTitle||name)}&context=${encodeURIComponent(show||'')}&alts=${encodeURIComponent(alts)}`,meta:{show,era,universeKey:universe},clues:[{kind:'group',label:'📺 Universo',text:universe==='globinho'?'Fez parte de uma atração/desenho associado à TV Globinho.':`Aparece em ${show}.`},{kind:'era',label:'🕰️ Época',text:`Muito lembrado no Brasil nos ${era}.`},{kind:'trait',label:'🧩 Característica',text:c1},{kind:'trait',label:'🔎 Outra pista',text:c2}],result:[`📺 ${show}`,`🕰️ ${era}`],source:universe==='globinho'?'TV Globinho':'Curadoria'};}

function randomCuratedSession(limit){
  const all=[
    ...DRAGON_BALL_V8.map(x=>normalizeFranchiseCharacter(x,'dragonball','db','Dragon Ball')),
    ...YUGIOH_V8.map(x=>normalizeFranchiseCharacter(x,'yugioh','ygo','Yu-Gi-Oh!')),
    ...NARUTO_V8.map(x=>normalizeFranchiseCharacter(x,'naruto','naruto','Naruto')),
    ...SAINT_SEIYA_V8.map(x=>normalizeFranchiseCharacter(x,'saintseiya','saintseiya','Cavaleiros do Zodíaco')),
    ...CHARACTER_CLASSICS_V8.map(x=>normalizeCharacter(x,'cartoons')),
    ...GLOBINHO.map(x=>normalizeCharacter(x,'globinho'))
  ];
  const seen=new Set();
  const unique=shuffle(all).filter(x=>{const k=String(x.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
  return unique.slice(0,limit);
}

async function leagueSession(limit,filter){const versions=await cached('lol:versions',()=>getJson('https://ddragon.leagueoflegends.com/api/versions.json'));const version=versions?.[0];if(!version)throw new Error('Data Dragon indisponível');const data=await cached(`lol:${version}`,()=>getJson(`https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/champion.json`));let champs=Object.values(data?.data||{});if(filter&&filter!=='all')champs=champs.filter(c=>(c.tags||[]).some(t=>t.toLowerCase()===filter));return sample(champs,limit).map(c=>({id:`lol:${c.id}`,name:c.name,aliases:[],image:`/api/asset?src=lol&id=${encodeURIComponent(c.id)}`,meta:{title:c.title,tags:c.tags||[],partype:c.partype,version},clues:[{kind:'role',label:'⚔️ Função',text:(c.tags||[]).map(x=>PT_TAG[x]||x).join(' / ')||'Função variada'},{kind:'ability',label:'📊 Estilo de combate',text:`Ataque ${c.info?.attack??'?'} • Defesa ${c.info?.defense??'?'} • Magia ${c.info?.magic??'?'}`},{kind:'trait',label:'🧠 Complexidade',text:`Dificuldade oficial: ${c.info?.difficulty??'?'} de 10`},{kind:'title',label:'✨ Título',text:`Conhecido(a) como “${c.title||'título não informado'}”.`}],result:[`⚔️ ${(c.tags||[]).map(x=>PT_TAG[x]||x).join(' / ')}`,`✨ ${c.title||''}`],source:'Riot Data Dragon'}));}

function pokeGeneration(id){if(id<=151)return 'Geração I';if(id<=251)return 'Geração II';if(id<=386)return 'Geração III';if(id<=493)return 'Geração IV';if(id<=649)return 'Geração V';if(id<=721)return 'Geração VI';if(id<=809)return 'Geração VII';if(id<=905)return 'Geração VIII';return 'Geração IX';}
async function pokemonSession(limit,filter){const root=await cached('poke:count',()=>getJson('https://pokeapi.co/api/v2/pokemon?limit=1'));const max=Math.min(Number(root?.count||1025),1025);let min=1,hi=max;if(/^gen[1-9]$/.test(filter||'')){const n=Number(filter.slice(3));const ranges=[[1,151],[152,251],[252,386],[387,493],[494,649],[650,721],[722,809],[810,905],[906,1025]];[min,hi]=ranges[n-1];hi=Math.min(hi,max);}const ids=[];for(let tries=0;tries<limit*15&&ids.length<limit;tries++){const id=min+Math.floor(Math.random()*(hi-min+1));if(!ids.includes(id))ids.push(id);}const details=await Promise.all(ids.map(id=>getJson(`https://pokeapi.co/api/v2/pokemon/${id}`,8000).catch(()=>null)));return details.filter(Boolean).map(p=>{const types=(p.types||[]).map(x=>PT_TYPE[x.type?.name]||cap(x.type?.name));const abilities=(p.abilities||[]).map(x=>cap(String(x.ability?.name||'').replaceAll('-',' ')));return {id:`poke:${p.id}`,name:cap(p.name),aliases:[p.name],image:`/api/asset?src=poke&id=${p.id}`,meta:{types,generation:pokeGeneration(p.id)},clues:[{kind:'role',label:'🔥 Tipo',text:types.join(' / ')||'Desconhecido'},{kind:'era',label:'🧬 Geração',text:pokeGeneration(p.id)},{kind:'trait',label:'📏 Corpo',text:`Altura aproximada ${(Number(p.height||0)/10).toFixed(1)} m • peso ${(Number(p.weight||0)/10).toFixed(1)} kg`},{kind:'ability',label:'✨ Habilidades',text:abilities.slice(0,3).join(' / ')||'Habilidade não informada'}],result:[`🔥 ${types.join(' / ')}`,`🧬 ${pokeGeneration(p.id)}`,`#${p.id}`],source:'PokéAPI'};});}

async function digimonSession(limit,filter){let base='https://digi-api.com/api/v1/digimon?pageSize=100';if(filter&&filter!=='all')base+=`&level=${encodeURIComponent(filter)}`;const first=await getJson(base,10000);const totalPages=Number(first?.pageable?.totalPages||first?.totalPages||1);const page=totalPages>1?Math.floor(Math.random()*totalPages):0;const listing=page?await getJson(`${base}&page=${page}`,10000).catch(()=>first):first;const items=listing?.content||listing?.data||listing?.digimons||[];const chosen=sample(items,Math.min(limit,items.length));const detailed=await Promise.all(chosen.map(x=>{const id=x.id??String(x.href||'').split('/').pop();return getJson(`https://digi-api.com/api/v1/digimon/${id}`,8000).catch(()=>x)}));return detailed.filter(Boolean).map(d=>{const image=d.images?.[0]?.href||d.images?.[0]?.url||d.image||d.imageUrl||'';const levels=(d.levels||[]).map(x=>x.level||x.name).filter(Boolean);const attrs=(d.attributes||[]).map(x=>x.attribute||x.name).filter(Boolean);const types=(d.types||[]).map(x=>x.type||x.name).filter(Boolean);const name=d.name||`Digimon ${d.id}`;const lvl=levels.map(x=>DIGI_LEVEL[String(x).toLowerCase()]||x).join(' / ')||'Nível não informado';const prior=Array.isArray(d.priorEvolutions)?d.priorEvolutions.length:0,next=Array.isArray(d.nextEvolutions)?d.nextEvolutions.length:0;const skills=(d.skills||[]).map(x=>x.skill||x.name).filter(Boolean);const clues=[{kind:'role',label:'🧬 Nível',text:lvl},{kind:'origin',label:'🔷 Atributo',text:attrs.join(' / ')||'Atributo não informado'},{kind:'trait',label:'🦖 Tipo',text:types.join(' / ')||'Tipo não informado'},{kind:'ability',label:'✨ Habilidades',text:skills.slice(0,3).join(' / ')||`Possui ${d.skills?.length||0} habilidade(s) cadastrada(s) na base.`}];if(prior||next)clues.push({label:'🔗 Evolução',text:`A base registra ${prior} evolução(ões) anterior(es) e ${next} possível(is) evolução(ões) seguinte(s).`});return {id:`digi:${d.id||name}`,name,aliases:[],image:`/api/asset?src=digi&url=${encodeURIComponent(image)}`,meta:{levels,attrs,types},clues,result:[`🧬 ${lvl}`,attrs.length?`🔷 ${attrs.join(' / ')}`:''],source:'DAPI'};});}

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Use POST.'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const universe=String(body.universe||'').toLowerCase();
    const limit=Math.max(10,Math.min(80,Number(body.limit)||30));
    const filter=String(body.filter||'all').toLowerCase();
    let items=[];
    if(universe==='lol')items=await leagueSession(limit,filter);
    else if(universe==='pokemon')items=await pokemonSession(limit,filter);
    else if(universe==='digimon')items=await digimonSession(limit,filter);
    else if(universe==='dragonball')items=franchiseSession(DRAGON_BALL_V8,limit,filter,'dragonball','db','Dragon Ball');
    else if(universe==='yugioh')items=franchiseSession(YUGIOH_V8,limit,filter,'yugioh','ygo','Yu-Gi-Oh!');
    else if(universe==='naruto')items=franchiseSession(NARUTO_V8,limit,filter,'naruto','naruto','Naruto');
    else if(universe==='saintseiya')items=franchiseSession(SAINT_SEIYA_V8,limit,filter,'saintseiya','saintseiya','Cavaleiros do Zodíaco');
    else if(universe==='random')items=randomCuratedSession(limit);
    else if(universe==='cartoons')items=sample(CHARACTER_CLASSICS_V8,limit).map(x=>normalizeCharacter(x,'cartoons'));
    else if(universe==='globinho')items=sample(GLOBINHO,limit).map(x=>normalizeCharacter(x,'globinho'));
    else return json(res,400,{error:'Universo inválido.'});
    return json(res,200,{universe,items,returned:items.length,random:true,counts:{dragonball:DRAGON_BALL_V8.length,yugioh:YUGIOH_V8.length,naruto:NARUTO_V8.length,saintseiya:SAINT_SEIYA_V8.length,cartoons:CHARACTER_CLASSICS_V8.length,globinho:GLOBINHO.length}});
  }catch(e){console.error('universe',e);return json(res,e?.status||502,{error:'Não consegui montar este universo agora.',detail:String(e?.message||e)});}
}
