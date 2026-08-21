# V19.4.4 — Layout mobile totalmente personalizável

## Correções e melhorias
- Joystick padrão foi movido mais para dentro da tela para reduzir desconforto no polegar.
- A/B/C/D foram deslocados mais para baixo no layout padrão.
- MAX e ESQUIVA acompanham o tamanho dos botões principais.
- Novo editor de posição dos controles no menu **🕹 LAYOUT**.

## Editor de HUD
O jogador pode arrastar individualmente:
- alavanca 360°;
- A;
- B;
- C;
- D;
- MAX;
- ESQUIVA;
- COIN;
- START.

O layout fica salvo em `localStorage` e é separado entre:
- orientação horizontal;
- orientação vertical.

Também foram adicionadas as opções:
- **SALVAR** posições;
- **CANCELAR** alterações;
- **PADRÃO** durante a edição;
- **RESETAR POSIÇÕES** no menu de layout.

## Arquivos alterados
- `kof-player.html`
- `kof-player.js`
