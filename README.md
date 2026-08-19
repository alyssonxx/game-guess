# Game Guess V10 — Online Arena

Versão ampliada do Game Guess com Games IGDB, Multiverso, Termo Arcade, contas Firebase, ranking global e duelo 1x1 em tempo real.

## Destaques
- 3 vidas somente nas dificuldades **Difícil** e **Insano**.
- Fácil e Normal usam tentativas por rodada, sem corações.
- Perguntas e pistas específicas para cada franquia/universo.
- Registro/login com Firebase Authentication.
- Progresso sincronizado e ranking global.
- Duelo 1x1: Difícil/Insano usam 3 vidas; Fácil/Normal usam 3 tentativas por rodada.
- Dragon Ball, Naruto, Yu-Gi-Oh!, Cavaleiros, Pokémon, Digimon, LoL, desenhos, TV Globinho e Games.
- Termo Arcade sem vidas: **Uma Palavra (6)**, **Dueto (7)** e **Quarteto (9)** tentativas.
- Palavra inexistente no Termo é rejeitada sem gastar tentativa.

## Antes de publicar
Leia **FIREBASE-SETUP.md** e preencha `firebase-config.js`.

O backend IGDB continua usando as variáveis já existentes:
- `IGDB_CLIENT_ID`
- `IGDB_CLIENT_SECRET`

## Atualização via Git

```bash
git add .
git commit -m "Game Guess V10 Termo Multi"
git push origin main
```

## Segurança
O ranking é apropriado para uso casual. Para competição com prêmio ou proteção forte contra adulteração do próprio cliente, valide pontuações/resultados em backend confiável.
