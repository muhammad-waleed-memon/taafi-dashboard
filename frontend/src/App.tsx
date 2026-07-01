// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Approvals from './pages/Approvals';
import Agents from './pages/Agents';
import Metrics from './pages/Metrics';
import Billing from './pages/Billing';
import Login from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('taafi_access_token');
    const storedUser = localStorage.getItem('taafi_user');
    if (token) {
      setIsAuthenticated(true);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser({ username: 'SRE User' });
        }
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('taafi_access_token');
    localStorage.removeItem('taafi_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  // If not authenticated and not on login, redirect to login
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // If authenticated and on login, redirect to home
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="dashboard-layout">
      {isAuthenticated && <Sidebar onLogout={handleLogout} user={user} />}
      <div className={isAuthenticated ? "main-content" : "auth-content-wrapper"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
