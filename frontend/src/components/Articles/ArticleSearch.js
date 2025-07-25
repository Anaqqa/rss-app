// frontend/src/components/Articles/ArticleSearch.js
import React, { useState, useEffect, useCallback } from 'react';
import { articlesService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { debounce } from 'lodash';

const ArticleSearch = ({ collectionId, feeds = [] }) => {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    feed_id: '',
    is_read: '',
    is_favorite: '',
    limit: 20,
    offset: 0
  });

  // Fonction de recherche avec debounce pour éviter trop de requêtes
  const debouncedSearch = useCallback(
    debounce(async (searchFilters) => {
      if (!collectionId) return;
      
      setLoading(true);
      setError('');
      
      try {
        const data = await articlesService.getByCollection(collectionId, searchFilters);
        setArticles(data);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setError('Erreur lors de la recherche d\'articles');
      } finally {
        setLoading(false);
      }
    }, 500),
    [collectionId]
  );

  // Effet pour lancer la recherche quand les filtres changent
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset pagination
    }));
  };

  const handleMarkAsRead = async (articleId, isRead) => {
    try {
      await articlesService.updateStatus(articleId, { is_read: isRead });
      
      // Mettre à jour l'article dans la liste locale
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, is_read: isRead }
          : article
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleToggleFavorite = async (articleId, isFavorite) => {
    try {
      await articlesService.updateStatus(articleId, { is_favorite: isFavorite });
      
      // Mettre à jour l'article dans la liste locale
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, is_favorite: isFavorite }
          : article
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError('Erreur lors de la mise à jour des favoris');
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

  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div className="article-search">
      {/* Barre de recherche et filtres */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">🔍 Recherche et filtres</h5>
        </div>
        <div className="card-body">
          <div className="row">
            {/* Recherche plein texte */}
            <div className="col-md-6 mb-3">
              <label htmlFor="search" className="form-label">Recherche plein texte</label>
              <input
                type="text"
                className="form-control"
                id="search"
                placeholder="Rechercher dans le titre, contenu, auteur..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <div className="form-text">
                Recherche dans le titre, description, contenu et nom de l'auteur
              </div>
            </div>

            {/* Filtre par flux */}
            <div className="col-md-6 mb-3">
              <label htmlFor="feed_filter" className="form-label">Filtrer par source</label>
              <select
                className="form-select"
                id="feed_filter"
                value={filters.feed_id}
                onChange={(e) => handleFilterChange('feed_id', e.target.value)}
              >
                <option value="">Toutes les sources</option>
                {feeds.map(feed => (
                  <option key={feed.id} value={feed.id}>
                    {feed.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par statut de lecture */}
            <div className="col-md-3 mb-3">
              <label htmlFor="read_filter" className="form-label">Statut de lecture</label>
              <select
                className="form-select"
                id="read_filter"
                value={filters.is_read}
                onChange={(e) => handleFilterChange('is_read', e.target.value)}
              >
                <option value="">Tous</option>
                <option value="false">Non lus</option>
                <option value="true">Lus</option>
              </select>
            </div>

            {/* Filtre par favoris */}
            <div className="col-md-3 mb-3">
              <label htmlFor="favorite_filter" className="form-label">Favoris</label>
              <select
                className="form-select"
                id="favorite_filter"
                value={filters.is_favorite}
                onChange={(e) => handleFilterChange('is_favorite', e.target.value)}
              >
                <option value="">Tous</option>
                <option value="true">Favoris uniquement</option>
                <option value="false">Non favoris</option>
              </select>
            </div>
          </div>

          {/* Résumé des filtres actifs */}
          {(filters.search || filters.feed_id || filters.is_read || filters.is_favorite) && (
            <div className="alert alert-info">
              <strong>Filtres actifs :</strong>
              {filters.search && <span className="badge bg-primary me-2">Recherche: "{filters.search}"</span>}
              {filters.feed_id && <span className="badge bg-secondary me-2">Source filtrée</span>}
              {filters.is_read && <span className="badge bg-success me-2">
                {filters.is_read === 'true' ? 'Lus uniquement' : 'Non lus uniquement'}
              </span>}
              {filters.is_favorite === 'true' && <span className="badge bg-warning me-2">Favoris uniquement</span>}
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setFilters({ search: '', feed_id: '', is_read: '', is_favorite: '', limit: 20, offset: 0 })}
              >
                Effacer tous les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages d'état */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Recherche en cours...</span>
          </div>
          <p className="mt-2">Recherche en cours...</p>
        </div>
      )}

      {/* Résultats de recherche */}
      <div className="articles-results">
        {!loading && articles.length === 0 && (
          <div className="text-center py-5">
            <h4 className="text-muted">📭 Aucun article trouvé</h4>
            <p className="text-muted">
              {filters.search || filters.feed_id || filters.is_read || filters.is_favorite
                ? 'Essayez de modifier vos critères de recherche'
                : 'Aucun article dans cette collection'
              }
            </p>
          </div>
        )}

        {articles.map(article => (
          <div key={article.id} className={`card mb-3 ${article.is_read ? 'opacity-75' : ''}`}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="card-title mb-1">
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerm(article.title, filters.search)
                    }}
                  />
                </h5>
                <div className="btn-group">
                  <button
                    className={`btn btn-sm ${article.is_read ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => handleMarkAsRead(article.id, !article.is_read)}
                    title={article.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                  >
                    {article.is_read ? '✓' : '○'}
                  </button>
                  <button
                    className={`btn btn-sm ${article.is_favorite ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => handleToggleFavorite(article.id, !article.is_favorite)}
                    title={article.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    {article.is_favorite ? '★' : '☆'}
                  </button>
                </div>
              </div>

              {article.description && (
                <p 
                  className="card-text"
                  dangerouslySetInnerHTML={{
                    __html: highlightSearchTerm(
                      article.description.length > 200 
                        ? article.description.substring(0, 200) + '...'
                        : article.description,
                      filters.search
                    )
                  }}
                />
              )}

              <div className="d-flex justify-content-between align-items-center text-muted small">
                <div>
                  {article.author && (
                    <span 
                      dangerouslySetInnerHTML={{
                        __html: `Par ${highlightSearchTerm(article.author, filters.search)} • `
                      }}
                    />
                  )}
                  <span>{formatDate(article.published_date)}</span>
                </div>
                <div>
                  {article.is_read && <span className="badge bg-success me-1">Lu</span>}
                  {article.is_favorite && <span className="badge bg-warning">Favori</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination simple */}
      {articles.length === filters.limit && (
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-primary"
            onClick={() => handleFilterChange('offset', filters.offset + filters.limit)}
          >
            Charger plus d'articles
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticleSearch;