/**
 * GeoGuess Configuration & Images Endpoint
 * Handles both config and image queries for GeoGuess
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    // Route: /api/geoguess-config - returns token config
    if (!req.url.includes('?') || req.url === '/api/geoguess-config') {
      // O token é público para o Viewer, mas não deve continuar em cache depois de uma rotação.
      res.setHeader('Cache-Control', 'no-store');
      const token = process.env.MAPILLARY_ACCESS_TOKEN;
      const isProduction = process.env.NODE_ENV === 'production';

      if (!token) {
        console.warn('[GeoGuess] MAPILLARY_ACCESS_TOKEN not configured');
        return res.status(503).json({
          enabled: false,
          token: '',
          error: 'Mapillary token not configured',
          message: 'Add MAPILLARY_ACCESS_TOKEN to Vercel environment variables'
        });
      }

      if (!token.startsWith('MLY|')) {
        console.warn('[GeoGuess] Invalid token format (should start with MLY|)');
        return res.status(400).json({
          enabled: false,
          token: '',
          error: 'Invalid token format',
          message: 'Token must be a Mapillary Client Token starting with MLY|'
        });
      }

      return res.status(200).json({
        enabled: true,
        token: token,
        version: '4.1.2',
        endpoint: 'https://graph.mapillary.com',
        cdnJs: 'https://cdn.jsdelivr.net/npm/mapillary-js@4.1.2/dist/mapillary.js',
        cdnCss: 'https://cdn.jsdelivr.net/npm/mapillary-js@4.1.2/dist/mapillary.css',
        limits: {
          note: 'Consulte a cota do seu aplicativo no painel do Mapillary.'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Route: /api/geoguess-config?lat=X&lng=Y - returns images for location
    if (req.query.lat && req.query.lng) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache 5 min

      const { lat, lng } = req.query;
      const token = process.env.MAPILLARY_ACCESS_TOKEN;

      if (!token) {
        return res.status(503).json({ error: 'Mapillary token not configured' });
      }

      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) {
        return res.status(400).json({
          error: 'Coordenadas inválidas',
          message: 'Latitude deve estar entre -90 e 90; longitude, entre -180 e 180.'
        });
      }
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
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
    }

    return res.status(400).json({ error: 'Invalid parameters' });

  } catch (error) {
    console.error('[GeoGuess Config] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Erro ao processar requisição'
    });
  }
}
