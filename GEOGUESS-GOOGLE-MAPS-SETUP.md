# GeoGuess 360° — configuração do Google Maps

A V17.1 remove as fotos fixas do GeoGuess e usa o Google Street View interativo.

## Google Cloud

1. Abra um projeto no Google Cloud.
2. Ative **Maps JavaScript API**.
3. Crie uma chave de API para navegador.
4. Restrinja a chave por **Sites (HTTP referrers)** ao domínio publicado, por exemplo:
   - `https://game-guess-bay.vercel.app/*`
   - seu domínio personalizado, se existir.
5. Nas restrições de API, permita apenas a **Maps JavaScript API**.

## Vercel

Em Project > Settings > Environment Variables, crie:

`GOOGLE_MAPS_API_KEY=SUACHAVE`

Depois faça um novo deploy.

A chave usada no Maps JavaScript API é uma chave de navegador e aparece no cliente; por isso as restrições de domínio/API são obrigatórias para segurança.

## Como validar

- Abra GeoGuess > Solo.
- O painel principal deve ser um panorama 360°, nunca uma foto fixa.
- Clique nas setas/rua para andar.
- Arraste para olhar em volta.
- Clique no minimapa para marcar o palpite.
- Ao confirmar, o mapa mostra o palpite, o local correto, a linha entre os dois, distância e pontuação.
