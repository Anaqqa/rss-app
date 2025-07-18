import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/dashboard">
          📰 RSS Aggregator
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                🏠 Tableau de bord
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/collections')}`} to="/collections">
                📚 Collections
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/feeds')}`} to="/feeds">
                📡 Flux RSS
              </Link>
            </li>
          </ul>

          <div className="navbar-nav">
            <div className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link text-white text-decoration-none"
                type="button"
                id="navbarDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ border: 'none', background: 'none' }}
              >
                👤 {user?.first_name || user?.username}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item" to="/profile">
                    ⚙️ Profil
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={handleLogout}
                    type="button"
                  >
                    🚪 Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;