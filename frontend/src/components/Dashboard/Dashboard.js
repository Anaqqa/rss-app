
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collectionsService, articlesService, commentService } from '../../services/api';
import ArticleComments from '../Comments/ArticleComments';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({
    collections: { total: 0, shared: 0, personal: 0 },
    feeds: { total: 0, active: 0 },
    articles: { total: 0, favorites: 0, unread: 0 }
  });
  const [error, setError] = useState(null);
  
  
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const collections = await collectionsService.getAll();
      
      const personalCollections = collections.filter(col => !col.is_shared);
      const sharedCollections = collections.filter(col => col.is_shared);
      
      setStats({
        collections: { 
          total: collections.length,
          personal: personalCollections.length,
          shared: sharedCollections.length
        },
        feeds: { total: 0, active: 0 },
        articles: { total: 0, favorites: 0, unread: 0 }
      });

      
      try {
        let recentArticles = [];
        
        
        for (const collection of collections) {
          try {
            const collectionArticles = await articlesService.getByCollection(collection.id, { 
              limit: 5,
              offset: 0 
            });
            
            const articlesWithCollection = collectionArticles.map(article => ({
              ...article,
              collection: collection
            }));
            recentArticles = [...recentArticles, ...articlesWithCollection];
          } catch (err) {
            console.log(`Pas d'articles pour la collection ${collection.name}`);
          }
        }
        
        
        recentArticles.sort((a, b) => new Date(b.published_date) - new Date(a.published_date));
        setArticles(recentArticles.slice(0, 10));
        
      } catch (err) {
        console.log('Aucun article trouvé, affichage des collections');
        setArticles([]);
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRead = async (articleId) => {
    try {
      await articlesService.toggleRead(articleId);
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId 
            ? { ...article, is_read: !article.is_read }
            : article
        )
      );
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const handleToggleFavorite = async (articleId) => {
    try {
      await articlesService.toggleFavorite(articleId);
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId 
            ? { ...article, is_favorite: !article.is_favorite }
            : article
        )
      );
    } catch (error) {
      console.error('Erreur lors du changement de favoris:', error);
    }
  };

  
  const handleCommentClick = (article) => {
    
    if (!article.collection?.is_shared) {
      alert('Les commentaires ne sont disponibles que sur les collections partagées');
      return;
    }
    
    setSelectedArticle(article);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedArticle(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Il y a quelques minutes";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-bordeaux mb-3" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="text-muted">Chargement des derniers articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h6>❌ Erreur</h6>
        {error}
        <button 
          className="btn btn-sm btn-outline-danger mt-2"
          onClick={fetchDashboardData}
        >
          🔄 Réessayer
        </button>
      </div>
    );
  }

  
  if (showComments && selectedArticle) {
    return (
      <div>
        {/* En-tête avec bouton retour */}
        <div className="d-flex align-items-center mb-4">
          <button 
            className="btn btn-outline-secondary me-3"
            onClick={handleCloseComments}
          >
            ← Retour au Dashboard
          </button>
          <div>
            <h2 className="h4 mb-1">💭 Commentaires</h2>
            <p className="text-muted mb-0">Article : {selectedArticle.title}</p>
          </div>
        </div>

        {/* Composant commentaires */}
        <ArticleComments 
          articleId={selectedArticle.id}
          collectionId={selectedArticle.collection.id}
          articleTitle={selectedArticle.title}
        />
      </div>
    );
  }

  return (
    <>
      {/* En-tête du feed */}
      <div className="feed-header">
        <h1 className="feed-title">📰 Derniers Articles</h1>
        <p className="feed-description">
          Les dernières actualités de toutes vos collections RSS
        </p>
      </div>

      {/* Articles récents */}
      {articles.length > 0 ? (
        articles.map(article => (
          <div key={article.id} className="article-card">
            <div className="article-content">
              <div className="article-meta">
                <span className="source-name">{article.feed?.title || 'Source inconnue'}</span>
                <span>•</span>
                <span>{formatDate(article.published_date)}</span>
                <span>•</span>
                <span>5 min de lecture</span>
                {/* Badge collection partagée */}
                {article.collection?.is_shared && (
                  <>
                    <span>•</span>
                    <span className="badge bg-info ms-1">👥 {article.collection.name}</span>
                  </>
                )}
              </div>
              
              <h2 className="article-title">
                <a href={article.link} target="_blank" rel="noopener noreferrer">
                  {article.title}
                </a>
              </h2>
              
              <p className="article-excerpt">
                {article.description ? 
                  (article.description.length > 150 ? 
                    article.description.substring(0, 150) + '...' : 
                    article.description
                  ) : 
                  'Aucun extrait disponible...'
                }
              </p>
              
              <div className="article-actions">
                <button 
                  className={`action-btn ${article.is_read ? 'active' : ''}`}
                  onClick={() => handleToggleRead(article.id)}
                >
                  👁️ {article.is_read ? 'Lu' : 'Non lu'}
                </button>
                
                <button 
                  className={`action-btn ${article.is_favorite ? 'active' : ''}`}
                  onClick={() => handleToggleFavorite(article.id)}
                >
                  ⭐ {article.is_favorite ? 'Favoris' : 'Ajouter favoris'}
                </button>
                
                {/* BOUTON COMMENTER  */}
                <button 
                  className={`action-btn ${article.collection?.is_shared ? '' : 'disabled'}`}
                  onClick={() => handleCommentClick(article)}
                  disabled={!article.collection?.is_shared}
                  title={
                    article.collection?.is_shared 
                      ? 'Commenter cet article' 
                      : 'Commentaires disponibles uniquement sur les collections partagées'
                  }
                >
                  💬 Commenter
                </button>
              </div>
            </div>
            
            {article.image_url && (
              <img 
                src={article.image_url} 
                alt={article.title}
                className="article-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
          </div>
        ))
      ) : (
        <>
          {/* Message si pas d'articles */}
          <div className="article-card">
            <div className="article-content">
              <div className="article-meta">
                <span className="source-name">Bienvenue</span>
                <span>•</span>
                <span>Guide de démarrage</span>
              </div>
              <h2 className="article-title">
                Aucun article pour le moment
              </h2>
              <p className="article-excerpt">
                {stats.collections.total === 0 ? 
                  'Créez votre première collection et ajoutez des flux RSS pour commencer à recevoir des articles.' :
                  'Vos collections sont créées ! Ajoutez maintenant des flux RSS pour commencer à recevoir des articles.'
                }
              </p>
              <div className="article-actions">
                {stats.collections.total === 0 ? (
                  <Link to="/collections" className="action-btn">
                    📚 Créer une collection
                  </Link>
                ) : (
                  <Link to="/collections" className="action-btn">
                    📡 Ajouter des flux RSS
                  </Link>
                )}
              </div>
            </div>
            <div className="article-image" style={{ 
              background: 'linear-gradient(135deg, #1a7f37 0%, #155d27 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: 'white'
            }}>
              📊
            </div>
          </div>
        </>
      )}

      {/* Bouton pour charger plus d'articles */}
      {articles.length > 0 && (
        <div className="text-center mt-4">
          <button 
            className="btn btn-outline-primary"
            onClick={fetchDashboardData}
          >
            🔄 Actualiser les articles
          </button>
        </div>
      )}
    </>
  );
};

export default Dashboard;