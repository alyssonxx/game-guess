# Teste manual — Game Guess V19.10.0

## Teste principal com Kula

1. Abra o KOF 2002 Magic Plus II e escolha **Kula** na Guia Azul / catálogo.
2. Confirme o botão **LADO →/←** de acordo com o lado para o qual Kula está olhando.
3. Com barra suficiente, toque em **DM**. Resultado esperado: **Diamond Edge**, o gelo saindo do chão.
4. Toque em **SDM/MAX**. O macro deve primeiro tentar ativar MAX com **B+C** e executar **Freeze Execution** (`HCB,HCB + AC`).
5. Em condição válida de HSDM/MAX2, toque em **HSDM/MAX2**. Resultado esperado: **Freeze Completion**, sequência `AC · BD · ABC` depois da ativação MAX.
6. Cruze de lado com o adversário, altere **LADO →/←** e repita DM para confirmar o espelhamento.

## Casos de regressão recomendados

- **Ryo SDM/MAX:** `↓↘→ + C, A`.
- **Shermie HSDM/MAX2:** perto `↓↘→ →↓↘ + BD`.
- **Yamazaki HSDM/MAX2:** perto `HCB,HCB + BD`.
- **K9999 HSDM/MAX2:** sequência `→←→←→←→←`, sem forçar pulo.
- **Ángel:** validar as condições de UC Circle / contra-ataque terrestre / contra-ataque aéreo descritas na Guia Azul.

## Controles

Em **LAYOUT**, confirme que DM, SDM/MAX e HSDM/MAX2 podem ser ligados/desligados separadamente, redimensionados e reposicionados. O botão LADO também deve poder ser movido e deve alternar entre `LADO →` e `LADO ←`.

## Observação

Alguns especiais só funcionam em condições específicas do próprio jogo: perto do adversário, no ar, vida baixa, modo MAX, transformação, Hero Mode, Orochi Mode, UC Circle ou como contra-ataque. O botão automatiza a sequência de entrada; ele não remove a condição exigida pelo jogo.
