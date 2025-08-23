import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
      
      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },
      
      setAuth: (user: User, accessToken: string, refreshToken: string) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      
      clearAuth: () => {
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
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
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
