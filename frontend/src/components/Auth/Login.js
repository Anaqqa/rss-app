
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import GoogleOAuth from './GoogleOAuth';
import { oauthService } from '../../services/oauth';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthAvailable, setOauthAvailable] = useState(false);

  const { login } = useAuth();
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

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError(
        error.response?.data?.detail || 
        'Erreur de connexion. Vérifiez vos identifiants.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h2 className="h4 mb-1">📰 RSS Aggregator</h2>
                  <p className="text-muted">Connectez-vous à votre compte</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
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
                        ou
                      </span>
                    </div>
                  </div>
                )}

                {/* Formulaire de connexion classique */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      Nom d'utilisateur
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
                      placeholder="Entrez votre nom d'utilisateur"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Mot de passe
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
                      placeholder="Entrez votre mot de passe"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Connexion...
                      </>
                    ) : (
                      'Se connecter'
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="mb-0">
                    Pas de compte ?{' '}
                    <Link to="/register" className="text-primary text-decoration-none">
                      Créer un compte
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

export default Login;