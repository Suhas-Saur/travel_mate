import React, { useState, useEffect } from 'react';
import { Clock, Navigation, Plus, Send, Loader, MapPin, Trash2, ChevronLeft, X } from 'lucide-react';
import { fetchItinerary, addItinerary, deleteItinerary, resetItinerary } from '../lib/dataStore';

const TimeManagement = ({ onPinSelect, autoOpenWith, clearAutoOpen, isCollapsed, onToggleCollapse }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_name: '',
    time: '12:00',
    location_name: '',
    lat: '',
    lng: ''
  });
  const [deletingId, setDeletingId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isFetchingName, setIsFetchingName] = useState(false);

  useEffect(() => {
    if (autoOpenWith) {
      setShowAdd(true);
      setNewEvent(prev => ({ ...prev, lat: autoOpenWith.lat, lng: autoOpenWith.lng }));
      
      setIsFetchingName(true);
      const fetchLocationName = async () => {
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${autoOpenWith.lat}&lon=${autoOpenWith.lng}`, {
            headers: { 'User-Agent': 'TravelMateApp/1.0' }
          });
          const data = await resp.json();
          if (data && data.address) {
            const locName = data.address.city || data.address.suburb || data.address.town || data.address.village || data.address.country || 'Selected Location';
            setNewEvent(prev => ({ ...prev, location_name: locName }));
          } else {
            setNewEvent(prev => ({ ...prev, location_name: 'Itinerary Stop' }));
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setNewEvent(prev => ({ ...prev, location_name: 'New Location' }));
        } finally {
          setIsFetchingName(false);
        }
      };
      fetchLocationName();
    }
  }, [autoOpenWith]);

  const loadSchedule = async () => {
    setLoading(true);
    const data = await fetchItinerary();
    setSchedule(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.event_name || !newEvent.lat || !newEvent.lng) return;
    setSaving(true);
    const saved = await addItinerary({
      ...newEvent,
      lat: parseFloat(newEvent.lat),
      lng: parseFloat(newEvent.lng)
    });
    if (saved) {
      setSchedule(prev => [...prev, saved].sort((a, b) => a.time.localeCompare(b.time)));
      setNewEvent({ event_name: '', time: '12:00', location_name: '', lat: '', lng: '' });
      setShowAdd(false);
      if (clearAutoOpen) clearAutoOpen();
    }
    setSaving(false);
  };

  const handleLocate = (item) => {
    if (onPinSelect) {
      onPinSelect({ lat: item.lat, lng: item.lng, zoom: 16 });
    }
  };

  const handleDeleteItinerary = async (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    const success = await deleteItinerary(id);
    if (success) {
      setSchedule(prev => prev.filter(item => item.id !== id));
    }
    setDeletingId(null);
  };

  const handleResetItinerary = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }

    setLoading(true);
    await resetItinerary();
    setSchedule([]);
    setConfirmReset(false);
    setLoading(false);
  };

  if (isCollapsed) {
    return (
      <button 
        onClick={onToggleCollapse}
        className="panel-expand-pill"
        title="Expand Itinerary"
      >
        <Clock size={18} color="var(--accent)" />
        <span>Open Day Itinerary ({schedule.length})</span>
        <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
      </button>
    );
  }

  return (
    <div className="dashboard-panel glass-panel">
      <div className="panel-header-row">
        <div className="panel-title">
          <Clock className="icon" color="var(--accent)" /> 
          Daily Itinerary
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={handleResetItinerary}
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
            onClick={() => setShowAdd(!showAdd)}
            className="sidebar-toggle-btn"
            style={{ width: '30px', height: '30px', borderRadius: '8px', color: 'var(--accent)' }}
            title="Add Activity"
          >
            {showAdd ? <X size={17} /> : <Plus size={17} />}
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
        Chronological schedule. Click any stop to fly to it on the map.
      </p>

      {showAdd && (
        <form onSubmit={handleAddEvent} style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)', marginBottom: '18px' }}>
          <div style={{ marginBottom: '10px' }}>
            <input 
              type="text" placeholder="Activity (e.g. Visit Eiffel Tower)" className="input" required style={{ marginBottom: 0 }}
              value={newEvent.event_name} onChange={e => setNewEvent({...newEvent, event_name: e.target.value})}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <input 
              type="time" className="input" style={{ marginBottom: 0 }}
              value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})}
            />
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder={isFetchingName ? "Fetching name..." : "Location Name"} 
                className="input" 
                style={{ marginBottom: 0, paddingRight: '28px', opacity: isFetchingName ? 0.7 : 1 }}
                value={newEvent.location_name} 
                onChange={e => setNewEvent({...newEvent, location_name: e.target.value})}
                disabled={isFetchingName}
              />
              {isFetchingName && (
                <Loader size={14} className="animate-spin" style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--accent)' }} />
              )}
            </div>
          </div>
          <button type="submit" className="btn" style={{ width: '100%' }} disabled={saving}>
            {saving ? <Loader className="animate-spin" size={15} /> : <Send size={15} />}
            Save to Schedule
          </button>
        </form>
      )}

      <div style={{ 
        position: 'relative', 
        paddingLeft: '20px', 
        borderLeft: '2px solid rgba(59, 130, 246, 0.35)',
        maxHeight: 'calc(100vh - 220px)',
        overflowY: 'auto'
      }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}><Loader className="animate-spin" size={20} color="var(--accent)" /></div>
        ) : schedule.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: '#64748b', padding: '10px 0' }}>No itinerary events yet. Drop a pin on map to add one!</p>
        ) : (
          schedule.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleLocate(item)}
              style={{ marginBottom: '16px', position: 'relative', cursor: 'pointer' }}
              className="itinerary-item"
            >
              <div style={{
                position: 'absolute',
                left: '-27px',
                top: '6px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'var(--accent)',
                border: '2px solid #ffffff',
                boxShadow: '0 0 8px var(--accent-glow)'
              }}></div>

              <div style={{ background: 'rgba(255, 255, 255, 0.85)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', transition: '0.2s' }}>
                <div style={{ fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem', color: '#0f172a' }}>
                  <span>{item.time}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                      <MapPin size={12}/> {item.location_name || 'Locate'}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteItinerary(e, item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                      disabled={deletingId === item.id}
                      title="Delete"
                    >
                      {deletingId === item.id ? <Loader className="animate-spin" size={14} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
                <p style={{ marginTop: '4px', fontSize: '0.85rem', color: '#475569' }}>
                  {item.event_name}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .itinerary-item:hover div {
          transform: translateX(2px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  );
};

export default TimeManagement;
