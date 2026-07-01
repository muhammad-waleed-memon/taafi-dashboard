// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, ShieldAlert, Sparkles, Terminal as CliIcon, FileCode, CheckCircle, HelpCircle } from 'lucide-react';
import './Approvals.css';

interface ApprovalRecord {
  id: string;
  incident_id: string;
  fix_id: string;
  risk_score: number;
  status: string;
  requester: string;
  reviewer?: string;
  created_at: string;
  reviewed_at?: string;
}

const Approvals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Fix details mapping for display purposes in hackathon (we mock these rich recommendations to link to the approval rows)
  const [fixDetails, setFixDetails] = useState<Record<string, any>>({
    "99999999-8888-7777-6666-555555555555": {
      fix_type: "CreateIndex",
      description: "Generate non-blocking index on financial_transactions (status, tx_id) to eliminate sequential table scan during batch processing.",
      sql: "CREATE INDEX CONCURRENTLY idx_tx_status_id ON financial_transactions (status, tx_id);",
      rollback_plan: "DROP INDEX CONCURRENTLY idx_tx_status_id;",
      confidence: 0.98
    }
  });

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'pending' ? '/api/approvals/' : '/api/approvals/history';
      const response = await axios.get(endpoint);
      setApprovals(response.data);
    } catch (err) {
      console.error('Failed to fetch approval queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      await axios.post(`/api/approvals/${id}/approve`);
      // Update UI list
      setApprovals(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActioningId(id);
    try {
      await axios.post(`/api/approvals/${id}/reject`);
      setApprovals(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setActioningId(null);
    }
  };

  const getRiskLabel = (score: number) => {
    if (score >= 0.75) return <span className="risk-tag risk-critical">Critical Risk ({Math.round(score * 100)}%)</span>;
    if (score >= 0.5) return <span className="risk-tag risk-high">High Risk ({Math.round(score * 100)}%)</span>;
    if (score >= 0.25) return <span className="risk-tag risk-medium">Medium Risk ({Math.round(score * 100)}%)</span>;
    return <span className="risk-tag risk-low">Low Risk ({Math.round(score * 100)}%)</span>;
  };

  return (
    <div className="approvals-page animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Remediation Approval Queue</h2>
        <p className="page-subtitle">Inspect, approve, or reject AI-generated database fixes before live production execution</p>
      </div>

      {/* Tabs */}
      <div className="tabs-wrapper flex-between">
        <div className="tabs flex-center gap-2">
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Approvals ({activeTab === 'pending' ? approvals.length : '?'})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History Log
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="approvals-loading flex-center">
          <div className="custom-loader"></div>
        </div>
      ) : (
        <div className="approvals-content grid-cols-12 animate-slide-up">
          {approvals.length === 0 ? (
            <div className="col-span-12 glass-card empty-approvals-card flex-center">
              <CheckCircle size={48} className="success-icon" />
              <h3>Approval Queue Clear</h3>
              <p>All SRE auto-healing recommendation items have been processed.</p>
            </div>
          ) : (
            approvals.map((record) => {
              const fix = fixDetails[record.fix_id] || {
                fix_type: "Database Remediation",
                description: `Suggested action for Incident ID: ${record.incident_id}`,
                sql: "VACUUM ANALYZE;",
                confidence: 0.90
              };

              return (
                <div key={record.id} className="col-span-12 glass-card approval-item-card">
                  <div className="approval-card-header flex-between">
                    <div className="badge-and-title">
                      <span className="badge badge-purple">{fix.fix_type}</span>
                      {getRiskLabel(record.risk_score)}
                    </div>
                    <div className="requester-label">
                      <span>Requester:</span>
                      <code>{record.requester}</code>
                    </div>
                  </div>

                  <div className="approval-card-body">
                    <div className="remediation-description">
                      <h5>Proposed Action</h5>
                      <p>{fix.description}</p>
                    </div>

                    <div className="technical-details grid-cols-12">
                      <div className="col-span-12 col-span-6-lg code-column">
                        <div className="code-header">
                          <CliIcon size={14} />
                          <span>Remediation SQL</span>
                        </div>
                        <pre className="code-block-display">
                          <code>{fix.sql}</code>
                        </pre>
                      </div>
                      
                      {fix.rollback_plan && (
                        <div className="col-span-12 col-span-6-lg code-column">
                          <div className="code-header">
                            <FileCode size={14} />
                            <span>Rollback SQL</span>
                          </div>
                          <pre className="code-block-display rollback-code">
                            <code>{fix.rollback_plan}</code>
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="metrics-summary-row flex-between">
                      <div className="metric-box">
                        <span className="metric-label">AI Confidence</span>
                        <span className="metric-value text-cyan">{(fix.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Risk Threshold</span>
                        <span className="metric-value">{record.risk_score > 0.5 ? 'High (Requires Admin approval)' : 'Low (Safe)'}</span>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'pending' ? (
                    <div className="approval-card-actions flex-between">
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleReject(record.id)}
                        disabled={actioningId !== null}
                      >
                        <X size={16} />
                        <span>Reject & Discard</span>
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleApprove(record.id)}
                        disabled={actioningId !== null}
                      >
                        <Check size={16} />
                        <span>Approve & Execute</span>
                      </button>
                    </div>
                  ) : (
                    <div className="approval-history-footer flex-between">
                      <div className="history-item">
                        <span>Reviewed By:</span>
                        <strong>{record.reviewer || 'System Autopilot'}</strong>
                      </div>
                      <div className="history-item">
                        <span>Status:</span>
                        <span className={`history-status-pill ${record.status}`}>
                          {record.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Approvals;
