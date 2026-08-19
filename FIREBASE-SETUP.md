# Firebase — configuração da V10 Online Arena

A V10 usa **Firebase Authentication** para registro/login e **Firebase Realtime Database** para perfil sincronizado, ranking e salas 1x1.

## 1. Criar ou abrir um projeto Firebase

1. Abra o Firebase Console.
2. Crie um projeto (ou use um projeto próprio separado para o Game Guess).
3. Na visão geral do projeto, clique no ícone **Web (`</>`)**.
4. Registre o app Web, por exemplo com o apelido `Game Guess`.
5. O Firebase mostrará um objeto `firebaseConfig`.

## 2. Preencher `firebase-config.js`

Abra `firebase-config.js` e substitua os valores de exemplo pelos valores do seu app Web:

```js
window.GAME_GUESS_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...firebaseapp.com",
  databaseURL: "https://...firebasedatabase.app",
  projectId: "...",
  storageBucket: "...firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

> O `databaseURL` só aparece/funciona depois que o Realtime Database existe. Se o objeto copiado antes da criação do banco não tiver esse campo, copie a URL exibida na página do Realtime Database e adicione manualmente.

Não coloque arquivo de Service Account, private key ou credenciais administrativas no repositório.

## 3. Ativar registro e login

No Firebase Console:

1. Vá em **Authentication**.
2. Abra **Sign-in method**.
3. Ative **Email/Password**.
4. Salve.

A V10 já possui telas para:
- criar conta com nome, e-mail e senha;
- entrar com e-mail e senha;
- sair da conta;
- restaurar e sincronizar progresso.

### Login Google (opcional)

A interface também tem o botão Google. Para usá-lo:

1. Em **Authentication > Sign-in method**, ative **Google**.
2. Em **Authentication > Settings > Authorized domains**, confira se o domínio onde seu site está publicado está autorizado. Adicione o domínio da Vercel, se necessário.

Se não quiser Google, basta deixar esse provedor desativado; e-mail/senha continua funcionando.

## 4. Criar o Realtime Database

1. Abra **Realtime Database** no Firebase Console.
2. Clique em **Create database**.
3. Escolha a região.
4. Pode iniciar em modo bloqueado; logo depois publique as regras da V10.
5. Copie a URL do banco e confirme que ela está em `firebase-config.js` como `databaseURL`.

## 5. Publicar as regras

Abra **Realtime Database > Rules** e substitua o conteúdo pelas regras que estão no arquivo:

`database.rules.json`

Depois clique em **Publish**.

As regras da V10 separam:
- `profiles/{uid}` — cada usuário só altera o próprio perfil;
- `leaderboard/{uid}` — ranking dos jogadores autenticados;
- `duels/{codigo}` — sala em tempo real usada pelos dois participantes.

## 6. Testar localmente / depois do deploy

Depois de publicar:

1. Abra o site.
2. Clique em **Entrar**.
3. Crie duas contas diferentes (para teste você pode usar dois navegadores ou uma janela anônima).
4. Na primeira conta, entre em **Duelo 1x1 > Criar sala**.
5. Copie o código de 6 caracteres.
6. Na segunda conta, abra **Duelo 1x1 > Entrar em sala** e informe o código.
7. Os dois devem receber a mesma rodada e o placar deve atualizar em tempo real.

## 7. Regra de vidas e tentativas

Na V10, as vidas dependem da dificuldade:

- **Fácil / Normal:** não exibem corações; erros consomem apenas tentativas da rodada.
- **Difícil / Insano:** o jogador tem 3 vidas; cada resposta incorreta enviada reduz `1 ❤️`. Pulo e timeout também podem consumir uma vida.
- **Termo Arcade:** não possui vidas. Uma Palavra tem 6 tentativas, Dueto tem 7 e Quarteto tem 9. Palavra inexistente é rejeitada sem consumir tentativa.

No duelo, a mesma regra é aplicada: Fácil/Normal usam 3 tentativas por rodada; Difícil/Insano usam 3 vidas por jogador e o duelo pode terminar quando alguém chega a zero.

## 8. Observação sobre ranking competitivo

Esta versão foi feita para um jogo casual entre amigos: o navegador autenticado sincroniza suas próprias estatísticas com o Firebase. As regras impedem um usuário comum de escrever diretamente no perfil de outro usuário, mas um jogador tecnicamente avançado ainda pode adulterar dados do próprio cliente.

Se no futuro o ranking virar competitivo/público com premiações, mova a validação de pontuação e resultados de duelo para um backend confiável (por exemplo uma função/servidor com Firebase Admin) e considere ativar App Check.

## 9. Deploy na Vercel

Após configurar `firebase-config.js`:

```bash
git add .
git commit -m "Game Guess V10 Termo Multi"
git push origin main
```

A configuração IGDB do projeto continua igual à versão anterior. Para o Firebase desta V10, não é necessário criar novas variáveis Vercel porque o app Web lê `firebase-config.js`.
