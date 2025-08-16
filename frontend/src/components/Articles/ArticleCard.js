// frontend/src/components/Articles/ArticleCard.js
import React from 'react';

const ArticleCard = ({ article, onToggleRead, onToggleFavorite }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Il y a quelques minutes";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <article className="article-card">
      <div className="article-content">
        <div className="article-meta">
          <span className="source-name">{article.feed?.title}</span>
          <span>•</span>
          <span>{formatDate(article.published_date)}</span>
          <span>•</span>
          <span>5 min de lecture</span>
        </div>
        
        <h2 className="article-title">
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            {article.title}
          </a>
        </h2>
        
        <p className="article-excerpt">
          {article.description?.substring(0, 150)}...
        </p>
        
        <div className="article-actions">
          <button 
            className={`action-btn ${article.is_read ? 'active' : ''}`}
            onClick={() => onToggleRead(article.id)}
          >
            👁️ {article.is_read ? 'Lu' : 'Marquer lu'}
          </button>
          
          <button 
            className={`action-btn ${article.is_favorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(article.id)}
          >
            ⭐ {article.is_favorite ? 'Favoris' : 'Ajouter favoris'}
          </button>
          
          <button className="action-btn">
            💬 Commenter
          </button>
        </div>
      </div>
      
      {article.image_url && (
        <img 
          src={article.image_url} 
          alt={article.title}
          className="article-image"
        />
      )}
    </article>
  );
};

export default ArticleCard;