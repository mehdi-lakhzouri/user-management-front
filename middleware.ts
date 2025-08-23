import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes qui nécessitent une authentification
const protectedRoutes = ['/dashboard'];

// Routes d'authentification (redirige vers dashboard si déjà connecté)
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Récupérer le token depuis les cookies ou localStorage (côté client)
  const authTokens = request.cookies.get('auth-storage');
  
  // Vérifier si l'utilisateur est authentifié
  let isAuthenticated = false;
  if (authTokens) {
    try {
      const authData = JSON.parse(authTokens.value);
      isAuthenticated = authData.state?.isAuthenticated && authData.state?.accessToken;
    } catch (error) {
      // Token invalide
      isAuthenticated = false;
    }
  }

  // Protéger les routes qui nécessitent une authentification
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rediriger les utilisateurs connectés depuis les pages d'auth
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
