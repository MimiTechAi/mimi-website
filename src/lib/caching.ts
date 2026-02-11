import { headers } from 'next/headers';

export async function getCachingHeaders() {
  const headers_list = headers();
  
  return {
    // Static assets - 1 year caching
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': '"v1"',
    'Vary': 'Accept-Encoding',
    
    // CORS headers for external resources
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export function setResponseCache(response: Response, maxAge: number = 3600) {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}`);
  response.headers.set('Vary', 'Accept-Encoding');
  return response;
}

// CDN Configuration
export const cdnConfig = {
  domains: ['slelguoygbfzlpylpxfs.supabase.co'],
  unoptimized: false,
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
};
