# Game Guess — Patch V19.3

## O que foi ajustado

### KOF 2002 Mobile / Arcade
- Refinado o layout do mobile para ficar mais próximo de fliperama:
  - alavanca virtual destacada no lado esquerdo;
  - bloco A/B/C/D no lado direito;
  - atalhos **MAX** e **ESQUIVA** maiores e em posição mais acessível.
- Mantida a personalização da ordem dos botões A/B/C/D pelo botão **🕹 LAYOUT**.

### Controle externo (Android e PC)
- Adicionado painel **🎮 CONTROLE** no `kof-player.html`.
- Compatibilidade pensada para:
  - Android com controle por **cabo USB**;
  - Android com controle por **Bluetooth**;
  - PC com controle **USB/Bluetooth**.
- Suporte via **Gamepad API** com detecção automática do controle conectado.
- Mapeamento salvo em `localStorage`, com opção de:
  - capturar botão por botão;
  - salvar o mapeamento personalizado;
  - restaurar o padrão.

### Padrão inicial sugerido
- Movimento: direcional / analógico esquerdo.
- A = botão **4**
- B = botão **5**
- C = botão **6**
- D = botão **1**
- COIN = botão **8**
- START = botão **9**
- MAX = botão **7**
- ESQUIVA = botão **0**

### Teclado arcade no PC
- Movimento pelas **setas**.
- A = **4 / Numpad 4**
- B = **5 / Numpad 5**
- C = **6 / Numpad 6**
- D = **1 ou 3 / Numpad 1 ou 3**
- COIN = **0 / Numpad 0**
- START = **Enter**
- MAX = **Q**
- ESQUIVA = **W**

### Perfil / Avatar
- O sistema antigo de avatar foi **retirado da interface principal**.
- O foco do menu social agora fica em:
  - perfil do jogador;
  - estatísticas;
  - progresso e recordes.

## Arquivos alterados
- `kof-player.html`
- `kof-player.js`
- `social.js`

## Observação sobre Bomberman
- **Neo Bomberman (Neo Geo)** é limitado a **2 jogadores**, então ele **não atende** ao objetivo de até 8 players.
- Para um modo estilo Bomberman com **até 8 jogadores**, o ideal é planejar isso em uma próxima versão com outro jogo/plataforma compatível.
- Ou seja: **é possível estudar e adicionar depois**, mas **não entrou neste patch V19.3**.
