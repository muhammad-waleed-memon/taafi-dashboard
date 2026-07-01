// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { BarChart3, Database, ShieldAlert, Cpu, RefreshCw } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import './Metrics.css';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'hsl(355, 85%, 56%)',
  High: 'hsl(38, 95%, 52%)',
  Medium: 'hsl(208, 95%, 55%)',
  Low: 'hsl(145, 80%, 42%)'
};

const STATUS_COLORS: Record<string, string> = {
  online: 'var(--success)',
  offline: 'var(--danger)'
};

const Metrics: React.FC = () => {
  const [summary, setSummary] = useState<any>({
    total_incidents: 0,
    total_fixes: 0,
    total_agents: 0,
    avg_risk_score: 0.0
  });
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      // 1. Summary
      const summaryRes = await axios.get('/api/metrics/summary');
      setSummary(summaryRes.data);

      // 2. Timeline
      const timelineRes = await axios.get('/api/metrics/incidents/timeline');
      setTimelineData(timelineRes.data);

      // 3. Severity
      const severityRes = await axios.get('/api/metrics/severity/distribution');
      const formattedSeverity = severityRes.data.map((item: any) => ({
        name: item.severity,
        value: item.count
      }));
      setSeverityData(formattedSeverity);

      // 4. Status
      const statusRes = await axios.get('/api/metrics/agents/status');
      const formattedStatus = statusRes.data.map((item: any) => ({
        name: item.status,
        count: item.count
      }));
      setStatusData(formattedStatus);
    } catch (err) {
      console.error('Failed to load metrics details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="metrics-page animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h2 className="page-title">Analytics & Cluster Metrics</h2>
          <p className="page-subtitle">Historical telemetry metrics, auto-healing success rates, and cluster health logs</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchMetrics} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {isLoading ? (
        <div className="metrics-loading flex-center">
          <div className="custom-loader"></div>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid-cols-12 summary-row">
            <div className="col-span-12 col-span-4-lg">
              <div className="glass-card metric-summary-box">
                <Database size={24} className="metric-box-icon text-cyan" />
                <div className="metric-box-text">
                  <h3>{summary.total_incidents}</h3>
                  <p>Telemetry Alerts Captured</p>
                </div>
              </div>
            </div>
            
            <div className="col-span-12 col-span-4-lg">
              <div className="glass-card metric-summary-box">
                <ShieldAlert size={24} className="metric-box-icon text-purple" />
                <div className="metric-box-text">
                  <h3>{summary.total_fixes}</h3>
                  <p>AI Healing Operations Executed</p>
                </div>
              </div>
            </div>

            <div className="col-span-12 col-span-4-lg">
              <div className="glass-card metric-summary-box">
                <Cpu size={24} className="metric-box-icon text-green" />
                <div className="metric-box-text">
                  <h3>{((summary.total_fixes / (summary.total_incidents || 1)) * 100).toFixed(0)}%</h3>
                  <p>Autopilot Remediation Ratio</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Timeline Card */}
          <div className="glass-card timeline-card-large">
            <div className="chart-header">
              <h4>Telemetry Incident Logs Timeline</h4>
              <p className="text-muted">Aggregated counts of cluster alerts registered over the past 30 days</p>
            </div>
            <div className="chart-body" style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorCountLarge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-muted)" 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-elevated)', 
                      borderColor: 'var(--glass-border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--accent-primary)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCountLarge)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dual Column Distribution Charts */}
          <div className="grid-cols-12 distribution-charts">
            <div className="col-span-12 col-span-6-lg glass-card distribution-card">
              <div className="chart-header">
                <h4>Incident Severity Breakdown</h4>
                <p className="text-muted">Proportional distribution of registered incident levels</p>
              </div>
              <div className="chart-body flex-center" style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || 'var(--accent-secondary)'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'var(--bg-elevated)', 
                        borderColor: 'var(--glass-border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="legend-label">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 col-span-6-lg glass-card distribution-card">
              <div className="chart-header">
                <h4>Daemon Cluster Agent Status</h4>
                <p className="text-muted">Count of registered agent daemons grouped by active state</p>
              </div>
              <div className="chart-body" style={{ height: '260px', padding: '1rem 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} barSize={40}>
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--text-muted)" 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="var(--text-muted)" 
                      tickLine={false} 
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'var(--bg-elevated)', 
                        borderColor: 'var(--glass-border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      cursor={{ fill: 'rgba(255,255,255,0.01)' }}
                    />
                    <Bar dataKey="count" fill="var(--accent-primary)">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || 'var(--accent-primary)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Metrics;
