
import React, { useState, useEffect } from 'react';
import ArticleCard from './ArticleCard';
import { articlesService } from '../../services/api';

const ArticleList = ({ 
  collectionId, 
  filters = {},
  searchTerm = '',
  onArticleUpdate 
}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchArticles(true); 
  }, [collectionId, filters, searchTerm]);

  const fetchArticles = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentOffset = reset ? 0 : offset;
      const allFilters = {
        ...filters,
        search: searchTerm,
        limit: 50,
        offset: currentOffset
      };

      const newArticles = await articlesService.getByCollection(collectionId, allFilters);
      
      if (reset) {
        setArticles(newArticles);
        setOffset(50);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
        setOffset(prev => prev + 50);
      }
      
      setHasMore(newArticles.length === 50);
    } catch (err) {
      console.error('Erreur lors du chargement des articles:', err);
      setError('Erreur lors du chargement des articles');
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
      if (onArticleUpdate) onArticleUpdate();
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
      if (onArticleUpdate) onArticleUpdate();
    } catch (error) {
      console.error('Erreur lors du changement de favoris:', error);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchArticles(false);
    }
  };

  if (loading && articles.length === 0) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-bordeaux" role="status">
          <span className="visually-hidden">Chargement...</span>
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
          onClick={() => fetchArticles(true)}
        >
          🔄 Réessayer
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="mb-3">
          <i className="fs-1">📭</i>
        </div>
        <h5 className="text-muted">Aucun article trouvé</h5>
        <p className="text-muted">
          {searchTerm ? 
            `Aucun résultat pour "${searchTerm}"` : 
            'Cette collection ne contient pas encore d\'articles'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="article-list">
      {/* En-tête avec compteur */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h6 className="text-muted mb-0">
            📄 {articles.length} article{articles.length > 1 ? 's' : ''}
            {searchTerm && ` pour "${searchTerm}"`}
          </h6>
        </div>
        
        <div className="d-flex gap-2">
          {/* Actions rapides */}
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => fetchArticles(true)}
            disabled={loading}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Liste des articles */}
      <div className="articles-container">
        {articles.map(article => (
          <ArticleCard
            key={article.id}
            article={article}
            onToggleRead={handleToggleRead}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {/* Bouton charger plus */}
      {hasMore && (
        <div className="text-center mt-4">
          <button 
            className="btn btn-outline-primary"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Chargement...
              </>
            ) : (
              <>📄 Charger plus d'articles</>
            )}
          </button>
        </div>
      )}

      {/* Indicateur fin de liste */}
      {!hasMore && articles.length > 0 && (
        <div className="text-center mt-4 py-3">
          <small className="text-muted">
            ✨ Vous avez vu tous les articles de cette collection
          </small>
        </div>
      )}
    </div>
  );
};

export default ArticleList;