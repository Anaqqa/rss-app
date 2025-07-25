import api from './api';

export const oauthService = {
  // Obtenir l'URL d'autorisation Google
  async getGoogleAuthUrl() {
    const response = await api.get('/auth/oauth/google/url');
    return response.data;
  },

  // Associer un compte Google à un compte existant
  async connectGoogleToAccount(oauthCode) {
    const response = await api.post('/auth/oauth/google/connect', {
      oauth_code: oauthCode
    });
    return response.data;
  },

  // Déconnecter le compte OAuth
  async disconnectOAuth() {
    const response = await api.delete('/auth/oauth/disconnect');
    return response.data;
  },

  // Vérifier si OAuth est configuré côté serveur
  async checkOAuthAvailability() {
    try {
      await api.get('/auth/oauth/google/url');
      return true;
    } catch (error) {
      if (error.response?.status === 503) {
        return false; // OAuth non configuré
      }
      throw error;
    }
  }
};