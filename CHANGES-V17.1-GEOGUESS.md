# V17.1 — GeoGuess 360°

Atualização exclusiva do modo GeoGuess.

- Remove imagens PNG/fotos fixas do modo GeoGuess.
- Usa Google Maps JavaScript API + Street View interativo.
- Movimento pelas ruas, câmera 360°, zoom e retorno ao ponto inicial.
- O ponto correto é o panorama inicial, mesmo que o jogador caminhe.
- Mapa de palpite flutuante e expansível.
- Resultado com distância exata, pontos, linha entre palpite e local correto e número de passos.
- Arena usa exatamente o mesmo panoId para todos os jogadores.
- Mantém 3/5/8 rodadas, regiões, ranking e Arena 2–8 jogadores.
- Nenhuma imagem estática é usada como fallback: sem chave do Google, o jogo informa a configuração necessária.

## Vercel
Configure `GOOGLE_MAPS_API_KEY` e habilite a Maps JavaScript API no projeto do Google Cloud. Restrinja a chave por HTTP referrer ao domínio publicado.
