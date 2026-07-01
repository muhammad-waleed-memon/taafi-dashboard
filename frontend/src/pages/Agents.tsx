// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, Server, Plus, Trash2, Calendar, Radio, Activity, RefreshCw, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './Agents.css';

interface Agent {
  id: string;
  agent_id: string;
  db_type: string;
  hostname: string;
  status: string;
  last_heartbeat: string;
  connected_at: string;
}

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Registration Form State
  const [showModal, setShowModal] = useState(false);
  const [newAgentId, setNewAgentId] = useState('');
  const [newDbType, setNewDbType] = useState('PostgreSQL');
  const [newHostname, setNewHostname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/agents/');
      setAgents(response.data);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/agents/', {
        agent_id: newAgentId,
        db_type: newDbType,
        hostname: newHostname || 'localhost'
      });
      // Append new agent
      setAgents(prev => [...prev, response.data]);
      setShowModal(false);
      // Reset form
      setNewAgentId('');
      setNewHostname('');
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!window.confirm(`Are you sure you want to unregister agent: ${agentId}?`)) {
      return;
    }
    try {
      await axios.delete(`/api/agents/${agentId}`);
      setAgents(prev => prev.filter(a => a.agent_id !== agentId));
    } catch (err) {
      console.error('Unregistration failed:', err);
    }
  };

  const getRelativeTime = (timeStr: string) => {
    try {
      return formatDistanceToNow(new Date(timeStr), { addSuffix: true });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="agents-page animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h2 className="page-title">SRE Daemon Agent Clusters</h2>
          <p className="page-subtitle">Inspect registered database collector daemons and telemetry status streams</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Register New Agent</span>
        </button>
      </div>

      {isLoading ? (
        <div className="agents-loading flex-center">
          <RefreshCw size={36} className="spin text-cyan" />
        </div>
      ) : (
        <div className="grid-cols-12 agents-grid animate-slide-up">
          {agents.length === 0 ? (
            <div className="col-span-12 glass-card empty-agents-card flex-center">
              <Cpu size={48} className="empty-icon" />
              <h3>No Registered Agents</h3>
              <p>Register a SRE agent daemon to begin collecting telemetry and automatically repairing databases.</p>
            </div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="col-span-12 col-span-6-md col-span-4-lg glass-card agent-card">
                <div className="agent-card-header flex-between">
                  <div className="agent-title-info">
                    <Server size={18} className="agent-icon" />
                    <h4>{agent.agent_id}</h4>
                  </div>
                  <div className="agent-status-section flex-center gap-2">
                    <span className={`status-dot ${agent.status}`}></span>
                    <span className="status-label">{agent.status}</span>
                  </div>
                </div>

                <div className="agent-card-body">
                  <div className="info-row">
                    <span className="info-label">Database Engine</span>
                    <span className="badge badge-medium">{agent.db_type}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Host Address</span>
                    <code>{agent.hostname}</code>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Last Ping</span>
                    <span>{getRelativeTime(agent.last_heartbeat)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Connected At</span>
                    <span>{getRelativeTime(agent.connected_at)}</span>
                  </div>
                </div>

                <div className="agent-card-footer flex-between">
                  <div className="agent-telemetry-status">
                    <Activity size={14} className={agent.status === 'online' ? 'pulse-cyan' : ''} />
                    <span>Streaming Logs</span>
                  </div>
                  <button 
                    className="btn-delete-agent" 
                    onClick={() => handleDelete(agent.agent_id)}
                    title="Unregister Agent"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Registration Modal Overlay */}
      {showModal && (
        <div className="modal-overlay flex-center animate-fade-in">
          <div className="glass-card modal-card animate-slide-up">
            <div className="modal-header flex-between">
              <h3>Register SRE Daemon Agent</h3>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRegister} className="modal-form">
              <div className="form-group">
                <label htmlFor="agentId">Agent ID</label>
                <input
                  id="agentId"
                  type="text"
                  className="form-input"
                  placeholder="agent-fra-prod-01"
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dbType">Database Engine</label>
                <select
                  id="dbType"
                  className="form-select"
                  value={newDbType}
                  onChange={(e) => setNewDbType(e.target.value)}
                >
                  <option value="PostgreSQL">PostgreSQL</option>
                  <option value="MySQL">MySQL</option>
                  <option value="MongoDB">MongoDB</option>
                  <option value="Redis">Redis</option>
                  <option value="Kafka">Kafka</option>
                  <option value="Universal">Universal Collector</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="hostname">Host Address</label>
                <input
                  id="hostname"
                  type="text"
                  className="form-input"
                  placeholder="ecs-fra-db.internal"
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                />
              </div>

              <div className="modal-actions flex-between">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
