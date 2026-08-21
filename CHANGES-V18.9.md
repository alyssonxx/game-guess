# Game Guess V18.9 — correção Netplay `Failed to fetch`

## Causa
A V18.7/V18.8 fazia um `fetch()` direto do navegador para `https://netplay.emulatorjs.org/list`. Em alguns navegadores/servidores essa rota não libera CORS para a origem do Game Guess, então a chamada falhava com `Failed to fetch` e o código abortava o PVP antes de sequer tentar o WebSocket.

## Correções
- o PVP não aborta mais por falha do teste HTTP cross-origin;
- nova Function `/api/kof-netplay-rooms` consulta `/list` servidor-a-servidor pela Vercel;
- `getOpenRooms()` do EmulatorJS é substituído por uma consulta same-origin ao proxy;
- o Socket.IO continua usando WebSocket direto para a sinalização em tempo real;
- o HOST continua criando a sessão automaticamente e o CONVIDADO continua procurando/entrando automaticamente;
- mantém fullscreen, joystick estilo fliperama e personalização A/B/C/D da V18.8.

## Arquivos alterados
- `kof-player.js`
- `kof-player.html`
- `index.html`
- `api/kof-config.js`
- `api/kof-health.js`
- `api/kof-netplay-rooms.js` (novo)
