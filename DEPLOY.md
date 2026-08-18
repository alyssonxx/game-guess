# Atualizar seu projeto atual na Vercel — V7

1. Extraia o ZIP V7.
2. Substitua os arquivos antigos do projeto local pelos arquivos da V7.
3. Confirme que existem:
   - `api/universe.js`
   - `api/asset.js`
   - `api/data/expanded.js`
   - `multiverse.js`
   - `termo.js`
4. Não altere suas variáveis `IGDB_CLIENT_ID` e `IGDB_CLIENT_SECRET`.
5. No terminal do VS Code:

```bash
git add .
git commit -m "Game Guess V7 Multiverso Caos"
git push origin main
```

6. Aguarde o Deployment da Vercel ficar como `Ready`.
7. Teste primeiro em janela anônima para evitar cache antigo.
8. Faça um teste em outro PC/celular. As imagens dos universos passam por `/api/asset` e possuem fallback interno para não quebrar a rodada quando uma fonte externa falha.
