import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, History, Calendar, DollarSign, Clock, Compass, LogOut } from 'lucide-react';
import { signOut } from '../lib/dataStore';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
  return (
    <div className="sidebar glass-panel" style={{ borderRight: 'none', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
      {/* Brand Section */}
      <div className="brand">
        <Compass size={32} className="brand-icon" />
        Travel Mate
      </div>

      {/* Navigation */}
      <nav className="nav-links">
        {/* Map view (Home) */}
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Map size={20} className="icon" />
          Dashboard Overview
        </NavLink>

        {/* History / Memories */}
        <NavLink 
          to="/history" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <History size={20} className="icon" />
          Past Memories
        </NavLink>

        {/* Future Plans */}
        <NavLink 
          to="/future" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Calendar size={20} className="icon" />
          Future Tour Plan
        </NavLink>

        {/* Cost Management */}
        <NavLink 
          to="/costs" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <DollarSign size={20} className="icon" />
          Cost Tracker
        </NavLink>

        {/* Time Management */}
        <NavLink 
          to="/time" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Clock size={20} className="icon" />
          Time Itinerary
        </NavLink>
      </nav>

      {/* Logout at bottom */}
      <div style={{ padding: '16px 0', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', padding: '0 12px 8px' }}>
          Logged in as: <strong>{localStorage.getItem('travel_username')}</strong>
        </p>
        <button 
          onClick={() => signOut()}
          className="nav-item"
          style={{ 
            width: '100%', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            color: 'var(--danger)',
            justifyContent: 'flex-start'
          }}
        >
          <LogOut size={20} className="icon" style={{ color: 'var(--danger)' }} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
