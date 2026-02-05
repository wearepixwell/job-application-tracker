import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

// Paths that don't require authentication
const publicPaths = ['/login', '/api/auth/login', '/api/auth/session']

// Paths that require authentication via extension token (Bearer header)
const extensionApiPaths = ['/api/jobs/scan']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check for extension API calls (Bearer token in header)
  if (extensionApiPaths.some(path => pathname.startsWith(path))) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        await jwtVerify(token, JWT_SECRET)
        return NextResponse.next()
      } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    }
  }

  // Check session cookie for dashboard routes
  const sessionToken = request.cookies.get('session')?.value

  if (!sessionToken) {
    // Redirect to login for page requests, return 401 for API requests
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(sessionToken, JWT_SECRET)
    return NextResponse.next()
  } catch {
    // Clear invalid session and redirect
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Session expired' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))

    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
