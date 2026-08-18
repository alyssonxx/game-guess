# Game Guess V4.3 — Brasil Edition PT-BR

Versão completa do Game Guess para Vercel + IGDB.

## Principais novidades

- Tela inicial arcade com 8 modos:
  - Jogo Rápido
  - Clássico
  - Survival
  - Blitz
  - Console Misterioso
  - Décadas
  - Temático
  - Caos Aleatório
- 4 dificuldades: Fácil, Normal, Difícil e Insano.
- Screenshots do próprio jogo vindos da IGDB e escolhidos aleatoriamente.
- Fragmentos da imagem revelados em ordem aleatória.
- Fácil começa com 2 fragmentos; Normal com 1; Difícil/Insano com 0.
- Dicas mais elaboradas e dependentes da dificuldade:
  - contexto/sinopse com nomes próprios ocultos;
  - gênero completo, parcial ou cifrado;
  - desenvolvedora mascarada;
  - época de lançamento aproximada;
  - plataforma como pista no modo Console Misterioso.
- Sistema de tentativas, combo e multiplicador:
  - 3 acertos: x1,5
  - 5 acertos: x2
  - 10 acertos: x3
- Moedas persistentes no navegador.
- Loja de ajuda:
  - revelar fragmento;
  - eliminar letras;
  - revelar primeira letra;
  - mostrar plataforma.
- Quente ou Frio após palpites errados, comparando plataforma, gênero e época.
- Cronômetro opcional de 30 segundos por rodada.
- Blitz com 120 segundos globais.
- Survival com 3 vidas.
- Conquistas locais com recompensas em moedas.
- Recordes e estatísticas salvos em `localStorage`.
- Categorias: 🇧🇷 Famosos no Brasil, Terror, Corrida, RPG, Tiro/FPS, Plataforma, Aventura, PlayStation Classics, Xbox Classics, Nintendo, PC e Retrô.
- Filtro por décadas.
- Histórico recente para diminuir repetição entre sessões.
- Layout responsivo para PC e celular.
- Sons, animações, confete e feedback visual de acerto/erro.

## Integração IGDB

O navegador chama somente `/api/igdb`. O Client Secret nunca é colocado no frontend.

A Function em `api/igdb.js`:

- obtém e reutiliza App Access Token da Twitch;
- consulta vários consoles de uma vez usando filtros OR de plataforma;
- conta os jogos elegíveis;
- usa `multiquery` para trazer vários blocos aleatórios em uma única chamada;
- filtra categorias temáticas no servidor;
- oferece uma ação de busca para o sistema Quente ou Frio;
- usa screenshots e capas da própria entrada do jogo.

Documentação oficial usada como referência:

- https://api-docs.igdb.com/

## Atualizar seu projeto no Vercel

Você já tem um projeto conectado ao GitHub. Então:

1. Extraia esta pasta.
2. Substitua os arquivos do repositório antigo pelos desta versão.
3. Não apague suas variáveis de ambiente da Vercel.
4. No terminal do VS Code:

```bash
git add .
git commit -m "Adiciona Famosos no Brasil"
git push
```

A Vercel fará o novo deploy automaticamente.

## Variáveis de ambiente

No Vercel, mantenha:

```text
IGDB_CLIENT_ID=...
IGDB_CLIENT_SECRET=...
```

## Estrutura

```text
game-guess-v4-3-brasil/
├── index.html
├── styles.css
├── app.js
├── api/
│   └── igdb.js
├── package.json
├── vercel.json
├── .env.example
└── README.md
```

## Observação

Não há banco de dados nem login. Moedas, conquistas, recordes e estatísticas ficam no navegador do dispositivo usando `localStorage`, conforme solicitado.


## V4.1 — pistas em português

- A descrição original (`summary`) da IGDB não é mais enviada ao frontend nem exibida como dica.
- As pistas de contexto são geradas localmente em PT-BR a partir de gêneros, temas, perspectiva e época.
- Gêneros, temas e perspectivas da IGDB são traduzidos antes de aparecerem para o jogador.
- A tela de resultado também mostra gêneros e temas em português.


## V4.2 — imagens compatíveis em qualquer PC

- Screenshots e capas não são mais carregados diretamente de `images.igdb.com` pelo navegador.
- Nova rota `/api/image` faz proxy seguro das imagens pela própria Vercel.
- Isso evita falhas em PCs ou redes que bloqueiam o CDN da IGDB.
- O proxy aceita apenas IDs de imagem da IGDB e tamanhos pré-aprovados, evitando uso como proxy aberto.
- Há fallback automático entre tamanhos de screenshot/capa e cache agressivo na Vercel.
- Avisos de imagem indisponível não ficam mais empilhando na tela.


## V4.3 — 🇧🇷 Famosos no Brasil

- Nova categoria **Famosos no Brasil** disponível junto aos filtros de plataforma.
- Há uma curadoria separada para PS1, PS2, PS3, PS4, PS5, Xbox, Xbox 360, Xbox One, Xbox Series, PC, NES, SNES, Nintendo 64, GameCube, Wii, Wii U e Switch.
- A seleção inclui jogos associados à cultura de locadoras, futebol, lan houses, multiplayer local e grandes sucessos de cada geração no país.
- A lista é uma **curadoria cultural**, não um ranking oficial de vendas brasileiras.
- Ao escolher um console + 🇧🇷 Famosos no Brasil, a API busca a biblioteca daquele console na IGDB e filtra somente os títulos da curadoria; depois embaralha a sessão normalmente.
- Também funciona com **Todas as plataformas**, misturando clássicos brasileiros de vários consoles.
- Screenshots, fragmentos e ordem das pistas continuam randomizados.
