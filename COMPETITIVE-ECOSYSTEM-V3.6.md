# Game Guess Competitive Ecosystem V3.6.0

Esta atualização consolida o Competitive Core, Torneios 2.0, perfil competitivo, desafios do Passe/temporada e Social/Rivalidades.

## Competitive Core
- Cada partida Ranked gera um registro canônico em `competitiveMatches/<season>/<roomCode>`.
- O registro guarda matchId, jogadores, jogo, resultado, RP antes/depois esperado, recibos reais de RP/AC/XP, torneio e replays vinculados.
- Resultado duplicado continua bloqueado pelo `appliedMatches`/inbox da V2.6+.
- Resultado conflitante continua exigindo confirmação dos dois jogadores.
- Sair voluntariamente durante uma luta iniciada conta como abandono.
- Queda de conexão recebe tolerância de 45 segundos antes da opção de vitória por desconexão.
- Revanche cria uma nova sala vinculada à partida anterior e envia convite ao rival.

## Torneios 2.0
- 4, 8 e 16 jogadores.
- MD1, MD3 e MD5.
- Público ou privado.
- O torneio inicia automaticamente quando a última vaga é preenchida.
- Eliminação simples com semifinal, final e disputa de 3º lugar.
- Guarda campeão, vice e terceiro lugar.
- Premiação: campeão, vice e terceiro recebem AC/XP; troféu conta apenas para campeão.
- Histórico salvo em `arcadeTournamentHistory/<season>/<code>`.
- Replay da final é associado quando houver replay em nuvem correspondente.

## Perfil competitivo
- Usa o histórico canônico de `competitiveMatches`.
- Mostra RP geral/por jogo, V/D, win rate, streak, torneios, temporadas, coleção, Passe e replays.
- Mostra torneios recentes e colocações.
- Perfis de outros jogadores têm botão direto de desafio X1.

## Seasons + Battle Pass
- O histórico pessoal da temporada anterior é arquivado automaticamente quando `rankedConfig/currentSeason` muda.
- Desafios diários e semanais são calculados a partir das partidas competitivas reais.
- Recompensas dos desafios dão Arcade Coins e XP do Passe.
- Top 100/50/10/3/#1 continuam exigindo `finalRanks` confiável publicado no Firebase. Isso é intencional: o navegador do jogador não deve poder declarar sua própria posição final.

## Social e Rivalidades
- Desafio X1 direto a partir do perfil/rivalidade.
- O desafio cria a sala Ranked antes de enviar o convite.
- O convidado aceita e entra diretamente na mesma sala.
- Revanche pós-partida usa o mesmo fluxo.
- Inbox de desafios aparece na Home.

## Firebase
Publique o novo `database.rules.json` após aplicar o patch.

## Vercel
Nenhuma nova função `/api` é adicionada.
