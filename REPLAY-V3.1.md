# Game Guess Replay V3.1

## Recursos
- gravação local em WebM com tentativa de áudio WebAudio;
- replay competitivo por inputs/frame no HOST do X1;
- save state inicial quando o core permite `gameManager.getState()`;
- upload opcional de vídeo, inputs e state para Firebase Storage;
- metadados no Realtime Database (`arcadeReplays`);
- compartilhamento entre participantes e modo público para usuários logados;
- player dedicado `arcade-replay-player.html` para reconstrução por inputs.

## Firebase Storage

**Importante (2026):** o Cloud Storage for Firebase exige o plano Blaze. A gravação local, áudio e replay por inputs funcionam sem Storage; somente a nuvem/compartilhamento depende dele.

1. Ative **Storage** no mesmo projeto do Firebase.
2. Abra **Storage > Rules** e publique o conteúdo de `storage.rules`.
3. Em **Realtime Database > Rules**, publique novamente `database.rules.json`.

A atualização não cria nenhuma nova função `/api` na Vercel.

## Observação sobre replay por inputs
O formato registra frame, player, botão e estado (pressionado/solto) e usa um save state inicial. A reprodução depende do determinismo do core e da compatibilidade do save state do EmulatorJS. Se o core não devolver um state válido, o vídeo continua disponível, mas o botão de replay por inputs não é liberado.

No X1 online o HOST é a fonte autoritativa da sequência: ele intercepta os comandos aplicados ao core, incluindo os enviados pelo GUEST via WebRTC.

## Áudio
O player instala um tap WebAudio antes do EmulatorJS carregar e espelha o nó conectado ao `AudioContext.destination` para um `MediaStreamDestination`. Se o navegador/core não expuser o áudio por esse grafo, o replay continua como vídeo sem áudio e a interface mostra `SEM ÁUDIO`.
