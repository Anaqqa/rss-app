
import React, { useState, useEffect, useRef } from 'react';
import { messageService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CollectionMessaging = ({ collectionId, collectionName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (collectionId) {
      fetchMessages();
    }
  }, [collectionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getCollectionMessages(collectionId);
      setMessages(data.reverse());
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const messageData = {
        collection_id: collectionId,
        content: newMessage.trim()
      };

      const newMsg = await messageService.createMessage(messageData);
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setError('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    try {
      await messageService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Erreur lors de la suppression du message');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getUserDisplayName = (messageUser) => {
    if (messageUser.first_name && messageUser.last_name) {
      return `${messageUser.first_name} ${messageUser.last_name}`;
    }
    return messageUser.username;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">💬 Discussion - {collectionName}</h5>
        </div>
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">💬 Discussion - {collectionName}</h5>
        <small className="text-muted">{messages.length} message(s)</small>
      </div>
      
      <div className="card-body p-0">
        <div className="messages-container" style={{ height: '400px', overflowY: 'auto', padding: '1rem' }}>
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
                          <small className="text-muted ms-2">{formatTime(message.created_at)}</small>
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
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-top p-3">
          <form onSubmit={handleSendMessage}>
            <div className="input-group">
              <textarea
                className="form-control"
                placeholder="Tapez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows="2"
                disabled={sending}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button 
                className="btn btn-primary" 
                type="submit" 
                disabled={sending || !newMessage.trim()}
              >
                {sending ? (
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
            <small className="form-text text-muted">
              Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
            </small>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CollectionMessaging;
