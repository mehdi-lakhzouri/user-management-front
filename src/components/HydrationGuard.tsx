'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

interface HydrationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Composant qui évite les problèmes d'hydration en attendant que Zustand soit hydraté
 * côté client avant de rendre les composants qui dépendent de l'état d'authentification
 */
export function HydrationGuard({ children, fallback }: HydrationGuardProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated, accessToken } = useAuthStore();

  useEffect(() => {
    // Marquer comme hydraté une fois que le composant est monté côté client
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100); // Petit délai pour s'assurer que Zustand a eu le temps de se hydrater

    return () => clearTimeout(timer);
  }, []);

  // Pendant l'hydration, afficher le fallback
  if (!isHydrated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
