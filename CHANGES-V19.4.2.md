# V19.4.2 — correção funcional dos controles mobile

Corrige os problemas vistos nos prints da V19.4.1.

## Corrigido
- removida a rotina que forçava todos os ancestrais do canvas para 100% da viewport — ela criava as grandes faixas/manchas translúcidas e podia bloquear os toques;
- removidos `transform: scale()` dos controles nativos do EmulatorJS, preservando a área real de toque;
- A/B/C/D, COIN, START e alavanca voltam a receber `pointer/touch` diretamente;
- alavanca continua visualmente transparente, sem alterar sua caixa de toque;
- MAX e ESQUIVA agora têm exatamente o diâmetro medido dos botões A/B/C/D;
- MAX/ESQUIVA disparam primeiro os botões virtuais reais do EmulatorJS (B+C e A+B); `simulateInput` fica apenas como fallback;
- limpeza das faixas brancas/translúcidas limitada aos wrappers do gamepad, sem mexer na estrutura do canvas;
- posições dos controles preservadas conforme a V19.4.1.

## Arquivos alterados
- `kof-player.html`
- `kof-player.js`
