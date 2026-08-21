# Game Guess V12 — Stability + Ranked

## Estabilidade
- Reserva atômica de vagas para Arena 2–8.
- Limpeza automática de reserva incompleta via `onDisconnect`.
- Presença por sessão.
- Reconexão de presença após queda de rede.
- Controle de uma mesma conta por apenas uma sessão por vez.
- Migração de host no lobby.
- Relógio sincronizado pelo Firebase.
- Máquina de estados de rodada.
- Submissão identificada por ID.
- Salas com expiração.
- `protocolVersion` para bloquear clientes incompatíveis.
- Cache busting V12 nos arquivos web.

## Arena
- 2 a 8 jogadores.
- Progressão de rodada distribuída: não depende de o host continuar aberto.
- Input sempre bloqueado depois de acertar/pular/falhar/timeout.
- Resposta correta após pulo somente no estado de revelação.
- Mosaico super escuro mantido.

## Ranked
- Melhor partida.
- Melhor modalidade.
- Melhor universo.
- Melhor desafio.
- Dificuldade de destaque.
- Estatísticas da Arena.
- Destaque do Termo.
- Filtros de ranking: Geral, Melhor partida, Arena e Sequência.

## Firebase
É obrigatório publicar o novo `database.rules.json`.
