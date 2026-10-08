import React, { useState, useEffect, useMemo } from 'react';
import { 
  Compass, Zap, Map as MapIcon, Trophy, PlusCircle, Calendar, 
  DollarSign, Search, MapPin, Loader, Trash2, AlertTriangle, 
  CloudSun, CloudRain, Sun, Wind, Droplets, CheckSquare, Square, 
  ArrowRight, ArrowUpDown, ChevronLeft, Maximize2, Minimize2, Clock, 
  Sparkles, CheckCircle2, ShieldCheck, Plus, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resetUserData, fetchMemories, fetchFuturePlans, fetchBudget, fetchExpenses } from '../lib/dataStore';

const Dashboard = ({ userLocation, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('Locating GPS...');
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [resetStatus, setResetStatus] = useState('idle');
  const [stats, setStats] = useState({ countries: 0, level: 1, badge: 'Beginner', totalMemories: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Weather state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Next trip state
  const [nextTrip, setNextTrip] = useState(null);

  // Budget progress state
  const [budgetData, setBudgetData] = useState({ budget: 5000, totalSpent: 0 });

  // Packing checklist state (stored in localStorage)
  const defaultChecklist = [
    { id: 1, text: 'Passport & Visa documents', done: true },
    { id: 2, text: 'Universal power adapter & charger', done: false },
    { id: 3, text: 'Travel insurance & booking tickets', done: true },
    { id: 4, text: 'First-aid kit & medications', done: false },
    { id: 5, text: 'Local currency & international travel card', done: false }
  ];

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('travel_mate_checklist');
      return saved ? JSON.parse(saved) : defaultChecklist;
    } catch {
      return defaultChecklist;
    }
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);

  // Currency Converter state
  const [convAmount, setConvAmount] = useState('100');
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('EUR');

  const EXCHANGE_RATES = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 154.2,
    INR: 83.4,
    AUD: 1.52,
    CAD: 1.37,
    SGD: 1.35,
    AED: 3.67,
    CHF: 0.91
  };

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save checklist
  useEffect(() => {
    try {
      localStorage.setItem('travel_mate_checklist', JSON.stringify(checklist));
    } catch (e) {
      console.error(e);
    }
  }, [checklist]);

  // Load stats, next trip, and budget
  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        const [memories, futurePlans, budget, expenses] = await Promise.all([
          fetchMemories(),
          fetchFuturePlans(),
          fetchBudget(),
          fetchExpenses()
        ]);

        // Stats calculation
        if (memories && memories.length > 0) {
          const countriesList = memories.map(m => {
            const parts = (m.location || '').split(',');
            return parts[parts.length - 1].trim(); 
          }).filter(Boolean);
          const uniqueCountries = new Set(countriesList).size || 1;
          const level = Math.floor(memories.length / 3) + 1;
          
          let badge = 'Explorer';
          if (level > 2) badge = 'Globetrotter';
          if (level > 5) badge = 'World Traveler';
          if (level > 10) badge = 'Legendary Nomad';

          setStats({ countries: uniqueCountries, level, badge, totalMemories: memories.length });
        }

        // Next upcoming trip
        if (futurePlans && futurePlans.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const upcoming = [...futurePlans]
            .filter(p => p.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date));
          if (upcoming.length > 0) {
            setNextTrip(upcoming[0]);
          } else {
            setNextTrip(futurePlans[0]);
          }
        }

        // Budget calculations
        const totalSpent = (expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
        setBudgetData({ budget: budget || 5000, totalSpent });
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      }
    };

    loadOverviewData();
  }, []);

  // Reverse geocoding & Live Weather
  useEffect(() => {
    const targetLat = userLocation?.lat || 28.6139; // Default fallback coordinates (New Delhi / Global)
    const targetLng = userLocation?.lng || 77.2090;

    if (userLocation) {
      setLoadingLoc(true);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`, {
        headers: { 'User-Agent': 'TravelMateApp/1.0' }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const place = data.address.city || data.address.town || data.address.suburb || data.address.state || 'Local Area';
          setAddress(`${place}, ${data.address.country || ''}`);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingLoc(false));
    }

    // Live weather fetching via Open-Meteo
    setWeatherLoading(true);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`)
      .then(res => res.json())
      .then(data => {
        if (data && data.current) {
          const code = data.current.weather_code;
          let cond = 'Clear Sky';
          let icon = 'sun';
          if (code >= 1 && code <= 3) { cond = 'Partly Cloudy'; icon = 'cloud-sun'; }
          else if (code >= 45 && code <= 48) { cond = 'Foggy / Hazy'; icon = 'cloud-sun'; }
          else if (code >= 51 && code <= 67) { cond = 'Light Rain'; icon = 'rain'; }
          else if (code >= 80 && code <= 99) { cond = 'Rain Showers'; icon = 'rain'; }

          setWeather({
            temp: Math.round(data.current.temperature_2m),
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            condition: cond,
            iconType: icon
          });
        }
      })
      .catch(console.error)
      .finally(() => setWeatherLoading(false));
  }, [userLocation]);

  // Greeting based on hour
  const greeting = useMemo(() => {
    const hr = currentTime.getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  }, [currentTime]);

  // Trip countdown calculation
  const countdownDays = useMemo(() => {
    if (!nextTrip || !nextTrip.date) return null;
    const tripDate = new Date(nextTrip.date);
    const now = new Date();
    const diffTime = tripDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [nextTrip]);

  // Converted currency amount
  const convertedAmount = useMemo(() => {
    const val = parseFloat(convAmount) || 0;
    const inUSD = val / (EXCHANGE_RATES[fromCurr] || 1);
    const result = inUSD * (EXCHANGE_RATES[toCurr] || 1);
    return result.toFixed(2);
  }, [convAmount, fromCurr, toCurr]);

  // Checklist handlers
  const toggleChecklist = (id) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    setChecklist(prev => [...prev, { id: Date.now(), text: newChecklistItem.trim(), done: false }]);
    setNewChecklistItem('');
    setShowAddChecklist(false);
  };

  const completedChecklistCount = checklist.filter(c => c.done).length;
  const checklistPercent = checklist.length > 0 ? Math.round((completedChecklistCount / checklist.length) * 100) : 0;

  // Handle data wipe reset
  const handleReset = async () => {
    if (resetStatus === 'idle') {
      setResetStatus('confirming');
      setTimeout(() => setResetStatus('idle'), 5000);
      return;
    }

    setResetStatus('resetting');
    const success = await resetUserData();
    if (success) {
      setResetStatus('success');
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setResetStatus('idle');
      alert('Reset failed. Please try again.');
    }
  };

  // If collapsed, render floating pill
  if (isCollapsed) {
    return (
      <button 
        onClick={onToggleCollapse}
        className="panel-expand-pill"
        title="Expand Dashboard"
      >
        <Compass size={18} color="var(--accent)" />
        <span>Open Travel Center</span>
        <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
      </button>
    );
  }

  const budgetPct = Math.min(100, Math.round((budgetData.totalSpent / (budgetData.budget || 1)) * 100));

  return (
    <div className="dashboard-panel glass-panel">
      {/* ─── Panel Header & Minimize Button ─────────────────── */}
      <div className="panel-header-row">
        <div className="panel-title">
          <Compass size={24} color="var(--accent)" />
          Travel Command Center
        </div>
        <button 
          onClick={onToggleCollapse}
          className="sidebar-toggle-btn"
          title="Minimize Dashboard to View Map"
          style={{ width: '32px', height: '32px', borderRadius: '10px' }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* ─── Hero Greeting & Live Clock ─────────────────────── */}
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
          {greeting}, Explorer! ✈️
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
          <Clock size={14} />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <span>•</span>
          <span>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* ─── Live GPS Position Card ─────────────────────────── */}
      <div style={{ 
        marginBottom: '16px', 
        padding: '16px', 
        borderRadius: '16px', 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.1))', 
        border: '1px solid rgba(16, 185, 129, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.08 }}>
          <MapPin size={90} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px' }}>
            Current Location
          </span>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}></span>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
          {loadingLoc ? <Loader className="animate-spin" size={18} /> : <MapPin size={18} color="var(--accent)" />}
          <span>{userLocation ? address : 'Waiting for GPS signal...'}</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
          {userLocation ? `Coordinates: ${userLocation.lat.toFixed(4)}°, ${userLocation.lng.toFixed(4)}°` : 'Turn on device location to sync map pin automatically.'}
        </div>
      </div>

      {/* ─── Live Weather Forecast Widget ────────────────────── */}
      {weather && (
        <div className="weather-card">
          <div className="weather-header">
            <div>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.85, fontWeight: '700', letterSpacing: '0.5px' }}>
                Local Weather
              </div>
              <div className="weather-temp">{weather.temp}°C</div>
              <div className="weather-condition">{weather.condition}</div>
            </div>
            <div>
              {weather.iconType === 'sun' && <Sun size={36} color="#fbbf24" />}
              {weather.iconType === 'cloud-sun' && <CloudSun size={36} color="#ffffff" />}
              {weather.iconType === 'rain' && <CloudRain size={36} color="#93c5fd" />}
            </div>
          </div>
          <div className="weather-stats">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplets size={14} />
              <span>Humidity: {weather.humidity}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wind size={14} />
              <span>Wind: {weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Upcoming Tour Countdown Banner ─────────────────── */}
      {nextTrip && (
        <div style={{
          marginBottom: '18px',
          padding: '14px 16px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08))',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: '#d97706' }}>
              Upcoming Adventure
            </span>
            <div style={{ fontSize: '0.98rem', fontWeight: '700', color: '#0f172a' }}>
              {nextTrip.destination}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Departure: {nextTrip.date}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#d97706', lineHeight: 1 }}>
              {countdownDays !== null ? `${countdownDays}d` : 'Soon'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Countdown</div>
          </div>
        </div>
      )}

      {/* ─── Travel Explorer Stats ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <Zap size={20} color="#f59e0b" style={{ marginBottom: '6px' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>Level {stats.level}</h4>
          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Badge: {stats.badge}</p>
        </div>
        
        <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <MapIcon size={20} color="var(--accent)" style={{ marginBottom: '6px' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>{stats.countries} Countries</h4>
          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{stats.totalMemories} Memories Logged</p>
        </div>
      </div>

      {/* ─── Budget Burn Meter ──────────────────────────────── */}
      <div style={{ 
        marginBottom: '18px', 
        padding: '14px 16px', 
        borderRadius: '14px', 
        background: 'rgba(255, 255, 255, 0.8)', 
        border: '1px solid rgba(0,0,0,0.06)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700' }}>
            <DollarSign size={16} color="var(--accent)" />
            <span>Budget Overview</span>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: budgetPct > 80 ? 'var(--danger)' : 'var(--accent)' }}>
            ${budgetData.totalSpent.toLocaleString()} / ${budgetData.budget.toLocaleString()} ({budgetPct}%)
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${budgetPct}%`, 
              height: '100%', 
              background: budgetPct > 85 ? 'var(--danger)' : 'var(--accent)', 
              borderRadius: '6px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* ─── Interactive Travel Packing Checklist ───────────── */}
      <div style={{ 
        marginBottom: '18px', 
        padding: '16px', 
        borderRadius: '16px', 
        background: 'rgba(255, 255, 255, 0.85)', 
        border: '1px solid rgba(0,0,0,0.06)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a' }}>Packing Checklist</h4>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {completedChecklistCount} of {checklist.length} packed ({checklistPercent}%)
            </span>
          </div>
          <button 
            onClick={() => setShowAddChecklist(!showAddChecklist)}
            className="sidebar-toggle-btn" 
            style={{ width: '28px', height: '28px', borderRadius: '8px' }}
            title="Add item"
          >
            {showAddChecklist ? <X size={15} /> : <Plus size={15} />}
          </button>
        </div>

        {showAddChecklist && (
          <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <input 
              type="text" 
              placeholder="e.g. Sunglasses, Swimsuit..." 
              value={newChecklistItem} 
              onChange={e => setNewChecklistItem(e.target.value)}
              className="input"
              style={{ marginBottom: 0, padding: '6px 10px', fontSize: '0.8rem' }}
              autoFocus
            />
            <button type="submit" className="btn" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              Add
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {checklist.map(item => (
            <div 
              key={item.id} 
              onClick={() => toggleChecklist(item.id)}
              className={`checklist-item ${item.done ? 'done' : ''}`}
            >
              {item.done ? (
                <CheckCircle2 size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
              ) : (
                <Square size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
              )}
              <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Instant Currency Converter Widget ───────────────── */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        borderRadius: '16px', 
        background: 'rgba(255, 255, 255, 0.85)', 
        border: '1px solid rgba(0,0,0,0.06)' 
      }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
          Instant Currency Exchange
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>Amount</label>
            <input 
              type="number" 
              value={convAmount} 
              onChange={e => setConvAmount(e.target.value)}
              className="input"
              style={{ marginBottom: 0, padding: '6px 10px', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>From</label>
            <select 
              value={fromCurr} 
              onChange={e => setFromCurr(e.target.value)}
              className="input"
              style={{ marginBottom: 0, padding: '6px 8px', fontSize: '0.85rem' }}
            >
              {Object.keys(EXCHANGE_RATES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '8px 12px', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#475569' }}>
            To {toCurr}:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--accent)' }}>
              {convertedAmount} {toCurr}
            </span>
            <select 
              value={toCurr} 
              onChange={e => setToCurr(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: '700', color: '#334155', cursor: 'pointer', outline: 'none' }}
            >
              {Object.keys(EXCHANGE_RATES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Quick Navigation Actions ───────────────────────── */}
      <h4 style={{ fontSize: '0.92rem', marginBottom: '12px', fontWeight: '700', color: '#0f172a' }}>
        Quick Navigation
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '22px' }}>
        <button onClick={() => navigate('/history')} className="option-btn">
          <PlusCircle size={16} color="var(--accent)" /> Past Memories
        </button>
        <button onClick={() => navigate('/time')} className="option-btn">
          <Calendar size={16} color="#3b82f6" /> Day Itinerary
        </button>
        <button onClick={() => navigate('/costs')} className="option-btn">
          <DollarSign size={16} color="#10b981" /> Cost Tracker
        </button>
        <button onClick={() => navigate('/future')} className="option-btn">
          <MapPin size={16} color="#f59e0b" /> Future Plans
        </button>
      </div>

      {/* ─── Dangerous Zone ─────────────────────────────────── */}
      <div style={{ 
        paddingTop: '16px', 
        borderTop: '1px solid rgba(0,0,0,0.08)' 
      }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--danger)' }}>
          <AlertTriangle size={15} /> Dangerous Zone
        </h4>
        <button 
          onClick={handleReset}
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '10px', 
            background: resetStatus === 'confirming' ? 'var(--danger)' : 'rgba(239, 68, 68, 0.08)',
            border: resetStatus === 'confirming' ? 'none' : '1px solid rgba(239, 68, 68, 0.2)',
            color: resetStatus === 'confirming' ? 'white' : 'var(--danger)',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: '0.2s'
          }}
          disabled={resetStatus === 'resetting' || resetStatus === 'success'}
        >
          {resetStatus === 'resetting' ? <Loader className="animate-spin" size={15} /> : <Trash2 size={15} />}
          {resetStatus === 'idle' && 'Reset All Travel Data'}
          {resetStatus === 'confirming' && 'Confirm Reset? (Permanent)'}
          {resetStatus === 'resetting' && 'Cleaning up...'}
          {resetStatus === 'success' && 'Data Wiped Successfully!'}
        </button>
      </div>

      <style>{`
        .option-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.85);
          color: #1e293b;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .option-btn:hover {
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
