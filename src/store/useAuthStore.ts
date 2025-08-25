import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastTokenRefresh: number | null;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
  setError: (error: string | null) => void;
  setTokenRefreshed: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  lastTokenRefresh: null,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setUser: (user: User) => {
        console.log('[AUTH STORE] setUser', user.fullname);
        set({ user, isAuthenticated: true, error: null });
      },
      
      setTokens: (accessToken: string, refreshToken: string) => {
        console.log('[AUTH STORE] setTokens');
        set({ 
          accessToken, 
          refreshToken,
          lastTokenRefresh: Date.now(),
          error: null 
        });
      },
      
      setAuth: (user: User, accessToken: string, refreshToken: string) => {
        console.log('[AUTH STORE] setAuth', user.fullname);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          lastTokenRefresh: Date.now(),
          error: null,
        });
      },
      
      clearAuth: () => {
        console.log('[AUTH STORE] clearAuth');
        set({
          ...initialState,
          isLoading: false,
        });
      },
      
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
      
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          console.log('[AUTH STORE] updateUser', userData);
          set({ user: { ...currentUser, ...userData } });
        }
      },
      
      setError: (error: string | null) => {
        console.log('[AUTH STORE] setError', error);
        set({ error });
      },
      
      setTokenRefreshed: () => {
        console.log('[AUTH STORE] setTokenRefreshed');
        set({ lastTokenRefresh: Date.now(), error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        lastTokenRefresh: state.lastTokenRefresh,
      }),
      skipHydration: false, // S'assurer que l'hydration se fait bien
    }
  )
);

// Hook pour vérifier les permissions selon le rôle
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);
  
  return {
    isAdmin: user?.role === 'ADMIN',
    isModerator: user?.role === 'MODERATOR' || user?.role === 'ADMIN',
    canManageUsers: user?.role === 'ADMIN' || user?.role === 'MODERATOR',
    canViewProfile: !!user,
  };
};
