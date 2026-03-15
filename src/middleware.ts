import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  // Simple redirect logic without Supabase middleware for now
  // This prevents build issues during development
  
  const { pathname } = req.nextUrl

  // Redirect root to dashboard
  if (pathname === '/') {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}