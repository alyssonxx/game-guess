# Game Guess V17.0

## Avatar 3D
- Avatar antigo humano removido da personalização.
- Novo mascote arredondado/bean inspirado diretamente na referência visual enviada para a V17.
- Faceplate oval claro com olhos verticais, corpo contínuo, braços arredondados, pernas curtas e calçados grandes.
- Look inicial "Galáxia" reproduz a linguagem da referência: roxo/rosa/azul, estrelas, detalhes dourados, capuz, bolso com lua, punhos e estrela lateral.
- Preview WebGL passa a ser inicializado somente depois de abrir a tela do Avatar, evitando a tela 3D vazia causada pela inicialização enquanto a tela estava oculta.
- Fallback 2D automático se WebGL/Three.js falhar.
- Arrastar para girar em 360°.
- Animações: Parado, Acenar, Pular e Comemorar.

## Loja e personalização
- 700 itens: 70 por categoria em 10 categorias.
- Categorias focadas em roupa/acessórios: Capuzes, Faceplate, Trajes, Mangas, Luvas, Parte inferior, Calçados, Peitoral, Cabeça e Costas.
- Os cards da loja agora mostram uma miniatura real do mascote usando a peça selecionada, em vez de emojis genéricos.
- Paletas independentes para cor principal, secundária, detalhes, metais e faceplate.
- Migração automática dos avatares antigos para o novo formato V17.

## Amigos e convites
- Nova tela Amigos.
- Busca de jogador por nickname.
- Pedido de amizade, aceitar/recusar e remover amigo.
- Presença online.
- Convites para KOF, Arena Online e GeoGuess.
- Quando houver sala ativa, o código é anexado ao convite e a aceitação tenta entrar diretamente na sala.
- `database.rules.json` atualizado com `publicProfiles`, `userPresence`, `friendRequests`, `friends` e `gameInvites`.

## KOF
- O KOF continua no FBNeo; WinKawaks não é um core web do EmulatorJS.
- `kf2k2mp2.zip`, `kof2002.zip` e `neogeo.zip` foram consolidados em um único `kf2k2mp2.zip` Full Non-Merged.
- O player V17 não usa mais `EJS_gameParentUrl` nem `EJS_biosUrl`.
