# V15.1 — Vercel Hobby Function Limit Fix

- Corrige o erro `No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan`.
- Move os módulos auxiliares que estavam em `api/data/` para `server-data/`.
- Esses módulos continuam sendo empacotados junto das funções que os importam, mas deixam de ser tratados como endpoints pela Vercel.
- O projeto passa de 13 arquivos JavaScript sob `/api` para 9 endpoints reais.
- Nenhum modo foi removido: GeoGuess, Avatar/Perfil/Loja, Quiz, KOF, Termo, Multiverso e Arena permanecem.

## IMPORTANTE AO ATUALIZAR UMA INSTALAÇÃO V15

Apague a pasta antiga `api/data` do seu projeto/repositório antes do push. Apenas extrair o ZIP por cima não remove arquivos antigos do Git.

Windows PowerShell:
```powershell
Remove-Item -Recurse -Force api\data
```

CMD:
```bat
rmdir /s /q api\data
```
