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
  },
  
  async updateFeed(id) {
    const response = await api.post(`/feeds/${id}/update`);
    return response.data;
  }  
};

// Services pour les articles
export const articlesService = {
  // NOUVEAU: Méthode améliorée avec tous les filtres
  async getByCollection(collectionId, filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });

    const response = await api.get(`/articles/collection/${collectionId}?${params}`);
    return response.data;
  },

  //Recherche globale
  async searchGlobal(searchTerm, filters = {}) {
    const params = new URLSearchParams({
      search: searchTerm,
      ...filters
    });

    const response = await api.get(`/articles/search?${params}`);
    return response.data;
  },

  // Mettre à jour le statut d'un article
  updateStatus: async (articleId, status) => {
    const response = await api.put(`/articles/${articleId}/status`, status);
    return response.data;
  },

  // Méthodes helper pour lu/favori
  async markAsRead(articleId, isRead = true) {
    return this.updateStatus(articleId, { is_read: isRead });
  },

  async toggleFavorite(articleId, isFavorite) {
    return this.updateStatus(articleId, { is_favorite: isFavorite });
  },

  // Actualiser un flux RSS
  async updateFeed(feedId) { // au lieu de refreshFeed
    const response = await api.post(`/feeds/${feedId}/update`);
    return response.data;
  }
};

// 2.Ajouter après articlesService :
export const statsService = {
  async getDashboardStats() {
    const response = await api.get('/stats/dashboard');
    return response.data;
  },

  async getCollectionStats(collectionId) {
    const response = await api.get(`/stats/collection/${collectionId}`);
    return response.data;
  }
};

export const exportImportService = {
  async exportOPML(collectionIds = null) {
    const params = collectionIds ? `?collection_ids=${collectionIds.join(',')}` : '';
    const response = await api.get(`/export/opml${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportJSON(collectionIds = null) {
    const params = collectionIds ? `?collection_ids=${collectionIds.join(',')}` : '';
    const response = await api.get(`/export/json${params}`);
    return response.data;
  },

  async importOPML(file, collectionId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (collectionId) {
      formData.append('collection_id', collectionId);
    }

    const response = await api.post('/import/opml', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async importJSON(file, collectionId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (collectionId) {
      formData.append('collection_id', collectionId);
    }

    const response = await api.post('/import/json', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default api;