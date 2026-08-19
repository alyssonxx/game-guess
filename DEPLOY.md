# Deploy V10

1. Substitua os arquivos antigos pelos arquivos desta pasta.
2. Configure `firebase-config.js` seguindo `FIREBASE-SETUP.md`.
3. No Firebase, ative Authentication Email/Password.
4. Crie o Realtime Database e publique `database.rules.json` na aba Rules.
5. Se quiser Google Login, habilite Google e autorize o domínio do site.
6. Preserve as variáveis IGDB já existentes na Vercel.
7. Faça o push:

```bash
git add .
git commit -m "Game Guess V10 Termo Multi"
git push origin main
```

8. Depois do deploy, teste:
   - registro/login e ranking;
   - Fácil/Normal: erros gastam tentativas, sem vidas;
   - Difícil/Insano: erro enviado reduz uma das 3 vidas;
   - Termo Uma Palavra: 6 tentativas;
   - Termo Dueto: 2 palavras e 7 tentativas compartilhadas;
   - Termo Quarteto: 4 palavras e 9 tentativas compartilhadas;
   - palavra inexistente no Termo não consome tentativa;
   - duelo em duas contas/navegadores diferentes, testando Normal e Difícil.
