# Game Guess V16 — Avatar Party 3D + KOF FBNeo + Quiz Cloud

Esta versão atualiza o sistema de avatar e corrige a arquitetura de carregamento do KOF 2002 Magic Plus II no EmulatorJS/FBNeo.

## Avatar V16

O avatar foi redesenhado em um estilo 3D arredondado/chibi de party game, com identidade própria e peças modulares.

- 2 tipos de corpo: masculino e feminino.
- 10 categorias de customização.
- 70 itens por categoria.
- 700 itens de catálogo gerados no cliente.
- Cores de pele, cabelo, olhos, roupa e detalhes.
- Busca, filtros, paginação, compra e equipamento.
- Preview 3D com rotação e fallback SVG.
- Migração automática dos IDs principais do avatar antigo.
- Limite de inventário do Firebase ampliado para suportar o novo catálogo.

Categorias: cabelo, olhos, cabeça, rosto, parte superior, casaco, mãos, parte inferior, calçados e costas.

## KOF 2002 Magic Plus II

A V16 não usa mais o pacote customizado `kf2k2mp2web.zip`/RomData. O FBNeo precisa reconhecer o nome real do driver.

Estrutura esperada em `roms/`:

```text
roms/
├── kf2k2mp2.zip   # clone Magic Plus II
├── kof2002.zip    # parent compatível com o romset FBNeo
└── neogeo.zip     # BIOS Neo Geo compatível com o romset FBNeo
```

O projeto já inclui `kf2k2mp2.zip` com os três arquivos específicos do clone. O parent e a BIOS enviados anteriormente eram de um conjunto NeoRageX/WinKawaks antigo e não correspondem aos CRCs esperados pelo FBNeo atual, por isso **não foram colocados como se fossem válidos**.

O loader agora:

- usa `EJS_core = 'fbneo'`;
- carrega `kf2k2mp2.zip` como jogo;
- usa `EJS_gameParentUrl = '/roms/kof2002.zip'`;
- usa `EJS_biosUrl = '/roms/neogeo.zip'`;
- faz uma verificação prévia dos três arquivos;
- bloqueia o botão de treino quando parent/BIOS não estão disponíveis;
- exibe uma mensagem clara em vez de deixar o core cair em `Romset is unknown`.

Veja `KOF-SETUP.md` para os CRCs esperados e instruções de validação.

## Firebase

As regras atuais do Realtime Database devem continuar publicadas para login, perfis, inventário, ranking e salas do KOF. O código cliente foi atualizado para aceitar até 1000 IDs em `avatarOwned`.

## Deploy no Vercel

1. Coloque os arquivos compatíveis `kof2002.zip` e `neogeo.zip` em `roms/`.
2. Rode o projeto localmente e confirme que o painel do KOF marca clone, parent e BIOS como disponíveis.
3. Envie a versão para o GitHub.
4. Faça o deploy no Vercel.
5. Confira as variáveis Firebase/TURN do projeto, se utilizadas.

## Aviso sobre ROMs

Use e distribua ROMs/BIOS somente quando você tiver os direitos e permissões necessários. Este repositório não transforma conjuntos antigos/incompatíveis em um romset FBNeo válido.
