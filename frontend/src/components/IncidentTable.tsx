// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Terminal as CliIcon, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './IncidentTable.css';

export interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  description: string;
  affected_tables?: string;
  query?: string;
  agent_id: string;
  resolved: boolean;
  created_at: string;
}

interface IncidentTableProps {
  incidents: Incident[];
  onSelectIncident?: (incident: Incident) => void;
}

const IncidentTable: React.FC<IncidentTableProps> = ({ incidents, onSelectIncident }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getSeverityBadge = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === 'critical') return <span className="badge badge-critical">Critical</span>;
    if (s === 'high') return <span className="badge badge-high">High</span>;
    if (s === 'medium') return <span className="badge badge-medium">Medium</span>;
    return <span className="badge badge-low">{severity}</span>;
  };

  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return timeStr;
    }
  };

  if (incidents.length === 0) {
    return (
      <div className="glass-card table-empty-state">
        <AlertCircle size={40} className="empty-icon" />
        <h4>No Incidents Detected</h4>
        <p>Your infrastructure database layers are operating in optimal condition.</p>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper incident-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Severity</th>
            <th>Description</th>
            <th>Agent ID</th>
            <th>Timestamp</th>
            <th>Status</th>
            <th style={{ width: '60px' }}></th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => {
            const isExpanded = expandedId === incident.id;
            return (
              <React.Fragment key={incident.id}>
                <tr className={`incident-row ${isExpanded ? 'row-expanded' : ''}`} onClick={() => toggleRow(incident.id)}>
                  <td>
                    <span className="incident-type-cell">{incident.incident_type}</span>
                  </td>
                  <td>{getSeverityBadge(incident.severity)}</td>
                  <td className="desc-cell text-truncate">{incident.description}</td>
                  <td>
                    <code className="agent-id-code">{incident.agent_id}</code>
                  </td>
                  <td>{formatTime(incident.created_at)}</td>
                  <td>
                    <span className={`status-pill ${incident.resolved ? 'resolved' : 'active'}`}>
                      {incident.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon-toggle">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="expanded-detail-row">
                    <td colSpan={7}>
                      <div className="incident-expanded-content">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Incident ID</span>
                            <span className="detail-value font-mono">{incident.id}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Affected Database Tables</span>
                            <span className="detail-value">
                              {incident.affected_tables ? (
                                incident.affected_tables.split(',').map((tbl) => (
                                  <span key={tbl} className="table-badge">{tbl}</span>
                                ))
                              ) : (
                                <span className="text-muted">None specified</span>
                              )}
                            </span>
                          </div>
                        </div>
                        {incident.query && (
                          <div className="query-box-wrapper">
                            <div className="query-box-header">
                              <CliIcon size={14} />
                              <span>SQL / Operations Command</span>
                            </div>
                            <pre className="query-code-block">
                              <code>{incident.query}</code>
                            </pre>
                          </div>
                        )}
                        {onSelectIncident && (
                          <div className="expanded-actions">
                            <button 
                              className="btn btn-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectIncident(incident);
                              }}
                            >
                              <span>View Fix Recommendation</span>
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default IncidentTable;
