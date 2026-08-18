# Game Guess V7 — Multiverso Caos

Jogo web para Vercel com videogames via IGDB e um multiverso de personagens.

## Universos
- Videogames / IGDB + Famosos no Brasil
- League of Legends
- Pokémon
- Digimon
- Dragon Ball — 109 personagens/variações
- Yu-Gi-Oh! — 69 personagens/variações
- Naruto — 104 personagens/variações
- Cavaleiros do Zodíaco — 101 personagens
- Desenhos clássicos
- TV Globinho
- Caos Multiverso
- Termo Arcade ∞

## Desafios de personagem
- 🧩 Mosaico
- 💥 Habilidade / técnica
- 🌍 Origem / nação / vila / universo
- 🕵️ Dossiê
- 🧠 Só pistas
- 🎲 Aleatório

## Modos
- Clássico
- Survival
- Blitz
- Caos

## Compatibilidade
As imagens externas passam por `/api/asset`. Se uma fonte externa falhar, a API devolve uma imagem de fallback do próprio Game Guess, então a rodada continua jogável por pistas. Progresso e conquistas ficam em `localStorage`.

## Vercel
Mantenha:
- `IGDB_CLIENT_ID`
- `IGDB_CLIENT_SECRET`

Nenhuma chave nova é necessária para os universos de personagens.
