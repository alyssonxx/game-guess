# Game Guess V18.6

# Game Guess V18.1

GeoGuess com Mapillary + Leaflet/OpenStreetMap, Avatar, KOF, Quiz e multiplayer.

# Game Guess V17 — Avatar 3D Bean + Social + KOF Full Non-Merged

A V17 concentra a atualização em três áreas: avatar/loja, social e KOF.

## Avatar V17

O antigo avatar humano foi substituído por um mascote arredondado de corpo contínuo, faceplate oval e olhos verticais. A referência visual enviada para a V17 foi usada como base de proporção e linguagem: capuz volumoso, braços arredondados, pernas curtas, botas grandes, materiais coloridos e detalhes dourados.

O look inicial é o **Galáxia**: gradiente roxo/rosa/azul, estrelas, capuz, cordões, punhos dourados, bolso com lua e estrela lateral.

A loja possui 700 peças (70 x 10 categorias) e os cards exibem o mascote usando cada item. O preview principal usa Three.js/WebGL, rotação 360° e animações Parado/Acenar/Pular/Comemorar. Se WebGL falhar, existe fallback SVG para o avatar nunca ficar em branco.

## Amigos

A V17 adiciona busca por nickname, pedidos de amizade, presença online e convites para KOF, Arena e GeoGuess. Para ativar o sistema, publique o `database.rules.json` desta versão no Firebase Realtime Database.

## KOF

A V17 continua usando FBNeo/EmulatorJS. O WinKawaks é um executável Windows, não um core web compatível com o EmulatorJS.

O KOF agora usa apenas:

`/roms/kf2k2mp2.zip`

Esse arquivo é Full Non-Merged e contém clone + parent KOF 2002 + BIOS Neo Geo. Os arquivos separados `kof2002.zip` e `neogeo.zip` não são mais necessários no deploy.

Veja `KOF-SETUP.md`, `CHANGES-V17.md` e `V17-VALIDACAO.txt`.

## KOF V17.8
O KOF usa EmulatorJS 4.2.1 com core `fbneo` explícito. O romset fica em `/roms/v178/kf2k2mp2.zip` e é Full Non-Merged. A pasta versionada existe para evitar reutilização do cache `immutable` das versões anteriores. Consulte `KOF-V17.8-VALIDACAO.txt`.
