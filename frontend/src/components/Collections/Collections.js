import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionsService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();

  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    is_shared: false
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const data = await collectionsService.getAll();
      setCollections(data);
    } catch (error) {
      console.error('Erreur lors du chargement des collections:', error);
      setError('Erreur lors du chargement des collections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    try {
      const created = await collectionsService.create(newCollection);
      setCollections([...collections, created]);
      setNewCollection({ name: '', description: '', is_shared: false });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setError('Erreur lors de la création de la collection');
    }
  };

  const handleDeleteCollection = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette collection ?')) {
      try {
        await collectionsService.delete(id);
        setCollections(collections.filter(c => c.id !== id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression');
      }
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

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📚 Mes Collections</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          ➕ Nouvelle Collection
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Créer une nouvelle collection</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateCollection}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Nom *</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  rows="3"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                />
              </div>
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="is_shared"
                  checked={newCollection.is_shared}
                  onChange={(e) => setNewCollection({...newCollection, is_shared: e.target.checked})}
                />
                <label className="form-check-label" htmlFor="is_shared">
                  Collection partagée
                </label>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">Créer</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des collections */}
      <div className="row">
        {collections.map((collection) => (
          <div key={collection.id} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="card-title">{collection.name}</h5>
                  {collection.is_shared && (
                    <span className="badge bg-info">👥 Partagée</span>
                  )}
                </div>
                
                <p className="card-text text-muted">
                  {collection.description || 'Aucune description'}
                </p>
                
                <div className="mb-3">
                  <small className="text-muted">
                    Créée le {new Date(collection.created_at).toLocaleDateString('fr-FR')}
                  </small>
                </div>
                
                <div className="d-flex justify-content-between align-items-center">
                  <Link 
                    to={`/collections/${collection.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Ouvrir
                  </Link>
                  
                  {collection.owner_id === user?.id && (
                    <div className="btn-group">
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {/* TODO: Edit */}}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteCollection(collection.id)}
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

      {collections.length === 0 && (
        <div className="text-center py-5">
          <h3 className="text-muted">📭 Aucune collection</h3>
          <p className="text-muted">Créez votre première collection pour organiser vos flux RSS</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ Créer ma première collection
          </button>
        </div>
      )}
    </div>
  );
};

export default Collections;