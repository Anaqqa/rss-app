
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import GoogleOAuth from './GoogleOAuth';
import { oauthService } from '../../services/oauth';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [oauthAvailable, setOauthAvailable] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  
  useEffect(() => {
    const checkOAuth = async () => {
      try {
        const available = await oauthService.checkOAuthAvailability();
        setOauthAvailable(available);
      } catch (error) {
        console.log('OAuth non disponible:', error);
        setOauthAvailable(false);
      }
    };
    
    checkOAuth();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      
      setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      setError(
        error.response?.data?.detail || 
        'Erreur lors de la création du compte. Essayez à nouveau.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h2 className="h4 mb-1">📰 Créer un compte</h2>
                  <p className="text-muted">Rejoignez RSS Aggregator</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                {/* OAuth Google - Affiché seulement si disponible */}
                {oauthAvailable && (
                  <div className="mb-4">
                    <GoogleOAuth 
                      onError={handleOAuthError}
                    />
                    
                    <div className="position-relative my-4">
                      <hr />
                      <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">
                        ou créez un compte manuel
                      </span>
                    </div>
                  </div>
                )}

                {/* Formulaire d'inscription */}
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
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
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
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
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      Nom d'utilisateur *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Choisissez un nom d'utilisateur"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="votre.email@exemple.com"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label">
                        Mot de passe *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        minLength={8}
                        placeholder="Au moins 8 caractères"
                      />
                      <div className="form-text">
                        Au moins 8 caractères
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirmer le mot de passe *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="Répétez votre mot de passe"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Création...
                      </>
                    ) : (
                      'Créer mon compte'
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="mb-0">
                    Déjà un compte ?{' '}
                    <Link to="/login" className="text-primary text-decoration-none">
                      Se connecter
                    </Link>
                  </p>
                </div>

                {/* Information sur OAuth si non disponible */}
                {!oauthAvailable && (
                  <div className="mt-3">
                    <small className="text-muted d-block text-center">
                      💡 La connexion Google sera disponible une fois configurée
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;