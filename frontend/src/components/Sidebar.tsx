// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertOctagon, 
  CheckSquare, 
  Cpu, 
  BarChart3, 
  CreditCard, 
  LogOut,
  Terminal
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  onLogout: () => void;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, user }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Incidents', path: '/incidents', icon: <AlertOctagon size={20} /> },
    { name: 'Approvals', path: '/approvals', icon: <CheckSquare size={20} /> },
    { name: 'Agents', path: '/agents', icon: <Cpu size={20} /> },
    { name: 'Metrics', path: '/metrics', icon: <BarChart3 size={20} /> },
    { name: 'Billing', path: '/billing', icon: <CreditCard size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-logo">🤖</span>
        <h1 className="brand-title">TAAFI AI</h1>
      </div>
      
      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.username ? user.username.substring(0, 2).toUpperCase() : 'SR'}
        </div>
        <div className="user-info">
          <p className="user-name">{user?.username || 'SRE Admin'}</p>
          <p className="user-role">{user?.role || 'Senior SRE'}</p>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink 
            to={item.path} 
            key={item.name} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <button className="btn-logout" onClick={onLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
