import React, { useState, useEffect } from 'react';
import { Calendar, Send, Compass, Loader, Trash2, ChevronLeft, MapPin } from 'lucide-react';
import { fetchFuturePlans, addFuturePlan, resetFuturePlans } from '../lib/dataStore';

const FuturePlan = ({ autoOpenWith, clearAutoOpen, isCollapsed, onToggleCollapse }) => {
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

  if (isCollapsed) {
    return (
      <button 
        onClick={onToggleCollapse}
        className="panel-expand-pill"
        title="Expand Future Plans"
      >
        <Calendar size={18} color="var(--accent)" />
        <span>Open Future Plans ({plans.length})</span>
        <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
      </button>
    );
  }

  return (
    <div className="dashboard-panel glass-panel">
      <div className="panel-header-row">
        <div className="panel-title">
          <Calendar className="icon" color="var(--accent)" /> 
          Future Tour Plan
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={handleResetPlans}
            style={{ 
              background: confirmReset ? 'var(--danger)' : 'rgba(239, 68, 68, 0.08)', 
              border: 'none', 
              color: confirmReset ? 'white' : 'var(--danger)', 
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
          >
            <Trash2 size={14} /> {confirmReset ? 'Confirm?' : 'Reset'}
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
        Plan upcoming destinations and track travel countdowns.
      </p>

      {/* Form to add a plan */}
      <div style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
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
              <div style={{ position: 'absolute', top: '-18px', right: '0', fontSize: '0.7rem', color: 'var(--accent)', fontWeight: '600' }}>
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
          {saving ? <Loader className="animate-spin" size={15} /> : <Send size={15} />}
          Save Future Plan
        </button>
      </div>

      <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>Upcoming Destinations</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><Loader className="animate-spin" size={20} color="var(--accent)" /></div>
        ) : plans.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '20px' }}>No plans yet. Click on the map or enter a city above!</p>
        ) : (
          plans.map((p) => (
            <div key={p.id} style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.85)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '10px', color: '#d97706' }}>
                <Compass size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a' }}>{p.destination}</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  📅 {p.date} &bull; <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{p.status}</span>
                </p>
                {p.lat && <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Coords: {p.lat.toFixed(2)}, {p.lng.toFixed(2)}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FuturePlan;
