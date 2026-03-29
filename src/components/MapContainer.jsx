import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, MapPin, Navigation, Loader, Plus, Coffee, Utensils, Home, Camera, Crosshair, ShoppingBag, Trash2 } from 'lucide-react';
import { fetchMemories, fetchItinerary, fetchFuturePlans, deleteMemory, deleteFuturePlan } from '../lib/dataStore';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;

const historyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const itineraryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const pendingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const futurePlanIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultCenter = [20, 0];

// Sub-component to handle map events (clicks)
const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Sub-component to handle map refocusing
const RecenterMap = ({ focus }) => {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.flyTo([focus.lat, focus.lng], focus.zoom || 14);
    }
  }, [focus, map]);
  return null;
};

const MapContainer = ({ onMemorySelect, mapFocus, onMapClick, userLocation }) => {
  const [markers, setMarkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pendingMarker, setPendingMarker] = useState(null);
  const [nearbyPOIs, setNearbyPOIs] = useState([]);
  const [isExploring, setIsExploring] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [poiFilter, setPoiFilter] = useState('none'); // 'none' | 'shops'
  const [mapInstance, setMapInstance] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [memories, itinerary, futurePlans] = await Promise.all([
        fetchMemories(),
        fetchItinerary(),
        fetchFuturePlans()
      ]);

      const memoryMarkers = (memories || []).map(m => ({ ...m, type: 'history', title: m.location }));
      const itineraryMarkers = (itinerary || []).map(i => ({ ...i, type: 'itinerary', title: i.event_name }));
      const futureMarkers = (futurePlans || []).map(p => ({ 
        ...p, 
        type: 'future', 
        title: p.destination,
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lng) 
      })).filter(p => !isNaN(p.lat) && !isNaN(p.lng));

      setMarkers([...memoryMarkers, ...itineraryMarkers, ...futureMarkers]);
    } catch (err) {
      console.error('Failed to load map data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleLocateMe = () => {
    if (userLocation && mapInstance) {
      mapInstance.flyTo([userLocation.lat, userLocation.lng], 15);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setNearbyPOIs([]); // Clear old discovery results
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await resp.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);
        const result = { lat: newLat, lng: newLon, name: display_name };
        setPendingMarker(result);
        setShowSearchPopup(true);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExploreNearby = async (lat, lng) => {
    setIsExploring(true);
    setShowSearchPopup(false);
    // Determine Overpass query based on filter
    let amenityFilter = 'restaurant|cafe|hotel|pub|tourism|museum|viewpoint';
    if (poiFilter === 'shops') {
      amenityFilter = 'shop|mall|department_store|supermarket|convenience';
    }

    try {
      // Overpass API for POIs
      const query = `[out:json];node(around:2000,${lat},${lng})[amenity~"${amenityFilter}"];out;`;
      const resp = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (data && data.elements) {
        setNearbyPOIs(data.elements.map(e => ({
          id: e.id,
          lat: e.lat,
          lng: e.lon,
          name: e.tags.name || 'Unnamed Spot',
          type: e.tags.amenity || e.tags.tourism || 'Point of Interest'
        })));
      }
    } catch (err) {
      console.error('Discovery failed:', err);
    } finally {
      setIsExploring(false);
    }
  };

  const handleInternalClick = (lat, lng) => {
    setPendingMarker({ lat, lng, name: 'Dropped Pin' });
    if (onMapClick) onMapClick(lat, lng);
  };

  const handleDelete = async (marker) => {
    const isConfirmed = window.confirm(`Permanently delete this ${marker.type}?`);
    if (!isConfirmed) return;

    let success = false;
    if (marker.type === 'history') {
      success = await deleteMemory(marker.id);
    } else if (marker.type === 'future') {
      success = await deleteFuturePlan(marker.id);
    }

    if (success) {
      loadData();
    } else {
      alert('Delete failed. Please try again.');
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
      {/* Search Bar Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '100%',
        maxWidth: '400px',
        padding: '0 20px'
      }}>
        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
            <button 
              type="button"
              onClick={() => setPoiFilter('none')}
              style={{ padding: '6px 12px', borderRadius: '15px', border: 'none', background: poiFilter === 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.8)', color: poiFilter === 'none' ? 'white' : '#444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }}
            >
              All POIs
            </button>
            <button 
              type="button"
              onClick={() => setPoiFilter('shops')}
              style={{ padding: '6px 12px', borderRadius: '15px', border: 'none', background: poiFilter === 'shops' ? 'var(--accent)' : 'rgba(255,255,255,0.8)', color: poiFilter === 'shops' ? 'white' : '#444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }}
            >
              <ShoppingBag size={12} style={{ marginRight: '4px' }} />
              Malls & Shops
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Search for a city or area..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 45px 12px 20px',
              borderRadius: '25px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontSize: '0.95rem',
              color: '#333'
            }}
          />
          <button type="submit" style={{ position: 'absolute', right: '15px', bottom: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}>
            <Search size={20} className={isSearching ? 'animate-spin' : ''} />
          </button>
        </form>
      </div>

      <LeafletMap 
        center={defaultCenter} 
        zoom={3} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={setMapInstance}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapEvents onMapClick={handleInternalClick} />
        <RecenterMap focus={pendingMarker ? { lat: pendingMarker.lat, lng: pendingMarker.lng, zoom: 12 } : mapFocus} />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div style={{ textAlign: 'center', color: '#000' }}>
                <strong style={{ display: 'block' }}>You are here</strong>
                <span style={{ fontSize: '0.8rem' }}>Live tracking active</span>
              </div>
            </Popup>
          </Marker>
        )}

        {pendingMarker && (
          <Marker position={[pendingMarker.lat, pendingMarker.lng]} icon={pendingIcon}>
            {showSearchPopup && (
              <Popup position={[pendingMarker.lat, pendingMarker.lng]} onClose={() => setShowSearchPopup(false)}>
                <div style={{ padding: '4px', minWidth: '200px', color: '#000' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#111' }}>{pendingMarker.name}</h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: '#666' }}>Selected Destination</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={() => onMapClick(pendingMarker.lat, pendingMarker.lng, 'history')}
                      style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                    >
                      <Plus size={14} /> Add to Memories
                    </button>
                    <button 
                      onClick={() => onMapClick(pendingMarker.lat, pendingMarker.lng, 'time')}
                      style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                    >
                      <Plus size={14} /> Add to Itinerary
                    </button>
                    <button 
                      onClick={() => onMapClick(pendingMarker.lat, pendingMarker.lng, 'future')}
                      style={{ background: '#a855f7', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                    >
                      <Plus size={14} /> Add to Future Plan
                    </button>
                    <button 
                      onClick={() => handleExploreNearby(pendingMarker.lat, pendingMarker.lng)}
                      style={{ border: '1px solid #ddd', background: 'white', color: '#444', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                      disabled={isExploring}
                    >
                      {isExploring ? <Loader className="animate-spin" size={14} /> : <Navigation size={14} />}
                      Explore Nearby
                    </button>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        )}

        {nearbyPOIs.map(poi => (
          <Marker 
            key={poi.id} 
            position={[poi.lat, poi.lng]} 
            icon={itineraryIcon} // Blue icons for nearby stuff
          >
            <Popup>
              <div style={{ color: '#000', minWidth: '150px' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{poi.name}</strong>
                <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'capitalize' }}>
                  {poi.type.replace(/_/g, ' ')}
                </span>
                <button 
                  onClick={() => onMapClick(poi.lat, poi.lng, 'time')}
                  style={{ display: 'block', marginTop: '10px', background: '#3b82f6', color: 'white', border: 'none', width: '100%', padding: '6px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Add to Itinerary
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {markers.map((marker) => (
          <Marker 
            key={`${marker.type}-${marker.id}`} 
            position={[marker.lat, marker.lng]}
            icon={
              marker.type === 'history' ? historyIcon : 
              marker.type === 'future' ? futurePlanIcon : 
              itineraryIcon
            }
            eventHandlers={{
              contextmenu: () => handleDelete(marker),
              dblclick: () => handleDelete(marker)
            }}
          >
            <Popup>
              <div style={{ color: '#000', minWidth: '150px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '0.95rem', fontWeight: '700' }}>{marker.title}</h3>
                  <button 
                    onClick={() => handleDelete(marker)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', opacity: 0.6 }}
                    title="Delete Pin"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <p style={{ margin: '5px 0', fontSize: '0.8rem', color: '#666' }}>
                  {marker.type === 'history' ? '🌍 Past Memory' : 
                   marker.type === 'future' ? '🚀 Future Destination' : 
                   '📍 Itinerary Stop'}
                </p>
                
                {marker.type === 'history' && marker.media_url && (
                  <div style={{ width: '100%', height: '80px', borderRadius: '4px', overflow: 'hidden', margin: '8px 0' }}>
                    <img src={marker.media_url} alt={marker.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                {marker.time && <p style={{ fontSize: '0.8rem', fontWeight: '600', margin: '4px 0' }}>⏰ {marker.time}</p>}
                {marker.date && <p style={{ fontSize: '0.8rem', color: '#888', margin: '2px 0' }}>📅 {marker.date}</p>}
                
                {marker.type === 'history' && (
                  <button 
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginTop: '8px', width: '100%', fontWeight: '500', fontSize: '0.8rem' }}
                    onClick={() => onMemorySelect && onMemorySelect(marker)}
                  >
                    View Details
                  </button>
                )}
                
                <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                  Tip: Right-click pin to delete instantly
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMap>

      {/* Locate Me Floating Button */}
      <button 
        onClick={handleLocateMe}
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '30px', /* Moved to left to avoid being covered by panels */
          zIndex: 1000,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          color: 'var(--accent)'
        }}
        title="Locate Me"
      >
        <Crosshair size={24} />
      </button>
    </div>
  );
};

export default MapContainer;
