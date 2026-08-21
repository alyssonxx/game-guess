# V15 — GeoGuess + Perfil + Avatar + Loja

## GeoGuess Arena
- Novo modo GeoGuess solo com fotos geolocalizadas obtidas pela API da Wikipédia em português.
- Mapa mundial interativo com Leaflet + OpenStreetMap.
- Pontuação por distância (até 5.000 pontos por rodada).
- Regiões: Mundo, Américas, Europa, Ásia, África e Oceania.
- Arena online independente para 2 a 8 jogadores.
- Mesmas imagens para todos os participantes da sala.
- 60 segundos por rodada, placar em tempo real, timeout e migração de host.
- Presence Firebase e reconexão sem ficar reposicionando/rolando a tela a cada heartbeat.
- Resultado GeoGuess entra no Ranked.

## Perfil do jogador
- Página própria com nickname, bio e jogo favorito.
- Avatar grande no perfil.
- Estatísticas gerais, Arena, GeoGuess e KOF.
- Destaques, nível, itens desbloqueados e visual equipado.
- Nickname passa a ser usado no ranking e nas novas salas quando disponível.

## Avatar e Loja
- Avatar chibi 3D real em WebGL/Three.js no editor, inspirado no estilo de avatares web clássicos sem copiar personagens/branding; SVG estilizado é mantido como fallback/miniatura.
- Personalização de pele, cabelo, olhos e cor da roupa.
- Slots: cabelo, olhos, roupa, calça, calçados e acessórios.
- Loja com itens Comum/Raro/Épico e itens iniciais gratuitos.
- Compras e equipamento são salvos no perfil e sincronizados na conta Firebase.
- Controle de avatarSpent para evitar que uma compra seja desfeita pelo merge multi-dispositivo da carteira.

## Economia
- Ganhos de pontos reduzidos para tornar a loja progressiva.
- Game Guess clássico, Multiverso, Termo, Quiz, Arena, KOF e GeoGuess agora entregam pequenas quantidades de pontos.
- Custos das ajudas foram reduzidos junto da nova economia.
- Não existe banner/mensagem dizendo que “todos os jogos geram moedas/pontos”.

## Firebase
- Nova árvore `geoRooms/`.
- GeoGuess usa protocolo de sala 1 e aceita de 2 a 8 jogadores.
- É obrigatório publicar o `database.rules.json` da V15.
