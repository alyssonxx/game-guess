# KOF 2002 Magic Plus II — V16.1

## Status

Os três romsets necessários foram recebidos e validados por nome, tamanho e CRC32:

- `roms/kf2k2mp2.zip` — clone/driver `kf2k2mp2`
- `roms/kof2002.zip` — parent `kof2002`
- `roms/neogeo.zip` — BIOS Neo Geo

O player usa o core `fbneo` do EmulatorJS, com:

- `EJS_gameUrl = /roms/kf2k2mp2.zip`
- `EJS_gameParentUrl = /roms/kof2002.zip`
- `EJS_biosUrl = /roms/neogeo.zip`

## CRCs principais validados

Magic Plus II:
- `k2k2m2p1.bin` `1016806c`
- `k2k2m2p2.bin` `432fdf53`
- `k2k2m2s1.bin` `446e74c5`

Parent KOF 2002:
- `265-p1.p1` `9ede7323`
- `265-p2.sp2` `327266b8`
- `265-m1.m1` `85aaa632`
- `265-c1.c1`…`265-c8.c8` validados
- `265-v1.v1` `15e8f3f5`
- `265-v2.v2` `da41d6f9`

BIOS essenciais:
- `000-lo.lo` `5a86cff2`
- `sfix.sfix` `c2ea0cfd`
- `sm1.sm1` `94416d67`
- `sp-s2.sp1` `9036d879`

## Deploy

Não renomeie os ZIPs dentro de `roms/`. O FBNeo usa o nome do romset/driver para identificar jogos arcade. Faça o deploy do projeto inteiro, incluindo a pasta `roms`.
