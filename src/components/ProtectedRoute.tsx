'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'MODERATOR' | 'ADMIN';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, accessToken, refreshToken } = useAuthStore();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Debug logs améliorés
  useEffect(() => {
    console.log('[DEBUG] ProtectedRoute', { 
      isAuthenticated, 
      user: user?.fullname || null, 
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      isHydrated,
      isChecking
    });
  }, [isAuthenticated, user, accessToken, refreshToken, isHydrated, isChecking]);

  // Marquer comme hydraté après le premier rendu côté client
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100); // Petit délai pour s'assurer de l'hydration complette

    return () => clearTimeout(timer);
  }, []);

  // Vérifier l'authentification après hydration
  useEffect(() => {
    if (!isHydrated) return;

    const checkAuth = async () => {
      // Vérifier si on a au moins un token valide
      const hasValidAuth = isAuthenticated && (accessToken || refreshToken);
      
      if (!hasValidAuth) {
        console.log('[DEBUG] ProtectedRoute - Redirection vers login');
        const currentPath = window.location.pathname;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Vérifier les rôles si nécessaire
      if (requiredRole && user) {
        const roleHierarchy = { USER: 0, MODERATOR: 1, ADMIN: 2 };
        const userLevel = roleHierarchy[user.role];
        const requiredLevel = roleHierarchy[requiredRole];
        
        if (userLevel < requiredLevel) {
          console.log('[DEBUG] ProtectedRoute - Rôle insuffisant, redirection vers dashboard');
          router.push('/dashboard');
          return;
        }
      }
      
      console.log('[DEBUG] ProtectedRoute - Accès autorisé');
      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, accessToken, refreshToken, user, requiredRole, router, isHydrated]);

  // Afficher le loader pendant l'hydration et la vérification
  if (!isHydrated || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            {!isHydrated ? 'Initialisation...' : 'Vérification...'}
          </p>
        </div>
      </div>
    );
  }

  // Vérification finale avant de rendre le contenu
  const hasValidAuth = isAuthenticated && (accessToken || refreshToken);
  if (!hasValidAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
