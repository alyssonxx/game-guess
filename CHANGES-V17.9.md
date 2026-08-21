# Game Guess V17.9 — KOF online launch fix

- Corrige o botão INICIAR KOF ONLINE do HOST.
- HOST abre a tela do emulador imediatamente após o write do Firebase, sem depender do callback realtime.
- CONVIDADO continua abrindo pelo listener e ganhou polling de fallback a cada 1,5 s.
- O lobby distingue jogadores cadastrados, conectados e aparelhos prontos.
- Mensagens explícitas para segunda conta, presença, ready-check e regras do Firebase.
- firebase.js e kof.js usam query version 17.9.0 para eliminar cache antigo.
- O iframe online tenta iniciar o EmulatorJS automaticamente e mantém um botão de fallback para navegadores que exigem gesto do usuário.
