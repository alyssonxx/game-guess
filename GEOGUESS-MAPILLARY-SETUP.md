# Game Guess V18.1 — GeoGuess gratuito com Mapillary

O modo GeoGuess usa **MapillaryJS 4.1.2** para as imagens de rua e **Leaflet + OpenStreetMap** para o mapa de palpite.

## 1. Criar o app no Mapillary
1. Entre em https://www.mapillary.com/dashboard/developers
2. Registre uma aplicação, por exemplo `Game Guess`.
3. Ative apenas o escopo **READ**.
4. Copie o **Client Token**. Não use o Client Secret.

## 2. Configurar no Vercel
Em `Settings > Environment Variables`, crie:

`MAPILLARY_ACCESS_TOKEN=SEU_CLIENT_TOKEN`

Aplique em Production/Preview/Development e faça um novo deploy.

## 3. Como a rodada funciona
- A API escolhe cidades da região selecionada.
- O backend consulta imagens Mapillary próximas e prioriza imagens esféricas (360°) pertencentes a sequências.
- Se não houver 360°, usa uma sequência navegável comum.
- O jogador navega pelas setas do MapillaryJS.
- O palpite é feito em Leaflet/OpenStreetMap.
- Distância e pontuação são calculadas pelo Game Guess.

## Observação
A cobertura do Mapillary é colaborativa e não é igual à do Google Street View. Se uma região não tiver imagens suficientes, o jogo informa e pede para tentar novamente ou escolher outra região.
