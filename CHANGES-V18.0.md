# Game Guess V18.0 — GeoGuess Google Street View

- GeoGuess voltou a usar Google Street View dinâmico e navegável em vez do explorador vetorial OSM.
- Movimento liberado por click-to-go/setas, rotação 360° e zoom.
- Leaflet + OpenStreetMap permanecem no mapa de palpite para evitar cobrança de Dynamic Maps.
- A localização correta é o panorama inicial da rodada, mesmo depois de o jogador caminhar.
- Ao confirmar: palpite + alvo + linha, distância Haversine e até 5.000 pontos.
- Arena usa os mesmos panoramas para todos os jogadores da sala.
- Configuração via `GOOGLE_MAPS_API_KEY` no Vercel.
- Loader atualiza cache para `geoguess.js?v=18.0.0`.
