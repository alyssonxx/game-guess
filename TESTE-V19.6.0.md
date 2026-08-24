# Teste rápido V19.6.0

## 1. Versão / cache
- Abra a home e confirme `GAME GUESS ... V19.6.0`.
- Abra KOF e confirme `ARCADE ONLINE • V19.6.0`.
- O HTML carrega `/styles.css?v=19.6.0`, `/app.js?v=19.6.0`, `/kof.js?v=19.6.0` e `/kof-player.js?v=19.6.0`.

## 2. Celular vertical
1. Inicie KOF.
2. Sem tela cheia: jogo deve ficar somente na parte superior; todos os controles ficam no painel arcade inferior.
3. Entre em tela cheia vertical: o mesmo limite continua valendo.
4. Abra `LAYOUT > EDITAR POSIÇÕES NA TELA` e arraste cada controle. Nenhum controle deve atravessar o limite do painel.
5. Salve, recarregue e confirme persistência.

## 3. Celular horizontal
1. Gire para horizontal.
2. Jogo ocupa a tela; controles ficam transparentes sobre as laterais.
3. MAX/ESQUIVA ficam acima de A/B/C/D sem sobreposição.
4. Edite posição/tamanho, salve, volte ao vertical e confirme que os dois layouts são independentes.

## 4. Input
- Teclado: setas, 4=A, 5=B, 6=C, 1/3=D, 0=COIN, Enter=START, Q=MAX, W=ESQUIVA.
- Teste de agregação: segure B, aperte e solte MAX; B deve continuar pressionado até você soltar B.
- Faça o equivalente no touch e no gamepad.
- Segure uma direção, troque de app/aba e volte; não deve ficar direção presa.

## 5. Performance
- Durante `kofPlayScreen`, `body` deve conter `kof-performance-active`.
- `.particles`, `.confetti-container` e `.bg-grid` ficam `display:none` durante a luta.
- Ao voltar ao lobby/home, a classe é removida.

## Validações estáticas executadas
- `node --check app.js`
- `node --check kof-player.js`
- `node --check kof.js`
- `node --check api/kof-config.js`
- `node --check api/kof-health.js`
- Sem referências residuais aos estados antigos `activePhysicalButtons`, `activeDirectDirections`, `simulateCombo` e `applyDirectDirection` em `kof-player.js`.
