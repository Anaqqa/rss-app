import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CollectionMembers = ({ collectionId, isOwner }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitePermissions, setInvitePermissions] = useState({
    can_read: true,
    can_add_feeds: false,
    can_edit_feeds: false,
    can_delete_feeds: false,
    can_comment: true
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (isOwner) {
      fetchMembers();
    }
  }, [collectionId, isOwner]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/collections/${collectionId}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      } else {
        setError('Erreur lors du chargement des membres');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des membres');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim() || inviting) return;

    try {
      setInviting(true);
      
      const response = await fetch(`http://localhost:8000/collections/${collectionId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          username: inviteUsername.trim(),
          permissions: invitePermissions
        })
      });

      if (response.ok) {
        const result = await response.json();
        setInviteUsername('');
        setError('');
        alert(`Utilisateur ${inviteUsername} invité avec succès !`);
        fetchMembers(); // Rafraîchir la liste
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Erreur lors de l\'invitation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId, username) => {
    if (!window.confirm(`Retirer ${username} de cette collection ?`)) return;

    try {
      const response = await fetch(`http://localhost:8000/collections/${collectionId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        alert('Membre retiré avec succès');
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la suppression');
    }
  };

  if (!isOwner) {
    return (
      <div className="text-center py-4">
        <i className="fas fa-users fa-2x text-muted mb-2"></i>
        <p className="text-muted">Vous n'êtes pas propriétaire de cette collection.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Formulaire d'invitation */}
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">👥 Inviter un utilisateur</h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleInviteUser}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Nom d'utilisateur *</label>
                <input
                  type="text"
                  className="form-control"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Entrez le nom d'utilisateur"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Permissions</label>
                <div className="form-check-group">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={invitePermissions.can_add_feeds}
                      onChange={(e) => setInvitePermissions(prev => ({...prev, can_add_feeds: e.target.checked}))}
                    />
                    <label className="form-check-label">Peut ajouter des flux</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={invitePermissions.can_edit_feeds}
                      onChange={(e) => setInvitePermissions(prev => ({...prev, can_edit_feeds: e.target.checked}))}
                    />
                    <label className="form-check-label">Peut modifier des flux</label>
                  </div>
                </div>
              </div>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={inviting || !inviteUsername.trim()}
            >
              {inviting ? 'Invitation...' : '📧 Inviter'}
            </button>
          </form>
        </div>
      </div>

      {/* Liste des membres */}
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">👥 Membres ({members.length})</h6>
        </div>
        <div className="card-body">
          {members.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-user-plus fa-2x text-muted mb-2"></i>
              <p className="text-muted">Aucun membre pour le moment. Invitez des utilisateurs !</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {members.map(member => (
                <div key={member.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{member.user.first_name} {member.user.last_name}</strong>
                    <span className="text-muted">(@{member.user.username})</span>
                    <br />
                    <small className="text-muted">
                      Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                    </small>
                    <div className="mt-1">
                      {member.permissions.can_add_feeds && <span className="badge bg-success me-1">Ajouter</span>}
                      {member.permissions.can_edit_feeds && <span className="badge bg-warning me-1">Modifier</span>}
                      {member.permissions.can_comment && <span className="badge bg-info me-1">Commenter</span>}
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveMember(member.id, member.user.username)}
                    title="Retirer ce membre"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionMembers;