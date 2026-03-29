import React from 'react';
import { X, Search, MapPin, Star, Phone, Globe } from 'lucide-react';

const RecommendationModal = ({ data, onClose }) => {
  if (!data) return null;

  // Mock recommendations based on location (dummy for now)
  const recommendations = [
    { id: 101, name: 'Seaside Bistro', type: 'Restaurant', rating: 4.8, distance: '0.2 km', address: '123 Beach Blvd' },
    { id: 102, name: 'Ocean View Crafts', type: 'Shop', rating: 4.5, distance: '0.5 km', address: '45 Sunset Rd' },
    { id: 103, name: 'Sunset Pier', type: 'Site', rating: 4.9, distance: '1.2 km', address: 'West Shoreline' },
  ];

  return (
    <div className="overlay" onClick={onClose}>
      <div 
        className="modal glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out', maxWidth: '450px' }}
      >
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Search size={20} color="var(--accent)" />
            Local Recommendations
          </h2>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
            Popular spots in {data.loc || 'the area'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {recommendations.map((spot) => (
            <div 
              key={spot.id} 
              className="glass-highlight-panel" 
              style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: '0.2s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary-text)' }}>{spot.name}</h4>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(76, 175, 80, 0.15)', color: 'var(--accent)', fontWeight: '500' }}>
                    {spot.type}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffc107', fontSize: '0.9rem' }}>
                  <Star size={14} fill="#ffc107" />
                  {spot.rating}
                </div>
              </div>

              <div style={{ color: 'var(--secondary-text)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> {spot.address} ({spot.distance})
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> Call</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={14} /> Visit Website</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="btn" 
          style={{ width: '100%', marginTop: '24px' }}
          onClick={onClose}
        >
          Explore Full List
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .glass-highlight-panel:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: var(--accent) !important;
        }
      `}</style>
    </div>
  );
};

export default RecommendationModal;
