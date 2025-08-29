import React from 'react';

const ImportResult = ({ result, onClose }) => {
  const { message, imported_feeds, skipped_feeds } = result;

  return (
    <div className="modal-overlay">
      <div className="import-result-modal">
        <div className="modal-header">
          <h3>📊 Résultat de l'import</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          <div className="import-summary">
            <p className="main-message">✅ {message}</p>
            
            <div className="import-stats">
              <div className="stat-item success">
                <span className="stat-number">{imported_feeds?.length || 0}</span>
                <span className="stat-label">flux importés</span>
              </div>
              <div className="stat-item warning">
                <span className="stat-number">{skipped_feeds?.length || 0}</span>
                <span className="stat-label">flux ignorés</span>
              </div>
            </div>
          </div>

          {/* Imported Feeds */}
          {imported_feeds && imported_feeds.length > 0 && (
            <div className="feeds-section">
              <h4>✅ Flux importés avec succès :</h4>
              <div className="feeds-list">
                {imported_feeds.map((feed, index) => (
                  <div key={index} className="feed-item success">
                    <span className="feed-title">{feed.title}</span>
                    <span className="feed-url">{feed.url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skipped Feeds */}
          {skipped_feeds && skipped_feeds.length > 0 && (
            <div className="feeds-section">
              <h4>⚠️ Flux ignorés :</h4>
              <div className="feeds-list">
                {skipped_feeds.map((feed, index) => (
                  <div key={index} className="feed-item warning">
                    <span className="feed-url">{feed.url}</span>
                    <span className="feed-reason">{feed.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportResult;
