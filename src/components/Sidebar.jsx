import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, History, Calendar, DollarSign, Clock, Compass, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ collapsed, onToggleCollapse }) => {
  const navItems = [
    { to: '/', label: 'Dashboard Overview', icon: Map, end: true },
    { to: '/history', label: 'Past Memories', icon: History },
    { to: '/future', label: 'Future Tour Plan', icon: Calendar },
    { to: '/costs', label: 'Cost Tracker', icon: DollarSign },
    { to: '/time', label: 'Time Itinerary', icon: Clock },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand & Collapse Button */}
      <div className="sidebar-header">
        <div className="brand" title="Travel Mate">
          <Compass size={28} className="brand-icon" />
          {!collapsed && <span>Travel Mate</span>}
        </div>
        <button 
          onClick={onToggleCollapse} 
          className="sidebar-toggle-btn"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.to}
              to={item.to} 
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="icon" style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.72rem', color: 'var(--sidebar-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}></span>
            <span>Live GPS & Sync Active</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
