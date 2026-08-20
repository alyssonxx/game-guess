import { QUIZ_FALLBACK } from '../server-data/quiz-fallback.js';
const TRYVIA_BASE='https://tryvia.ptr.red';

function out(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function decodeHtml(s){return String(s??'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&quot;/g,'"').replace(/&#039;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&eacute;/g,'é').replace(/&aacute;/g,'á').replace(/&iacute;/g,'í').replace(/&oacute;/g,'ó').replace(/&uacute;/g,'ú').replace(/&atilde;/g,'ã').replace(/&otilde;/g,'õ').replace(/&ccedil;/g,'ç');}
function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function q(category,question,correct,wrong,difficulty='normal',source='Gerador Game Guess',conceptKey=''){
  const opts=shuffle([String(correct),...wrong.map(String)]).slice(0,4);
  if(!opts.includes(String(correct)))opts[0]=String(correct);
  const dedupeKey=hash(norm(conceptKey||`${category}|${question}|${correct}`));
  return {id:`${source.startsWith('Tryvia')?'ext':'gen'}:${category}:${dedupeKey}`,dedupeKey,category,question:String(question),correct:String(correct),options:shuffle([...new Set(opts)]).slice(0,4),difficulty,source};
}
function numericOptions(correct,spread=10){const c=Number(correct),s=new Set([c]);while(s.size<4){let n=c+rand(-spread,spread);if(n!==c)s.add(n);}return shuffle([...s]).map(String);}
function qNum(cat,prompt,correct,spread=10,diff='normal',conceptKey=''){const opts=numericOptions(correct,spread),dedupeKey=hash(norm(conceptKey||`${cat}|${prompt}|${correct}`));return {id:`gen:${cat}:${dedupeKey}`,dedupeKey,category:cat,question:prompt,correct:String(correct),options:opts,difficulty:diff,source:'Gerador Game Guess'};}

const CAPITALS=[['Brasil','Brasília'],['Argentina','Buenos Aires'],['Chile','Santiago'],['Peru','Lima'],['Colômbia','Bogotá'],['Uruguai','Montevidéu'],['Paraguai','Assunção'],['México','Cidade do México'],['Canadá','Ottawa'],['Estados Unidos','Washington, D.C.'],['Portugal','Lisboa'],['Espanha','Madri'],['França','Paris'],['Itália','Roma'],['Alemanha','Berlim'],['Reino Unido','Londres'],['Irlanda','Dublin'],['Noruega','Oslo'],['Suécia','Estocolmo'],['Finlândia','Helsinque'],['Dinamarca','Copenhague'],['Polônia','Varsóvia'],['Grécia','Atenas'],['Turquia','Ancara'],['Egito','Cairo'],['Marrocos','Rabat'],['Quênia','Nairóbi'],['Etiópia','Adis Abeba'],['África do Sul','Pretória'],['Japão','Tóquio'],['China','Pequim'],['Coreia do Sul','Seul'],['Índia','Nova Délhi'],['Tailândia','Bangkok'],['Vietnã','Hanói'],['Indonésia','Jacarta'],['Austrália','Canberra'],['Nova Zelândia','Wellington']];
const EVENTS=[['Independência do Brasil',1822],['Proclamação da República no Brasil',1889],['Queda do Muro de Berlim',1989],['Fim da Segunda Guerra Mundial',1945],['Início da Primeira Guerra Mundial',1914],['Revolução Francesa',1789],['Chegada de Cristóvão Colombo à América',1492],['Revolução Russa',1917],['Primeiro pouso tripulado na Lua',1969],['Invenção da imprensa de tipos móveis por Gutenberg na Europa',1450],['Abolição da escravidão no Brasil pela Lei Áurea',1888],['Constituição Federal brasileira atualmente vigente',1988]];
const ELEMENTS=[['hidrogênio','H'],['hélio','He'],['carbono','C'],['nitrogênio','N'],['oxigênio','O'],['sódio','Na'],['magnésio','Mg'],['alumínio','Al'],['silício','Si'],['fósforo','P'],['enxofre','S'],['cloro','Cl'],['potássio','K'],['cálcio','Ca'],['ferro','Fe'],['cobre','Cu'],['zinco','Zn'],['prata','Ag'],['ouro','Au'],['mercúrio','Hg'],['chumbo','Pb']];
const TECH=[['HTML','estruturar o conteúdo de páginas web'],['CSS','estilizar páginas web'],['JavaScript','adicionar comportamento e lógica a páginas web'],['Git','controle de versão'],['DNS','traduzir nomes de domínio em endereços IP'],['RAM','armazenamento temporário de dados em uso'],['SSD','armazenamento de dados sem disco mecânico'],['CPU','executar instruções e processamento principal'],['HTTPS','proteger a comunicação HTTP com criptografia'],['USB','conectar periféricos e transferir dados/energia']];
const MUSIC=[['violão',6],['violino',4],['baixo elétrico tradicional',4],['ukulele tradicional',4],['piano acústico padrão',88],['violoncelo',4],['viola clássica',4],['harpa de concerto moderna',47],['guitarra elétrica tradicional',6],['cavaquinho brasileiro tradicional',4],['bandolim tradicional',8],['contrabaixo acústico tradicional',4]];
const SPORT=[['futebol','jogadores de cada time em campo no início',11],['basquete','jogadores de cada equipe em quadra',5],['vôlei','jogadores de cada equipe em quadra',6],['beisebol','strikes que normalmente eliminam um rebatedor',3],['tênis','sets normalmente necessários para vencer uma partida masculina de Grand Slam',3],['handebol','jogadores de cada equipe em quadra',7],['futsal','jogadores de cada equipe em quadra',5],['polo aquático','jogadores de cada equipe na água',7],['rugby union','jogadores de cada equipe em campo',15],['rugby sevens','jogadores de cada equipe em campo',7],['críquete','jogadores em uma equipe',11],['hóquei no gelo','jogadores de cada equipe no gelo normalmente, contando o goleiro',6],['vôlei de praia','jogadores de cada equipe em quadra',2]];
const FILMS=[['O Senhor dos Anéis','Frodo'],['Harry Potter','Harry Potter'],['Matrix','Neo'],['De Volta para o Futuro','Marty McFly'],['Toy Story','Woody'],['Shrek','Shrek'],['Piratas do Caribe','Jack Sparrow'],['Homem-Aranha','Peter Parker'],['Pantera Negra','T’Challa'],['O Rei Leão','Simba']];
const GAMES=[['The Legend of Zelda','Link'],['Super Mario Bros.','Mario'],['God of War','Kratos'],['Minecraft','Steve'],['Halo','Master Chief'],['Sonic the Hedgehog','Sonic'],['Tomb Raider','Lara Croft'],['The Last of Us','Joel'],['Uncharted','Nathan Drake'],['Metroid','Samus Aran'],['Mega Man','Mega Man'],['Donkey Kong','Donkey Kong']];
const DRAWINGS=[['Dragon Ball','Goku'],['Naruto','Naruto Uzumaki'],['Pokémon','Pikachu'],['Avatar: A Lenda de Aang','Aang'],['Ben 10','Ben Tennyson'],['Bob Esponja','Bob Esponja'],['Hora de Aventura','Finn'],['Scooby-Doo','Scooby-Doo'],['Cavaleiros do Zodíaco','Seiya'],['One Piece','Monkey D. Luffy'],['Yu-Gi-Oh!','Yugi Muto']];
const PORTUGUESE=[
  ['feliz','triste','antônimo'],['rápido','lento','antônimo'],['claro','escuro','antônimo'],['alto','baixo','antônimo'],['forte','fraco','antônimo'],
  ['alegre','feliz','sinônimo'],['veloz','rápido','sinônimo'],['bonito','belo','sinônimo'],['começar','iniciar','sinônimo'],['terminar','finalizar','sinônimo']
];
const PT_WORDS=['abacaxi','amizade','aventura','biblioteca','caderno','caminho','caneta','cidade','computador','conhecimento','coragem','criança','cultura','desafio','escola','esperança','estrela','família','felicidade','floresta','futuro','história','idioma','janela','jardim','jogador','leitura','liberdade','livro','memória','montanha','música','natureza','oceano','palavra','planeta','praia','professor','programa','resposta','sabedoria','saúde','tecnologia','tempo','trabalho','universo','viagem','vitória','vontade','mundo','Brasil','energia','internet','cinema','esporte','ciência','guitarra','personagem','matemática','português'];
function sampleDistinct(arr,n){return shuffle(arr).slice(0,Math.min(n,arr.length));}
function pairCombo(category,rows,leftIndex,rightIndex,difficulty,label='par'){
  const chosen=sampleDistinct(rows,4);if(chosen.length<4)return null;
  const correctSlot=rand(0,3),shift=rand(1,3),opts=[];
  for(let i=0;i<4;i++){
    const left=String(chosen[i][leftIndex]),right=String(chosen[i===correctSlot?i:(i+shift)%4][rightIndex]);
    opts.push(`${left} — ${right}`);
  }
  const correct=opts[correctSlot],wrong=opts.filter((_,i)=>i!==correctSlot);
  const concept=`combo:${category}:${label}:${correctSlot}:${shift}:${chosen.map(x=>`${x[leftIndex]}=${x[rightIndex]}`).join('|')}`;
  return q(category,`Qual destas associações está correta?`,correct,wrong,difficulty,'Gerador Game Guess',concept);
}
function portugueseGenerated(difficulty='normal'){
  if(Math.random()<.62){
    const metric=Math.random()<.5?'vogais':'letras',rows=PT_WORDS.map(word=>[word,metric==='vogais'?[...norm(word)].filter(c=>'aeiou'.includes(c)).length:norm(word).length]);
    const combo=pairCombo('portugues',rows,0,1,difficulty,`palavra-${metric}`);if(combo){combo.question=`Qual associação entre palavra e quantidade de ${metric} está correta?`;return combo;}
  }
  if(Math.random()<.55){
    const groups=['sinônimo','antônimo'],type=pick(groups),rows=PORTUGUESE.filter(x=>x[2]===type),chosen=sampleDistinct(rows,4),slot=rand(0,3),shift=rand(1,3),opts=[];
    if(chosen.length===4){for(let i=0;i<4;i++){const ans=chosen[i===slot?i:(i+shift)%4][1];opts.push(`${chosen[i][0]} — ${ans}`)};return q('portugues',`Qual par apresenta corretamente uma relação de ${type}?`,opts[slot],opts.filter((_,i)=>i!==slot),difficulty,'Gerador Game Guess',`pt:combo:${type}:${slot}:${shift}:${chosen.map(x=>x.join(':')).join('|')}`);}
  }
  const word=pick(PT_WORDS),clean=norm(word),mode=rand(0,3);
  if(mode===0){const n=clean.length;return qNum('portugues',`Quantas letras tem a palavra “${word}”?`,n,4,difficulty,`pt:letras:${clean}:${n}`);}
  if(mode===1){const n=[...clean].filter(c=>'aeiou'.includes(c)).length;return qNum('portugues',`Quantas vogais aparecem na palavra “${word}”?`,n,3,difficulty,`pt:vogais:${clean}:${n}`);}
  if(mode===2){const correct=clean[0].toUpperCase(),wrong=shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(x=>x!==correct)).slice(0,3);return q('portugues',`Com qual letra começa a palavra “${word}”?`,correct,wrong,difficulty,'Gerador Game Guess',`pt:inicial:${clean}:${correct}`);}
  const correct=clean.at(-1).toUpperCase(),wrong=shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(x=>x!==correct)).slice(0,3);return q('portugues',`Com qual letra termina a palavra “${word}”?`,correct,wrong,difficulty,'Gerador Game Guess',`pt:final:${clean}:${correct}`);
}

function mathQuestion(difficulty='normal'){
  const mode=rand(0,6);
  if(mode===0){const a=rand(2,30),b=rand(2,20),c=a*b;return qNum('matematica',`Quanto é ${a} × ${b}?`,c,Math.max(6,Math.floor(c*.2)),difficulty);}
  if(mode===1){const b=rand(2,20),c=rand(2,25),a=b*c;return qNum('matematica',`Quanto é ${a} ÷ ${b}?`,c,8,difficulty);}
  if(mode===2){const a=rand(10,90),b=rand(5,60),c=a+b;return qNum('matematica',`Quanto é ${a} + ${b}?`,c,12,difficulty);}
  if(mode===3){const p=pick([10,20,25,50]),base=rand(2,40)*10,c=base*p/100;return qNum('matematica',`Quanto é ${p}% de ${base}?`,c,Math.max(5,base/10),difficulty);}
  if(mode===4){const x=rand(2,30),a=rand(2,20),sum=x+a;return qNum('matematica',`Se x + ${a} = ${sum}, quanto vale x?`,x,7,difficulty);}
  if(mode===5){const side=rand(3,25),area=side*side;return qNum('matematica',`Qual é a área de um quadrado de lado ${side}?`,area,Math.max(8,side*2),difficulty);}
  const a=rand(2,14),exp=pick([2,3]),c=a**exp;return qNum('matematica',`Quanto vale ${a}${exp===2?'²':'³'}?`,c,Math.max(8,a*3),difficulty);
}
function generated(category,difficulty='normal'){
  if(category==='matematica')return mathQuestion(difficulty);
  if(category==='geografia'){
    if(Math.random()<.68){const combo=pairCombo('geografia',CAPITALS,0,1,difficulty,'pais-capital');if(combo)return combo;}
    const [country,capital]=pick(CAPITALS),inverse=Math.random()<.45;
    if(inverse){const wrong=shuffle(CAPITALS.filter(x=>x[0]!==country).map(x=>x[0])).slice(0,3);return q('geografia',`Qual país tem ${capital} como capital?`,country,wrong,difficulty,'Gerador Game Guess',`geo:capital-pais:${capital}:${country}`);}
    const wrong=shuffle(CAPITALS.filter(x=>x[0]!==country).map(x=>x[1])).slice(0,3);return q('geografia',pick([`Qual é a capital de ${country}?`,`A cidade que funciona como capital de ${country} é:`,`Entre as opções, qual é a capital de ${country}?`]),capital,wrong,difficulty,'Gerador Game Guess',`geo:pais-capital:${country}:${capital}`);
  }
  if(category==='historia'){
    if(Math.random()<.72){const combo=pairCombo('historia',EVENTS,0,1,difficulty,'evento-ano');if(combo)return combo;}
    const [event,year]=pick(EVENTS),inverse=Math.random()<.35;
    if(inverse){const wrong=shuffle(EVENTS.filter(x=>x[0]!==event).map(x=>x[0])).slice(0,3);return q('historia',`Qual acontecimento desta lista está associado ao ano de ${year}?`,event,wrong,difficulty,'Gerador Game Guess',`hist:ano-evento:${year}:${event}`);}
    const wrong=shuffle(EVENTS.filter(x=>x[1]!==year).map(x=>x[1])).slice(0,3);return q('historia',pick([`Em que ano ocorreu: ${event}?`,`Qual ano corresponde a “${event}”?`,`Quando aconteceu “${event}”?`]),year,wrong,difficulty,'Gerador Game Guess',`hist:evento-ano:${event}:${year}`);
  }
  if(category==='ciencias'){
    if(Math.random()<.68){const combo=pairCombo('ciencias',ELEMENTS,0,1,difficulty,'elemento-simbolo');if(combo)return combo;}
    const [name,symbol]=pick(ELEMENTS),inverse=Math.random()<.45;
    if(inverse){const wrong=shuffle(ELEMENTS.filter(x=>x[0]!==name).map(x=>x[0])).slice(0,3);return q('ciencias',`Qual elemento químico é representado pelo símbolo ${symbol}?`,name,wrong,difficulty,'Gerador Game Guess',`ciencia:simbolo-elemento:${symbol}:${name}`);}
    const wrong=shuffle(ELEMENTS.filter(x=>x[1]!==symbol).map(x=>x[1])).slice(0,3);return q('ciencias',pick([`Qual é o símbolo químico do elemento ${name}?`,`Que símbolo representa o elemento ${name} na tabela periódica?`]),symbol,wrong,difficulty,'Gerador Game Guess',`ciencia:elemento-simbolo:${name}:${symbol}`);
  }
  if(category==='tecnologia'){
    if(Math.random()<.72){const combo=pairCombo('tecnologia',TECH,0,1,difficulty,'termo-funcao');if(combo)return combo;}
    const [term,use]=pick(TECH),inverse=Math.random()<.4;
    if(inverse){const wrong=shuffle(TECH.filter(x=>x[0]!==term).map(x=>x[0])).slice(0,3);return q('tecnologia',`Qual tecnologia ou componente está mais associado a “${use}”?`,term,wrong,difficulty,'Gerador Game Guess',`tech:uso-termo:${use}:${term}`);}
    const wrong=shuffle(TECH.filter(x=>x[0]!==term).map(x=>x[1])).slice(0,3);return q('tecnologia',pick([`Qual destas opções descreve melhor a função de ${term}?`,`No contexto de tecnologia, para que serve principalmente ${term}?`]),use,wrong,difficulty,'Gerador Game Guess',`tech:termo-uso:${term}:${use}`);
  }
  if(category==='portugues')return portugueseGenerated(difficulty);
  if(category==='musica'){
    if(Math.random()<.72){const combo=pairCombo('musica',MUSIC,0,1,difficulty,'instrumento-quantidade');if(combo)return combo;}
    const [inst,n]=pick(MUSIC),wrong=numericOptions(n,6).filter(x=>x!==String(n)).slice(0,3);
    return q('musica',pick([`Quantas cordas/teclas possui normalmente um ${inst}?`,`Em sua configuração tradicional, quantas cordas/teclas tem um ${inst}?`,`Qual número corresponde à quantidade tradicional de cordas/teclas de um ${inst}?`]),n,wrong,difficulty,'Gerador Game Guess',`musica:qtd:${inst}:${n}`);
  }
  if(category==='esportes'){
    if(Math.random()<.72){const rows=SPORT.map(x=>[`${x[0]} (${x[1]})`,x[2]]),combo=pairCombo('esportes',rows,0,1,difficulty,'regra-quantidade');if(combo)return combo;}
    const [sport,detail,n]=pick(SPORT),wrong=numericOptions(n,5).filter(x=>x!==String(n)).slice(0,3);
    return q('esportes',pick([`No ${sport}, quantos ${detail}?`,`Pensando nas regras do ${sport}, qual é o número de ${detail}?`,`Qual quantidade corresponde a ${detail} no ${sport}?`]),n,wrong,difficulty,'Gerador Game Guess',`esporte:qtd:${sport}:${detail}:${n}`);
  }
  if(category==='filmes'){
    if(Math.random()<.75){const combo=pairCombo('filmes',FILMS,0,1,difficulty,'obra-personagem');if(combo)return combo;}
    const [title,character]=pick(FILMS),inverse=Math.random()<.45;
    if(inverse){const wrong=shuffle(FILMS.filter(x=>x[0]!==title).map(x=>x[0])).slice(0,3);return q('filmes',`Em qual filme ou franquia desta lista o personagem ${character} é uma figura central?`,title,wrong,difficulty,'Gerador Game Guess',`filme:personagem-titulo:${character}:${title}`);}
    const wrong=shuffle(FILMS.filter(x=>x[1]!==character).map(x=>x[1])).slice(0,3);return q('filmes',pick([`Qual personagem é o protagonista mais associado a “${title}”?`,`Em “${title}”, qual personagem desta lista é central à história?`]),character,wrong,difficulty,'Gerador Game Guess',`filme:titulo-personagem:${title}:${character}`);
  }
  if(category==='games'){
    if(Math.random()<.75){const combo=pairCombo('games',GAMES,0,1,difficulty,'serie-personagem');if(combo)return combo;}
    const [title,character]=pick(GAMES),inverse=Math.random()<.45;
    if(inverse){const wrong=shuffle(GAMES.filter(x=>x[0]!==title).map(x=>x[0])).slice(0,3);return q('games',`A qual série de jogos o personagem ${character} está principalmente associado?`,title,wrong,difficulty,'Gerador Game Guess',`game:personagem-serie:${character}:${title}`);}
    const wrong=shuffle(GAMES.filter(x=>x[1]!==character).map(x=>x[1])).slice(0,3);return q('games',pick([`Qual personagem é protagonista ou ícone principal da série “${title}”?`,`Quem é uma figura central da franquia de jogos “${title}”?`]),character,wrong,difficulty,'Gerador Game Guess',`game:serie-personagem:${title}:${character}`);
  }
  if(category==='desenhos'){
    if(Math.random()<.75){const combo=pairCombo('desenhos',DRAWINGS,0,1,difficulty,'obra-personagem');if(combo)return combo;}
    const [title,character]=pick(DRAWINGS),inverse=Math.random()<.45;
    if(inverse){const wrong=shuffle(DRAWINGS.filter(x=>x[0]!==title).map(x=>x[0])).slice(0,3);return q('desenhos',`Em qual desenho ou anime desta lista aparece ${character} como figura central?`,title,wrong,difficulty,'Gerador Game Guess',`desenho:personagem-titulo:${character}:${title}`);}
    const wrong=shuffle(DRAWINGS.filter(x=>x[1]!==character).map(x=>x[1])).slice(0,3);return q('desenhos',pick([`Qual personagem é protagonista ou figura central de “${title}”?`,`Em “${title}”, qual personagem desta lista ocupa papel central?`]),character,wrong,difficulty,'Gerador Game Guess',`desenho:titulo-personagem:${title}:${character}`);
  }
  const categories=['geografia','historia','ciencias','matematica','portugues','tecnologia','filmes','games','desenhos','esportes','musica'];
  return generated(pick(categories),difficulty);
}
async function getJson(url,timeout=7000){const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{signal:c.signal,headers:{Accept:'application/json','User-Agent':'GameGuess-Quiz/14.0'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json();}finally{clearTimeout(t)}}
const TRYVIA_CATEGORY_IDS={geral:9,historia:23,geografia:22,matematica:19,portugues:10,ciencias:17,filmes:11,games:15,esportes:21,tecnologia:18,musica:12};
async function externalQuestions(category,difficulty,count){
  try{
    const amount=Math.max(5,Math.min(25,count*2));
    const u=new URL(`${TRYVIA_BASE}/api.php`);u.searchParams.set('amount',String(amount));u.searchParams.set('type','multiple');
    if(category==='desenhos')u.searchParams.set('category',String(Math.random()<.5?31:32));
    else if(category!=='random'&&TRYVIA_CATEGORY_IDS[category])u.searchParams.set('category',String(TRYVIA_CATEGORY_IDS[category]));
    if(['easy','medium','hard'].includes(difficulty))u.searchParams.set('difficulty',difficulty);
    const data=await getJson(u.toString(),4500);if(Number(data?.response_code)!==0||!Array.isArray(data?.results))return [];
    return data.results.map((x,i)=>{
      const question=decodeHtml(x.question),correct=decodeHtml(x.correct_answer),wrong=(x.incorrect_answers||[]).map(decodeHtml).filter(Boolean);
      if(!question||!correct||wrong.length<3)return null;
      const inferred=category==='random'?'geral':category;
      const dedupeKey=hash(norm(`tryvia|${question}|${correct}`));return {id:`tryvia:${dedupeKey}`,dedupeKey,category:inferred,question,correct,options:shuffle([correct,...wrong]).slice(0,4),difficulty:x.difficulty||difficulty,source:'Tryvia API'};
    }).filter(Boolean);
  }catch{return []}
}
function localFallbackQuestions(category,difficulty){
  const pool=(category==='random'?QUIZ_FALLBACK:QUIZ_FALLBACK.filter(x=>x.category===category));
  return shuffle(pool).map(x=>{const dedupeKey=hash(norm(`local|${x.id}|${x.question}|${x.correct}`));return {id:`local:${x.id}`,dedupeKey,category:x.category,question:x.question,correct:String(x.correct),options:shuffle([...(x.options||[])]),difficulty,source:'Banco local Game Guess'};});
}
function fingerprint(x){return String(x?.dedupeKey||hash(norm(x.question)+'|'+norm(x.correct)));}

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return out(res,405,{error:'Use POST.'});}
  let body={};try{body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}catch{return out(res,400,{error:'JSON inválido.'});}
  const allowed=['random','geral','historia','geografia','matematica','portugues','ciencias','filmes','games','desenhos','esportes','tecnologia','musica'];
  const category=allowed.includes(body.category)?body.category:'random';const count=Math.max(5,Math.min(30,Number(body.count)||10));const difficulty=['easy','normal','hard','insane'].includes(body.difficulty)?body.difficulty:'normal';
  const externalDiff=difficulty==='normal'?'medium':difficulty==='insane'?'hard':difficulty;
  const seen=new Set((Array.isArray(body.seen)?body.seen:[]).slice(-50000).map(String));
  let external=await externalQuestions(category,externalDiff,count);
  let fresh=external.filter(x=>!seen.has(fingerprint(x)));
  const result=[];const used=new Set();
  for(const item of shuffle(fresh)){
    const fp=fingerprint(item);if(used.has(fp))continue;used.add(fp);result.push(item);if(result.length>=count)break;
  }
  for(const item of localFallbackQuestions(category,difficulty)){
    const fp=fingerprint(item);if(used.has(fp)||seen.has(fp))continue;used.add(fp);result.push(item);if(result.length>=count)break;
  }
  let guard=0;
  while(result.length<count&&guard++<count*60){
    const cat=category==='random'?pick(['geral','historia','geografia','matematica','portugues','ciencias','filmes','games','desenhos','esportes','tecnologia','musica']):category;
    const item=generated(cat,difficulty);const fp=fingerprint(item);if(used.has(fp)||seen.has(fp))continue;used.add(fp);result.push(item);
  }
  // V14 não reutiliza conscientemente hashes presentes no histórico enviado.
  // Os geradores combinatórios possuem espaço grande de variações; tentamos mais combinações antes de declarar esgotamento.
  guard=0;
  while(result.length<count&&guard++<count*1200){
    const cat=category==='random'?pick(['geral','historia','geografia','matematica','portugues','ciencias','filmes','games','desenhos','esportes','tecnologia','musica']):category;
    const item=generated(cat,difficulty),fp=fingerprint(item);if(used.has(fp)||seen.has(fp))continue;used.add(fp);result.push(item);
  }
  if(result.length<count)return out(res,409,{error:'Não encontrei perguntas inéditas suficientes para esta categoria sem repetir seu histórico. Tente outra categoria ou mais tarde.',questions:result,exhausted:true});
  return out(res,200,{questions:shuffle(result).slice(0,count),source:external.length?'hybrid':'procedural',externalCount:external.length,fingerprints:result.map(fingerprint)});
}
