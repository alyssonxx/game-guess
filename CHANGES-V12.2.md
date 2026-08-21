# Game Guess V12.2 — Seasons + Termo Mobile

## Temporadas
No Realtime Database, crie:

rankedConfig/currentSeason

com o valor:

{
  "id": "S1",
  "label": "Temporada 1",
  "description": "Temporada competitiva atual"
}

Para iniciar uma nova temporada, altere S1 para S2 (e o label). O ranking sazonal passa a usar `rankedSeasons/S2/leaderboard`. O histórico geral continua em `leaderboard`.

## Termo
- Letras mais legíveis com fonte Rajdhani.
- Animação de digitação e revelação.
- Campo nativo para abrir teclado do celular.
- Botão “Abrir teclado do celular”.
- Dueto e Quarteto reorganizados para telas pequenas.

## Mosaico
- Blocos fechados agora escondem a imagem de verdade, usando `visibility:hidden` e cobertura opaca.
- Arena usa mosaico em todos os desafios com imagem, exceto o modo blind.
