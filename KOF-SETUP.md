# KOF 2002 Magic Plus II — V17

## Estratégia V17

A V17 não depende mais de três arquivos separados no navegador. O projeto monta um único romset **Full Non-Merged**:

- `roms/kf2k2mp2.zip`

Esse ZIP contém, no mesmo arquivo:

- os 3 arquivos específicos do Magic Plus II;
- os 13 arquivos do parent KOF 2002;
- a BIOS Neo Geo recebida e validada.

Isso foi feito porque o EmulatorJS/FBNeo reconhecia o driver `kf2k2mp2`, mas não estava montando corretamente `EJS_gameParentUrl` e `EJS_biosUrl`, fazendo o core listar arquivos do parent/BIOS como ausentes mesmo quando eles estavam publicados.

## Configuração do player

- `EJS_core = fbneo`
- `EJS_gameUrl = /roms/kf2k2mp2.zip`
- sem `EJS_gameParentUrl`
- sem `EJS_biosUrl`

## CRCs importantes preservados

Magic Plus II:
- `k2k2m2p1.bin` — `1016806c`
- `k2k2m2p2.bin` — `432fdf53`
- `k2k2m2s1.bin` — `446e74c5`

Parent KOF 2002:
- `265-p1.p1` — `9ede7323`
- `265-p2.sp2` — `327266b8`
- `265-m1.m1` — `85aaa632`
- `265-c1.c1` a `265-c8.c8` preservados
- `265-v1.v1` — `15e8f3f5`
- `265-v2.v2` — `da41d6f9`

BIOS essenciais:
- `000-lo.lo` — `5a86cff2`
- `sfix.sfix` — `c2ea0cfd`
- `sm1.sm1` — `94416d67`
- `sp-s3.sp1` — `91b64be3`

O arquivo completo possui 54 entradas. Não renomeie `kf2k2mp2.zip`.
