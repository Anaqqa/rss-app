
import React from 'react';

const SearchFilters = ({ 
  filters, 
  onFilterChange, 
  feeds = [], 
  collections = [],
  showCollectionFilter = false 
}) => {
  const clearAllFilters = () => {
    onFilterChange('search', '');
    onFilterChange('feed_id', '');
    onFilterChange('is_read', '');
    onFilterChange('is_favorite', '');
    if (showCollectionFilter) {
      onFilterChange('collection_id', '');
    }
  };

  const hasActiveFilters = filters.search || filters.feed_id || filters.is_read || filters.is_favorite || filters.collection_id;

  return (
    <div className="card mb-4">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="bi bi-funnel me-2"></i>
            Recherche et filtres
          </h6>
          {hasActiveFilters && (
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={clearAllFilters}
              title="Effacer tous les filtres"
            >
              <i className="bi bi-x-circle me-1"></i>
              Effacer
            </button>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {/* Recherche plein texte */}
          <div className={showCollectionFilter ? "col-md-3" : "col-md-4"}>
            <label htmlFor="search" className="form-label">
              <i className="bi bi-search me-1"></i>
              Recherche
            </label>
            <input
              type="text"
              className="form-control"
              id="search"
              placeholder="Titre, contenu, auteur..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>

          {/* Filtre collection (recherche globale uniquement) */}
          {showCollectionFilter && (
            <div className="col-md-3">
              <label htmlFor="collection" className="form-label">
                <i className="bi bi-collection me-1"></i>
                Collection
              </label>
              <select
                className="form-select"
                id="collection"
                value={filters.collection_id}
                onChange={(e) => onFilterChange('collection_id', e.target.value)}
              >
                <option value="">Toutes les collections</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.is_shared ? '🤝' : '🔒'} {collection.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtre flux */}
          <div className={showCollectionFilter ? "col-md-2" : "col-md-3"}>
            <label htmlFor="feed" className="form-label">
              <i className="bi bi-rss me-1"></i>
              Flux
            </label>
            <select
              className="form-select"
              id="feed"
              value={filters.feed_id}
              onChange={(e) => onFilterChange('feed_id', e.target.value)}
            >
              <option value="">Tous les flux</option>
              {feeds.map(feed => (
                <option key={feed.id} value={feed.id}>
                  {feed.title}
                </option>
              ))}
            </select>
          </div>

          {/* Statut lecture */}
          <div className={showCollectionFilter ? "col-md-2" : "col-md-2"}>
            <label htmlFor="read_status" className="form-label">
              <i className="bi bi-eye me-1"></i>
              Lecture
            </label>
            <select
              className="form-select"
              id="read_status"
              value={filters.is_read}
              onChange={(e) => onFilterChange('is_read', e.target.value)}
            >
              <option value="">Tous</option>
              <option value="false">Non lus</option>
              <option value="true">Lus</option>
            </select>
          </div>

          {/* Favoris */}
          <div className={showCollectionFilter ? "col-md-2" : "col-md-3"}>
            <label htmlFor="favorites" className="form-label">
              <i className="bi bi-heart me-1"></i>
              Favoris
            </label>
            <select
              className="form-select"
              id="favorites"
              value={filters.is_favorite}
              onChange={(e) => onFilterChange('is_favorite', e.target.value)}
            >
              <option value="">Tous</option>
              <option value="true">Favoris uniquement</option>
              <option value="false">Non favoris</option>
            </select>
          </div>
        </div>

        {/* Résumé des filtres actifs */}
        {hasActiveFilters && (
          <div className="mt-3">
            <small className="text-muted">
              <strong>Filtres actifs : </strong>
              {filters.search && (
                <span className="badge bg-primary me-1">
                  Recherche: "{filters.search}"
                </span>
              )}
              {filters.collection_id && collections.find(c => c.id === parseInt(filters.collection_id)) && (
                <span className="badge bg-secondary me-1">
                  Collection: {collections.find(c => c.id === parseInt(filters.collection_id)).name}
                </span>
              )}
              {filters.feed_id && feeds.find(f => f.id === parseInt(filters.feed_id)) && (
                <span className="badge bg-info me-1">
                  Flux: {feeds.find(f => f.id === parseInt(filters.feed_id)).title}
                </span>
              )}
              {filters.is_read === 'true' && (
                <span className="badge bg-success me-1">Lus uniquement</span>
              )}
              {filters.is_read === 'false' && (
                <span className="badge bg-warning me-1">Non lus uniquement</span>
              )}
              {filters.is_favorite === 'true' && (
                <span className="badge bg-danger me-1">Favoris uniquement</span>
              )}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;