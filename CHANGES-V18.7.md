# V18.7 — KOF Netplay WebSocket Fix

- Corrige o erro `Connect error: xhr poll error` no PVP do KOF.
- O Socket.IO do Netplay é forçado a usar `websocket` diretamente, sem XHR long-polling.
- Adiciona timeout e reconexão controlada.
- Faz teste do endpoint `/list` no navegador antes de tentar criar/entrar na sessão.
- Se o servidor público não estiver acessível, mostra uma mensagem explícita pedindo `KOF_NETPLAY_SERVER` próprio em vez de ficar preso.
- Mantém fullscreen vertical/horizontal, controles A/B/C/D, ROM Full Non-Merged e treino local.
