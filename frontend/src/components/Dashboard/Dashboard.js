// frontend/src/components/Dashboard/Dashboard.js - Version avec vraies données
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { statsService } from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await statsService.getDashboardStats();
      setStats(data);
      setRecentArticles(data.recent_articles || []);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
      setError('Erreur lors du chargement du tableau de bord');
      // Fallback avec des données par défaut
      setStats({
        collections: { total: 0, owned: 0, shared: 0 },
        feeds: { total: 0, active: 0, inactive: 0 },
        articles: { total: 0, unread: 0, read: 0, favorites: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* En-tête de bienvenue */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="h2 mb-1">
            👋 Bonjour, {user?.first_name || user?.username} !
          </h1>
          <p className="text-muted">Voici un aperçu de votre activité RSS</p>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="alert alert-warning alert-dismissible">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {/* Cartes de statistiques */}
      <div className="row mb-4">
        {/* Collections */}
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title">Collections</h5>
                  <h3 className="mb-0">{stats?.collections?.total || 0}</h3>
                  <small className="opacity-75">
                    {stats?.collections?.owned || 0} possédées, {stats?.collections?.shared || 0} partagées
                  </small>
                </div>
                <div className="align-self-center">
                  <i className="fs-1">📚</i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flux RSS */}
        <div className="col-md-3 mb-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title">Flux RSS</h5>
                  <h3 className="mb-0">{stats?.feeds?.total || 0}</h3>
                  <small className="opacity-75">
                    {stats?.feeds?.active || 0} actifs, {stats?.feeds?.inactive || 0} inactifs
                  </small>
                </div>
                <div className="align-self-center">
                  <i className="fs-1">📡</i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title">Articles</h5>
                  <h3 className="mb-0">{stats?.articles?.total || 0}</h3>
                  <small className="opacity-75">
                    {stats?.articles?.read || 0} lus, {stats?.articles?.favorites || 0} favoris
                  </small>
                </div>
                <div className="align-self-center">
                  <i className="fs-1">📄</i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Non lus */}
        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title">Non lus</h5>
                  <h3 className="mb-0">{stats?.articles?.unread || 0}</h3>
                  <small className="opacity-75">
                    Articles à découvrir
                  </small>
                </div>
                <div className="align-self-center">
                  <i className="fs-1">🔔</i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Actions rapides */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">🚀 Actions rapides</h5>
            </div>
            <div className="card-body d-flex flex-column">
              <div className="d-grid gap-2">
                <Link to="/collections" className="btn btn-primary">
                  📚 Voir mes collections
                </Link>
                <Link to="/collections" className="btn btn-outline-primary">
                  ➕ Nouvelle collection
                </Link>
                <Link to="/export-import" className="btn btn-outline-info">
                  📥 Importer des flux
                </Link>
                <button 
                  className="btn btn-outline-success"
                  onClick={fetchDashboardData}
                >
                  🔄 Actualiser les données
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Articles récents */}
        <div className="col-lg-8 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📰 Articles récents</h5>
              {recentArticles.length > 0 && (
                <small className="text-muted">
                  {recentArticles.length} article(s) récent(s)
                </small>
              )}
            </div>
            <div className="card-body">
              {recentArticles.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="fs-1">📭</i>
                  <p className="mt-2">Aucun article récent</p>
                  <p className="small">Ajoutez des flux RSS pour voir vos articles ici</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentArticles.map(article => (
                    <div key={article.id} className="list-group-item border-0 px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1 me-3">
                          <h6 className="mb-1">
                            <a 
                              href={article.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                            >
                              {article.title}
                            </a>
                          </h6>
                          <small className="text-muted">
                            📡 {article.feed_title} • {formatDate(article.published_date)}
                          </small>
                        </div>
                        <div className="flex-shrink-0">
                          {article.is_read && (
                            <span className="badge bg-success me-1">Lu</span>
                          )}
                          {article.is_favorite && (
                            <span className="badge bg-warning">★</span>
                          )}
                          {!article.is_read && (
                            <span className="badge bg-primary">Nouveau</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {recentArticles.length > 0 && (
              <div className="card-footer text-center">
                <small className="text-muted">
                  <Link to="/collections" className="text-decoration-none">
                    Voir tous les articles dans vos collections →
                  </Link>
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conseils pour les nouveaux utilisateurs */}
      {stats?.collections?.total === 0 && (
        <div className="row">
          <div className="col">
            <div className="card border-primary">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">🎯 Premiers pas</h5>
              </div>
              <div className="card-body">
                <p className="card-text">
                  Bienvenue dans votre agrégateur RSS ! Pour commencer :
                </p>
                <ol>
                  <li>
                    <Link to="/collections" className="text-decoration-none">
                      Créez votre première collection
                    </Link> pour organiser vos flux
                  </li>
                  <li>Ajoutez des flux RSS de vos sites favoris</li>
                  <li>Utilisez la recherche pour retrouver facilement vos articles</li>
                  <li>
                    <Link to="/export-import" className="text-decoration-none">
                      Importez vos flux existants
                    </Link> depuis un fichier OPML
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;