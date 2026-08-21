# V14.1 — Correção de entrada na Arena

- Corrige `PERMISSION_DENIED` ao segundo jogador entrar em salas da Arena/Quiz.
- A validação do slot 1–8 agora é explícita nas regras do Realtime Database.
- Mantém reserva atômica de vaga antes de criar o registro do jogador.
- Atualiza mensagens antigas que ainda citavam regras V13/V13.1.
- Adiciona log de diagnóstico para identificar exatamente falhas na gravação de `players/{uid}`.
- Atualiza cache de `firebase.js` e `duel.js` para V14.1.

## Obrigatório
Publique o `database.rules.json` desta versão no Firebase Realtime Database.
