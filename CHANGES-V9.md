# V9 — Online Arena

## Contas e ranking
- Registro e login com Firebase Authentication (e-mail/senha).
- Login Google opcional.
- Perfil e progresso sincronizados no Realtime Database.
- Ranking global com rating, vitórias, sequência e placar 1x1.

## Duelo 1x1
- Salas por código de 6 caracteres.
- Dois jogadores recebem exatamente a mesma sequência de perguntas.
- 3 vidas por jogador.
- Cada resposta incorreta enviada custa 1 vida.
- Pulo e timeout também custam 1 vida.
- 35 segundos por rodada e até 15 rodadas.
- Vence por acertos; desempate por vidas e pontuação.
- Perguntas específicas por universo e por tipo de desafio.

## Regra global de vidas
- Games IGDB, Multiverso e Termo agora usam 3 vidas.
- Erro enviado = -1 vida em todos os modos.
- Termo rejeita palavra inexistente sem consumir tentativa/vida.

## Perguntas específicas
- Dragon Ball: técnica, transformação, raça/origem, grupo, saga e papel.
- Naruto: jutsu/kekkei genkai, vila/clã/nação, equipe/organização e fase.
- Yu-Gi-Oh!: deck/carta, academia, geração e papel do duelista.
- Cavaleiros: técnica, armadura/constelação, exército/reino e saga.
- Pokémon: tipo, geração, habilidades e corpo.
- Digimon: nível, atributo, tipo, habilidades e evolução.
- League of Legends: função, estilo de combate, título e dificuldade.
- Desenhos/TV Globinho: desenho, época, característica e grupo.
- Games: plataforma, gênero, lançamento, estúdio e tema.

## Arquivos novos
- `firebase-config.js`
- `firebase.js`
- `database.rules.json`
- `duel.js`
- `FIREBASE-SETUP.md`
