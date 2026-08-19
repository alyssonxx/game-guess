# V13.1 — Quiz Infinito + Arena 2–8 corrigida

## Quiz praticamente inesgotável
- Novo endpoint server-side `POST /api/quiz`.
- Fonte principal: Tryvia API em português, compatível com o formato Open Trivia DB.
- Fallback local com 144 perguntas PT-BR.
- Geradores procedurais para todas as categorias (matemática, português, história, geografia, ciências, filmes, games, desenhos/anime, esportes, tecnologia, música e geral).
- Histórico anti-repetição salvo no navegador (`gameGuessQuizSeenV13`) com até 1.500 fingerprints recentes.
- Ao abrir um novo Quiz, o site pede um conjunto novo ao servidor e evita perguntas já vistas sempre que houver alternativas disponíveis.
- Se a API externa estiver fora do ar, o jogo continua funcionando com o banco local + geração procedural.

## Arena Quiz
- O criador da sala busca as perguntas pelo mesmo motor infinito antes de criar a Arena.
- As perguntas são gravadas uma única vez na sala; todos os 2–8 jogadores recebem exatamente o mesmo conjunto.
- Quiz continua com uma resposta por jogador/rodada e revela a resposta ao fim da rodada.
- Resultado continua indo para Ranked/Season com categoria, dificuldade, score e Arena.

## Correção do erro ao criar sala
- `createDuelRoom` sanitiza o payload antes de gravar no Firebase.
- Uma falha temporária ao anexar Presence não faz mais uma sala já criada aparecer como “erro ao criar”.
- Erros de `PERMISSION_DENIED` agora informam explicitamente para publicar o `database.rules.json` da V13.1.
- O protocolo da Arena permanece 13; `APP_VERSION` foi para 13.1.0.

## Firebase
Se você ainda estava com regras V12 ou não publicou as regras da V13, publique novamente o `database.rules.json` deste pacote em Realtime Database > Rules.
