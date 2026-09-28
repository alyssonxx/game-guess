ARCADE NETPLAY ROOM FIX V2.5.2

Corrige o bug em que dois aparelhos podiam acabar criando duas sessoes WebRTC com o mesmo codigo visual.

ALTERACOES
- O Firebase agora grava hostSessionId/guestSessionId por aparelho.
- Um segundo aparelho usando a mesma conta nao pode assumir o papel de HOST da mesma sala.
- O nome real da sessao WebRTC (rtcRoomName) e gerado uma unica vez pelo HOST no Firebase no momento do inicio.
- HOST e CONVIDADO recebem exatamente o mesmo rtcRoomName.
- O player nao reconstrói mais a sala WebRTC apenas com timestamp quando rtcRoomName estiver presente.
- Cache bust atualizado para v2.5.2.
- Nenhuma nova Serverless Function e criada.

IMPORTANTE
Para X1 ranqueado, use contas diferentes nos dois aparelhos. Isso tambem evita que vitorias/derrotas de dois jogadores sejam gravadas no mesmo UID.

ARQUIVOS
firebase.js
arcade-x1.js
arcade-player.js
arcade-player.html
index.html
