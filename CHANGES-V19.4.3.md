# V19.4.3 — correção de lentidão em tela cheia

## Otimizações
- adicionado modo automático `gg-fullscreen-performance` ao entrar em tela cheia;
- remove blur/backdrop-filter, sombras e transições do HUD enquanto estiver em fullscreen;
- removido o `setInterval` que recalculava a posição dos controles durante toda a partida;
- o `MutationObserver` agora observa somente `#game`, usa debounce e se desconecta assim que os controles virtuais são encontrados;
- redimensionamento do EmulatorJS foi centralizado em uma função com debounce, evitando vários `handleResize()` seguidos durante fullscreen/rotação;
- HUD e toast ficam ocultos em fullscreen quando não estão em uso, reduzindo composição gráfica no Android;
- `EJS_backgroundBlur = false` explicitamente;
- `EJS_threads` passa a ser ativado somente quando o navegador já oferece `crossOriginIsolated + SharedArrayBuffer`, sem quebrar aparelhos que não suportam threads.

## Arquivos alterados
- `kof-player.html`
- `kof-player.js`
