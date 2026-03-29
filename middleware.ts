import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // CSP — allow Mapbox tiles/GL, Open-Meteo API, NOAA APIs, Vercel analytics
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
      "img-src 'self' data: blob: https://api.mapbox.com https://*.mapbox.com",
      "font-src 'self'",
      "connect-src 'self' https://api.mapbox.com https://*.mapbox.com https://api.open-meteo.com https://marine-api.open-meteo.com https://tidesandcurrents.noaa.gov https://api.tidesandcurrents.noaa.gov https://www.ndbc.noaa.gov https://api.weather.gov https://aa.usno.navy.mil https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "worker-src 'self' blob:",
      "child-src blob:",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return response;
}

export const config = {
  // Run on all pages, skip static files and API routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)'],
};
