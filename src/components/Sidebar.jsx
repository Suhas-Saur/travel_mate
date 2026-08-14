import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, History, Calendar, DollarSign, Clock, Compass } from 'lucide-react';

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
    </div>
  );
};

export default Sidebar;
