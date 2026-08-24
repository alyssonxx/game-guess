# Teste manual — V19.10.3

1. Confirme **V19.10.3** no topo do site após o deploy e faça hard refresh/limpeza do cache.
2. Na Guia Azul escolha o mesmo personagem usado dentro da ROM.
3. Teste **DM** parado: o botão não deve ativar MAX antes do golpe.
4. Teste **SDM/MAX**: o botão deve acionar **B+C** e em seguida o comando do personagem.
5. Testes de regressão prioritários: Kula (Diamond Edge / Freeze Execution / Freeze Completion), Ryo SDM, May Lee SDM, Mary SDM, K9999 SDM e Ángel.
6. May Lee SDM deve tentar **D → ABC** depois da ativação MAX.
7. HSDM/MAX2 não deve injetar B+C automaticamente.
8. Personagens com golpe “perto”, aéreo, contra-ataque ou modo/stance continuam exigindo essa condição da ROM.

A validação automatizada desta versão verifica sintaxe, 44 perfis DM, 44 SDM e 44 HSDM, flags de MAX e páginas da command list. A execução real dos 44 golpes precisa ser confirmada dentro do FBNeo/ROM.
