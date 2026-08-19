# KOF 2002 Magic Plus II — configuração V14

## Arquivos

### Já integrado
`roms/kf2k2mp2.zip`

SHA-256:
`6c6ab95604d3704f2bd805df4ec9df8ece6b77486a191da672bba8f9d8bf1f61`

Arquivos alterados do clone:

- `k2k2m2p1.bin` — CRC32 `1016806c`
- `k2k2m2p2.bin` — CRC32 `432fdf53`
- `k2k2m2s1.bin` — CRC32 `446e74c5`

### Necessários em cada aparelho

- `kof2002.zip`
- `neogeo.zip`

Abra **KOF 2002 Magic Plus II → Arquivos do arcade** e importe os dois ZIPs. Eles ficam somente no IndexedDB do navegador.

## Duelo

1. Os dois jogadores entram na conta Game Guess.
2. O HOST cria uma sala KOF.
3. O outro jogador digita o código de 6 caracteres.
4. Ambos importam parent + BIOS e clicam em **INICIAR KOF ONLINE**.
5. No menu do EmulatorJS, abra **Netplay**.
6. HOST cria a sessão; CONVIDADO entra.
7. Ao terminar, os dois confirmam o mesmo vencedor no lobby Game Guess.
8. O resultado é aplicado uma única vez ao Ranked por jogador, mesmo que a conta seja aberta em outro dispositivo.

## Netplay

O servidor padrão é o servidor público do EmulatorJS e pode ser trocado no lobby.
Para produção mais independente, hospede o projeto oficial `EmulatorJS-Netplay` em um servidor que suporte conexões persistentes e coloque sua URL no campo **Servidor Netplay**.

## Diagnóstico

`/api/kof-health` testa a disponibilidade do loader fixado do EmulatorJS 4.2.3 e do servidor público de netplay. Uma falha de diagnóstico não apaga a sala Firebase.
