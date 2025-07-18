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

// Services pour les collections
export const collectionsService = {
  // Obtenir toutes les collections
  getAll: async () => {
    const response = await api.get('/collections');
    return response.data;
  },

  // Créer une collection
  create: async (collectionData) => {
    const response = await api.post('/collections', collectionData);
    return response.data;
  },

  // Obtenir une collection spécifique
  getById: async (id) => {
    const response = await api.get(`/collections/${id}`);
    return response.data;
  },

  // Mettre à jour une collection
  update: async (id, collectionData) => {
    const response = await api.put(`/collections/${id}`, collectionData);
    return response.data;
  },

  // Supprimer une collection
  delete: async (id) => {
    await api.delete(`/collections/${id}`);
  }
};

// Services pour les flux RSS
export const feedsService = {
  // Obtenir tous les flux d'une collection
  getByCollection: async (collectionId) => {
    const response = await api.get(`/feeds/collection/${collectionId}`);
    return response.data;
  },

  // Créer un flux RSS
  create: async (feedData) => {
    const response = await api.post('/feeds', feedData);
    return response.data;
  },

  // Mettre à jour un flux RSS
  update: async (id, feedData) => {
    const response = await api.put(`/feeds/${id}`, feedData);
    return response.data;
  },

  // Supprimer un flux RSS
  delete: async (id) => {
    await api.delete(`/feeds/${id}`);
  }
};

// Services pour les articles
export const articlesService = {
  // Obtenir les articles d'une collection
  getByCollection: async (collectionId, params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = `/articles/collection/${collectionId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  // Mettre à jour le statut d'un article
  updateStatus: async (articleId, status) => {
    const response = await api.put(`/articles/${articleId}/status`, status);
    return response.data;
  },

  // Actualiser un flux RSS
  refreshFeed: async (feedId) => {
    const response = await api.post(`/articles/refresh-feed/${feedId}`);
    return response.data;
  }
};

export default api;