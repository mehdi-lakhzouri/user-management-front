import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export const useTokenMonitor = () => {
  const { accessToken, refreshToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !isAuthenticated) return;

    try {
      // Décoder le token JWT pour obtenir l'expiration
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = tokenPayload.exp * 1000; // Convertir en millisecondes
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      console.log('🔑 Token Monitor:', {
        currentTime: new Date(currentTime).toLocaleString(),
        expirationTime: new Date(expirationTime).toLocaleString(),
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60), // en minutes
        hasRefreshToken: !!refreshToken,
      });

      // Avertir 5 minutes avant l'expiration
      if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
        console.warn('⚠️ Token va expirer dans moins de 5 minutes');
      }

      // Avertir si le token est déjà expiré
      if (timeUntilExpiry <= 0) {
        console.error('❌ Token déjà expiré !');
      }

    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
    }
  }, [accessToken, refreshToken, isAuthenticated]);

  return {
    isAuthenticated,
    hasValidToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
  };
};
