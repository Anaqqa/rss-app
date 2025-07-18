import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    collections: 0,
    feeds: 0,
    articles: 0,
    unread: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Pour l'instant, on simule les stats
        // Plus tard on créera les vraies API
        setTimeout(() => {
          setStats({
            collections: 3,
            feeds: 12,
            articles: 156,
            unread: 23
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
      {/* En-tête de bienvenue */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="h2 mb-1">
            👋 Bonjour, {user?.first_name || user?.username} !
          </h1>
          <p className="text-muted">Voici un aperçu de votre activité RSS</p>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Collections</h5>
                  <h3 className="mb-0">{stats.collections}</h3>
                </div>
                <div className="align-self-center">
                  <i className="fs-1">📚</i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Flux RSS</h5>
                  <h3 className="mb-0">{stats.feeds}</h3>
                </div>
                <div className="align-self-center">
                  <i className="fs-1">📡</i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Articles</h5>
                  <h3 className="mb-0">{stats.articles}</h3>
                </div>
                <div className="align-self-center">
                  <i className="fs-1">📄</i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Non lus</h5>
                  <h3 className="mb-0">{stats.unread}</h3>
                </div>
                <div className="align-self-center">
                  <i className="fs-1">🔔</i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">🚀 Actions rapides</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <button className="btn btn-outline-primary w-100">
                    ➕ Nouvelle collection
                  </button>
                </div>
                <div className="col-md-4 mb-3">
                  <button className="btn btn-outline-info w-100">
                    📡 Ajouter un flux RSS
                  </button>
                </div>
                <div className="col-md-4 mb-3">
                  <button className="btn btn-outline-success w-100">
                    📥 Importer des flux
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Articles récents */}
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">📰 Articles récents</h5>
            </div>
            <div className="card-body">
              <div className="text-center text-muted py-4">
                <i className="fs-1">📭</i>
                <p className="mt-2">Aucun article pour le moment</p>
                <p className="small">Ajoutez des flux RSS pour voir vos articles ici</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;