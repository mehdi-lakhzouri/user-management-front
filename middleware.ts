import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes qui nécessitent une authentification
const protectedRoutes = ['/dashboard'];

// Routes d'authentification (redirige vers dashboard si déjà connecté)
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware pour les ressources statiques et API
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') || 
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Récupérer le token depuis les cookies
  const authTokens = request.cookies.get('auth-storage');
  
  // Vérifier si l'utilisateur est authentifié
  let isAuthenticated = false;
  let hasValidTokens = false;
  
  if (authTokens) {
    try {
      const authData = JSON.parse(authTokens.value);
      isAuthenticated = authData.state?.isAuthenticated === true;
      hasValidTokens = !!(authData.state?.accessToken && authData.state?.refreshToken);
      
      // Vérifier l'expiration du token si possible
      if (hasValidTokens && authData.state?.accessToken) {
        try {
          const tokenPayload = JSON.parse(atob(authData.state.accessToken.split('.')[1]));
          const isExpired = tokenPayload.exp * 1000 < Date.now();
          // Si le token est expiré mais qu'on a un refresh token, considérer comme authentifié
          isAuthenticated = isAuthenticated && (!isExpired || !!authData.state?.refreshToken);
        } catch {
          // Si on ne peut pas décoder le token, faire confiance au flag isAuthenticated
        }
      }
    } catch (error) {
      console.warn('Erreur lors du parsing des tokens:', error);
      isAuthenticated = false;
      hasValidTokens = false;
    }
  }

  // Protéger les routes qui nécessitent une authentification
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated || !hasValidTokens) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rediriger les utilisateurs connectés depuis les pages d'auth
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated && hasValidTokens) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
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
