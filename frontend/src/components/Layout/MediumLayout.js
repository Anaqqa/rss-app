// frontend/src/components/Layout/MediumLayout.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';

const MediumLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <>
      {/* Header Medium-style */}
      <header className="header">
        <div className="header-content">
          <Link to="/dashboard" className="logo">
            SUP RSS
          </Link>
          
          <nav className="header-nav">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/collections" className="nav-link">Collections</Link>
            <Link to="/export-import" className="nav-link">Import/Export</Link>
            
            <div className="dropdown">
              <button 
                className="user-avatar dropdown-toggle" 
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </button>
              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/profile">👤 Profil</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item" onClick={handleLogout}>🚪 Déconnexion</button></li>
              </ul>
            </div>
          </nav>
        </div>
      </header>

      {/* Layout principal 3-colonnes */}
      <div className="main-container">
        <Sidebar />
        <main className="feed-main">
          {children}
        </main>
        <aside className="sidebar-right">
          {/* Filtres et stats */}
          <div className="widget">
            <h4>🔍 Recherche</h4>
            <input type="text" className="search-box" placeholder="Rechercher dans les articles..." />
          </div>

          <div className="widget">
            <h4>🎛️ Filtres</h4>
            <div className="filter-group">
              <label className="filter-label">Source</label>
              <select className="filter-select">
                <option>Toutes les sources</option>
                <option>TechCrunch</option>
                <option>Le Monde</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Statut</label>
              <select className="filter-select">
                <option>Tous</option>
                <option>Non lus</option>
                <option>Lus</option>
                <option>Favoris</option>
              </select>
            </div>
          </div>

          <div className="widget">
            <h4>📊 Statistiques</h4>
            <div className="stat-item">
              <span className="stat-label">Articles non lus</span>
              <span className="stat-value">0</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Favoris</span>
              <span className="stat-value">0</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Collections</span>
              <span className="stat-value">3</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default MediumLayout;