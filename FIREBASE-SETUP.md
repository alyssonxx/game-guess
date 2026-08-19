# Firebase — configuração da V12 Stability + Ranked

A V12 usa:

- **Firebase Authentication** — conta/login.
- **Firebase Realtime Database** — perfil, ranking, salas, presença e Arena.
- IGDB continua no backend da Vercel como nas versões anteriores.

## 1. `firebase-config.js`

Mantenha o objeto Web do seu projeto:

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

Não use Service Account/private key no frontend.

## 2. Authentication

Ative **Email/Password**. Google continua opcional.

Confira também **Authentication → Settings → Authorized domains** e mantenha o domínio da Vercel autorizado.

## 3. Realtime Database

A V12 exige o **Realtime Database**, não o Firestore.

## 4. IMPORTANTE — publicar as regras V12

Abra:

**Realtime Database → Rules**

Substitua tudo pelo conteúdo de:

`database.rules.json`

e clique em **Publish**.

A V12 adiciona regras para:

- `profiles`
- `leaderboard`
- `duels/{codigo}`
- `duels/{codigo}/slots` — reserva de vagas
- `duels/{codigo}/presence` — conexão/reconexão

## 5. Como a Arena V12 evita conflitos

Cada sala possui `protocolVersion: 12`.

Cada participante reserva um `slot` de 1 a 8 por transação atômica. Enquanto o jogador está entrando, existe também um `onDisconnect` temporário na vaga, portanto uma queda no meio da entrada não deixa a sala permanentemente com vaga fantasma.

Durante a partida cada navegador usa um `sessionId`. Se a mesma conta abrir a mesma Arena em outro aparelho, a sessão mais recente assume o controle e o aparelho antigo fica bloqueado para responder.

## 6. Presença e host

A presença fica em:

```text
duels/CODIGO/presence/UID/SESSION_ID
```

O Firebase remove a presença automaticamente com `onDisconnect`.

Se o anfitrião sumir do lobby e não voltar após a tolerância, outro participante assume o host automaticamente.

## 7. Horário

Cronômetro, deadlines e transições usam a diferença de horário fornecida pelo Firebase em:

```text
.info/serverTimeOffset
```

Isso evita depender do relógio configurado em cada celular.

## 8. Estados da rodada

A V12 usa:

```text
waiting
playing
revealing
finished
```

Durante `revealing` ninguém pode enviar resposta. Quando alguém pula, a resposta correta é exibida nesse estado antes da próxima rodada.

## 9. Expiração

- lobby: aproximadamente 30 minutos;
- partida ativa: aproximadamente 4 horas;
- resultado final: aproximadamente 2 horas.

Salas expiradas podem ser removidas.

## 10. Ranking

O `leaderboard` agora recebe também resumo da melhor partida e especialidades do jogador. Os detalhes completos continuam guardados no perfil sincronizado.

## 11. Deploy

```bash
git add .
git commit -m "Game Guess V12 Stability Ranked"
git push origin main
```

Depois que a Vercel estiver `Ready`, faça `Ctrl + Shift + R` uma vez no PC.
