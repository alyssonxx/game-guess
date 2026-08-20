# Game Guess V15.1 — GeoGuess + Avatar + KOF Web + Quiz Cloud


**KOF Web:** o Magic Plus II agora é carregado diretamente do site através de um pacote RomData preparado para FBNeo; nenhum arquivo local é exigido do jogador. O Quiz Cloud, Arena 2–8, Ranked por temporada e histórico persistente continuam preservados.

A V14 mantém o Arcade/Multiverso, Termo, Quiz, temporadas, Ranked e Arena de 2–8 jogadores e adiciona duas integrações principais:

1. **Quiz com histórico persistente por conta**: hashing determinístico, deduplicação local + Firebase e sincronização entre dispositivos.
2. **KOF 2002 Magic Plus II**: FBNeo/EmulatorJS, treino no navegador, lobby Firebase 1x1, presença/reconexão, netplay e Ranked KOF.

## Firebase obrigatório

Publique `database.rules.json` em **Firebase Console → Realtime Database → Rules**.

As regras V14.2 mantêm/adicionam:

- `quizHistory/{uid}/seen`
- `fightRooms/{code}`
- confirmação idempotente do Ranked do KOF

## KOF

A V14.2 usa um pacote web completo em `roms/kf2k2mp2web.zip`, acompanhado de `roms/kf2k2mp2web.dat` e `roms/neogeo-web.zip`. Esses arquivos foram preparados a partir dos três pacotes fornecidos pelo usuário, portanto o jogador não precisa importar `kof2002.zip` nem BIOS localmente.

O emulador usa **EmulatorJS 4.2.3 + FBNeo**. Antes de liberar treino ou sala, o lobby verifica se os três ativos web respondem. No 1x1, os dois clientes passam por ready-check no Firebase e o HOST dispara um boot sincronizado. O mesmo `EJS_gameID`, servidor Netplay e ICE config são aplicados nos dois aparelhos.

Para redes mais restritas, é possível configurar um TURN opcional pelas variáveis `KOF_TURN_*` descritas em `.env.example` e `KOF-SETUP.md`.

## Quiz

Cada pergunta recebe `dedupeKey`. O navegador e a conta Firebase mantêm histórico de até **50.000 hashes ativos por leitura**, e as perguntas vistas na Arena também entram no histórico do participante.

O backend mistura:

- Tryvia API
- banco local PT-BR
- geradores procedurais/combinatórios

Mesmo sem API externa, os geradores foram testados para produzir centenas de perguntas consecutivas sem repetição nas categorias principais.

## Deploy

```bash
git add .
git commit -m "Game Guess V14.2 KOF Web"
git push origin main
```

Depois do deploy, publique as regras V14.2 do Realtime Database.

## Observações de produção

- O Ranked continua sendo um sistema de competição casual; para competição com prêmio real, mova cálculo de score/elo para backend autoritativo.
- O servidor de netplay do EmulatorJS é separado do Firebase. O lobby usa Firebase; a sessão do emulador usa o servidor Netplay/WebRTC.
- Se você publicar ROMs no site, confirme que possui os direitos necessários para distribuí-las.

## V15
Veja `CHANGES-V15.md` para GeoGuess Arena, perfil, avatar, loja e nova economia.
