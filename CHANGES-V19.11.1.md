# Game Guess V19.11.1 — Responsivo + remoção do GeoGuess

## Responsividade
- Nova passada geral de responsividade para celulares.
- Home reorganizada para 1 coluna no mobile, com cards e botões ocupando a largura correta.
- Topbar compactada no celular para evitar estouro horizontal.
- Hero, estatísticas, cards populares, Arena e universos extras ajustados para telas pequenas.
- Layouts internos de Setup, Game Guess, Quiz, KOF, Arena, Termo, Perfil, Amigos e Catálogo KOF passam para uma coluna quando necessário.
- Inputs usam 16px em mobile para evitar zoom automático no iOS.
- Modais e overlays limitados ao viewport dinâmico (`dvh`).
- Métricas horizontais usam rolagem controlada em vez de estourar a largura da tela.
- Safe areas de iPhone/Android respeitadas no shell e barra inferior.
- Ajuste específico para celular em paisagem.

## GeoGuess removido
- Removidos os scripts do GeoGuess da página.
- Removidos Leaflet/Mapillary da Home e do carregamento do site.
- Removidos endpoints `api/geoguess*.js`.
- Removido `geoguess.js`.
- Removido o bloco `geoRooms` das regras do Firebase.
- Removidas opções do GeoGuess em Perfil e Amigos.
- Removido o código de salas GeoGuess do `firebase.js`.

## Preservado
- Game Guess
- Quiz Mundial
- KOF 2002 Magic Plus II
- Termo Arcade
- Multiverso
- Ranking
- Arena online
- Perfil / Amigos
