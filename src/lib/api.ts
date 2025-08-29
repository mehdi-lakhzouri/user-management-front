import axios, { AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Configuration de l'instance Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types pour les réponses API
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable pour éviter les requêtes de refresh simultanées
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Intercepteur pour gérer les erreurs et le refresh des tokens
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Si on est déjà en train de rafraîchir, attendre
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
        
        if (!refreshToken) {
          console.warn('Pas de refresh token disponible');
          clearAuth();
          processQueue(error, null);
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
        
        console.log('Tentative de refresh du token...');
        
        // Utiliser une nouvelle instance axios pour éviter l'intercepteur
        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log('Réponse refresh:', refreshResponse.data);
        
        // Gestion flexible de la structure de réponse
        let newAccessToken: string;
        let newRefreshToken: string;
        
        if (refreshResponse.data.data) {
          // Structure avec wrapper
          newAccessToken = refreshResponse.data.data.accessToken;
          newRefreshToken = refreshResponse.data.data.refreshToken;
        } else {
          // Structure directe
          newAccessToken = refreshResponse.data.accessToken;
          newRefreshToken = refreshResponse.data.refreshToken;
        }
        
        if (!newAccessToken) {
          throw new Error('Access token manquant dans la réponse');
        }
        
        // Mise à jour des tokens
        setTokens(newAccessToken, newRefreshToken);
        useAuthStore.getState().setTokenRefreshed();
        processQueue(null, newAccessToken);
        
        // Retry de la requête originale avec le nouveau token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        console.log('Token refreshé avec succès, retry de la requête originale');
        return api(originalRequest);
        
      } catch (refreshError: unknown) {
        console.error('Erreur lors du refresh:', refreshError);
        processQueue(refreshError, null);
        
        // Si le refresh échoue, déconnecter l'utilisateur
        useAuthStore.getState().clearAuth();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Fonction utilitaire pour mapper les données utilisateur du backend vers le frontend
const mapUserData = (userData: Record<string, unknown>): User => ({
  id: userData._id as string,
  fullname: userData.fullname as string,
  age: userData.age as number,
  gender: userData.gender as 'male' | 'female' | 'other',
  email: userData.email as string,
  role: userData.role as 'USER' | 'MODERATOR' | 'ADMIN',
  isActive: userData.isActive as boolean,
  avatar: userData.avatar as string | undefined,
  createdAt: userData.createdAt as string,
  updatedAt: userData.updatedAt as string,
});

// Fonction utilitaire pour mapper les données d'authentification
const mapAuthResponse = (authData: Record<string, unknown>): AuthResponse => ({
  user: mapUserData(authData.user as Record<string, unknown>),
  accessToken: authData.accessToken as string,
  refreshToken: authData.refreshToken as string,
});

// Types pour l'authentification
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullname: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  email: string;
  password: string;
}

export interface User {
  id: string;
  _id?: string; // Pour la compatibilité avec le backend MongoDB
  fullname: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  email: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  avatar?: string;
  mustChangePassword?: boolean; // Nouveau champ pour indiquer si l'utilisateur doit changer son mot de passe
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  fullname: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  password?: string; 
}

// Nouveau type pour la réponse de création d'utilisateur
export interface CreateUserResponse {
  message: string;
  user: User;
  temporaryPassword?: string; 
  emailSent?: boolean; 
}

// Type pour le changement de mot de passe
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Type pour la réponse du changement de mot de passe
export interface ChangePasswordResponse {
  message: string;
  requiresRelogin: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresPasswordChange?: boolean; // Nouveau champ pour indiquer si l'utilisateur doit changer son mot de passe
}

// Nouveaux types pour le système 2FA
export interface CredentialsValidationResponse {
  sessionToken: string;
  expiresIn: string;
}

export interface SessionData {
  sessionToken: string;
  email: string;
  expiresAt: number;
}

// Types pour la pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Services API
export const authService = {
  // Méthode unifiée pour l'inscription (avec ou sans avatar)
  async registerUnified(data: RegisterData | FormData): Promise<AuthResponse> {
    try {
      let endpoint = '/auth/register';
      let config = {};
      
      // Déterminer si c'est FormData (avec avatar) ou JSON (sans avatar)
      if (data instanceof FormData) {
        endpoint = '/auth/register-with-avatar';
        config = {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
        console.log('Register unified: utilisation endpoint avec avatar');
      } else {
        console.log('Register unified: utilisation endpoint standard');
      }
      
      const response = await api.post<ApiResponse<AuthResponse>>(endpoint, data, config);
      console.log('Register unified response:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else {
        return response.data as unknown as AuthResponse;
      }
    } catch (error: unknown) {
      console.error('Erreur dans registerUnified:', error);
      // Pour les erreurs Axios, on peut extraire plus d'infos
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('Statut:', axiosError.response?.status);
        console.error('Data:', axiosError.response?.data);
      }
      throw error;
    }
  },



  // Nouvelle méthode pour le système 2FA - Étape 1: Validation des identifiants
  async validateCredentials(credentials: LoginCredentials): Promise<CredentialsValidationResponse> {
    try {
      const response = await api.post<ApiResponse<CredentialsValidationResponse>>('/auth/login-with-otp', credentials);
      console.log('Credentials validation response:', response.data);
      
      if (response.data.data) {
        // Stocker la session temporaire
        const sessionData: SessionData = {
          sessionToken: response.data.data.sessionToken,
          email: credentials.email,
          expiresAt: Date.now() + (10 * 60 * 1000) // Session 10 minutes (mais OTP expire en 4 min)
        };
        this.setSessionData(sessionData);
        
        return response.data.data;
      } else {
        return response.data as unknown as CredentialsValidationResponse;
      }
    } catch (error) {
      console.error('Erreur validation credentials:', error);
      throw error;
    }
  },

  // Nouvelle méthode pour le système 2FA - Étape 2: Validation OTP et connexion
  async verifyOtpAndLogin(email: string, otp: string, sessionToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/verify-otp-complete-login', {
        email,
        otp,
        sessionToken
      });
      console.log('OTP verification and login response:', response.data);
      
      // Nettoyer la session temporaire après succès
      this.clearSessionData();
      
      if (response.data.data) {
        return response.data.data;
      } else {
        return response.data as unknown as AuthResponse;
      }
    } catch (error) {
      console.error('Erreur vérification OTP et login:', error);
      throw error;
    }
  },

  // Gestion de la session temporaire
  setSessionData(sessionData: SessionData): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('temp_session_data', JSON.stringify(sessionData));
    }
  },

  getSessionData(): SessionData | null {
    if (typeof window !== 'undefined') {
      const data = sessionStorage.getItem('temp_session_data');
      if (data) {
        const sessionData: SessionData = JSON.parse(data);
        // Vérifier si la session n'est pas expirée
        if (sessionData.expiresAt > Date.now()) {
          return sessionData;
        } else {
          this.clearSessionData();
        }
      }
    }
    return null;
  },

  clearSessionData(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('temp_session_data');
    }
  },

  // Vérifier si une session temporaire est active
  hasActiveSession(): boolean {
    return this.getSessionData() !== null;
  },

  async logout(): Promise<void> {
    try {
      const { refreshToken } = useAuthStore.getState();
      console.log('Logout avec refreshToken:', refreshToken);
      
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      } else {
        console.warn('Pas de refreshToken disponible pour logout');
        // Continuer quand même la déconnexion côté client
      }
    } catch (error: unknown) {
      console.error('Erreur lors du logout:', error);
      // Ne pas throw l'erreur pour permettre la déconnexion côté client
    }
  },

  // Nouvelle méthode pour le changement de mot de passe
  async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
    try {
      const response = await api.post<ApiResponse<ChangePasswordResponse>>('/auth/change-password', data);
      console.log('Change password response:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else {
        return response.data as unknown as ChangePasswordResponse;
      }
    } catch (error: unknown) {
      console.error('Erreur changement mot de passe:', error);
      throw error;
    }
  },





  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },



  async verifyEmail(email: string, otp: string): Promise<{ message: string; success: boolean }> {
    try {
      const response = await api.post('/auth/verify-email', { email, otp });
      return response.data;
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    try {
      console.log('Sending reset password request with token:', token);
      const response = await api.post('/auth/reset-password', { token, password });
      console.log('Reset password response:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      // Pour les erreurs Axios, extraire plus d'infos
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('Error response:', axiosError.response?.data);
      }
      throw error;
    }
  },


};

export const userService = {
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<Record<string, unknown>>>('/users/profile');
      console.log('Profile response:', response.data);
      
      // Utiliser la fonction mapUserData pour transformer les données
      const userData = response.data.data as Record<string, unknown>;
      const user = mapUserData(userData);
      
      console.log('Mapped user profile:', user);
      return user;
    } catch (error: unknown) {
      console.error('Erreur dans getProfile:', error);
        
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('Response data:', axiosError.response?.data);
      }
      throw error;
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<ApiResponse<User>>('/users/profile', data);
    return response.data.data;
  },

  async updateProfileWithFormData(formData: FormData): Promise<User> {
    try {
      const response = await api.patch<ApiResponse<User>>('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Update profile with FormData response:', response.data);
      
      // Transformer _id en id pour correspondre à l'interface frontend
      const userData = response.data.data;
      const user: User = {
        id: userData._id || userData.id,
        fullname: userData.fullname,
        age: userData.age,
        gender: userData.gender,
        email: userData.email,
        role: userData.role,
        isActive: userData.isActive,
        avatar: userData.avatar,
        mustChangePassword: userData.mustChangePassword,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };
      
      return user;
    } catch (error: unknown) {
      console.error('Erreur dans updateProfileWithFormData:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('Response data:', axiosError.response?.data);
      }
      throw error;
    }
  },

  async getAllUsers(params: PaginationParams = {}): Promise<PaginatedUsersResponse> {
    try {
      console.log('[getAllUsers] Début de la requête avec params:', params);
      
      // Construire les paramètres de requête
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.role && params.role !== 'all') queryParams.append('role', params.role);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      
      const queryString = queryParams.toString();
      const url = `/users${queryString ? `?${queryString}` : ''}`;
      
      console.log('[getAllUsers] URL finale:', url);
      
      const response = await api.get<ApiResponse<{ users: Record<string, unknown>[], total: number, page: number, limit: number, totalPages?: number }>>(url);
      console.log('[getAllUsers] Réponse brute:', response);
      console.log('[getAllUsers] response.data:', response.data);
      console.log('[getAllUsers] response.data.data:', response.data.data);
      
      // Le backend retourne { data: { users: [...], total: 4, page: 1, limit: 10 } }
      // Utiliser mapUserData pour transformer chaque utilisateur
      const users = response.data.data.users.map(user => mapUserData(user));
      
      const result = {
        users,
        total: response.data.data.total,
        page: response.data.data.page,
        limit: response.data.data.limit,
        totalPages: response.data.data.totalPages || Math.ceil(response.data.data.total / response.data.data.limit)
      };
      
      console.log('[getAllUsers] Utilisateurs mappés:', users);
      console.log('[getAllUsers] Résultat final:', result);
      return result;
    } catch (error: unknown) {
      console.error('[getAllUsers] Erreur:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('[getAllUsers] Erreur response:', axiosError.response);
        console.error('[getAllUsers] Erreur response data:', axiosError.response?.data);
      }
      throw error;
    }
  },

  async createUser(data: CreateUserData): Promise<CreateUserResponse> {
    try {
      console.log('Création utilisateur avec data:', data);
      const response = await api.post<ApiResponse<CreateUserResponse>>('/users', data);
      console.log('Réponse création utilisateur:', response.data);
      
      // Retourner la réponse complète qui contient message, user, temporaryPassword, etc.
      if (response.data.data) {
        return response.data.data;
      } else {
        // Fallback pour l'ancien format si nécessaire
        const userData = response.data as unknown as Record<string, unknown>;
        return {
          message: (userData.message as string) || 'Utilisateur créé avec succès',
          user: {
            id: (userData._id as string) || (userData.id as string),
            fullname: userData.fullname as string,
            age: userData.age as number,
            gender: userData.gender as 'male' | 'female' | 'other',
            email: userData.email as string,
            role: userData.role as 'USER' | 'MODERATOR' | 'ADMIN',
            isActive: userData.isActive as boolean,
            avatar: userData.avatar as string | undefined,
            mustChangePassword: userData.mustChangePassword as boolean,
            createdAt: userData.createdAt as string,
            updatedAt: userData.updatedAt as string,
          },
          temporaryPassword: userData.temporaryPassword as string | undefined,
          emailSent: userData.emailSent as boolean,
        };
      }
    } catch (error: unknown) {
      console.error('Erreur dans createUser:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
      }
      throw error;
    }
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/users/${userId}`, data);
    return response.data.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },

  // API unifiée pour upload d'avatar
  async uploadAvatarUnified(file: File, userId?: string): Promise<{ avatarUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // Si userId est fourni, utiliser l'endpoint spécifique, sinon l'endpoint général
    const endpoint = userId ? `/users/${userId}/avatar` : '/users/avatar';
    
    const response = await api.post<ApiResponse<{ avatarUrl: string; message: string }>>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async deleteAvatar(): Promise<void> {
    await api.delete('/users/avatar');
  },
};
