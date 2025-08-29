import api from './api';

export const oauthService = {
  
  async getGoogleAuthUrl() {
    const response = await api.get('/auth/oauth/google/url');
    return response.data;
  },

  
  async connectGoogleToAccount(oauthCode) {
    const response = await api.post('/auth/oauth/google/connect', {
      oauth_code: oauthCode
    });
    return response.data;
  },

  
  async disconnectOAuth() {
    const response = await api.delete('/auth/oauth/disconnect');
    return response.data;
  },

  
  async checkOAuthAvailability() {
    try {
      await api.get('/auth/oauth/google/url');
      return true;
    } catch (error) {
      if (error.response?.status === 503) {
        return false; 
      }
      throw error;
    }
  }
};