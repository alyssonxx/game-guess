# Game Guess V18.2 — Mapillary reliability fix

- Corrige o erro genérico “0 de 5 locais navegáveis”.
- Erros de autenticação/READ do Mapillary não são mais escondidos como ausência de cobertura.
- Busca progressiva em raios de 4 km, 12 km e 30 km.
- Mais cidades candidatas por rodada.
- Fallback no navegador: se a consulta server-side do Vercel vier vazia, o Client Token tenta a Graph API diretamente.
- Mantém prioridade para imagens esféricas/360° e sequências navegáveis.
- Cache do geoguess.js atualizado para 18.2.0.
