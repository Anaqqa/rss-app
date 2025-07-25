// frontend/src/components/Collections/CollectionDetail.js - Version complète avec recherche
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collectionsService, feedsService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ArticleSearch from '../Articles/ArticleSearch';

const CollectionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [collection, setCollection] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('articles');

  const [newFeed, setNewFeed] = useState({
    title: '',
    url: '',
    description: '',
    site_url: '',
    update_frequency: 60,
    is_active: true
  });

  useEffect(() => {
    fetchCollectionData();
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
      setError('');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setError('Erreur lors de l\'ajout du flux RSS');
    }
  };

  const handleDeleteFeed = async (feedId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce flux RSS ?')) {
      try {
        await feedsService.delete(feedId);
        setFeeds(feeds.filter(feed => feed.id !== feedId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression du flux RSS');
      }
    }
  };

  const handleUpdateFeed = async (feedId) => {
    try {
      const result = await feedsService.updateFeed(feedId);
      setError('');
      alert(`Flux mis à jour avec succès ! ${result.new_articles_count || 0} nouveaux articles.`);
      // Optionnel: recharger les feeds pour voir les nouvelles données
      fetchCollectionData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError('Erreur lors de la mise à jour du flux RSS');
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
        <div className="alert alert-danger">
          Collection non trouvée ou accès refusé
        </div>
      </div>
    );
  }

  const canManage = collection.owner_id === user?.id;

  return (
    <div className="container mt-4">
      {/* En-tête de la collection */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="h2 mb-1">📚 {collection.name}</h1>
              <p className="text-muted mb-2">{collection.description || 'Aucune description'}</p>
              <div className="d-flex gap-2">
                <span className="badge bg-info">{feeds.length} flux RSS</span>
                {collection.is_shared && <span className="badge bg-success">Collection partagée</span>}
                {canManage && <span className="badge bg-primary">Propriétaire</span>}
              </div>
            </div>
            <div>
              <Link to="/collections" className="btn btn-outline-secondary me-2">
                ← Retour aux collections
              </Link>
              {canManage && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddForm(true)}
                >
                  ➕ Ajouter un flux RSS
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {/* Onglets de navigation */}
      <div className="row mb-4">
        <div className="col">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'articles' ? 'active' : ''}`}
                onClick={() => setActiveTab('articles')}
              >
                📰 Articles et Recherche
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'feeds' ? 'active' : ''}`}
                onClick={() => setActiveTab('feeds')}
              >
                📡 Gestion des flux RSS
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'articles' && (
        <div className="tab-content">
          <ArticleSearch collectionId={parseInt(id)} feeds={feeds} />
        </div>
      )}

      {activeTab === 'feeds' && (
        <div className="tab-content">
          {/* Formulaire d'ajout de flux */}
          {showAddForm && canManage && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">➕ Ajouter un nouveau flux RSS</h5>
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
                          <option value={180}>3 heures</option>
                          <option value={360}>6 heures</option>
                          <option value={720}>12 heures</option>
                          <option value={1440}>24 heures</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Ajouter le flux RSS
                    </button>
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

          {/* Liste des flux RSS */}
          <div className="row">
            {feeds.length === 0 ? (
              <div className="col-12">
                <div className="text-center py-5">
                  <h4 className="text-muted">📭 Aucun flux RSS</h4>
                  <p className="text-muted">
                    {canManage 
                      ? 'Ajoutez votre premier flux RSS pour commencer à agréger des articles'
                      : 'Cette collection ne contient aucun flux RSS pour le moment'
                    }
                  </p>
                  {canManage && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddForm(true)}
                    >
                      ➕ Ajouter un flux RSS
                    </button>
                  )}
                </div>
              </div>
            ) : (
              feeds.map(feed => (
                <div key={feed.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 text-truncate" title={feed.title}>
                        📡 {feed.title}
                      </h6>
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          ⋮
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleUpdateFeed(feed.id)}
                            >
                              🔄 Mettre à jour
                            </button>
                          </li>
                          {feed.site_url && (
                            <li>
                              <a
                                className="dropdown-item"
                                href={feed.site_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                🌐 Visiter le site
                              </a>
                            </li>
                          )}
                          {canManage && (
                            <>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button
                                  className="dropdown-item text-danger"
                                  onClick={() => handleDeleteFeed(feed.id)}
                                >
                                  🗑️ Supprimer
                                </button>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="card-body">
                      {feed.description && (
                        <p className="card-text small text-muted mb-2">
                          {feed.description.length > 100
                            ? `${feed.description.substring(0, 100)}...`
                            : feed.description
                          }
                        </p>
                      )}
                      
                      <div className="mb-2">
                        <span className={`badge ${feed.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {feed.is_active ? 'Actif' : 'Inactif'}
                        </span>
                        <span className="badge bg-info ms-1">
                          {feed.update_frequency >= 60 
                            ? `${feed.update_frequency / 60}h`
                            : `${feed.update_frequency}min`
                          }
                        </span>
                        {feed.last_fetch_status && (
                          <span className={`badge ms-1 ${
                            feed.last_fetch_status === 'success' ? 'bg-success' : 
                            feed.last_fetch_status === 'error' ? 'bg-danger' : 'bg-warning'
                          }`}>
                            {feed.last_fetch_status}
                          </span>
                        )}
                      </div>

                      {feed.last_updated && (
                        <p className="card-text small text-muted">
                          Dernière mise à jour : {new Date(feed.last_updated).toLocaleString('fr-FR')}
                        </p>
                      )}

                      {feed.error_message && (
                        <div className="alert alert-danger small py-1">
                          {feed.error_message}
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <a
                        href={feed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        🔗 Voir le flux RSS
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetail;