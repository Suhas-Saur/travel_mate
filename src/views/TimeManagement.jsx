import React, { useState, useEffect } from 'react';
import { Clock, Navigation, Plus, Send, Loader, MapPin } from 'lucide-react';
import { fetchItinerary, addItinerary, deleteItinerary, resetItinerary } from '../lib/dataStore';
import { Trash2, AlertTriangle, Loader as LoaderIcon } from 'lucide-react';

const TimeManagement = ({ onPinSelect, autoOpenWith, clearAutoOpen }) => {
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
    e.stopPropagation(); // Avoid triggering locate
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

  return (
    <div className="dashboard-panel glass-panel" style={{ right: '24px', left: 'auto', width: '400px' }}>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock className="icon" /> 
          Daily Itinerary
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handleResetItinerary}
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
          <button 
            onClick={() => setShowAdd(!showAdd)}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <p style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--secondary-text)' }}>
        Your chronological schedule. Click an item to locate it on the map.
      </p>

      {showAdd && (
        <form onSubmit={handleAddEvent} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <input 
              type="text" placeholder="Activity Name" className="input" required
              value={newEvent.event_name} onChange={e => setNewEvent({...newEvent, event_name: e.target.value})}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <input 
              type="time" className="input" style={{ marginBottom: 0 }}
              value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})}
            />
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder={isFetchingName ? "Fetching location..." : "Location Name"} 
                className="input" 
                style={{ marginBottom: 0, paddingRight: '30px', opacity: isFetchingName ? 0.7 : 1 }}
                value={newEvent.location_name} 
                onChange={e => setNewEvent({...newEvent, location_name: e.target.value})}
                disabled={isFetchingName}
              />
              {isFetchingName && (
                <LoaderIcon size={14} className="animate-spin" style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--accent)' }} />
              )}
            </div>
          </div>
          <div style={{ display: 'none' }}>
            <input type="number" value={newEvent.lat} readOnly />
            <input type="number" value={newEvent.lng} readOnly />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }} disabled={saving}>
            {saving ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
            Save to Schedule
          </button>
        </form>
      )}

      <div style={{ 
        position: 'relative', 
        paddingLeft: '24px', 
        borderLeft: '2px solid rgba(59, 130, 246, 0.3)',
        maxHeight: '450px',
        overflowY: 'auto'
      }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}><Loader className="animate-spin" size={24} color="var(--accent)" /></div>
        ) : schedule.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>No activities planned yet.</p>
        ) : (
          schedule.map((item, idx) => (
            <div 
              key={item.id} 
              onClick={() => handleLocate(item)}
              style={{ marginBottom: '24px', position: 'relative', cursor: 'pointer' }}
              className="itinerary-item"
            >
              <div style={{
                position: 'absolute',
                left: '-32px',
                top: '4px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'var(--accent)',
                border: '3px solid var(--bg-darker)',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
              }}></div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', transition: '0.2s' }}>
                <h4 style={{ fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{item.time}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12}/> {item.location_name || 'Locate'}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteItinerary(e, item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? <Loader className="animate-spin" size={14} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </h4>
                <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--secondary-text)' }}>
                  {item.event_name}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .itinerary-item:hover div {
          background: rgba(255, 255, 255, 0.08) !important;
          transform: translateX(4px);
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default TimeManagement;
