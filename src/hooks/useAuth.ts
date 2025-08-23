import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { userService } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Hook pour vérifier et valider l'authentification au chargement de l'app
 */
export function useAuthCheck() {
  const { isAuthenticated, accessToken, setUser, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated && accessToken) {
        try {
          // Vérifier si le token est toujours valide en récupérant le profil
          const user = await userService.getProfile();
          setUser(user);
        } catch (error) {
          // Si la récupération du profil échoue, déconnecter l'utilisateur
          clearAuth();
          toast.error('Session expirée', {
            description: 'Veuillez vous reconnecter',
          });
          router.push('/login');
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, accessToken, setUser, clearAuth, router]);
}

/**
 * Hook pour gérer la redirection automatique des utilisateurs connectés
 */
export function useAuthRedirect() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated };
}

/**
 * Hook pour protéger une route (rediriger vers login si non authentifié)
 */
export function useRequireAuth() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated, user };
}

/**
 * Hook pour vérifier les permissions selon le rôle
 */
export function usePermissions() {
  const { user } = useAuthStore();

  const hasRole = (requiredRole: 'USER' | 'MODERATOR' | 'ADMIN') => {
    if (!user) return false;
    
    const roleHierarchy = { USER: 0, MODERATOR: 1, ADMIN: 2 };
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  };

  return {
    isAdmin: user?.role === 'ADMIN',
    isModerator: user?.role === 'MODERATOR' || user?.role === 'ADMIN',
    canManageUsers: user?.role === 'ADMIN' || user?.role === 'MODERATOR',
    canViewProfile: !!user,
    hasRole,
  };
}
