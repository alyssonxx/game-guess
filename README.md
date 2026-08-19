# Game Guess V14 — Quiz Cloud + KOF Online

A V14 mantém o Arcade/Multiverso, Termo, Quiz, temporadas, Ranked e Arena de 2–8 jogadores e adiciona duas integrações principais:

1. **Quiz com histórico persistente por conta**: hashing determinístico, deduplicação local + Firebase e sincronização entre dispositivos.
2. **KOF 2002 Magic Plus II**: FBNeo/EmulatorJS, treino no navegador, lobby Firebase 1x1, presença/reconexão, netplay e Ranked KOF.

## Firebase obrigatório

Publique `database.rules.json` em **Firebase Console → Realtime Database → Rules**.

As regras V14 adicionam:

- `quizHistory/{uid}/seen`
- `fightRooms/{code}`
- confirmação idempotente do Ranked do KOF

## KOF

A ROM clone `kf2k2mp2.zip` enviada para esta atualização está em `roms/kf2k2mp2.zip`.
O set é **split**, então cada aparelho também precisa importar uma vez:

- `kof2002.zip` — ROM parent
- `neogeo.zip` — BIOS Neo Geo

Os dois arquivos ficam no IndexedDB do navegador e não são enviados ao Firebase.
Também existe um seletor para importar `kf2k2mp2.zip` localmente caso você prefira não hospedar o clone no site.

O emulador usa **EmulatorJS 4.2.3 + FBNeo**, com `EJS_gameParentUrl`, `EJS_biosUrl`, Game ID numérico da sala e servidor de netplay configurável.

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
git commit -m "Game Guess V14 Quiz Cloud KOF Online"
git push origin main
```

Depois do deploy, publique as regras V14 do Realtime Database.

## Observações de produção

- O Ranked continua sendo um sistema de competição casual; para competição com prêmio real, mova cálculo de score/elo para backend autoritativo.
- O servidor de netplay do EmulatorJS é separado do Firebase. O lobby usa Firebase; a sessão do emulador usa o servidor Netplay/WebRTC.
- Se você publicar ROMs no site, confirme que possui os direitos necessários para distribuí-las.
