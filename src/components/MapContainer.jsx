import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Search, MapPin, Navigation, Loader, Plus, Coffee, Utensils, Home, 
  Camera, Crosshair, ShoppingBag, Trash2, Layers, ZoomIn, ZoomOut, 
  Maximize2, Minimize2, Compass, Route, Sparkles, X, Landmark, Bed
} from 'lucide-react';
import { fetchMemories, fetchItinerary, fetchFuturePlans, deleteMemory, deleteFuturePlan } from '../lib/dataStore';

// Fix for default Leaflet marker icons
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
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const futurePlanIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const poiIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [22, 36],
  iconAnchor: [11, 36],
  popupAnchor: [1, -30],
  shadowSize: [36, 36]
});

const defaultCenter = [20, 0];

// Tile Layer Definitions for Google Maps-style Layer Switcher
const TILE_LAYERS = {
  streets: {
    id: 'streets',
    name: 'Street View',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    thumbnail: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=120&auto=format&fit=crop&q=60'
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&auto=format&fit=crop&q=60'
  },
  dark: {
    id: 'dark',
    name: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=120&auto=format&fit=crop&q=60'
  },
  terrain: {
    id: 'terrain',
    name: 'Outdoor Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=120&auto=format&fit=crop&q=60'
  }
};

// Sub-component for clicks on map
const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Sub-component for smooth refocus
const RecenterMap = ({ focus }) => {
  const map = useMap();
  useEffect(() => {
    if (focus && focus.lat && focus.lng) {
      map.flyTo([focus.lat, focus.lng], focus.zoom || 13, { duration: 1.4 });
    }
  }, [focus, map]);
  return null;
};

const MapContainer = ({ onMemorySelect, mapFocus, onMapClick, userLocation, panelOpen = true }) => {
  const [markers, setMarkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pendingMarker, setPendingMarker] = useState(null);
  const [nearbyPOIs, setNearbyPOIs] = useState([]);
  const [isExploring, setIsExploring] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [poiFilter, setPoiFilter] = useState('none');
  const [activeLayer, setActiveLayer] = useState('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const markerRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [memories, itinerary, futurePlans] = await Promise.all([
        fetchMemories(),
        fetchItinerary(),
        fetchFuturePlans()
      ]);

      const memoryMarkers = (memories || []).map(m => ({ 
        ...m, 
        type: 'history', 
        title: m.location,
        lat: parseFloat(m.lat),
        lng: parseFloat(m.lng)
      })).filter(m => !isNaN(m.lat) && !isNaN(m.lng));

      const itineraryMarkers = (itinerary || []).map(i => ({ 
        ...i, 
        type: 'itinerary', 
        title: i.event_name,
        lat: parseFloat(i.lat),
        lng: parseFloat(i.lng)
      })).filter(i => !isNaN(i.lat) && !isNaN(i.lng));

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

  // Google Maps Zoom In / Out
  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };

  // Google Maps Center on User
  const handleLocateMe = () => {
    if (userLocation && mapInstance) {
      mapInstance.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.4 });
    } else if (!userLocation) {
      alert('Locating GPS... please allow location permission or wait a moment.');
    }
  };

  // Google Maps "Fit All Pins"
  const handleFitAllPins = () => {
    if (!mapInstance || markers.length === 0) return;
    const validCoords = markers.map(m => [m.lat, m.lng]);
    if (userLocation) validCoords.push([userLocation.lat, userLocation.lng]);
    const bounds = L.latLngBounds(validCoords);
    mapInstance.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(true));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => setIsFullscreen(false));
      }
    }
  };

  // Search places via Nominatim
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setNearbyPOIs([]);
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
        if (mapInstance) {
          mapInstance.flyTo([newLat, newLon], 13, { duration: 1.5 });
        }
      } else {
        alert('Place not found. Try searching another city or landmark.');
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Explore Nearby POIs using Overpass API
  const handleExploreNearby = async (lat, lng, forcedFilter) => {
    const filter = forcedFilter || poiFilter;
    setIsExploring(true);
    setShowSearchPopup(false);

    let queryTag = '[amenity~"restaurant|cafe|hotel|pub|tourism|museum|viewpoint"]';
    if (filter === 'food') {
      queryTag = '[amenity~"restaurant|cafe|fast_food|bar"]';
    } else if (filter === 'hotels') {
      queryTag = '[tourism~"hotel|hostel|motel|guest_house"]';
    } else if (filter === 'attractions') {
      queryTag = '[tourism~"museum|viewpoint|attraction|theme_park|monument|gallery"]';
    } else if (filter === 'shops') {
      queryTag = '[shop~"mall|department_store|supermarket|convenience|clothes"]';
    }

    try {
      const query = `[out:json];node(around:2500,${lat},${lng})${queryTag};out 30;`;
      const resp = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (data && data.elements) {
        setNearbyPOIs(data.elements.map(e => ({
          id: e.id,
          lat: e.lat,
          lng: e.lon,
          name: e.tags.name || 'Local Spot',
          type: e.tags.amenity || e.tags.tourism || e.tags.shop || 'Place of Interest'
        })));
      }
    } catch (err) {
      console.error('POI discovery failed:', err);
    } finally {
      setIsExploring(false);
    }
  };

  // Draggable Pin Event Handler
  const handleMarkerDragEnd = async (e) => {
    const newPos = e.target.getLatLng();
    setPendingMarker(prev => ({ ...prev, lat: newPos.lat, lng: newPos.lng, name: 'Fetching address...' }));
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`, {
        headers: { 'User-Agent': 'TravelMateApp/1.0' }
      });
      const data = await resp.json();
      const name = data?.display_name || `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`;
      setPendingMarker({ lat: newPos.lat, lng: newPos.lng, name });
      setShowSearchPopup(true);
    } catch {
      setPendingMarker({ lat: newPos.lat, lng: newPos.lng, name: `Location (${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)})` });
    }
  };

  // Map click handler (drop pin)
  const handleInternalClick = async (lat, lng) => {
    setPendingMarker({ lat, lng, name: 'Dropped Pin (Resolving...)' });
    setShowSearchPopup(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'User-Agent': 'TravelMateApp/1.0' }
      });
      const data = await resp.json();
      const locName = data?.display_name ? data.display_name.split(',').slice(0, 3).join(',') : 'Dropped Pin';
      setPendingMarker({ lat, lng, name: locName });
    } catch {
      setPendingMarker({ lat, lng, name: 'Dropped Pin' });
    }

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

  // Prepare route polylines for itinerary and future plans
  const itineraryCoords = markers
    .filter(m => m.type === 'itinerary')
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    .map(m => [m.lat, m.lng]);

  const futureCoords = markers
    .filter(m => m.type === 'future')
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map(m => [m.lat, m.lng]);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
      {/* ─── Google Maps-Style Top Search Bar & Category Chips ─────────── */}
      <div className={`map-search-wrapper ${panelOpen ? 'panel-open' : 'panel-closed'}`}>
        <form onSubmit={handleSearch} className="search-box-pill">
          <Search size={18} color="var(--accent)" style={{ marginRight: '6px' }} />
          <input 
            type="text" 
            placeholder="Search Google Maps or any place..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
          <button 
            type="submit" 
            style={{ 
              background: 'var(--accent)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '20px', 
              padding: '6px 14px', 
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              marginLeft: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isSearching ? <Loader size={14} className="animate-spin" /> : 'Find'}
          </button>
        </form>

        {/* POI Filter Chips (Google Maps style) */}
        <div className="poi-filter-row">
          <button 
            type="button"
            onClick={() => {
              setPoiFilter('none');
              if (pendingMarker) handleExploreNearby(pendingMarker.lat, pendingMarker.lng, 'none');
            }}
            className={`poi-pill-btn ${poiFilter === 'none' ? 'active' : ''}`}
          >
            <Sparkles size={13} />
            All Spots
          </button>
          <button 
            type="button"
            onClick={() => {
              setPoiFilter('food');
              if (pendingMarker) handleExploreNearby(pendingMarker.lat, pendingMarker.lng, 'food');
            }}
            className={`poi-pill-btn ${poiFilter === 'food' ? 'active' : ''}`}
          >
            <Utensils size={13} />
            Food & Cafes
          </button>
          <button 
            type="button"
            onClick={() => {
              setPoiFilter('attractions');
              if (pendingMarker) handleExploreNearby(pendingMarker.lat, pendingMarker.lng, 'attractions');
            }}
            className={`poi-pill-btn ${poiFilter === 'attractions' ? 'active' : ''}`}
          >
            <Landmark size={13} />
            Attractions
          </button>
          <button 
            type="button"
            onClick={() => {
              setPoiFilter('hotels');
              if (pendingMarker) handleExploreNearby(pendingMarker.lat, pendingMarker.lng, 'hotels');
            }}
            className={`poi-pill-btn ${poiFilter === 'hotels' ? 'active' : ''}`}
          >
            <Bed size={13} />
            Hotels
          </button>
          <button 
            type="button"
            onClick={() => {
              setPoiFilter('shops');
              if (pendingMarker) handleExploreNearby(pendingMarker.lat, pendingMarker.lng, 'shops');
            }}
            className={`poi-pill-btn ${poiFilter === 'shops' ? 'active' : ''}`}
          >
            <ShoppingBag size={13} />
            Shops
          </button>
        </div>
      </div>

      {/* ─── Google Maps Layer Switcher (Bottom Left) ────────────────── */}
      <div className={`layer-switcher-container ${panelOpen ? 'panel-open' : 'panel-closed'}`}>
        <button 
          onClick={() => setShowLayerMenu(!showLayerMenu)} 
          className="layer-toggle-btn"
          title="Change Map Layer (Satellite, Street, Dark, Terrain)"
        >
          <Layers size={16} color="var(--accent)" />
          <span>{TILE_LAYERS[activeLayer].name}</span>
        </button>

        {showLayerMenu && (
          <div className="layer-menu-popup">
            {Object.values(TILE_LAYERS).map(layer => (
              <div 
                key={layer.id}
                className={`layer-card-item ${activeLayer === layer.id ? 'selected' : ''}`}
                onClick={() => {
                  setActiveLayer(layer.id);
                  setShowLayerMenu(false);
                }}
              >
                <img src={layer.thumbnail} alt={layer.name} className="layer-preview-thumbnail" />
                <span className="layer-label">{layer.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Google Maps Controls Dock (Bottom Right) ───────────────── */}
      <div className="map-controls-dock">
        <div className="control-pill-group">
          <button 
            onClick={handleZoomIn} 
            className="map-action-btn" 
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            onClick={handleZoomOut} 
            className="map-action-btn" 
            title="Zoom Out"
            aria-label="Zoom Out"
            style={{ borderTop: '1px solid #f1f5f9' }}
          >
            <ZoomOut size={18} />
          </button>
        </div>

        <button 
          onClick={handleLocateMe} 
          className="map-action-btn standalone" 
          title="Center on My Location"
          aria-label="Locate Me"
        >
          <Crosshair size={19} color="var(--accent)" />
        </button>

        <button 
          onClick={handleFitAllPins} 
          className="map-action-btn standalone" 
          title="Fit All Pins on Map"
          aria-label="Fit All Pins"
        >
          <Compass size={19} color="#3b82f6" />
        </button>

        <button 
          onClick={() => setShowRoutes(!showRoutes)} 
          className={`map-action-btn standalone ${showRoutes ? 'active-glow' : ''}`} 
          title="Toggle Travel Routes & Connections"
          aria-label="Toggle Travel Routes"
        >
          <Route size={19} />
        </button>

        <button 
          onClick={handleToggleFullscreen} 
          className="map-action-btn standalone" 
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* ─── Interactive Leaflet Map Instance ───────────────────────── */}
      <LeafletMap 
        center={defaultCenter} 
        zoom={3} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={setMapInstance}
      >
        <TileLayer
          key={activeLayer}
          url={TILE_LAYERS[activeLayer].url}
          attribution={TILE_LAYERS[activeLayer].attribution}
          maxZoom={19}
        />

        <MapEvents onMapClick={handleInternalClick} />
        <RecenterMap focus={pendingMarker ? { lat: pendingMarker.lat, lng: pendingMarker.lng, zoom: 12 } : mapFocus} />

        {/* Route Polylines (Google Maps Directions) */}
        {showRoutes && itineraryCoords.length > 1 && (
          <Polyline 
            positions={itineraryCoords} 
            pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '6, 8', opacity: 0.8 }} 
          />
        )}
        {showRoutes && futureCoords.length > 1 && (
          <Polyline 
            positions={futureCoords} 
            pathOptions={{ color: '#f59e0b', weight: 4, dashArray: '8, 8', opacity: 0.8 }} 
          />
        )}

        {/* User GPS Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div style={{ textAlign: 'center', color: '#000', padding: '4px' }}>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>📍 Your Current Location</strong>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live GPS Tracking Active</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Draggable Search / Dropped Pin (Google Maps style) */}
        {pendingMarker && (
          <Marker 
            position={[pendingMarker.lat, pendingMarker.lng]} 
            icon={pendingIcon}
            draggable={true}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
            ref={markerRef}
          >
            {showSearchPopup && (
              <Popup position={[pendingMarker.lat, pendingMarker.lng]} onClose={() => setShowSearchPopup(false)}>
                <div style={{ padding: '6px', minWidth: '220px', color: '#000' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <MapPin size={16} color="var(--accent)" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>{pendingMarker.name}</h4>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: '#64748b' }}>
                    💡 Tip: You can drag this pin anywhere!
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button 
                      onClick={() => onMapClick(pendingMarker.lat, pendingMarker.lng, 'history')}
                      style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                    >
                      <Plus size={14} /> Add to Past Memories
                    </button>
                    <button 
                      onClick={() => onMapClick(pendingMarker.lat, pendingMarker.lng, 'time')}
                      style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                    >
                      <Plus size={14} /> Add to Day Itinerary
                    </button>
                    <button 
                      onClick={() => onMapClick(pendingMarker.lat, pendingMarker.lng, 'future')}
                      style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                    >
                      <Plus size={14} /> Add to Future Tour
                    </button>
                    <button 
                      onClick={() => handleExploreNearby(pendingMarker.lat, pendingMarker.lng)}
                      style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                      disabled={isExploring}
                    >
                      {isExploring ? <Loader className="animate-spin" size={14} /> : <Navigation size={14} />}
                      Explore Nearby Places
                    </button>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        )}

        {/* Nearby POIs */}
        {nearbyPOIs.map(poi => (
          <Marker 
            key={poi.id} 
            position={[poi.lat, poi.lng]} 
            icon={poiIcon}
          >
            <Popup>
              <div style={{ color: '#000', minWidth: '160px', padding: '4px' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>{poi.name}</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize', display: 'block', marginBottom: '8px' }}>
                  {poi.type.replace(/_/g, ' ')}
                </span>
                <button 
                  onClick={() => onMapClick(poi.lat, poi.lng, 'time')}
                  style={{ display: 'block', background: '#3b82f6', color: 'white', border: 'none', width: '100%', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Add to Itinerary
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User Markers (Memories, Itinerary, Future Plans) */}
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
              <div style={{ color: '#000', minWidth: '170px', padding: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '0.95rem', fontWeight: '700' }}>{marker.title}</h3>
                  <button 
                    onClick={() => handleDelete(marker)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                    title="Delete Pin"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <p style={{ margin: '4px 0', fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
                  {marker.type === 'history' ? '📸 Past Memory' : 
                   marker.type === 'future' ? '✈️ Future Destination' : 
                   '📍 Daily Itinerary Stop'}
                </p>
                
                {marker.type === 'history' && marker.media_url && (
                  <div style={{ width: '100%', height: '85px', borderRadius: '6px', overflow: 'hidden', margin: '8px 0' }}>
                    <img src={marker.media_url} alt={marker.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                {marker.time && <p style={{ fontSize: '0.8rem', fontWeight: '600', margin: '4px 0', color: '#1e293b' }}>⏰ {marker.time}</p>}
                {marker.date && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0' }}>📅 {marker.date}</p>}
                
                {marker.type === 'history' && (
                  <button 
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginTop: '8px', width: '100%', fontWeight: '600', fontSize: '0.8rem' }}
                    onClick={() => onMemorySelect && onMemorySelect(marker)}
                  >
                    View Details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMap>
    </div>
  );
};

export default MapContainer;
