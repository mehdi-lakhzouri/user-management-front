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

// Intercepteur pour gérer les erreurs et le refresh des tokens
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
        
        if (!refreshToken) {
          clearAuth();
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Tentative de refresh du token
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/refresh`,
          { refreshToken }
        );
        
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Mise à jour des tokens
        setTokens(newAccessToken, newRefreshToken);
        
        // Retry de la requête originale avec le nouveau token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // Si le refresh échoue, déconnecter l'utilisateur
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
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

// Services API
export const authService = {
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

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },
};

export const userService = {
  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/users/profile');
    return response.data.data;
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
};
