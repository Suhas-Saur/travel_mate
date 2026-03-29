import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Camera, Video, Save, Loader, Upload, Image as ImageIcon } from 'lucide-react';
import { addMemory, uploadFile } from '../lib/dataStore';

const AddMemoryModal = ({ onClose, onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    location: initialData?.location || '',
    date: new Date().toISOString().split('T')[0],
    type: 'image',
    media_url: '',
    description: '',
    lat: initialData?.lat || 0,
    lng: initialData?.lng || 0
  });

  const [isFetchingName, setIsFetchingName] = useState(false);

  // Reverse geocoding to find the address from coordinates
  useEffect(() => {
    if (initialData?.lat && initialData?.lng && !formData.location) {
      setIsFetchingName(true);
      const fetchAddress = async () => {
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${initialData.lat}&lon=${initialData.lng}`, {
            headers: { 'User-Agent': 'TravelMateApp/1.0' }
          });
          const data = await resp.json();
          if (data && data.address) {
            const locName = data.address.city || data.address.suburb || data.address.town || data.address.village || data.address.country || 'Selected Location';
            setFormData(prev => ({ ...prev, location: locName }));
          } else {
            setFormData(prev => ({ ...prev, location: 'Dropped Pin' }));
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setFormData(prev => ({ ...prev, location: 'New Location' }));
        } finally {
          setIsFetchingName(false);
        }
      };
      fetchAddress();
    }
  }, [initialData, formData.location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalMediaUrl = formData.media_url;

      // If a local file was selected, upload it first
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile);
        if (uploadedUrl) {
          finalMediaUrl = uploadedUrl;
        } else {
          // If upload failed, don't proceed with saving the record
          alert('Upload failed! Please check if your Supabase Storage bucket "memories" is public and has proper policies.');
          setLoading(false);
          return;
        }
      }

      const memoryToSave = {
        ...formData,
        media_url: finalMediaUrl,
        lat: parseFloat(formData.lat) || 0,
        lng: parseFloat(formData.lng) || 0
      };
      
      const result = await addMemory(memoryToSave);
      if (result) {
        onSuccess && onSuccess();
        onClose();
      } else {
        alert('Failed to save memory. Check console for details.');
      }
    } catch (err) {
      console.error('Error in form submission:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="overlay" onClick={onClose}>
      <div 
        className="modal glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', padding: '32px' }}
      >
        <button className="close-btn" onClick={onClose}><X size={24} /></button>
        
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Camera size={24} color="var(--accent)" />
          Save New Memory
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Image Preview / Upload Area */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Upload Photo from Device</label>
            <div 
              style={{
                width: '100%',
                height: '180px',
                borderRadius: '12px',
                border: loading ? '2px solid var(--accent)' : '2px dashed var(--glass-border)',
                background: 'rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: '0.3s'
              }}
              onClick={() => !loading && document.getElementById('fileInput').click()}
            >
              {loading && !imagePreview ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Loader className="animate-spin" size={32} color="var(--accent)" />
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Processing...</p>
                </div>
              ) : imagePreview ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {loading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader className="animate-spin" size={32} color="white" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Upload size={32} color="var(--accent)" style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--secondary-text)' }}>Click to pick a photo</p>
                </>
              )}
              <input 
                id="fileInput"
                type="file" 
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
            {imagePreview && (
              <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px', cursor: 'pointer', textAlign: 'center' }} onClick={() => {setImagePreview(null); setSelectedFile(null);}}>
                Clear Selection
              </p>
            )}
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Location Name</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                name="location" 
                className="input" 
                placeholder={isFetchingName ? "Fetching location..." : "e.g. Bondi Beach"}
                required
                value={formData.location}
                onChange={handleChange}
                style={{ paddingLeft: '36px', opacity: isFetchingName ? 0.7 : 1 }}
                disabled={isFetchingName}
              />
              {isFetchingName ? (
                <Loader size={18} className="animate-spin" style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--accent)' }} />
              ) : (
                <MapPin size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--secondary-text)' }} />
              )}
            </div>
          </div>

          <div style={{ display: 'none' }}>
            <input type="number" name="lat" value={formData.lat} readOnly />
            <input type="number" name="lng" value={formData.lng} readOnly />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Date</label>
              <input 
                type="date" 
                name="date" 
                className="input" 
                required
                value={formData.date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Description</label>
            <textarea 
              name="description" 
              className="textarea" 
              rows="3" 
              placeholder="What made this trip special?"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button 
              type="submit" 
              className="btn" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              disabled={loading}
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
              {loading ? 'Saving...' : 'Save Travel Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemoryModal;
