# Game Guess V14 — Quiz Cloud + KOF 2002 Magic Plus II

## Quiz sem repetição entre dispositivos

- Cada pergunta recebe um `dedupeKey` determinístico.
- O histórico local usa até 50.000 hashes.
- Usuários autenticados também salvam os hashes no Firebase em `quizHistory/{uid}/seen`.
- Ao abrir em outro PC/celular, o histórico da conta é unido ao histórico local antes de pedir novas perguntas.
- Perguntas da Arena/Quiz também são marcadas no histórico da conta de cada participante.
- O gerador procedural usa chaves de conceito em História, Geografia, Ciências, Tecnologia, Filmes, Games, Desenhos etc. para evitar repetir o mesmo fato apenas com outra redação.

> Nenhum banco finito permite prometer que uma pergunta nunca voltará para sempre. A V14 evita as perguntas conhecidas no histórico enquanto houver conteúdo novo disponível e mantém até 50.000 hashes ativos por consulta/dispositivo.

## KOF 2002 Magic Plus II

- ROM `kf2k2mp2.zip` enviada pelo usuário incluída em `roms/kf2k2mp2.zip`.
- SHA-256 integrado: `6c6ab95604d3704f2bd805df4ec9df8ece6b77486a191da672bba8f9d8bf1f61`.
- O set é um clone split e precisa também de `kof2002.zip` (parent) e `neogeo.zip` (BIOS).
- Parent e BIOS são importados pelo navegador e guardados apenas no IndexedDB daquele aparelho.
- Também é possível importar `kf2k2mp2.zip` manualmente; se a ROM não estiver hospedada, o jogo usa a versão importada.
- Emulador: EmulatorJS 4.2.3 com core FBNeo, versão fixada.
- `EJS_gameParentUrl` recebe o parent local e `EJS_biosUrl` recebe a BIOS local.
- Netplay configurado com Game ID numérico determinístico da sala e ICE/STUN.

## Sala KOF 1x1 robusta

- Firebase cria código de sala de 6 caracteres.
- Entrada usa transação somente em `guestUid`, evitando transação no objeto inteiro da sala.
- Presence/reconexão usa `.info/connected` + `onDisconnect`.
- Falha momentânea de presence não invalida uma sala já criada.
- Resultado só fecha quando os dois jogadores votam no mesmo vencedor.
- Registro do Ranked tem trava global `rankedRecorded/{uid}` para a mesma luta não pontuar duas vezes em aparelhos diferentes.
- `/api/kof-health` verifica disponibilidade do EmulatorJS e servidor Netplay para diagnóstico, sem bloquear o jogo em falhas transitórias.

## Configuração necessária

1. Publique `database.rules.json` no Realtime Database.
2. Cada aparelho deve importar `kof2002.zip` e `neogeo.zip` uma vez.
3. Para uso público, confira se você possui autorização para distribuir qualquer ROM colocada em `roms/`.
4. Para maior independência em produção, hospede seu próprio EmulatorJS-Netplay e troque o servidor no lobby KOF.

## Limitação de integração Netplay

A V14 usa apenas as opções públicas/documentadas do EmulatorJS. Após os dois jogadores abrirem o KOF, use o menu **Netplay** do EmulatorJS: HOST cria a sessão e CONVIDADO entra. Automatizar cliques internos do menu dependeria de APIs internas não documentadas e seria menos estável entre versões.
