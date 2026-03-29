import React from 'react';
import { X, Calendar, MapPin, Image as ImageIcon, Video } from 'lucide-react';

const MemoryModal = ({ memory, onClose }) => {
  if (!memory) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div 
        className="modal glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--primary-text)' }}>
            {memory.title || memory.location || 'Travel Memory'}
          </h2>
          <div style={{ display: 'flex', gap: '16px', color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={16} /> {memory.date || 'No date'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={16} /> {memory.location || 'Unknown Location'}
            </span>
          </div>
        </div>

        <div style={{ 
          width: '100%', 
          height: '300px', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          background: 'rgba(0,0,0,0.1)',
          marginBottom: '20px',
          position: 'relative'
        }}>
          {memory.media_url ? (
            <img 
              src={memory.media_url} 
              alt={memory.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--secondary-text)' }}>
              <ImageIcon size={48} />
              <p>No media available</p>
            </div>
          )}
        </div>

        <div style={{ color: 'var(--primary-text)', lineHeight: '1.6' }}>
          <p>{memory.description || 'No description provided for this memory yet.'}</p>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button className="btn" style={{ flex: 1 }}>Edit Memory</button>
          <button className="btn" style={{ flex: 1, background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', boxShadow: 'none' }}>Share</button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default MemoryModal;
