import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MapContainer from './components/MapContainer';
import CostManagement from './views/CostManagement';
import TimeManagement from './views/TimeManagement';
import MemoriesPanel from './views/MemoriesPanel';
import FuturePlan from './views/FuturePlan';
import Dashboard from './views/Dashboard';
import MemoryModal from './components/MemoryModal';
import RecommendationModal from './components/RecommendationModal';

function App() {
  const navigate = useNavigate();
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [mapFocus, setMapFocus] = useState(null);
  const [mapClickCoord, setMapClickCoord] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const closeMemory = () => setSelectedMemory(null);
  const closeRecommendation = () => setSelectedRecommendation(null);

  const handleMapClick = (lat, lng, actionType) => {
    setMapClickCoord({ lat, lng });
    if (actionType === 'history') {
      navigate('/history');
    } else if (actionType === 'time') {
      navigate('/time');
    } else if (actionType === 'future') {
      navigate('/future');
    }
  };

  const handlePinSelect = (focusData) => {
    setMapFocus(focusData);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        {/* Map is always rendered in the background */}
        <MapContainer 
          onMemorySelect={setSelectedMemory}
          onRecommendationSelect={setSelectedRecommendation}
          mapFocus={mapFocus}
          onMapClick={handleMapClick}
          userLocation={userLocation}
        />
        
        {/* Removed Spline Companion as requested */}

        {/* The panels are rendered above the map based on routes */}
        <Routes>
          <Route path="/" element={<Dashboard userLocation={userLocation} />} /> 
          <Route path="/history" element={<MemoriesPanel onPinSelect={handlePinSelect} autoOpenWith={mapClickCoord} clearAutoOpen={() => setMapClickCoord(null)} />} />
          <Route path="/future" element={<FuturePlan autoOpenWith={mapClickCoord} clearAutoOpen={() => setMapClickCoord(null)} />} />
          <Route path="/costs" element={<CostManagement />} />
          <Route path="/time" element={<TimeManagement onPinSelect={handlePinSelect} autoOpenWith={mapClickCoord} clearAutoOpen={() => setMapClickCoord(null)} />} />
          <Route path="/recommendations" element={null} />
        </Routes>

        {/* Modals */}
        {selectedMemory && <MemoryModal memory={selectedMemory} onClose={closeMemory} />}
        {selectedRecommendation && <RecommendationModal data={selectedRecommendation} onClose={closeRecommendation} />}
      </div>
    </div>
  );
}

export default App;
