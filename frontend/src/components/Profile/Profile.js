import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleOAuth from '../Auth/GoogleOAuth';
import { oauthService } from '../../services/oauth';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    theme_preference: 'light',
    font_size: 14
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [oauthAvailable, setOauthAvailable] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        theme_preference: user.theme_preference || 'light',
        font_size: user.font_size || 14
      });
    }

    // Vérifier si OAuth est disponible
    const checkOAuth = async () => {
      try {
        const available = await oauthService.checkOAuthAvailability();
        setOauthAvailable(available);
      } catch (error) {
        setOauthAvailable(false);
      }
    };
    
    checkOAuth();
  }, [user]);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectOAuth = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir déconnecter votre compte Google ?')) {
      return;
    }

    try {
      await oauthService.disconnectOAuth();
      setSuccess('Compte Google déconnecté avec succès');
      // Recharger les données utilisateur
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la déconnexion OAuth:', error);
      setError(error.response?.data?.detail || 'Erreur lors de la déconnexion');
    }
  };

  const handleOAuthError = (errorMessage) => {
    setError(errorMessage);
  };

  if (!user) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">⚙️ Mon Profil</h3>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  {success}
                </div>
              )}

              {/* Informations de base */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <h5>Informations du compte</h5>
                  <p><strong>Nom d'utilisateur :</strong> {user.username}</p>
                  <p><strong>Email :</strong> {user.email}</p>
                  <p><strong>Membre depuis :</strong> {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="col-md-6">
                  <h5>Méthode de connexion</h5>
                  {user.oauth_provider ? (
                    <div className="d-flex align-items-center">
                      <span className="badge bg-success me-2">
                        {user.oauth_provider === 'google' ? '🔗 Google' : `🔗 ${user.oauth_provider}`}
                      </span>
                      <span className="text-muted">Compte lié</span>
                    </div>
                  ) : (
                    <span className="badge bg-primary">🔐 Mot de passe</span>
                  )}
                </div>
              </div>

              <hr />

              {/* OAuth Section */}
              {oauthAvailable && (
                <div className="mb-4">
                  <h5>Connexion Google</h5>
                  {user.oauth_provider === 'google' ? (
                    <div className="alert alert-info d-flex justify-content-between align-items-center">
                      <div>
                        <strong>✅ Compte Google connecté</strong>
                        <p className="mb-0 small">Vous pouvez vous connecter avec Google ou votre mot de passe</p>
                      </div>
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleDisconnectOAuth}
                      >
                        Déconnecter
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted">Associez votre compte Google pour une connexion plus rapide</p>
                      <GoogleOAuth 
                        isConnecting={true}
                        onError={handleOAuthError}
                      />
                    </div>
                  )}
                  <hr />
                </div>
              )}

              {/* Formulaire de mise à jour */}
              <form onSubmit={handleSubmit}>
                <h5>Préférences personnelles</h5>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="first_name" className="form-label">Prénom</label>
                    <input
                      type="text"
                      className="form-control"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="last_name" className="form-label">Nom</label>
                    <input
                      type="text"
                      className="form-control"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="theme_preference" className="form-label">Thème</label>
                    <select
                      className="form-select"
                      id="theme_preference"
                      name="theme_preference"
                      value={formData.theme_preference}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="light">🌞 Clair</option>
                      <option value="dark">🌙 Sombre</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="font_size" className="form-label">
                      Taille de police ({formData.font_size}px)
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      id="font_size"
                      name="font_size"
                      min="10"
                      max="24"
                      value={formData.font_size}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">Petit</small>
                      <small className="text-muted">Grand</small>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Mise à jour...
                    </>
                  ) : (
                    'Mettre à jour le profil'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;