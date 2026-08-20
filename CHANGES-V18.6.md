# Game Guess V18.6 — KOF mobile fullscreen + PVP WebRTC automático

- Treino local continua no EmulatorJS 4.2.1, que já estava validado com o FBNeo/romset atual.
- KOF online usa EmulatorJS 4.3.0-pre, linha que adicionou o novo Netplay por WebRTC.
- A sala Netplay interna agora é automática: HOST cria via código da sala Game Guess e CONVIDADO procura/entra sozinho.
- O nome do jogador vem do perfil Game Guess; o popup "Set Player Name" não é mais necessário.
- Cada início de luta recebe uma chave derivada de `launchAt`, evitando entrar em uma sala WebRTC antiga.
- Botões de tela cheia, vertical e horizontal adicionados dentro do emulador.
- Controles A/B/C/D reorganizados em grade 2x2 no touch para não saírem da tela em celulares estreitos.
- Barra de status do PVP mostra: criando sala, procurando host, entrando e WebRTC conectado.
- Mantido botão NETPLAY apenas como fallback manual.
- STUN permanece configurado; TURN pode ser habilitado pelas variáveis KOF_TURN_URL, KOF_TURN_USERNAME e KOF_TURN_CREDENTIAL para redes/NAT restritivos.
