Game Guess - Arcade EmulatorJS Virtual Gamepad Fix v2.5.5

Corrige o erro do EmulatorJS 4.3.0-pre:
  Cannot read properties of undefined (reading 'debug')

Causa: EJS_VirtualGamepadSettings=[] aciona um bug no validador interno de setVirtualGamepad().
A correção remove essa configuração e esconde apenas a UI nativa do gamepad via CSS,
mantendo os controles touch customizados do Game Guess.

Substitua:
  arcade-player.js
  arcade-player.html
