/**
 * GeoGuess Configuration Endpoint
 * Serves Mapillary API token securely from backend
 *
 * Required env var: MAPILLARY_ACCESS_TOKEN
 * Token format: MLY|... (Client Token from Mapillary)
 *
 * Rate limit: 50k calls/month (free tier)
 * Estimated capacity: ~300 concurrent games/day
 */

export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Add CORS and cache headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 hour

  try {
    const token = process.env.MAPILLARY_ACCESS_TOKEN;
    const isProduction = process.env.NODE_ENV === 'production';

    // Validate token exists
    if (!token) {
      console.warn('[GeoGuess] MAPILLARY_ACCESS_TOKEN not configured');
      return res.status(503).json({
        enabled: false,
        token: '',
        error: 'Mapillary token not configured',
        message: 'Add MAPILLARY_ACCESS_TOKEN to Vercel environment variables'
      });
    }

    // Validate token format (should start with MLY|)
    if (!token.startsWith('MLY|')) {
      console.warn('[GeoGuess] Invalid token format (should start with MLY|)');
      return res.status(400).json({
        enabled: false,
        token: '',
        error: 'Invalid token format',
        message: 'Token must be a Mapillary Client Token starting with MLY|'
      });
    }

    // Success: Return token (safe in backend-to-frontend communication)
    return res.status(200).json({
      enabled: true,
      token: token,
      version: '4.1.2',
      endpoint: 'https://graph.mapillary.com/v4',
      cdnJs: 'https://cdn.jsdelivr.net/npm/mapillary-js@4.1.2/dist/mapillary.js',
      cdnCss: 'https://cdn.jsdelivr.net/npm/mapillary-js@4.1.2/dist/mapillary.css',
      limits: {
        requestsPerMonth: 50000,
        estimatedCapacity: '~300 games/day',
        note: 'Monitor quota at https://www.mapillary.com/dashboard/api-keys'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[GeoGuess] Config error:', error);
    return res.status(500).json({
      enabled: false,
      error: 'Internal server error',
      message: 'Failed to load GeoGuess configuration'
    });
  }
}
