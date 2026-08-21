# Game Guess V18.3 — KOF Mobile Lobby Fix

- Corrige abertura automática do KOF no celular ao entrar na tela do KOF.
- Remove reconexão automática a uma sala antiga salva no localStorage.
- Uma partida online só pode autoabrir após o usuário criar ou entrar explicitamente em uma sala na sessão atual.
- Listener realtime e polling de launch agora respeitam `roomSessionArmed`.
- Ao abrir KOF sem sala ativa da sessão atual, o usuário sempre vê o lobby com CRIAR SALA / ENTRAR / TREINO LOCAL.
- Mantém o fluxo normal: após criar/entrar, o sinal do HOST ainda abre o KOF nos dois aparelhos.
