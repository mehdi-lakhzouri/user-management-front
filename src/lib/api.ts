import axios, { AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Configuration de l'instance Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types pour les réponses API
export interface ApiResponse<T = any> {
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
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
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
        
      } catch (refreshError: any) {
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
  fullname: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  email: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
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

// Services API
export const authService = {
  async registerWithAvatar(data: FormData): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register-with-avatar', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Register with avatar response:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else {
        return response.data as unknown as AuthResponse;
      }
    } catch (error: any) {
      console.error('Erreur dans registerWithAvatar:', error);
      if (error.response) {
        console.error('Statut:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      // Vérifier si la réponse a une structure { data: ... } ou directement les données
      if (response.data.data) {
        return response.data.data;
      } else {
        return response.data as unknown as AuthResponse;
      }
    } catch (error) {
      console.error('Erreur login:', error);
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

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('Service register appelé avec:', data);
    console.log('URL de base:', api.defaults.baseURL);
    
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
      console.log('Réponse complète du serveur:', response);
      console.log('Réponse data du serveur:', response.data);
      
      // Vérifier si la réponse a une structure { data: ... } ou directement les données
      if (response.data.data) {
        console.log('Structure avec data wrapper:', response.data.data);
        return response.data.data;
      } else {
        console.log('Structure directe:', response.data);
        return response.data as unknown as AuthResponse;
      }
    } catch (error: any) {
      console.error('Erreur dans authService.register:', error);
      console.error('URL complète:', `${api.defaults.baseURL}/auth/register`);
      if (error.response) {
        console.error('Statut:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
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
    } catch (error: any) {
      console.error('Erreur lors du logout:', error);
      // Ne pas throw l'erreur pour permettre la déconnexion côté client
    }
  },

  async logoutAll(): Promise<void> {
    try {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        await api.post('/auth/logout-all', { refreshToken });
      }
    } catch (error: any) {
      console.error('Erreur lors du logout-all:', error);
    }
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data.data;
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

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    try {
      console.log('Sending reset password request with token:', token);
      const response = await api.post('/auth/reset-password', { token, password });
      console.log('Reset password response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Reset password error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  async requestOtp(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/request-otp', { email });
      console.log('Request OTP response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Request OTP error:', error);
      throw error;
    }
  },

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/verify-otp', { email, otp });
      console.log('Verify OTP response:', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else {
        return response.data as unknown as AuthResponse;
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  },
};

export const userService = {
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>('/users/profile');
      console.log('Profile response:', response.data);
      
      // Avec l'intercepteur backend, la réponse est toujours { data: ... }
      return response.data.data;
    } catch (error: any) {
      console.error('Erreur dans getProfile:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<ApiResponse<User>>('/users/profile', data);
    return response.data.data;
  },

  async getAllUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data;
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/users/${userId}`, data);
    return response.data.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post<ApiResponse<{ avatarUrl: string; message: string }>>('/users/avatar', formData, {
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
