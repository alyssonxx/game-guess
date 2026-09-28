ARCADE NETPLAY STABILITY V2.5.3

CORRECOES IDENTIFICADAS PELOS PRINTS DO CONSOLE

1. tournaments.js:142 - Unexpected token '...'
   O spread estava solto dentro do constructor da classe Tournament.
   Foi substituido por Object.assign seguro, preservando os objetos rules/prizes.

2. Firebase /userPresence/... permission_denied
   - regra userPresence fortalecida no nivel do UID;
   - attachSocialPresence agora confere se a conta ainda e a mesma depois das operacoes async;
   - falha de presenca social nao derruba o restante do fluxo.

3. X1 preso em "reconectando / validando ROM"
   Havia tres problemas de sincronizacao:
   - create/join retornavam antes de attachFightPresence terminar;
   - se o primeiro attach falhasse, o handle nao existia para ser restaurado na reconexao;
   - clientReady e removido pelo onDisconnect, mas o frontend mantinha readyRoom em cache e nao gravava ready novamente.

   A V2.5.3 agora:
   - espera a presenca Firebase realmente ser registrada antes de confirmar criacao/entrada;
   - tenta o attach ate 3 vezes;
   - guarda o handle antes da primeira escrita para permitir restauracao apos queda;
   - restaura a presenca ao Firebase reconectar;
   - regrava clientReady depois de reconexao;
   - valida ready/presenca pelo sessionId correto do aparelho;
   - impede o host de iniciar se houver estado pronto antigo de outra sessao;
   - evita varias validacoes HEAD simultaneas;
   - separa na UI "reconectando ao Firebase" de "sincronizando estado".

4. Warnings Cross-Origin-Opener-Policy do popup Google
   Eles vem do fluxo signInWithPopup do Firebase/Chrome e nao sao a causa do bug da sala.

ARQUIVOS
- firebase.js
- arcade-x1.js
- tournaments.js
- index.html
- database.rules.json

IMPORTANTE - FIREBASE
Depois de substituir os arquivos do projeto, copie TODO o conteudo de database.rules.json em:
Firebase Console > Realtime Database > Regras > Publicar

SEM ISSO, o erro permission_denied pode continuar mesmo com o JavaScript corrigido.

INSTALACAO COM PATCH
1. Coloque arcade-netplay-stability-v2.5.3.patch na raiz do projeto.
2. git apply --check arcade-netplay-stability-v2.5.3.patch
3. git apply arcade-netplay-stability-v2.5.3.patch
4. git add firebase.js arcade-x1.js tournaments.js index.html database.rules.json
5. git commit -m "fix: estabiliza presenca e ready do arcade x1 v2.5.3"
6. git push

TESTE RECOMENDADO
- Abra o site em dois aparelhos com contas DIFERENTES.
- Crie uma sala nova; nao reutilize sala antiga.
- O segundo aparelho so deve aparecer conectado depois que a presenca Firebase for registrada.
- Os dois devem chegar a "online • pronto".
- O host so deve liberar INICIAR ONLINE X1 quando os dois sessionIds estiverem coerentes.
