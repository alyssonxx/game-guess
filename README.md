# Game Guess V6 — Multiverso

Versão completa para Vercel. Mantém todos os modos de games/IGDB e o Multiverso da V5, acrescentando:

- 🐉 Dragon Ball: Clássico, Z, GT e Super.
- 🃏 Yu-Gi-Oh!: Clássico/Duel Monsters e GX.
- 🍥 Naruto: Clássico e Shippuden.
- 🔤 Termo Arcade ∞: palavras de 5 letras, 6 tentativas e rodadas ilimitadas.

## Deploy

1. Substitua os arquivos do projeto atual por esta pasta.
2. Mantenha `IGDB_CLIENT_ID` e `IGDB_CLIENT_SECRET` nas Environment Variables da Vercel.
3. Rode:

```bash
git add .
git commit -m "Game Guess V6 Multiverso"
git push origin main
```

A Vercel fará o novo deploy automaticamente. Nenhuma chave adicional é necessária para os universos novos ou para o Termo Arcade.

## Imagens

As imagens de personagens continuam passando por `/api/asset`. Para Dragon Ball, Yu-Gi-Oh! e Naruto, o servidor tenta Wikipedia e, como alternativa, as wikis Fandom correspondentes.

## Termo Arcade

O modo usa uma lista local de soluções PT-BR e aceita qualquer tentativa de exatamente cinco letras. Acentos são ignorados na comparação. O tabuleiro informa: posição correta, letra presente em outra posição ou letra ausente. Ao terminar, uma nova palavra pode ser sorteada imediatamente.
