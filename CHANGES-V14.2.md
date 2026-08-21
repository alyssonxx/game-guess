# Game Guess V14.2 — KOF Web

- KOF 2002 Magic Plus II passa a carregar diretamente do site, sem importação local.
- Criado `roms/kf2k2mp2web.zip`, romset completo combinando o hack e o set KOF 2002 decriptado enviado pelo usuário.
- Criado `roms/kf2k2mp2web.dat` para o modo RomData do FBNeo.
- Criado `roms/neogeo-web.zip` a partir dos arquivos BIOS contidos no pacote NeoRAGEx enviado.
- `000-lo.lo` corrigido para 128 KiB a partir do dump de 64 KiB espelhado.
- Tela KOF agora valida os ativos hospedados por HEAD antes de liberar o jogo.
- Removida a obrigação de armazenar parent/BIOS em IndexedDB.
- Ready-check por jogador na sala KOF.
- HOST só inicia quando 2/2 aparelhos estão prontos.
- Boot sincronizado pelo Firebase com `launchState`/`launchAt`.
- Protocolo das salas KOF atualizado para 2.
- Configuração opcional de TURN por variáveis de ambiente.
- Cache longo para `/roms/*` no Vercel.
- `firebase.js`, `kof.js`, `kof-player.js`, CSS e HTML com cache-bust V14.2.
