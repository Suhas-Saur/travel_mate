import React, { useState, useEffect } from 'react';
import { Compass, Zap, Map as MapIcon, Trophy, PlusCircle, Calendar, DollarSign, Search, MapPin, Loader, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resetUserData, fetchMemories } from '../lib/dataStore';

const Dashboard = ({ userLocation }) => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('Locating...');
  const [loading, setLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState('idle'); // idle, confirming, resetting, success
  const [stats, setStats] = useState({ countries: 0, level: 1, badge: 'Beginner' });

  const loadStats = async () => {
    const memories = await fetchMemories();
    if (memories && memories.length > 0) {
      // Extract unique countries (assuming location name might contain country or we search for it)
      // For now, let's look for unique 'country' if it exists or unique location names
      const countriesList = memories.map(m => {
        const parts = m.location.split(',');
        return parts[parts.length - 1].trim(); 
      });
      const uniqueCountries = new Set(countriesList).size;
      const level = Math.floor(memories.length / 3) + 1;
      
      let badge = 'Explorer';
      if (level > 2) badge = 'Globetrotter';
      if (level > 5) badge = 'World Traveler';
      if (level > 10) badge = 'Legendary Nomad';

      setStats({ countries: uniqueCountries, level, badge });
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleReset = async () => {
    if (resetStatus === 'idle') {
      setResetStatus('confirming');
      setTimeout(() => setResetStatus('idle'), 5000); // Reset button after 5s
      return;
    }

    setResetStatus('resetting');
    const success = await resetUserData();
    if (success) {
      setResetStatus('success');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setResetStatus('idle');
      alert('Reset failed. Please try again.');
    }
  };

  useEffect(() => {
    if (userLocation) {
      const fetchAddress = async () => {
        setLoading(true);
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`, {
            headers: { 'User-Agent': 'TravelMateApp/1.0' }
          });
          const data = await resp.json();
          if (data && data.address) {
            setAddress(`${data.address.city || data.address.town || data.address.suburb || 'Unknown'}, ${data.address.country}`);
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchAddress();
    }
  }, [userLocation]);

  return (
    <div className="dashboard-panel glass-panel">
      <div className="panel-title">
        <Compass size={24} color="var(--accent)" />
        Travel Command Center
      </div>
      
      <p style={{ marginBottom: '24px', color: 'var(--secondary-text)' }}>
        Welcome back! Your live adventure dashboard is ready.
      </p>

      {/* Live Status Card */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '20px', 
        borderRadius: '16px', 
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(33, 150, 243, 0.15))', 
        border: '1px solid var(--accent)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
          <MapPin size={100} />
        </div>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '1rem' }}>
          <Trophy size={18} color="var(--accent)" />
          Current Position
        </h4>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading ? <Loader className="animate-spin" size={20} /> : <MapPin size={20} color="var(--accent)" />}
          {userLocation ? address : 'Waiting for GPS...'}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginTop: '8px' }}>
          {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Enable location to track your journey live.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <Zap size={20} color="#ffab00" style={{ marginBottom: '8px' }} />
          <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>Level {stats.level}</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Travel Badge: {stats.badge}</p>
        </div>
        
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <MapIcon size={20} color="var(--accent)" style={{ marginBottom: '8px' }} />
          <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>{stats.countries} Countries</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Global Footprint</p>
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: '600' }}>Quick Options</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        <button onClick={() => navigate('/history')} className="option-btn">
          <PlusCircle size={18} /> Add Memory
        </button>
        <button onClick={() => navigate('/time')} className="option-btn">
          <Calendar size={18} /> Plan Today
        </button>
        <button onClick={() => navigate('/costs')} className="option-btn">
          <DollarSign size={18} /> Check Costs
        </button>
        <button onClick={() => navigate('/history')} className="option-btn" style={{ background: 'var(--accent)', color: 'white' }}>
          <Search size={18} /> Search Map
        </button>
      </div>

      {/* Dangerous Zone */}
      <div style={{ 
        marginTop: '32px', 
        paddingTop: '24px', 
        borderTop: '1px solid var(--glass-border)' 
      }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--danger)' }}>
          <AlertTriangle size={16} /> Dangerous Zone
        </h4>
        <button 
          onClick={handleReset}
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '12px', 
            background: resetStatus === 'confirming' ? 'var(--danger)' : 'rgba(211, 47, 47, 0.1)',
            border: resetStatus === 'confirming' ? 'none' : '1px solid rgba(211, 47, 47, 0.2)',
            color: resetStatus === 'confirming' ? 'white' : 'var(--danger)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: '0.3s'
          }}
          disabled={resetStatus === 'resetting' || resetStatus === 'success'}
        >
          {resetStatus === 'resetting' ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
          {resetStatus === 'idle' && 'Reset All Travel Data'}
          {resetStatus === 'confirming' && 'Confirm Reset? (Action is permanent)'}
          {resetStatus === 'resetting' && 'Cleaning up...'}
          {resetStatus === 'success' && 'Data Wiped Successfully!'}
        </button>
      </div>

      <style>{`
        .option-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.05);
          color: var(--primary-text);
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: 0.2s;
        }
        .option-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Dashboard;
