import React, { useState, useRef } from 'react';
import { useExportImport } from '../../contexts/ExportImportContext';

const ImportSection = ({ collections }) => {
  const { importOPML, importJSON, isImporting } = useExportImport();
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetCollection, setTargetCollection] = useState('');
  const [createNewCollection, setCreateNewCollection] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    
    const validExtensions = ['.opml', '.json'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setMessage('❌ Format de fichier non supporté. Utilisez .opml ou .json');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    setSelectedFile(file);
    setMessage('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setMessage('❌ Veuillez sélectionner un fichier');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!createNewCollection && !targetCollection) {
      setMessage('❌ Veuillez sélectionner une collection de destination');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const collectionId = createNewCollection ? null : parseInt(targetCollection);
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

    let result;
    if (fileExtension === 'opml') {
      result = await importOPML(selectedFile, collectionId);
    } else if (fileExtension === 'json') {
      result = await importJSON(selectedFile, collectionId);
    }

    if (result.success) {
      setMessage(`✅ Import réussi !`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setMessage(`❌ ${result.message}`);
    }
    
    setTimeout(() => setMessage(''), 5000);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="import-section">
      <div className="import-info">
        <h3>📥 Import de flux RSS</h3>
        <p>
          Importez vos flux depuis un fichier OPML (standard) ou JSON (format complet).
          Vous deviendrez automatiquement propriétaire des flux importés.
        </p>
      </div>

      {/* File Upload Area */}
      <div 
        className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <p>Glissez-déposez votre fichier ici</p>
            <span>ou</span>
            <button 
              className="select-file-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Choisir un fichier
            </button>
            <small>Formats supportés : .opml, .json</small>
          </div>
        ) : (
          <div className="selected-file">
            <div className="file-info">
              <span className="file-icon">
                {selectedFile.name.endsWith('.opml') ? '📄' : '🔧'}
              </span>
              <div className="file-details">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <button 
              className="remove-file-btn"
              onClick={removeSelectedFile}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".opml,.json"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Destination Options */}
      {selectedFile && (
        <div className="destination-options">
          <h4>📂 Destination des flux</h4>
          
          <div className="option-group">
            <label className="radio-label">
              <input
                type="radio"
                name="destination"
                checked={createNewCollection}
                onChange={() => setCreateNewCollection(true)}
              />
              <span className="radio-mark"></span>
              Créer une nouvelle collection
            </label>
          </div>

          <div className="option-group">
            <label className="radio-label">
              <input
                type="radio"
                name="destination"
                checked={!createNewCollection}
                onChange={() => setCreateNewCollection(false)}
              />
              <span className="radio-mark"></span>
              Ajouter à une collection existante
            </label>
          </div>

          {!createNewCollection && (
            <div className="collection-select">
              <select
                value={targetCollection}
                onChange={(e) => setTargetCollection(e.target.value)}
                className="collection-dropdown"
              >
                <option value="">-- Choisir une collection --</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name} ({collection.feeds?.length || 0} flux)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Import Button */}
      {selectedFile && (
        <div className="import-actions">
          <button
            className="import-btn"
            onClick={handleImport}
            disabled={isImporting}
          >
            {isImporting ? '⏳ Import en cours...' : '📥 Importer les flux'}
          </button>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ImportSection;