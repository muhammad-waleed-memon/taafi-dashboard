// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, Terminal, Loader2 } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Direct call to FastAPI backend
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      const { access_token, token_type } = response.data;
      
      // Store token
      localStorage.setItem('taafi_access_token', access_token);
      localStorage.setItem('taafi_user', JSON.stringify({ username, role: 'Senior SRE' }));
      
      // Redirect to home dashboard
      navigate('/');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Connection failed. Please check if the backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Floating animated orbs in background */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <div className="glass-card login-card animate-slide-up">
        <div className="login-header">
          <div className="login-logo">
            <Terminal size={32} />
          </div>
          <h2>TAAFI AI</h2>
          <p className="login-subtitle">Autonomous SRE Infrastructure Platform</p>
        </div>

        {error && (
          <div className="login-error-box animate-fade-in">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group-wrapper">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="sre_admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="input-group-wrapper">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-login" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="spinner" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Access Core Dashboard</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Powered by Qwen Cloud AI & Alibaba Cloud</p>
          <p className="license-text">Licensed under Apache 2.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
