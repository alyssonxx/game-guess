# Game Guess V3 — temporadas competitivas

A temporada atual vem de `rankedConfig/currentSeason` no Realtime Database. O cliente pode ler, mas as regras impedem jogadores comuns de alterar esse valor.

## Abrir uma temporada
No Firebase Console, defina `rankedConfig/currentSeason`:

```json
{
  "id": "S2",
  "label": "Temporada 2",
  "description": "Neon Storm",
  "startsAt": 1798761600000,
  "endsAt": 1803945600000
}
```

Mudar o `id` cria naturalmente uma nova classificação, novas recompensas de divisão e um novo Passe Arcade. O histórico da temporada anterior permanece em `arcadeSeasonHistory`.

## Fechar uma temporada
A classificação final deve ser publicada por um administrador, não pelo navegador do jogador. Isso evita que alguém falsifique a própria colocação.

No Firebase Console:

```text
rankedSeasons/S1/meta/finalized = true
rankedSeasons/S1/meta/finalizedAt = <timestamp ms>
rankedSeasons/S1/finalRanks/<UID_DO_1>/rank = 1
rankedSeasons/S1/finalRanks/<UID_DO_2>/rank = 2
...
rankedSeasons/S1/finalRanks/<UID_DO_100>/rank = 100
```

Depois, o botão **RESGATAR TEMPORADA** concede somente uma vez a recompensa da faixa correspondente.

Faixas: #1, Top 3, Top 10, Top 50, Top 100.
