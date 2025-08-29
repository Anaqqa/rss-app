
import React, { useState, useEffect, useCallback } from 'react';
import { articlesService } from '../../services/api';
import { debounce } from 'lodash';

const ArticleSearchEngine = ({ 
  collectionId = null, 
  collections = [], 
  feeds = [], 
  children 
}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    feed_id: '',
    is_read: '',
    is_favorite: '',
    collection_id: '',
    limit: 20,
    offset: 0
  });

  
  const debouncedSearch = useCallback(
    debounce(async (searchFilters) => {
      setLoading(true);
      setError('');
      
      try {
        let results = [];
        
        if (collectionId) {
          
          results = await articlesService.getByCollection(collectionId, searchFilters);
        } else {
          
          if (searchFilters.search.trim()) {
            const response = await articlesService.searchGlobal(searchFilters.search, {
              collection_id: searchFilters.collection_id || undefined,
              feed_id: searchFilters.feed_id || undefined,
              is_read: searchFilters.is_read || undefined,
              is_favorite: searchFilters.is_favorite || undefined,
              limit: searchFilters.limit,
              offset: searchFilters.offset
            });
            results = response.articles || [];
          }
        }
        
        setArticles(results);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setError('Erreur lors de la recherche d\'articles');
      } finally {
        setLoading(false);
      }
    }, 500),
    [collectionId]
  );

  useEffect(() => {
    if (collectionId || filters.search.trim()) {
      debouncedSearch(filters);
    } else if (!collectionId) {
      
      setArticles([]);
    }
  }, [filters, debouncedSearch, collectionId]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0
    }));
  };

  const handleMarkAsRead = async (articleId, isRead) => {
    try {
      await articlesService.markAsRead(articleId, isRead);
      setArticles(prev => prev.map(article => 
        article.id === articleId ? { ...article, is_read: isRead } : article
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError('Erreur lors de la mise à jour du statut');
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
      setError('Erreur lors de la mise à jour des favoris');
    }
  };

  
  return children({
    articles,
    loading,
    error,
    filters,
    collections,
    feeds,
    handleFilterChange,
    handleMarkAsRead,
    handleToggleFavorite,
    setError
  });
};

export default ArticleSearchEngine;