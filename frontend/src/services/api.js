import axios from 'axios';

// Configuration de base d'axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  // Inscription
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Connexion
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { access_token, token_type, expires_in } = response.data;
    
    // Stocker le token
    localStorage.setItem('access_token', access_token);
    
    // Récupérer les infos utilisateur
    const userResponse = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(userResponse.data));
    
    return {
      token: access_token,
      user: userResponse.data,
      expires_in
    };
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  // Obtenir l'utilisateur connecté
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Mettre à jour le profil
  updateProfile: async (userData) => {
    const response = await api.put('/auth/me', userData);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Obtenir l'utilisateur depuis le localStorage
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default api;