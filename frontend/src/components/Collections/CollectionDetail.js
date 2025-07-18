import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collectionsService, feedsService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { articlesService } from '../../services/api';


const CollectionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [collection, setCollection] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [newFeed, setNewFeed] = useState({
    title: '',
    url: '',
    description: '',
    site_url: '',
    update_frequency: 60,
    is_active: true
  });
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [filters, setFilters] = useState({
    limit: 20,
    offset: 0,
    feed_id: '',
    is_read: '',
    search: ''
  });

  useEffect(() => {
    fetchCollectionData();
    fetchArticles();
  }, [id]);

  const fetchCollectionData = async () => {
    try {
      setLoading(true);
      const [collectionData, feedsData] = await Promise.all([
        collectionsService.getById(id),
        feedsService.getByCollection(id)
      ]);
      setCollection(collectionData);
      setFeeds(feedsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoadingArticles(true);
      const articlesData = await articlesService.getByCollection(id, filters);
      setArticles(articlesData);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
      setError('Erreur lors du chargement des articles');
    } finally {
      setLoadingArticles(false);
    }
  };

  const handleAddFeed = async (e) => {
    e.preventDefault();
    try {
      const feedData = { ...newFeed, collection_id: parseInt(id) };
      const created = await feedsService.create(feedData);
      setFeeds([...feeds, created]);
      setNewFeed({
        title: '',
        url: '',
        description: '',
        site_url: '',
        update_frequency: 60,
        is_active: true
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setError('Erreur lors de l\'ajout du flux RSS');
    }
  };

  const handleDeleteFeed = async (feedId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce flux RSS ?')) {
      try {
        await feedsService.delete(feedId);
        setFeeds(feeds.filter(f => f.id !== feedId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression');
      }
    }
  };

  const handleRefreshFeed = async (feedId) => {
  try {
    await articlesService.refreshFeed(feedId);
    // Recharger les articles après quelques secondes
    setTimeout(() => {
      fetchArticles();
    }, 3000);
  } catch (error) {
    console.error('Erreur lors de l\'actualisation:', error);
    setError('Erreur lors de l\'actualisation du flux');
  }
};

const handleToggleRead = async (articleId, isRead) => {
  try {
    await articlesService.updateStatus(articleId, { is_read: !isRead });
    // Mettre à jour l'article dans la liste
    setArticles(articles.map(article => 
      article.id === articleId 
        ? { ...article, is_read: !isRead }
        : article
    ));
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
  }
};

const handleToggleFavorite = async (articleId, isFavorite) => {
  try {
    await articlesService.updateStatus(articleId, { is_favorite: !isFavorite });
    setArticles(articles.map(article => 
      article.id === articleId 
        ? { ...article, is_favorite: !isFavorite }
        : article
    ));
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
  }
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

  if (!collection) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Collection non trouvée</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* En-tête de la collection */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/collections">Collections</Link>
              </li>
              <li className="breadcrumb-item active">{collection.name}</li>
            </ol>
          </nav>
          <h1>📚 {collection.name}</h1>
          {collection.description && (
            <p className="text-muted">{collection.description}</p>
          )}
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          📡 Ajouter un flux RSS
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Formulaire d'ajout de flux */}
      {showAddForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Ajouter un flux RSS</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddFeed}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Titre *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      value={newFeed.title}
                      onChange={(e) => setNewFeed({...newFeed, title: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="url" className="form-label">URL du flux RSS *</label>
                    <input
                      type="url"
                      className="form-control"
                      id="url"
                      value={newFeed.url}
                      onChange={(e) => setNewFeed({...newFeed, url: e.target.value})}
                      required
                      placeholder="https://example.com/rss.xml"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  rows="2"
                  value={newFeed.description}
                  onChange={(e) => setNewFeed({...newFeed, description: e.target.value})}
                />
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="site_url" className="form-label">URL du site web</label>
                    <input
                      type="url"
                      className="form-control"
                      id="site_url"
                      value={newFeed.site_url}
                      onChange={(e) => setNewFeed({...newFeed, site_url: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="update_frequency" className="form-label">
                      Fréquence de mise à jour (minutes)
                    </label>
                    <select
                      className="form-select"
                      id="update_frequency"
                      value={newFeed.update_frequency}
                      onChange={(e) => setNewFeed({...newFeed, update_frequency: parseInt(e.target.value)})}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 heure</option>
                      <option value={360}>6 heures</option>
                      <option value={720}>12 heures</option>
                      <option value={1440}>24 heures</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">Ajouter</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section flux RSS avec bouton refresh */}
<div className="card mb-4">
  <div className="card-header">
    <h5>📡 Flux RSS ({feeds.length})</h5>
  </div>
  <div className="card-body">
    {feeds.length === 0 ? (
      <div className="text-center py-4">
        <h6 className="text-muted">Aucun flux RSS</h6>
        <p className="text-muted">Ajoutez votre premier flux RSS pour commencer</p>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          📡 Ajouter un flux RSS
        </button>
      </div>
    ) : (
      <div className="row">
        {feeds.map((feed) => (
          <div key={feed.id} className="col-md-6 col-lg-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="card-title">{feed.title}</h6>
                  <span className={`badge ${
                    feed.last_fetch_status === 'success' ? 'bg-success' :
                    feed.last_fetch_status === 'error' ? 'bg-danger' : 'bg-warning'
                  }`}>
                    {feed.last_fetch_status}
                  </span>
                </div>
                
                <p className="card-text small text-muted">
                  {feed.description || 'Aucune description'}
                </p>
                
                <div className="small text-muted mb-2">
                  <div>🔗 <a href={feed.url} target="_blank" rel="noopener noreferrer">
                    Flux RSS
                  </a></div>
                  {feed.site_url && (
                    <div>🌐 <a href={feed.site_url} target="_blank" rel="noopener noreferrer">
                      Site web
                    </a></div>
                  )}
                  <div>⏱️ Mise à jour toutes les {feed.update_frequency} min</div>
                </div>
                
                <div className="d-flex justify-content-between align-items-center">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleRefreshFeed(feed.id)}
                  >
                    🔄 Actualiser
                  </button>
                  
                  {(collection.owner_id === user?.id || feed.added_by_user_id === user?.id) && (
                    <div className="btn-group">
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {/* TODO: Edit */}}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteFeed(feed.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

{/* Section articles */}
<div className="card">
  <div className="card-header d-flex justify-content-between align-items-center">
    <h5>📰 Articles ({articles.length})</h5>
    <button 
      className="btn btn-outline-primary btn-sm"
      onClick={fetchArticles}
      disabled={loadingArticles}
    >
      {loadingArticles ? '🔄' : '🔄'} Actualiser
    </button>
  </div>
  <div className="card-body">
    {(() => {
      if (loadingArticles) {
        return (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Chargement des articles...</span>
            </div>
          </div>
        );
      }
      if (articles.length === 0) {
        return (
          <div className="text-center py-4">
            <h6 className="text-muted">📭 Aucun article</h6>
            <p className="text-muted">Les articles apparaîtront ici après actualisation des flux RSS</p>
          </div>
        );
      }
      return (
        <div className="row">
          {articles.map((article) => (
            <div key={article.id} className="col-12 mb-3">
              <div className={`card ${article.is_read ? 'opacity-75' : ''}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="card-title">
                        <a 
                          href={article.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                        >
                          {article.title}
                        </a>
                      </h6>
                      
                      {article.description && (
                        <p className="card-text text-muted small">
                          {article.description.length > 200 
                            ? article.description.substring(0, 200) + '...'
                            : article.description
                          }
                        </p>
                      )}
                      
                      <div className="small text-muted">
                        {article.author && <span>👤 {article.author} • </span>}
                        📅 {article.published_date 
                          ? new Date(article.published_date).toLocaleDateString('fr-FR')
                          : new Date(article.fetched_at).toLocaleDateString('fr-FR')
                        }
                      </div>
                    </div>
                    
                    <div className="ms-3">
                      <div className="btn-group-vertical">
                        <button
                          className={`btn btn-sm ${article.is_read ? 'btn-success' : 'btn-outline-secondary'}`}
                          onClick={() => handleToggleRead(article.id, article.is_read)}
                          title={article.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                        >
                          {article.is_read ? '✓' : '○'}
                        </button>
                        <button
                          className={`btn btn-sm ${article.is_favorite ? 'btn-warning' : 'btn-outline-warning'}`}
                          onClick={() => handleToggleFavorite(article.id, article.is_favorite)}
                          title={article.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        >
                          {article.is_favorite ? '⭐' : '☆'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    })()}
  </div>
</div>
      
    
    </div>
  );
};

export default CollectionDetail;