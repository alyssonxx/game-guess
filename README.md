# Game Guess — IGDB + Vercel

Versão corrigida do Game Guess com a integração da IGDB feita no servidor.

## Por que mudou?

A IGDB não aceita requisições feitas diretamente pelo navegador. Além disso, colocar o Client Secret dentro do `index.html` expõe a credencial para qualquer visitante.

Nesta versão:

- `index.html` chama somente `/api/igdb` no mesmo domínio;
- `api/igdb.js` obtém o App Access Token da Twitch e consulta a IGDB;
- o Client Secret fica somente nas variáveis de ambiente do Vercel;
- existe cache temporário de token e das consultas;
- se a IGDB estiver indisponível, o jogo continua usando a biblioteca local já presente no HTML;
- a interface informa se a sessão está usando IGDB ou modo local;
- capas, desenvolvedoras, sugestões de busca e tratamento de erros foram melhorados.

## Configurar no Vercel

1. Suba esta pasta para o GitHub ou importe-a diretamente no Vercel.
2. No projeto Vercel, abra **Settings > Environment Variables**.
3. Crie:
   - `IGDB_CLIENT_ID`
   - `IGDB_CLIENT_SECRET`
4. Marque as variáveis para Production, Preview e Development se desejar.
5. Faça um novo deploy.

> Não coloque o Client Secret novamente dentro do `index.html`.

## Teste local

Para testar a Function do Vercel localmente, use o Vercel CLI (`vercel dev`) e configure as variáveis de ambiente localmente.
