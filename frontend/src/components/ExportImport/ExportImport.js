import React, { useState } from 'react';

const ExportImport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');

  // Fonction pour récupérer le token d'authentification
  const getToken = () => {
    // Essayer différents formats de token
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('access_token') || 
                  localStorage.getItem('authToken');
    
    console.log('Token récupéré:', token); // Debug
    return token;
  };

  // Fonction générique pour télécharger un fichier
  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Export OPML avec debug
  const handleExportOPML = async () => {
    setIsExporting(true);
    setMessage('');
    
    const token = getToken();
    if (!token) {
      setMessage('❌ Aucun token d\'authentification trouvé. Reconnectez-vous.');
      setIsExporting(false);
      return;
    }
    
    try {
      console.log('Envoi de la requête avec token:', token); // Debug
      
      const response = await fetch('http://localhost:8000/export/opml', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Réponse:', response.status, response.statusText); // Debug

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token d\'authentification invalide. Reconnectez-vous.');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      downloadFile(blob, 'rss_feeds.opml');
      setMessage('✅ Export OPML réussi !');
      
    } catch (error) {
      console.error('Erreur export OPML:', error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsExporting(false);
      setTimeout(() => setMessage(''), 8000);
    }
  };

  // Export JSON
  const handleExportJSON = async () => {
    setIsExporting(true);
    setMessage('');
    
    const token = getToken();
    if (!token) {
      setMessage('❌ Aucun token d\'authentification trouvé. Reconnectez-vous.');
      setIsExporting(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/export/json', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token d\'authentification invalide. Reconnectez-vous.');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      downloadFile(blob, 'rss_feeds.json');
      setMessage('✅ Export JSON réussi !');
      
    } catch (error) {
      console.error('Erreur export JSON:', error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsExporting(false);
      setTimeout(() => setMessage(''), 8000);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    setMessage('');
    
    const token = getToken();
    if (!token) {
      setMessage('❌ Aucun token d\'authentification trouvé. Reconnectez-vous.');
      setIsExporting(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/export/csv', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token d\'authentification invalide. Reconnectez-vous.');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      downloadFile(blob, 'rss_feeds.csv');
      setMessage('✅ Export CSV réussi !');
      
    } catch (error) {
      console.error('Erreur export CSV:', error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsExporting(false);
      setTimeout(() => setMessage(''), 8000);
    }
  };

  // Test de connexion API
  const testConnection = async () => {
    const token = getToken();
    console.log('Test avec token:', token);
    
    try {
      const response = await fetch('http://localhost:8000/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Test de connexion:', response.status);
      if (response.ok) {
        const userData = await response.json();
        console.log('Utilisateur connecté:', userData);
        setMessage('✅ Token valide, connexion OK');
      } else {
        setMessage('❌ Token invalide, reconnectez-vous');
      }
    } catch (error) {
      console.error('Erreur test connexion:', error);
      setMessage('❌ Erreur de connexion au serveur');
    }
    
    setTimeout(() => setMessage(''), 5000);
  };

  // Gestion du fichier sélectionné
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validExtensions = ['.opml', '.json'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setMessage('');
      } else {
        setMessage('❌ Format de fichier non supporté. Utilisez .opml ou .json');
        setSelectedFile(null);
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  // Import de fichier
  const handleImport = async () => {
    if (!selectedFile) {
      setMessage('❌ Veuillez sélectionner un fichier');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const token = getToken();
    if (!token) {
      setMessage('❌ Aucun token d\'authentification trouvé. Reconnectez-vous.');
      return;
    }

    setIsImporting(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      const endpoint = fileExtension === 'opml' ? 'opml' : 'json';

      const response = await fetch(`http://localhost:8000/export/import/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token d\'authentification invalide. Reconnectez-vous.');
        }
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors de l\'import');
      }

      const result = await response.json();
      setMessage(`✅ ${result.message}`);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Erreur import:', error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsImporting(false);
      setTimeout(() => setMessage(''), 8000);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h2>📤 Export / Import RSS</h2>
          <p>Sauvegardez vos flux ou importez-en de nouveaux</p>
          
          {/* Bouton de test de connexion */}
          <div className="mb-3">
            <button className="btn btn-secondary btn-sm" onClick={testConnection}>
              🔍 Tester la connexion API
            </button>
          </div>
          
          {/* Message de statut */}
          {message && (
            <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} mt-3`}>
              {message}
            </div>
          )}
          
          <div className="row mt-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>📤 Export</h5>
                </div>
                <div className="card-body">
                  <p>Exportez vos flux RSS au format OPML, JSON ou CSV.</p>
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-primary" 
                      onClick={handleExportOPML}
                      disabled={isExporting}
                    >
                      {isExporting ? '⏳ Export...' : '📄 Export OPML'}
                    </button>
                    <button 
                      className="btn btn-info" 
                      onClick={handleExportJSON}
                      disabled={isExporting}
                    >
                      {isExporting ? '⏳ Export...' : '🔧 Export JSON'}
                    </button>
                    <button 
                      className="btn btn-warning" 
                      onClick={handleExportCSV}
                      disabled={isExporting}
                    >
                      {isExporting ? '⏳ Export...' : '📊 Export CSV'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>📥 Import</h5>
                </div>
                <div className="card-body">
                  <p>Importez vos flux RSS depuis un fichier OPML ou JSON.</p>
                  <div className="mb-3">
                    <input 
                      type="file" 
                      className="form-control" 
                      accept=".opml,.json"
                      onChange={handleFileSelect}
                      disabled={isImporting}
                    />
                    {selectedFile && (
                      <small className="text-success mt-1 d-block">
                        ✅ Fichier sélectionné: {selectedFile.name}
                      </small>
                    )}
                  </div>
                  <button 
                    className="btn btn-success w-100" 
                    onClick={handleImport}
                    disabled={isImporting || !selectedFile}
                  >
                    {isImporting ? '⏳ Import...' : '📥 Importer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportImport;