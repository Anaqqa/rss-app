// frontend/src/components/Auth/OAuthCallback.js - Version corrigée
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth(); // On garde le contexte pour la cohérence
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        switch (errorParam) {
          case 'oauth_denied':
            setError('Connexion annulée. Vous avez refusé l\'autorisation.');
            break;
          case 'oauth_error':
            setError('Erreur lors de la connexion OAuth. Veuillez réessayer.');
            break;
          default:
            setError('Erreur de connexion inconnue.');
        }
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (token) {
        try {
          // CORRECTION: Directement stocker le token et récupérer l'utilisateur
          localStorage.setItem('access_token', token);
          
          // Récupérer les infos utilisateur avec le token
          const { authService } = await import('../../services/api');
          const user = await authService.getCurrentUser();
          
          // Stocker les infos utilisateur
          localStorage.setItem('user', JSON.stringify(user));
          
          // CORRECTION: Forcer le rechargement du contexte d'authentification
          // Au lieu d'appeler login(), on déclenche un rechargement complet
          setStatus('success');
          
          setTimeout(() => {
            // Forcer le rechargement de la page pour que AuthContext se mette à jour
            window.location.href = '/dashboard';
          }, 1500);
          
        } catch (error) {
          console.error('Erreur lors de la finalisation OAuth:', error);
          setStatus('error');
          setError('Erreur lors de la finalisation de la connexion.');
          
          // Nettoyer en cas d'erreur
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        setStatus('error');
        setError('Token manquant dans la réponse OAuth.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body text-center p-5">
          {status === 'processing' && (
            <>
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Chargement...</span>
              </div>
              <h4 className="mb-2">Finalisation de la connexion</h4>
              <p className="text-muted">Authentification avec Google...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-success mb-3" style={{ fontSize: '3rem' }}>
                ✓
              </div>
              <h4 className="mb-2 text-success">Connexion réussie !</h4>
              <p className="text-muted">Redirection vers le tableau de bord...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>
                ✗
              </div>
              <h4 className="mb-2 text-danger">Erreur de connexion</h4>
              <p className="text-muted">{error}</p>
              <p className="small text-muted">Redirection vers la page de connexion...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;