import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collectionsService, feedsService, articlesService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import CollectionMembers from './CollectionMembers'; // NOUVEAU IMPORT

const CollectionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [collection, setCollection] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [articles, setArticles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleComments, setArticleComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('articles');
  const [showAddFeedForm, setShowAddFeedForm] = useState(false);
  
  // États pour la messagerie
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // États pour les commentaires
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    feed_id: '',
    is_read: '',
    is_favorite: ''
  });

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

  useEffect(() => {
    if (collection && activeTab === 'articles') {
      fetchArticles();
    } else if (collection && activeTab === 'messaging' && collection.is_shared) {
      fetchMessages();
    }
  }, [collection, filters, activeTab]);

  useEffect(() => {
    if (selectedArticle && activeTab === 'comments') {
      fetchArticleComments();
    }
  }, [selectedArticle, activeTab]);

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
      setError('Erreur lors du chargement de la collection');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const params = {
        ...filters,
        limit: 20
      };
      const articlesData = await articlesService.getByCollection(id, params);
      setArticles(articlesData);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
      setError('Erreur lors du chargement des articles');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:8000/messages/collection/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse()); // Inverser pour afficher chronologiquement
      } else {
        console.error('Erreur lors du chargement des messages');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const fetchArticleComments = async () => {
    if (!selectedArticle) return;
    
    try {
      const response = await fetch(`http://localhost:8000/comments/article/${selectedArticle.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setArticleComments(data);
      } else {
        console.error('Erreur lors du chargement des commentaires');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      const response = await fetch('http://localhost:8000/messages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          collection_id: parseInt(id),
          content: newMessage.trim()
        })
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
      } else {
        setError('Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || sendingComment || !selectedArticle) return;

    try {
      setSendingComment(true);
      
      const response = await fetch('http://localhost:8000/comments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          article_id: selectedArticle.id,
          collection_id: parseInt(id),
          content: newComment.trim()
        })
      });

      if (response.ok) {
        const newCommentObj = await response.json();
        setArticleComments(prev => [newCommentObj, ...prev]);
        setNewComment('');
      } else {
        setError('Erreur lors de l\'ajout du commentaire');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      setError('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Supprimer ce message ?')) return;

    try {
      const response = await fetch(`http://localhost:8000/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setActiveTab('comments');
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
      setShowAddFeedForm(false);
      setError('');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setError(error.response?.data?.detail || 'Erreur lors de l\'ajout du flux RSS');
    }
  };

  const handleUpdateFeed = async (feedId) => {
    try {
      const result = await feedsService.updateFeed(feedId);
      setError('');
      alert(`Flux mis à jour ! ${result.new_articles_count || 0} nouveaux articles.`);
      fetchCollectionData();
      if (activeTab === 'articles') {
        fetchArticles();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError('Erreur lors de la mise à jour du flux RSS');
    }
  };

  const handleMarkAsRead = async (articleId, isRead) => {
    try {
      await articlesService.markAsRead(articleId, isRead);
      setArticles(prev => prev.map(article => 
        article.id === articleId ? { ...article, is_read: isRead } : article
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleToggleFavorite = async (articleId, isFavorite) => {
    try {
      await articlesService.toggleFavorite(articleId, isFavorite);
      setArticles(prev => prev.map(article => 
        article.id === articleId ? { ...article, is_favorite: isFavorite } : article
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
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

  const getUserDisplayName = (messageUser) => {
    if (messageUser.first_name && messageUser.last_name) {
      return `${messageUser.first_name} ${messageUser.last_name}`;
    }
    return messageUser.username;
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

  if (error && !collection) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  const canManage = collection && collection.owner_id === user?.id;

  return (
    <div className="container mt-4">
      {/* En-tête */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-1">
                {collection?.is_shared ? '👥' : '📂'} {collection?.name}
              </h1>
              <p className="text-muted mb-0">{collection?.description || 'Aucune description'}</p>
              <small className="text-muted">
                {feeds.length} flux • {articles.length} articles
                {collection?.is_shared && ' • Collection partagée'}
              </small>
            </div>
            <div>
              <Link to="/collections" className="btn btn-outline-secondary me-2">← Retour</Link>
              {canManage && (
                <button className="btn btn-primary" onClick={() => setShowAddFeedForm(true)}>
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
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Formulaire d'ajout de flux */}
      {showAddFeedForm && (
        <div className="card mb-4">
          <div className="card-header"><h5>Ajouter un flux RSS</h5></div>
          <div className="card-body">
            <form onSubmit={handleAddFeed}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Titre *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newFeed.title}
                    onChange={(e) => setNewFeed({...newFeed, title: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">URL du flux RSS *</label>
                  <input
                    type="url"
                    className="form-control"
                    value={newFeed.url}
                    onChange={(e) => setNewFeed({...newFeed, url: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">Ajouter</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddFeedForm(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onglets - SECTION MODIFIÉE */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            📰 Articles ({articles.length})
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'feeds' ? 'active' : ''}`}
            onClick={() => setActiveTab('feeds')}
          >
            📡 Flux RSS ({feeds.length})
          </button>
        </li>
        {collection?.is_shared && (
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'messaging' ? 'active' : ''}`}
              onClick={() => setActiveTab('messaging')}
            >
              💬 Discussion
            </button>
          </li>
        )}
        {/* NOUVEL ONGLET MEMBRES */}
        {collection?.is_shared && canManage && (
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              👥 Membres
            </button>
          </li>
        )}
        {selectedArticle && (
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              💭 Commentaires
            </button>
          </li>
        )}
      </ul>

      {/* Contenu des onglets */}
      <div className="tab-content">
        {/* Onglet Articles */}
        {activeTab === 'articles' && (
          <div className="tab-pane fade show active">
            {/* Filtres */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={filters.feed_id}
                      onChange={(e) => setFilters(prev => ({ ...prev, feed_id: e.target.value }))}
                    >
                      <option value="">Tous les flux</option>
                      {feeds.map(feed => (
                        <option key={feed.id} value={feed.id}>{feed.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={filters.is_read}
                      onChange={(e) => setFilters(prev => ({ ...prev, is_read: e.target.value }))}
                    >
                      <option value="">Tous</option>
                      <option value="false">Non lus</option>
                      <option value="true">Lus</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={filters.is_favorite}
                      onChange={(e) => setFilters(prev => ({ ...prev, is_favorite: e.target.value }))}
                    >
                      <option value="">Tous</option>
                      <option value="true">Favoris</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des articles */}
            <div className="row">
              {articles.length === 0 ? (
                <div className="col-12 text-center py-5">
                  <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
                  <h4>Aucun article trouvé</h4>
                  <p className="text-muted">Il n'y a pas encore d'articles dans cette collection.</p>
                </div>
              ) : (
                articles.map(article => (
                  <div key={article.id} className="col-12 mb-3">
                    <div className={`card ${!article.is_read ? 'border-primary' : ''}`}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h5 className="card-title">
                              <a 
                                href={article.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={!article.is_read ? 'fw-bold' : ''}
                              >
                                {article.title}
                              </a>
                              {collection.is_shared && (
                                <button
                                  className="btn btn-sm btn-outline-secondary ms-2"
                                  onClick={() => handleArticleClick(article)}
                                  title="Voir les commentaires"
                                >
                                  💭
                                </button>
                              )}
                            </h5>
                            
                            {article.description && (
                              <p className="card-text text-muted">
                                {article.description.length > 200 
                                  ? `${article.description.substring(0, 200)}...`
                                  : article.description
                                }
                              </p>
                            )}
                            
                            <div className="d-flex align-items-center text-muted small">
                              <span>{formatDate(article.published_date)}</span>
                              {article.author && <span className="ms-3">Par {article.author}</span>}
                            </div>
                          </div>
                          
                          <div className="ms-3">
                            <div className="btn-group-vertical">
                              <button
                                className={`btn btn-sm ${article.is_read ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                onClick={() => handleMarkAsRead(article.id, !article.is_read)}
                                title={article.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                              >
                                <i className={`fas ${article.is_read ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              </button>
                              
                              <button
                                className={`btn btn-sm ${article.is_favorite ? 'btn-warning' : 'btn-outline-warning'}`}
                                onClick={() => handleToggleFavorite(article.id, !article.is_favorite)}
                                title={article.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                              >
                                <i className="fas fa-star"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Onglet Flux RSS */}
        {activeTab === 'feeds' && (
          <div className="tab-pane fade show active">
            <div className="row">
              {feeds.length === 0 ? (
                <div className="col-12 text-center py-5">
                  <i className="fas fa-rss fa-3x text-muted mb-3"></i>
                  <h4>Aucun flux RSS</h4>
                  <p className="text-muted">Ajoutez votre premier flux pour commencer.</p>
                  {canManage && (
                    <button className="btn btn-primary" onClick={() => setShowAddFeedForm(true)}>
                      ➕ Ajouter un flux RSS
                    </button>
                  )}
                </div>
              ) : (
                feeds.map(feed => (
                  <div key={feed.id} className="col-md-6 mb-4">
                    <div className="card h-100">
                      <div className="card-header d-flex justify-content-between">
                        <h6 className="mb-0">📡 {feed.title}</h6>
                        <span className={`badge ${feed.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {feed.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="card-body">
                        <p className="card-text small text-muted">{feed.description}</p>
                        <div className="small text-muted">
                          <div>URL: <a href={feed.url} target="_blank" rel="noopener noreferrer">Voir le flux</a></div>
                          <div>MAJ: Toutes les {feed.update_frequency} min</div>
                          {feed.last_updated && <div>Dernière MAJ: {formatDate(feed.last_updated)}</div>}
                        </div>
                      </div>
                      {canManage && (
                        <div className="card-footer">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleUpdateFeed(feed.id)}
                          >
                            🔄 Mettre à jour
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Onglet Messagerie */}
        {activeTab === 'messaging' && collection?.is_shared && (
          <div className="tab-pane fade show active">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">💬 Discussion - {collection.name}</h5>
                <small className="text-muted">{messages.length} message(s)</small>
              </div>
              
              <div className="card-body p-0">
                {/* Zone des messages */}
                <div className="messages-container" style={{ height: '400px', overflowY: 'auto', padding: '1rem' }}>
                  {messages.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="fas fa-comments fa-2x mb-2"></i>
                      <p>Aucun message pour le moment.<br />Soyez le premier à lancer la discussion !</p>
                    </div>
                  ) : (
                    <div className="messages-list">
                      {messages.map((message) => (
                        <div key={message.id} className="message-item mb-3">
                          <div className="d-flex">
                            <div className="message-avatar me-2">
                              <div 
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                                style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
                              >
                                {getUserDisplayName(message.user).charAt(0).toUpperCase()}
                              </div>
                            </div>
                            
                            <div className="message-content flex-grow-1">
                              <div className="message-header d-flex justify-content-between align-items-center mb-1">
                                <div>
                                  <strong className="text-primary">{getUserDisplayName(message.user)}</strong>
                                  <small className="text-muted ms-2">{formatDate(message.created_at)}</small>
                                </div>
                                
                                {message.user_id === user.id && (
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteMessage(message.id)}
                                    title="Supprimer le message"
                                  >
                                    <i className="fas fa-trash fa-xs"></i>
                                  </button>
                                )}
                              </div>
                              
                              <div className="message-text">
                                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                  {message.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Formulaire d'envoi */}
                <div className="border-top p-3">
                  <form onSubmit={handleSendMessage}>
                    <div className="input-group">
                      <textarea
                        className="form-control"
                        placeholder="Tapez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows="2"
                        disabled={sendingMessage}
                      />
                      <button 
                        className="btn btn-primary" 
                        type="submit" 
                        disabled={sendingMessage || !newMessage.trim()}
                      >
                        {sendingMessage ? (
                          <span className="spinner-border spinner-border-sm me-1"></span>
                        ) : (
                          <i className="fas fa-paper-plane"></i>
                        )}
                        {sendingMessage ? 'Envoi...' : 'Envoyer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NOUVEL ONGLET MEMBRES */}
        {activeTab === 'members' && collection?.is_shared && canManage && (
          <div className="tab-pane fade show active">
            <CollectionMembers 
              collectionId={collection.id} 
              isOwner={canManage}
            />
          </div>
        )}

        {/* Onglet Commentaires */}
        {activeTab === 'comments' && selectedArticle && (
          <div className="tab-pane fade show active">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  💭 Commentaires sur "{selectedArticle.title}"
                </h6>
              </div>
              
              <div className="card-body">
                {/* Formulaire d'ajout de commentaire */}
                <form onSubmit={handleSendComment} className="mb-4">
                  <div className="mb-3">
                    <label className="form-label">Ajouter un commentaire</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Partagez votre opinion sur cet article..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={sendingComment}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={sendingComment || !newComment.trim()}
                  >
                    {sendingComment ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Publication...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-comment me-2"></i>
                        Publier le commentaire
                      </>
                    )}
                  </button>
                </form>

                {/* Liste des commentaires */}
                {articleComments.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="fas fa-comment-slash fa-2x mb-2"></i>
                    <p>Aucun commentaire pour le moment.<br />Soyez le premier à donner votre avis !</p>
                  </div>
                ) : (
                  <div className="comments-list">
                    {articleComments.map((comment) => (
                      <div key={comment.id} className="comment-item border-bottom pb-3 mb-3">
                        <div className="d-flex">
                          <div className="comment-avatar me-3">
                            <div 
                              className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                              style={{ width: '40px', height: '40px' }}
                            >
                              {getUserDisplayName(comment.user).charAt(0).toUpperCase()}
                            </div>
                          </div>
                          
                          <div className="comment-content flex-grow-1">
                            <div className="comment-header mb-2">
                              <strong className="text-primary">{getUserDisplayName(comment.user)}</strong>
                              <small className="text-muted ms-2">
                                {formatDate(comment.created_at)}
                                {comment.updated_at !== comment.created_at && (
                                  <span className="ms-1">(modifié)</span>
                                )}
                              </small>
                            </div>
                            
                            <div className="comment-text">
                              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetail;