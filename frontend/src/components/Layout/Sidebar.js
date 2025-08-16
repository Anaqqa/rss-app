// frontend/src/components/Layout/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { collectionsService } from '../../services/api';

const Sidebar = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const data = await collectionsService.getAll();
      setCollections(data);
    } catch (error) {
      console.error('Erreur lors du chargement des collections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <aside className="sidebar">
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-bordeaux" role="status"></div>
        </div>
      </aside>
    );
  }

  const personalCollections = collections.filter(col => !col.is_shared);
  const sharedCollections = collections.filter(col => col.is_shared);

  return (
    <aside className="sidebar">
      <h3>Mes Collections</h3>
      
      {personalCollections.length === 0 ? (
        <p className="text-muted small">Aucune collection personnelle</p>
      ) : (
        personalCollections.map(collection => (
          <Link
            key={collection.id}
            to={`/collections/${collection.id}`}
            className={`collection-item ${
              location.pathname === `/collections/${collection.id}` ? 'active' : ''
            }`}
          >
            📰 {collection.name}
          </Link>
        ))
      )}

      <h3 style={{ marginTop: '32px' }}>Collections Partagées</h3>
      
      {sharedCollections.length === 0 ? (
        <p className="text-muted small">Aucune collection partagée</p>
      ) : (
        sharedCollections.map(collection => (
          <Link
            key={collection.id}
            to={`/collections/${collection.id}`}
            className={`collection-item ${
              location.pathname === `/collections/${collection.id}` ? 'active' : ''
            }`}
          >
            👥 {collection.name}
          </Link>
        ))
      )}

      <div className="mt-3">
        <Link to="/collections" className="btn btn-sm btn-outline-primary w-100">
          ➕ Nouvelle Collection
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;