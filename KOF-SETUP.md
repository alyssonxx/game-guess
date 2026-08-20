# KOF 2002 Magic Plus II — V14.2 Web

## Estado atual

Na V14.2 o jogador **não precisa importar ROMs pelo PC/celular**.

O site publica três ativos próprios:

- `roms/kf2k2mp2web.zip` — pacote completo do Magic Plus II preparado a partir dos arquivos enviados pelo usuário.
- `roms/kf2k2mp2web.dat` — RomData que descreve o layout de memória do set decriptado para o FBNeo.
- `roms/neogeo-web.zip` — BIOS Neo Geo preparada a partir do pacote NeoRAGEx enviado.

O `kof2002.zip` recebido é um set antigo/decriptado de NeoRAGEx, por isso ele não é usado diretamente como `EJS_gameParentUrl` no FBNeo moderno. Os gráficos, áudio e Z80 necessários foram incorporados ao pacote web completo.

## Boot

O player usa:

```js
EJS_core = 'fbneo';
EJS_gameUrl = '/roms/kf2k2mp2web.zip';
EJS_biosUrl = '/roms/neogeo-web.zip';
```

O RomData é colocado em vários caminhos compatíveis do VFS através de `EJS_externalFiles`, para que o FBNeo consiga reconhecer o basename `kf2k2mp2web` independentemente do diretório em que o frontend montar a ROM.

O EmulatorJS permanece fixado em `4.2.3` para que os dois jogadores executem a mesma geração do frontend/core.

## Duelo 1x1 V14.2

1. HOST cria uma sala no Game Guess.
2. CONVIDADO entra pelo código de 6 caracteres.
3. Cada aparelho verifica o pacote do jogo, RomData e BIOS.
4. O Firebase registra `clientReady/{uid}` somente depois da verificação.
5. O botão do HOST só libera quando há `2/2 jogadores` e `2/2 aparelhos prontos`.
6. O HOST inicia e o Firebase publica `launchState=starting` + `launchAt`.
7. Os dois navegadores abrem o emulador a partir do mesmo evento de sala.
8. Ambos recebem o mesmo `EJS_gameID` e o mesmo servidor Netplay.
9. No menu Netplay do EmulatorJS, HOST cria a sessão e CONVIDADO entra.
10. Ao terminar, os dois confirmam o mesmo vencedor; o Ranked é aplicado uma única vez por conta.

O protocolo das salas KOF passou de `1` para `2`. Portanto, publique o `database.rules.json` da V14.2 no Realtime Database antes de testar.

## TURN opcional

O projeto funciona com os STUN públicos configurados por padrão. Para melhorar a conectividade em redes com NAT restritivo, a V14.2 aceita:

```text
KOF_NETPLAY_SERVER=https://netplay.emulatorjs.org/
KOF_TURN_URL=
KOF_TURN_USERNAME=
KOF_TURN_CREDENTIAL=
```

Configure no Vercel apenas se tiver um servidor TURN próprio/temporário.

## Diagnóstico

- `/api/kof-health` verifica EmulatorJS + servidor Netplay.
- `/api/kof-config` entrega a configuração de Netplay/ICE ao iframe.
- O lobby executa `HEAD` nos três ativos do arcade antes de habilitar treino/sala.
- Os ROMs V14.2 recebem cache imutável de 1 ano pelo `vercel.json`.

## Limite da validação automática

A estrutura dos ZIPs, CRCs, hashes, RomData, JavaScript, JSON e fluxo Firebase podem ser validados offline. O boot final do WebAssembly e uma luta Netplay completa precisam ser confirmados depois do deploy em navegador real, pois dependem do core remoto do EmulatorJS e da conectividade entre dois dispositivos.
