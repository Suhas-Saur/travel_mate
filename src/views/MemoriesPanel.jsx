import React, { useEffect, useState } from 'react';
import { History, Image as ImageIcon, Video, Heart, Plus, Loader, Trash2, MapPin } from 'lucide-react';
import { fetchMemories, toggleFavorite, deleteMemory } from '../lib/dataStore';
import AddMemoryModal from '../components/AddMemoryModal';

const MemoriesPanel = ({ autoOpenWith, clearAutoOpen, onPinSelect }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (autoOpenWith) {
      setIsAdding(true);
    }
  }, [autoOpenWith]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Force a small delay to ensure Supabase sync if just added
      const data = await fetchMemories();
      setMemories(data || []);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteMemory = async (e, id) => {
    e.stopPropagation();
    
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }

    setDeletingId(id);
    try {
      const success = await deleteMemory(id);
      if (success) {
        setMemories(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleLocateMemory = (mem) => {
    if (onPinSelect && mem.lat && mem.lng) {
      onPinSelect({ lat: mem.lat, lng: mem.lng, zoom: 12 });
    }
  };

  const handleToggleFavorite = async (id, currentStatus) => {
    try {
      const updated = await toggleFavorite(id, !currentStatus);
      if (updated) {
        setMemories(prev => prev.map(m => m.id === id ? updated : m));
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  if (loading && memories.length === 0) {
    return (
      <div className="dashboard-panel glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <Loader className="animate-spin" color="var(--accent)" />
      </div>
    );
  }

  return (
    <div className="dashboard-panel glass-panel" style={{ right: '24px', left: 'auto', width: '420px' }}>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History className="icon" /> 
          Past Memories
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            style={{ 
              background: confirmDeleteId === 'all' ? 'var(--danger)' : 'none', 
              border: 'none', 
              color: confirmDeleteId === 'all' ? 'white' : 'var(--danger)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              transition: '0.3s'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (confirmDeleteId === 'all') {
                resetMemories().then(() => loadData());
                setConfirmDeleteId(null);
              } else {
                setConfirmDeleteId('all');
                setTimeout(() => setConfirmDeleteId(null), 3000);
              }
            }}
          >
            <Trash2 size={16} /> {confirmDeleteId === 'all' ? 'Confirm Reset?' : 'Reset'}
          </button>
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
            onClick={() => setIsAdding(true)}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <p style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--secondary-text)' }}>
        {memories.length > 0 ? 'Relive your previous trips and attached media.' : 'No memories found. Click + to add your first one!'}
      </p>

      {loading && <div style={{ textAlign: 'center', marginBottom: '16px' }}><Loader className="animate-spin" size={20} color="var(--accent)" /></div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {memories.map((mem) => (
          <div 
            key={mem.id} 
            onClick={() => handleLocateMemory(mem)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid var(--glass-border)',
              transition: '0.3s',
              cursor: 'pointer'
            }} className="memory-card">
            <div style={{ height: '180px', width: '100%', position: 'relative', background: 'rgba(0,0,0,0.05)' }}>
              {mem.media_url ? (
                <img 
                  src={mem.media_url} 
                  alt={mem.location} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: mem.media_url ? 'none' : 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <ImageIcon color="var(--secondary-text)" size={32} />
                <span style={{ fontSize: '0.7rem', color: 'var(--secondary-text)' }}>No Media</span>
              </div>
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex'
              }}>
                {mem.type === 'video' ? <Video size={16} color="white" /> : <ImageIcon size={16} color="white" />}
              </div>
            </div>
            
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {mem.location}
                  {mem.lat && <MapPin size={14} color="var(--accent)" />}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>{new Date(mem.date).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={(e) => handleDeleteMemory(e, mem.id)}
                  style={{ 
                    background: confirmDeleteId === mem.id ? 'var(--danger)' : 'none', 
                    border: 'none', 
                    color: confirmDeleteId === mem.id ? 'white' : 'var(--danger)', 
                    cursor: 'pointer', 
                    padding: '8px', 
                    opacity: confirmDeleteId === mem.id ? 1 : 0.7,
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: '0.3s'
                  }}
                  disabled={deletingId === mem.id}
                >
                  {deletingId === mem.id ? <Loader className="animate-spin" size={16} /> : 
                   confirmDeleteId === mem.id ? <span>Confirm?</span> : <Trash2 size={18} />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleFavorite(mem.id, mem.is_favorite); }}
                  className="like-btn"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    padding: '8px',
                    borderRadius: '50%',
                    transition: '0.2s',
                    background: mem.is_favorite ? 'rgba(255, 64, 129, 0.1)' : 'transparent'
                  }}
                >
                  <Heart 
                    size={20} 
                    color={mem.is_favorite ? '#ff4081' : 'var(--accent)'} 
                    fill={mem.is_favorite ? '#ff4081' : 'none'}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <AddMemoryModal 
          initialData={autoOpenWith}
          onClose={() => {
            setIsAdding(false);
            if (clearAutoOpen) clearAutoOpen();
          }} 
          onSuccess={() => {
            loadData();
            setIsAdding(false);
            if (clearAutoOpen) clearAutoOpen();
          }} 
        />
      )}

      <style>{`
        .memory-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        .like-btn:hover {
          background: rgba(255, 64, 129, 0.15);
          transform: scale(1.1);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MemoriesPanel;
