import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 2. LIVE MONITORING: Log clean traffic to your Vercel runtime logs
  // if (!path.includes('.') && !path.startsWith('/_next')) {
  //   console.log(`\n--- [${request.method}] Request to: ${path} ---`);
  //   request.headers.forEach((value, key) => {
  //     console.log(`[Header] ${key}: ${value}`);
  //   });
  //   console.log(`---------------------------------------------------\n`);
  // }

  return NextResponse.next();
}


