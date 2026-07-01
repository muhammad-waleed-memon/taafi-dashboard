// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertOctagon, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import IncidentTable, { Incident } from '../components/IncidentTable';
import './Incidents.css';

const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      let url = `/api/incidents/?page=${page}&limit=10`;
      if (severityFilter) {
        url += `&severity=${severityFilter}`;
      }
      const response = await axios.get(url);
      setIncidents(response.data);
    } catch (err) {
      console.error('Failed to fetch incidents list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [page, severityFilter]);

  const handleSelectIncident = (incident: Incident) => {
    navigate('/approvals');
  };

  return (
    <div className="incidents-page animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h2 className="page-title">Cluster Alerts & Incidents</h2>
          <p className="page-subtitle">Historical records and ongoing database anomalies captured by TAAFI agents</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchIncidents} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card filter-bar flex-between gap-4">
        <div className="filter-group flex-center gap-2">
          <Filter size={16} className="text-muted" />
          <span className="filter-label">Filters</span>
        </div>
        
        <div className="filter-selectors flex-center gap-4">
          <div className="selector-item">
            <select 
              className="form-select select-filter"
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1); // Reset page to 1
              }}
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="table-loading flex-center">
          <RefreshCw size={36} className="spin text-cyan" />
        </div>
      ) : (
        <div className="table-section animate-slide-up">
          <IncidentTable incidents={incidents} onSelectIncident={handleSelectIncident} />
          
          {/* Pagination Controls */}
          {incidents.length > 0 && (
            <div className="pagination-wrapper flex-between">
              <span className="pagination-info">Showing page {page}</span>
              <div className="pagination-buttons flex-center gap-2">
                <button 
                  className="btn btn-secondary btn-icon-only"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  className="btn btn-secondary btn-icon-only"
                  onClick={() => setPage(p => p + 1)}
                  disabled={incidents.length < 10}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Incidents;
