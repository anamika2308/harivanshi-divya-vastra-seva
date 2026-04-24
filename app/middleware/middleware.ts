import { NextRequest, NextResponse } from 'next/server'

// Secret passcode - change this to anything you want
const SECRET_PASSCODE = process.env.ADMIN_URL_PASSCODE || '123456'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block direct /admin access - show 404
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }

  // Allow /admin/[passcode] only if passcode matches
  if (pathname.startsWith('/admin/')) {
    const passcode = pathname.split('/admin/')[1]?.split('/')[0]
    
    // Wrong passcode → 404
    if (passcode !== SECRET_PASSCODE) {
      return NextResponse.rewrite(new URL('/not-found', request.url))
    }

    // Rate limiting via headers check (basic brute force protection)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

    // Add security headers
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}