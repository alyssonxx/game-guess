# Atualizar seu projeto atual na Vercel

1. Extraia o ZIP V6.
2. Apague/substitua os arquivos antigos do projeto local.
3. Confirme que existem `api/universe.js` e `api/asset.js` além das rotas antigas.
4. Não altere suas variáveis `IGDB_CLIENT_ID` e `IGDB_CLIENT_SECRET`.
5. No terminal do VS Code:

```bash
git add .
git commit -m "Game Guess V6 Multiverso"
git push origin main
```

6. Aguarde o novo Deployment da Vercel ficar como Ready.
7. Abra o site em janela anônima para evitar cache antigo.
