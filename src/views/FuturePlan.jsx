import React, { useState, useEffect } from 'react';
import { Calendar, Send, Compass, Loader } from 'lucide-react';
import { fetchFuturePlans, addFuturePlan, resetFuturePlans } from '../lib/dataStore';
import { Trash2, AlertTriangle, Loader as LoaderIcon } from 'lucide-react';

const FuturePlan = ({ autoOpenWith, clearAutoOpen }) => {
  const [dest, setDest] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (autoOpenWith) {
      setLat(autoOpenWith.lat);
      setLng(autoOpenWith.lng);
      
      // Auto-fetch location name
      setIsFetching(true);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${autoOpenWith.lat}&lon=${autoOpenWith.lng}`, {
        headers: { 'User-Agent': 'TravelMateApp/1.0' }
      })
      .then(r => r.json())
      .then(data => {
        if (data && data.display_name) {
          const name = data.address.city || data.address.town || data.address.village || data.address.suburb || data.display_name.split(',')[0];
          setDest(name);
        }
      })
      .finally(() => setIsFetching(false));
    }
  }, [autoOpenWith]);

  const loadPlans = async () => {
    setLoading(true);
    const data = await fetchFuturePlans();
    setPlans(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSavePlan = async () => {
    if (!dest || !date) return;
    setSaving(true);
    const newPlan = { 
      destination: dest, 
      date, 
      status: 'Planning',
      lat: lat,
      lng: lng
    };
    const saved = await addFuturePlan(newPlan);
    if (saved) {
      setPlans(prev => [saved, ...prev]);
      setDest('');
      setLat(null);
      setLng(null);
      if (clearAutoOpen) clearAutoOpen();
    }
    setSaving(false);
  };

  const handleResetPlans = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }

    setLoading(true);
    await resetFuturePlans();
    setPlans([]);
    setConfirmReset(false);
    setLoading(false);
  };

  return (
    <div className="dashboard-panel glass-panel" style={{ right: '24px', left: 'auto', width: '400px' }}>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar className="icon" /> 
          Future Destinations
        </div>
        <button 
          onClick={handleResetPlans}
          style={{ 
            background: confirmReset ? 'var(--danger)' : 'none', 
            border: 'none', 
            color: confirmReset ? 'white' : 'var(--danger)', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            transition: '0.3s'
          }}
        >
          <Trash2 size={16} /> {confirmReset ? 'Confirm?' : 'Reset'}
        </button>
      </div>
      <p style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--secondary-text)' }}>
        Draft up your upcoming adventures. Pick a location on the map first to auto-fill!
      </p>

      {/* Form to add a plan */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 2, position: 'relative' }}>
            <input 
              type="text" 
              placeholder={isFetching ? "Fetching name..." : "Where to next?"}
              value={dest} 
              onChange={(e) => setDest(e.target.value)} 
              className="input" 
              style={{ marginBottom: 0, width: '100%' }} 
              disabled={isFetching}
            />
            {lat && (
              <div style={{ position: 'absolute', top: '-18px', right: '0', fontSize: '0.65rem', color: 'var(--accent)' }}>
                📍 {lat.toFixed(2)}, {lng.toFixed(2)}
              </div>
            )}
          </div>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="input" 
            style={{ marginBottom: 0, flex: 1 }} 
          />
        </div>
        <button 
          className="btn" 
          onClick={handleSavePlan}
          disabled={saving || isFetching}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
        >
          {saving ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
          {saving ? 'Saving...' : 'Save Plan'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '8px' }}>Upcoming Trips</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><Loader className="animate-spin" size={24} color="var(--accent)" /></div>
        ) : plans.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', textAlign: 'center' }}>No plans yet. Start dreaming!</p>
        ) : (
          plans.map((p) => (
            <div key={p.id} style={{ padding: '12px', background: 'var(--glass-highlight)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '50%' }}>
                <Compass size={20} color="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.95rem' }}>{p.destination}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>{p.date} &bull; <span style={{ color: p.status === 'Planning' ? 'var(--accent)' : 'var(--success)' }}>{p.status}</span></p>
                {p.lat && <p style={{ fontSize: '0.6rem', color: '#555' }}>Coords: {p.lat}, {p.lng}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default FuturePlan;
