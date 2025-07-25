import React, { useState } from 'react';
import { useExportImport } from '../../contexts/ExportImportContext';

const ExportSection = ({ collections }) => {
  const { exportOPML, exportJSON, exportCSV, isExporting } = useExportImport();
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [exportAll, setExportAll] = useState(true);
  const [message, setMessage] = useState('');

  const handleCollectionToggle = (collectionId) => {
    setSelectedCollections(prev => 
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleExportAllToggle = (checked) => {
    setExportAll(checked);
    if (checked) {
      setSelectedCollections([]);
    }
  };

  const handleExport = async (format) => {
    const collectionIds = exportAll ? null : selectedCollections;
    
    if (!exportAll && selectedCollections.length === 0) {
      setMessage('⚠️ Veuillez sélectionner au moins une collection');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    let result;
    switch (format) {
      case 'opml':
        result = await exportOPML(collectionIds);
        break;
      case 'json':
        result = await exportJSON(collectionIds);
        break;
      case 'csv':
        result = await exportCSV(collectionIds);
        break;
      default:
        return;
    }

    setMessage(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <div className="export-section">
      <div className="export-warning">
        <div className="warning-box">
          <h3>⚠️ Avertissement</h3>
          <p>
            Vos données vont être exportées en clair. Assurez-vous de stocker 
            le fichier dans un endroit sécurisé si vous partagez des collections privées.
          </p>
        </div>
      </div>

      <div className="export-options">
        <h3>📋 Options d'export</h3>
        
        {/* Export All Toggle */}
        <div className="option-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={exportAll}
              onChange={(e) => handleExportAllToggle(e.target.checked)}
            />
            <span className="checkmark"></span>
            Exporter toutes mes collections
          </label>
        </div>

        {/* Collection Selection */}
        {!exportAll && (
          <div className="collections-selection">
            <h4>Sélectionner les collections :</h4>
            <div className="collections-list">
              {collections.map(collection => (
                <label key={collection.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCollections.includes(collection.id)}
                    onChange={() => handleCollectionToggle(collection.id)}
                  />
                  <span className="checkmark"></span>
                  <div className="collection-info">
                    <span className="collection-name">{collection.name}</span>
                    <span className="collection-feeds">
                      {collection.feeds?.length || 0} flux
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="export-formats">
        <h3>📁 Formats d'export</h3>
        <div className="format-buttons">
          <button
            className="export-btn opml"
            onClick={() => handleExport('opml')}
            disabled={isExporting}
          >
            {isExporting ? '⏳' : '📄'} Export OPML
            <small>Format standard pour les agrégateurs RSS</small>
          </button>

          <button
            className="export-btn json"
            onClick={() => handleExport('json')}
            disabled={isExporting}
          >
            {isExporting ? '⏳' : '🔧'} Export JSON
            <small>Format structuré avec métadonnées complètes</small>
          </button>

          <button
            className="export-btn csv"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            {isExporting ? '⏳' : '📊'} Export CSV
            <small>Format tableur pour analyse</small>
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ExportSection;