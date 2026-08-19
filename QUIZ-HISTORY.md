# Quiz V14 — histórico persistente e deduplicação

## Caminho no Firebase

`quizHistory/{uid}/seen/{dedupeKey}: timestamp`

## Fluxo

1. Ao iniciar o Quiz, o cliente lê os hashes locais.
2. Se houver conta autenticada, lê também o histórico Firebase.
3. Junta os dois conjuntos e envia os hashes ao `/api/quiz`.
4. O backend elimina candidatos já vistos.
5. As perguntas entregues são imediatamente marcadas no histórico local + Firebase.
6. Na Arena, cada participante marca as perguntas quando elas aparecem.

A consulta trabalha com até **50.000 hashes recentes/ativos**, o que mantém o payload controlado e torna a repetição extremamente improvável em uso normal.

## Fontes

O motor usa API externa, banco local e geradores combinatórios. Em falha externa, os geradores continuam funcionando.
