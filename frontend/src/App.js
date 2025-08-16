// frontend/src/App.js - VERSION COMPLÈTE AVEC MEDIUMLAYOUT
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import des styles - ORDRE IMPORTANT
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/medium-theme.css';

// Vos composants existants
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OAuthCallback from './components/Auth/OAuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import Profile from './components/Profile/Profile';
import Collections from './components/Collections/Collections';
import CollectionDetail from './components/Collections/CollectionDetail';
import ExportImport from './components/ExportImport/ExportImport';

// Import du MediumLayout
import MediumLayout from './components/Layout/MediumLayout';

// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-bordeaux" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Composant pour rediriger les utilisateurs connectés
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-bordeaux" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            
            {/* Routes protégées avec MediumLayout */}
            <Route path="/*" element={
              <ProtectedRoute>
                <MediumLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/collections" element={<Collections />} />
                    <Route path="/collections/:id" element={<CollectionDetail />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/export-import" element={<ExportImport />} />
                    
                    <Route path="*" element={
                      <div className="text-center py-5">
                        <h3>404 - Page non trouvée</h3>
                        <p className="text-muted">Cette page n'existe pas.</p>
                        <Link to="/dashboard" className="btn btn-primary">
                          Retour au tableau de bord
                        </Link>
                      </div>
                    } />
                  </Routes>
                </MediumLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;