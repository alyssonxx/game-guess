# Game Guess V16 — alterações

## Avatar

- Novo avatar 3D arredondado/chibi inspirado no gênero de party platformers, sem copiar um personagem específico.
- Tipos de corpo masculino e feminino no mesmo sistema modular.
- 10 slots de customização com 70 itens por slot (700 itens no catálogo).
- Slots: cabelo, olhos, cabeça, rosto, parte superior, casaco, mãos, parte inferior, calçados e costas.
- Controles de cor para pele, cabelo, olhos, roupa e detalhe.
- Loja com busca, filtros por categoria, raridade, paginação e preview.
- Migração de IDs do catálogo anterior.
- `avatarOwned` ampliado para até 1000 IDs no Firebase.

## KOF

- Removido o carregamento do pacote customizado `kf2k2mp2web.zip` + RomData.
- O jogo passa a usar o driver reconhecido `kf2k2mp2.zip`.
- Parent configurado por `EJS_gameParentUrl` em `/roms/kof2002.zip`.
- BIOS configurada por `EJS_biosUrl` em `/roms/neogeo.zip`.
- Preflight verifica clone, parent e BIOS antes de abrir o EmulatorJS.
- O botão de treino fica bloqueado quando os arquivos obrigatórios estão ausentes.
- Adicionado manifesto V16 com CRCs para conferência.
- O `kof2002.zip` e o pacote WinKawaks recebidos foram identificados como conjuntos antigos/incompatíveis com o FBNeo atual e não foram usados como parent/BIOS válidos.

## Versão

- Interface e cache-busting atualizados para V16.0.0.
- Documentação principal e setup do KOF atualizados.
