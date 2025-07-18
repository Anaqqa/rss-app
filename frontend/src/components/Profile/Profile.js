import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    theme_preference: user?.theme_preference || 'light',
    font_size: user?.font_size || 14
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    setMessage('');
    setError('');

    try {
      await updateProfile(formData);
      setMessage('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">👤 Mon Profil</h4>
            </div>
            <div className="card-body">
              {message && (
                <div className="alert alert-success" role="alert">
                  {message}
                </div>
              )}

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Informations de base (non modifiables) */}
              <div className="mb-4">
                <h5>Informations de base</h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Nom d'utilisateur</label>
                      <input
                        type="text"
                        className="form-control"
                        value={user?.username || ''}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Formulaire modifiable */}
              <form onSubmit={handleSubmit}>
                <h5>Informations personnelles</h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="first_name" className="form-label">
                        Prénom
                      </label>
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
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="last_name" className="form-label">
                        Nom
                      </label>
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
                </div>

                <h5 className="mt-4">Préférences</h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="theme_preference" className="form-label">
                        Thème
                      </label>
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
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="font_size" className="form-label">
                        Taille de police: {formData.font_size}px
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
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sauvegarde...
                      </>
                    ) : (
                      'Sauvegarder'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Statistiques du compte */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">📊 Statistiques du compte</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3">
                  <h6>Membre depuis</h6>
                  <p className="text-muted">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
                <div className="col-md-3">
                  <h6>Statut</h6>
                  <span className={`badge ${user?.is_active ? 'bg-success' : 'bg-danger'}`}>
                    {user?.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="col-md-3">
                  <h6>Authentification</h6>
                  <p className="text-muted">
                    {user?.oauth_provider ? `OAuth ${user.oauth_provider}` : 'Standard'}
                  </p>
                </div>
                <div className="col-md-3">
                  <h6>ID Utilisateur</h6>
                  <p className="text-muted">#{user?.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;