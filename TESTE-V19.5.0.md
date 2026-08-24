# Teste rápido V19.5.0

1. Suba os arquivos e aguarde o deploy do Vercel terminar.
2. Abra o site em uma aba anônima ou faça recarga forçada para evitar HTML/JS antigo.
3. Treino local no celular:
   - vertical: o jogo deve ficar na metade superior e o painel arcade na metade inferior;
   - horizontal: somente um conjunto de controles transparentes deve aparecer;
   - não deve haver letras A/B/C/D duplicadas do EmulatorJS.
4. Teste alavanca, A/B/C/D, COIN e START.
5. Teste MAX = B+C e ESQUIVA = A+B.
6. Em LAYOUT > EDITAR POSIÇÕES, mova um botão, altere tamanho e salve. Vertical e horizontal usam layouts independentes.
7. No PC, teste setas + 4/5/6/1. Q = MAX, W = ESQUIVA e 3 = D alternativo.
8. Se usar controle USB/Bluetooth, abra CONTROLE e confirme o mapeamento. O polling do controle só roda enquanto um gamepad está conectado.

A V19.5 usa novas chaves de layout (`v4`), portanto posições quebradas salvas nas versões 19.4.x não são reaproveitadas.
