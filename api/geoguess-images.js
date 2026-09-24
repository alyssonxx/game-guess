/**
 * GeoGuess Images Endpoint
 * Busca imagens de rua do Mapillary para uma localização
 * Server-side proxy para evitar CORS e rate limiting
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache 5 min
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Missing lat or lng parameters' });
    }

    const token = process.env.MAPILLARY_ACCESS_TOKEN;
    if (!token) {
      return res.status(503).json({ error: 'Mapillary token not configured' });
    }

    // Bbox pequeno para aumentar chances de encontrar imagens
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const latPad = Math.min(0.045, Math.max(0.012, 0.04));
    const lngPad = Math.min(0.045, Math.max(0.012, 0.04));

    const bbox = [
      lngNum - lngPad,
      latNum - latPad,
      lngNum + lngPad,
      latNum + latPad
    ].map(n => Number(n.toFixed(6))).join(',');

    const url = new URL('https://graph.mapillary.com/images');
    url.searchParams.set('access_token', token);
    url.searchParams.set('bbox', bbox);
    url.searchParams.set('limit', '100');
    url.searchParams.set('fields', 'id,computed_geometry,geometry,computed_compass_angle,compass_angle,camera_type,sequence,captured_at');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundo timeout

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[GeoGuess Images] Mapillary HTTP ${response.status}:`, errorData);

        if (response.status === 401 || response.status === 403) {
          return res.status(401).json({
            error: 'Token inválido',
            message: 'O Client Token do Mapillary é inválido ou não tem permissões suficientes',
            status: response.status
          });
        }

        return res.status(response.status).json({
          error: errorData?.error?.message || `Mapillary HTTP ${response.status}`,
          message: 'Falha ao consultar imagens do Mapillary'
        });
      }

      const data = await response.json();
      const images = Array.isArray(data.data) ? data.data : [];

      if (images.length === 0) {
        return res.status(200).json({
          data: [],
          message: 'Nenhuma imagem encontrada nesta localização',
          coverage: false
        });
      }

      return res.status(200).json({
        data: images,
        count: images.length,
        coverage: true,
        bbox
      });

    } catch (fetchError) {
      clearTimeout(timeout);

      if (fetchError.name === 'AbortError') {
        console.error('[GeoGuess Images] Request timeout');
        return res.status(408).json({
          error: 'Timeout',
          message: 'O Mapillary demorou demais para responder. Tente novamente.'
        });
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('[GeoGuess Images] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Erro ao buscar imagens'
    });
  }
}
