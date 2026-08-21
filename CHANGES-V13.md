# Game Guess V13 — Quiz Mundial

## Novo modo: Quiz Mundial
- Perguntas de múltipla escolha em português.
- 12 categorias: Conhecimentos Gerais, História, Geografia, Matemática, Português, Ciências, Filmes & Séries, Games, Desenhos & Anime, Esportes, Tecnologia e Música.
- 144 perguntas iniciais no banco local PT-BR.
- Categoria Aleatório mistura todas as áreas.
- Dificuldades Fácil, Normal e Difícil alteram tempo e multiplicador de pontos.
- Partidas solo de 5, 10, 15 ou 20 perguntas no Aleatório; categorias específicas usam até 12 perguntas por sessão.
- Pontos por acerto, velocidade e sequência.
- Resultados enviados ao Ranked/temporada pela função GameGuessRanked.record.

## Quiz na Arena
- O Quiz Mundial agora aparece como universo no criador de sala da Arena.
- Pode escolher categoria antes de criar a sala.
- Funciona de 2 a 8 jogadores.
- Todos recebem a mesma pergunta e as mesmas alternativas.
- Cada jogador tem uma única resposta por pergunta no Quiz.
- A resposta correta é revelada depois que todos os jogadores ativos terminam a rodada.
- Resultado da Arena continua indo para o Ranked e registra a categoria do Quiz.

## Compatibilidade de versão
O protocolo da Arena mudou de 12 para 13 para impedir clientes antigos de entrarem em salas do Quiz sem entender as novas perguntas.

### IMPORTANTE
Publique o novo `database.rules.json` no Firebase Realtime Database antes de criar salas V13.
Salas antigas da V12 devem ser descartadas e recriadas na V13.

## Arquivos principais alterados
- index.html
- styles.css
- quiz-bank.js (novo)
- quiz.js (novo)
- duel.js
- firebase.js
- database.rules.json
