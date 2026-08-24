# Teste V19.7.0

## Validações executadas

- `node --check`: `kof-player.js`, `kof.js`, `kof-catalog.js`, `kof-catalog-ui.js`, `api/kof-config.js`, `api/kof-netplay-rooms.js`, `api/kof-health.js`.
- HTML: IDs únicos em `index.html` e `kof-player.html`.
- Catálogo: 44 IDs únicos.
- API config sem variável de ambiente: retorna servidor público, `netplaySource=public`, online EJS `4.3.0-pre` e `netplayConfigured=true`.
- ROM preservada sem modificação.

## Teste recomendado após Vercel

1. Faça deploy limpo e abra em aba anônima/limpe cache.
2. Entre com duas contas diferentes, crie a sala e aguarde 2/2 aparelhos prontos.
3. HOST inicia a partida. Os dois devem abrir o KOF e depois o toast deve evoluir de preparação para sala WebRTC/conectado.
4. Teste movimento + A/B/C/D simultâneos nos dois lados.
5. No celular, abra `🕹 LAYOUT`: o botão de editar e os tamanhos devem estar imediatamente visíveis no topo.
6. Ative a guia azul, escolha um lutador e confirme que apenas uma ficha aparece.
7. No lobby, abra Catálogo, pesquise um personagem, selecione-o e confira especiais/combo.

> O ambiente de empacotamento não executa um duelo WebRTC real entre dois navegadores externos. A correção de rede foi baseada na restauração da linha de Netplay da versão anterior funcional e na configuração oficial atual do EmulatorJS.
