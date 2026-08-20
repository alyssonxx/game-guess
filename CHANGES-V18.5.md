# Game Guess V18.5 — Mapillary loading fix

- Corrige o botão “PREPARANDO MAPILLARY…” que podia ficar preso indefinidamente.
- A busca de cobertura Mapillary passa a ocorrer diretamente no navegador, em lotes paralelos.
- `/api/geoguess` agora retorna apenas sementes de cidades e responde rapidamente no Vercel.
- Adicionados timeouts para configuração, Graph API, carregamento do MapillaryJS e abertura de imagem.
- MapillaryJS usa jsDelivr como CDN principal e unpkg como fallback.
- Caixas de busca foram reduzidas para evitar consultas geográficas excessivamente grandes.
- O botão mostra progresso de locais encontrados durante a preparação.
- Mantidos KOF V18.4, avatar, loja, amigos e demais modos sem alterações funcionais.
