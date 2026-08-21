# KOF Online V19.1 — servidor Netplay dedicado no Render

As telas com `websocket error` e lista de salas vazia mostram que o KOF/FBNeo está funcionando, mas o servidor público de sinalização não está atendendo o PVP de forma confiável.

A V19.1 usa um servidor EmulatorJS-Netplay próprio. O Dockerfile desta pasta baixa e compila a branch `rust` oficial do projeto EmulatorJS-Netplay.

## 1. Suba este patch para o GitHub

Garanta que a pasta `netplay-server/` também foi commitada.

## 2. Crie o serviço no Render

1. Entre em https://dashboard.render.com/
2. Clique em **New > Web Service**.
3. Conecte o mesmo repositório GitHub do Game Guess.
4. Configure:
   - **Name:** `game-guess-netplay`
   - **Branch:** `main`
   - **Root Directory:** `netplay-server`
   - **Language / Runtime:** `Docker`
   - **Instance Type:** `Free` para testes
5. Crie o serviço.
6. Aguarde aparecer **Live**.

O servidor lê automaticamente a variável `PORT` fornecida pelo Render. Não precisa criar uma porta manualmente.

## 3. Teste o servidor

Abra no navegador, trocando pela URL do seu Render:

`https://SEU-SERVICO.onrender.com/list?domain=game-guess-bay.vercel.app&game_id=1`

Se estiver funcionando e não houver salas, a resposta esperada é:

```json
{}
```

## 4. Configure o Vercel

No projeto Game Guess:

**Settings > Environment Variables > Add**

Nome:

`KOF_NETPLAY_SERVER`

Valor:

`https://SEU-SERVICO.onrender.com`

Marque Production (e Preview se você usa preview) e faça **Redeploy**.

Não coloque barra `/` no final; a V19.1 aceita com ou sem, mas normaliza automaticamente.

## 5. Teste o PVP

1. HOST cria sala no Game Guess.
2. CONVIDADO entra no código.
3. Espere 2/2 prontos.
4. HOST toca em **INICIAR KOF ONLINE**.
5. A V19.1 acorda o Render automaticamente se o plano gratuito estiver dormindo.
6. HOST cria a sessão interna automaticamente.
7. CONVIDADO procura a mesma sessão usando `domain + game_id` e entra.

Mensagens esperadas:

- `Preparando servidor PVP dedicado...`
- `Servidor PVP disponível`
- `HOST criando automaticamente a sessão...` / `CONVIDADO procurando...`
- `PVP CONECTADO • PLAYER 1/2`

## TURN opcional

STUN já está configurado. Se alguns pares de redes não fecharem WebRTC (por exemplo CGNAT/4G muito restrito), configure depois:

- `KOF_TURN_URL`
- `KOF_TURN_USERNAME`
- `KOF_TURN_CREDENTIAL`
