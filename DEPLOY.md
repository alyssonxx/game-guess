# Deploy rápido

1. Copie todos os arquivos desta pasta para o repositório que já está ligado à Vercel.
2. Confirme que `api/igdb.js` existe.
3. Confirme na Vercel que continuam configuradas:
   - `IGDB_CLIENT_ID`
   - `IGDB_CLIENT_SECRET`
4. Rode:

```bash
git add .
git commit -m "Adiciona Famosos no Brasil"
git push
```

5. Aguarde o deploy ficar `Ready`.
6. Abra o site e teste primeiro **Jogo Rápido**.
7. Depois teste **Survival**, **Blitz** e um filtro temático.


### V4.2
A pasta `api` agora contém `igdb.js` e `image.js`. Suba os dois arquivos. Nenhuma nova variável de ambiente é necessária.


### V4.3
Inclui a categoria 🇧🇷 Famosos no Brasil. Substitua também `api/igdb.js` e `app.js`; não há novas variáveis de ambiente.
