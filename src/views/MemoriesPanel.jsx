import React, { useEffect, useState } from 'react';
import { History, Image as ImageIcon, Video, Heart, Plus, Loader, Trash2, MapPin, ChevronLeft } from 'lucide-react';
import { fetchMemories, toggleFavorite, deleteMemory, resetMemories } from '../lib/dataStore';
import AddMemoryModal from '../components/AddMemoryModal';

const MemoriesPanel = ({ autoOpenWith, clearAutoOpen, onPinSelect, isCollapsed, onToggleCollapse }) => {
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

  if (isCollapsed) {
    return (
      <button 
        onClick={onToggleCollapse}
        className="panel-expand-pill"
        title="Expand Memories"
      >
        <History size={18} color="var(--accent)" />
        <span>Open Past Memories ({memories.length})</span>
        <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
      </button>
    );
  }

  return (
    <div className="dashboard-panel glass-panel">
      <div className="panel-header-row">
        <div className="panel-title">
          <History className="icon" color="var(--accent)" /> 
          Past Memories
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            style={{ 
              background: confirmDeleteId === 'all' ? 'var(--danger)' : 'rgba(239, 68, 68, 0.08)', 
              border: 'none', 
              color: confirmDeleteId === 'all' ? 'white' : 'var(--danger)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '600',
              transition: '0.2s'
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
            <Trash2 size={14} /> {confirmDeleteId === 'all' ? 'Confirm?' : 'Reset'}
          </button>
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex' }}
            onClick={() => setIsAdding(true)}
            className="sidebar-toggle-btn"
            title="Add Memory"
          >
            <Plus size={18} />
          </button>
          <button 
            onClick={onToggleCollapse}
            className="sidebar-toggle-btn"
            style={{ width: '30px', height: '30px', borderRadius: '8px' }}
            title="Minimize Panel to View Map"
          >
            <ChevronLeft size={17} />
          </button>
        </div>
      </div>

      <p style={{ marginBottom: '16px', fontSize: '0.85rem', color: '#64748b' }}>
        {memories.length > 0 ? 'Relive past journeys, locations, and media.' : 'No memories yet. Click + to add your first memory!'}
      </p>

      {loading && <div style={{ textAlign: 'center', marginBottom: '16px' }}><Loader className="animate-spin" size={20} color="var(--accent)" /></div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {memories.map((mem) => (
          <div 
            key={mem.id} 
            onClick={() => handleLocateMemory(mem)}
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              transition: '0.2s',
              cursor: 'pointer'
            }} className="memory-card">
            <div style={{ height: '160px', width: '100%', position: 'relative', background: '#f1f5f9' }}>
              {mem.media_url ? (
                <img 
                  src={mem.media_url} 
                  alt={mem.location} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
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
                gap: '6px'
              }}>
                <ImageIcon color="#94a3b8" size={28} />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No Media Attached</span>
              </div>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                padding: '5px',
                borderRadius: '50%',
                display: 'flex'
              }}>
                {mem.type === 'video' ? <Video size={14} color="white" /> : <ImageIcon size={14} color="white" />}
              </div>
            </div>
            
            <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {mem.location}
                  {mem.lat && <MapPin size={13} color="var(--accent)" />}
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(mem.date).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={(e) => handleDeleteMemory(e, mem.id)}
                  style={{ 
                    background: confirmDeleteId === mem.id ? 'var(--danger)' : 'none', 
                    border: 'none', 
                    color: confirmDeleteId === mem.id ? 'white' : 'var(--danger)', 
                    cursor: 'pointer', 
                    padding: '6px', 
                    borderRadius: '6px',
                    fontSize: '0.7rem'
                  }}
                  disabled={deletingId === mem.id}
                  title="Delete Memory"
                >
                  {deletingId === mem.id ? <Loader className="animate-spin" size={15} /> : 
                   confirmDeleteId === mem.id ? <span>Confirm?</span> : <Trash2 size={16} />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleFavorite(mem.id, mem.is_favorite); }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    padding: '6px'
                  }}
                  title="Favorite"
                >
                  <Heart 
                    size={18} 
                    color={mem.is_favorite ? '#ef4444' : '#94a3b8'} 
                    fill={mem.is_favorite ? '#ef4444' : 'none'}
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
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
      `}</style>
    </div>
  );
};

export default MemoriesPanel;
