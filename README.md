# Game Guess V12 — Stability + Ranked

A V12 consolida a Arena online de **2 a 8 jogadores**, o Multiverso, Termo Arcade e o ranking global com uma camada extra de estabilidade.

## Principais novidades

- Arena para **2–8 jogadores**.
- Reserva atômica de vagas: dois jogadores não conseguem ocupar a mesma vaga.
- Presença em tempo real com indicador de conexão.
- Reconexão automática após queda de internet ou recarregamento da página.
- O dispositivo mais recente assume o controle da conta na Arena; o anterior fica somente para visualização.
- Migração automática de anfitrião no lobby se o host desconectar e não voltar.
- Horário sincronizado pelo Firebase (`serverTimeOffset`) para cronômetro e transições.
- Máquina de estados de rodada: `waiting → playing → revealing → playing/finished`.
- Respostas bloqueadas fora do estado `playing`.
- ID único por submissão para reduzir efeitos de clique/reenvio duplicado.
- Se alguém pular, a resposta correta aparece somente depois que todos os jogadores ativos terminarem.
- Salas possuem expiração.
- `protocolVersion: 12` impede misturar clientes antigos e novos.
- Cache busting `?v=12.0.0` nos scripts.
- Ranking detalhado com melhor partida, modalidade, universo, desafio, dificuldade, Arena e Termo.
- Mosaico progressivo super escuro preservado.

## Atualização obrigatória do Firebase

A V12 muda a estrutura das salas (`slots`, `presence`, `roundState`, `protocolVersion`).

Publique o novo `database.rules.json` em:

**Firebase Console → Realtime Database → Rules → Publish**

Sem as regras V12, a entrada de novos jogadores pode retornar `PERMISSION_DENIED`.

## Deploy

```bash
git add .
git commit -m "Game Guess V12 Stability Ranked"
git push origin main
```

Depois do deploy da Vercel, faça uma atualização forçada uma vez:

- PC: `Ctrl + Shift + R`
- celular: feche a aba e abra novamente.

As próximas atualizações já usam `?v=12.0.0`, reduzindo cache de JavaScript antigo.

## Segurança do Ranked

A V12 melhora consistência, sessões, concorrência e regras do Realtime Database. O ranking continua adequado para competição casual.

Um navegador autenticado ainda é capaz de alterar dados do próprio cliente. Para um ranking com dinheiro/prêmios ou anti-cheat forte, a autoridade sobre respostas, score e rating deve migrar para backend com Firebase Admin/App Check.
