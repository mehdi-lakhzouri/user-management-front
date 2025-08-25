import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Hook qui retourne l'état d'authentification seulement après hydration complète
 * Évite les problèmes de SSR/client mismatch
 */
export function useHydratedAuth() {
  const authState = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Marquer comme hydraté après le premier effet
    setIsHydrated(true);
  }, []);

  // Pendant l'hydration, retourner un état "loading"
  if (!isHydrated) {
    return {
      ...authState,
      isAuthenticated: false,
      isLoading: true,
      isHydrated: false,
    };
  }

  return {
    ...authState,
    isHydrated: true,
  };
}

/**
 * Hook pour vérifier si l'utilisateur est authentifié de manière sûre
 */
export function useIsAuthenticated() {
  const { isAuthenticated, accessToken, refreshToken, isHydrated } = useHydratedAuth();
  
  if (!isHydrated) return false;
  
  return isAuthenticated && (accessToken || refreshToken);
}
