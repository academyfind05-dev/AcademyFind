import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const FIREBASE_PROJECT_NUMBER = '561439451313'; // From google-services.json
const JWKS_URL = 'https://firebaseappcheck.googleapis.com/v1/jwks';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Verify Firebase App Check for mobile API routes
  if (path.startsWith('/api/mobile/')) {
    const appCheckToken = request.headers.get('X-Firebase-AppCheck');
    
    if (!appCheckToken) {
      // In production, you can make this strict by returning 403
      // For now, allow requests without App Check but log a warning
      console.warn('⚠️ Mobile API request without App Check token:', path);
      // TODO: Uncomment below line when App Check is fully configured
      // return NextResponse.json({ error: 'Unauthorized: Missing App Check token' }, { status: 403 });
    } else {
      try {
        const JWKS = jose.createRemoteJWKSet(new URL(JWKS_URL));
        const { payload } = await jose.jwtVerify(appCheckToken, JWKS, {
          issuer: `https://firebaseappcheck.googleapis.com/${FIREBASE_PROJECT_NUMBER}`,
          audience: [`projects/${FIREBASE_PROJECT_NUMBER}`],
        });
        // Token is valid
      } catch (error) {
        console.error('App Check validation failed', error);
        // Allow through for now, make strict later
        // return NextResponse.json({ error: 'Unauthorized: Invalid App Check token' }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}



