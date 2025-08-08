// frontend/src/components/Comments/ArticleComments.js
import React, { useState, useEffect } from 'react';
import { commentService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ArticleComments = ({ articleId, collectionId, articleTitle }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (articleId) {
      fetchComments();
    }
  }, [articleId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await commentService.getArticleComments(articleId);
      setComments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
      setError('Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const commentData = {
        article_id: articleId,
        collection_id: collectionId,
        content: newComment.trim()
      };

      const newCommentObj = await commentService.createComment(commentData);
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment('');
      setError('');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      if (error.response?.status === 403) {
        setError('Vous n\'avez pas l\'autorisation de commenter');
      } else if (error.response?.status === 400) {
        setError('Les commentaires ne sont disponibles que sur les collections partagées');
      } else {
        setError('Erreur lors de l\'ajout du commentaire');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const updatedComment = await commentService.updateComment(commentId, editContent.trim());
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? updatedComment : comment
      ));
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      setError('Erreur lors de la modification du commentaire');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;

    try {
      await commentService.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Erreur lors de la suppression du commentaire');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserDisplayName = (commentUser) => {
    if (commentUser.first_name && commentUser.last_name) {
      return `${commentUser.first_name} ${commentUser.last_name}`;
    }
    return commentUser.username;
  };

  if (loading) {
    return (
      <div className="card mt-3">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement des commentaires...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-3">
      <div className="card-header">
        <h6 className="mb-0">
          💬 Commentaires ({comments.length})
          <small className="text-muted ms-2">sur "{articleTitle}"</small>
        </h6>
      </div>
      
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-sm mb-3">
            {error}
            <button 
              className="btn-close btn-sm ms-2" 
              onClick={() => setError('')}
              aria-label="Fermer"
            ></button>
          </div>
        )}

        {/* Formulaire d'ajout de commentaire */}
        <form onSubmit={handleSubmitComment} className="mb-4">
          <div className="mb-3">
            <label htmlFor="newComment" className="form-label">
              Ajouter un commentaire
            </label>
            <textarea
              id="newComment"
              className="form-control"
              rows="3"
              placeholder="Partagez votre opinion sur cet article..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
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
        {comments.length === 0 ? (
          <div className="text-center text-muted py-4">
            <i className="fas fa-comment-slash fa-2x mb-2"></i>
            <p>Aucun commentaire pour le moment.<br />Soyez le premier à donner votre avis !</p>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map((comment) => (
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
                    <div className="comment-header d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong className="text-primary">{getUserDisplayName(comment.user)}</strong>
                        <small className="text-muted ms-2">
                          {formatDate(comment.created_at)}
                          {comment.updated_at !== comment.created_at && (
                            <span className="ms-1">(modifié)</span>
                          )}
                        </small>
                      </div>
                      
                      {comment.user_id === user.id && (
                        <div className="comment-actions">
                          {editingId === comment.id ? (
                            <div>
                              <button
                                className="btn btn-sm btn-success me-1"
                                onClick={() => handleSaveEdit(comment.id)}
                                disabled={!editContent.trim()}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={handleCancelEdit}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <div>
                              <button
                                className="btn btn-sm btn-outline-primary me-1"
                                onClick={() => handleEditComment(comment)}
                                title="Modifier"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteComment(comment.id)}
                                title="Supprimer"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="comment-text">
                      {editingId === comment.id ? (
                        <textarea
                          className="form-control"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows="3"
                          autoFocus
                        />
                      ) : (
                        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                          {comment.content}
                        </p>
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
  );
};

export default ArticleComments;