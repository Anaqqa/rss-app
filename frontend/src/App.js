import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OAuthCallback from './components/Auth/OAuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import Profile from './components/Profile/Profile';
import Navbar from './components/Layout/Navbar';
import Collections from './components/Collections/Collections';
import CollectionDetail from './components/Collections/CollectionDetail';
import ExportImport from './components/ExportImport/ExportImport';
import 'bootstrap/dist/css/bootstrap.min.css';

// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
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
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      {isAuthenticated && <Navbar />}
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
        
        {/* Route OAuth callback - accessible même non connecté */}
        <Route path="/auth/callback" element={<OAuthCallback />} />
        
        {/* Routes protégées */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/collections" element={
          <ProtectedRoute>
            <Collections />
          </ProtectedRoute>
        } />  
        <Route path="/collections/:id" element={
          <ProtectedRoute> 
            <CollectionDetail />
          </ProtectedRoute>
        } />
        <Route path="/export-import" element={
          <ProtectedRoute>
            <ExportImport />
          </ProtectedRoute>
        } />
        
        {/* Redirection par défaut */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;