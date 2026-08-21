# Game Guess V17.8 — KOF FBNeo diagnosticado + anti-cache

## KOF
- EmulatorJS fixado em 4.2.1 (commit `13362ef`).
- Core configurado explicitamente como `fbneo` em vez do alias `arcade`.
- O relatório público do CDN confirma o build do core FBNeo em 2025-01-07, finalizado às 14:59:35 UTC.
- ROM `kf2k2mp2.zip` em Full Non-Merged com clone + parent + BIOS.
- Tamanho validado: `86.694.745` bytes.
- SHA-256 local validado: `2cb16b649819f8168701f01ddd4642dc3678283c112cd89e79103ed45f4a1a4d`.
- Nova URL: `/roms/v178/kf2k2mp2.zip`.
- A mudança de URL é intencional: versões anteriores usavam `/roms/kf2k2mp2.zip` com `Cache-Control: immutable` por 1 ano, o que podia manter uma ROM antiga no CDN/navegador.
- `kof.js` foi atualizado para não exigir mais `kof2002.zip` e `neogeo.zip` separados.
- `/api/kof-health` agora confere EmulatorJS, relatório do core FBNeo, ROM publicada e Netplay.

## GeoGuess
- Mantido o GeoGuess V17.6 com Leaflet + OpenStreetMap.

## Demais módulos
- Avatar, loja, amigos, Firebase, quiz, Arena e demais módulos foram preservados.
