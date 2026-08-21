# Game Guess V19.1 — KOF Dedicated Netplay Fix

## Problemas corrigidos

1. A V18.9 consultava `/list` enviando apenas `game_id`.
   O servidor atual do EmulatorJS-Netplay exige **`domain` + `game_id`** para listar uma sala.
2. A V18.7/V18.9 forçava Socket.IO em WebSocket-only.
   A V19.1 volta a deixar o Socket.IO negociar o transporte normalmente.
3. O servidor público `netplay.emulatorjs.org` deixa de ser fallback silencioso.
   O PVP agora exige `KOF_NETPLAY_SERVER`, evitando loops infinitos de erro.
4. O servidor configurado no Vercel passa a ser a fonte de verdade; uma URL antiga salva em `localStorage` não interfere mais.
5. A V19.1 tenta acordar um servidor gratuito adormecido e espera até 75s antes de declarar falha.
6. A lista de salas tenta o proxy same-origin e possui fallback direto para o servidor dedicado.
7. O convidado procura a sala por até 90s, cobrindo cold-start de hospedagem gratuita.

## Arquivos alterados

- `index.html`
- `kof.js`
- `kof-player.html`
- `kof-player.js`
- `api/kof-config.js`
- `api/kof-health.js`
- `api/kof-netplay-rooms.js`
- `.env.example`

## Arquivos novos

- `netplay-server/Dockerfile`
- `netplay-server/.dockerignore`
- `netplay-server/README-RENDER.md`

O `index.html` deste patch também preserva o ajuste V19.0 de enquadramento das imagens/rostos.
