// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  AlertTriangle, 
  Cpu, 
  Settings, 
  CheckCircle, 
  Activity, 
  ShieldAlert, 
  Coins 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import StatsCard from '../components/StatsCard';
import IncidentTable, { Incident } from '../components/IncidentTable';
import './Dashboard.css';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'hsl(355, 85%, 56%)',
  High: 'hsl(38, 95%, 52%)',
  Medium: 'hsl(208, 95%, 55%)',
  Low: 'hsl(145, 80%, 42%)'
};

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>({
    total_incidents: 0,
    total_fixes: 0,
    total_agents: 0,
    avg_risk_score: 0.0
  });
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      // 1. Fetch Summary
      const summaryRes = await axios.get('/api/metrics/summary');
      setSummary(summaryRes.data);

      // 2. Fetch Timeline
      const timelineRes = await axios.get('/api/metrics/incidents/timeline');
      setTimelineData(timelineRes.data);

      // 3. Fetch Severity Distribution
      const severityRes = await axios.get('/api/metrics/severity/distribution');
      const formattedSeverity = severityRes.data.map((item: any) => ({
        name: item.severity,
        value: item.count
      }));
      setSeverityData(formattedSeverity);

      // 4. Fetch Incidents (last 5)
      const incidentsRes = await axios.get('/api/incidents/?limit=5');
      setIncidents(incidentsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectIncident = (incident: Incident) => {
    // Redirect to approvals or incidents page
    navigate('/approvals');
  };

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h2 className="page-title">SRE Autopilot Operations</h2>
          <p className="page-subtitle">Real-time telemetry, automated healing, and security compliance verification</p>
        </div>
        <div className="header-status glass-card flex-center gap-2">
          <Activity size={16} className="pulse-green" />
          <span>System Status: <strong className="status-ok">Optimal</strong></span>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid-cols-12 stats-grid">
        <div className="col-span-12 col-span-6 col-span-3-lg">
          <StatsCard
            title="Total Incidents Detected"
            value={summary.total_incidents}
            subtitle="Across database clusters"
            icon={<AlertTriangle size={20} />}
            trend="down"
            trendValue="-12%"
            accentColor="red"
          />
        </div>
        <div className="col-span-12 col-span-6 col-span-3-lg">
          <StatsCard
            title="AI Fixes Executed"
            value={summary.total_fixes}
            subtitle="Auto-remediated"
            icon={<CheckCircle size={20} />}
            trend="up"
            trendValue="+8%"
            accentColor="green"
          />
        </div>
        <div className="col-span-12 col-span-6 col-span-3-lg">
          <StatsCard
            title="Active SRE Agents"
            value={summary.total_agents}
            subtitle="Online clusters"
            icon={<Cpu size={20} />}
            trend="neutral"
            trendValue="0"
            accentColor="cyan"
          />
        </div>
        <div className="col-span-12 col-span-6 col-span-3-lg">
          <StatsCard
            title="Average Fix Risk Score"
            value={(summary.avg_risk_score * 100).toFixed(0) + '%'}
            subtitle="Lower is safer"
            icon={<ShieldAlert size={20} />}
            trend="down"
            trendValue="-4%"
            accentColor="purple"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-cols-12 charts-grid">
        <div className="col-span-12 col-span-8-lg glass-card chart-card">
          <div className="chart-header">
            <h4>Database Incidents Timeline</h4>
            <span className="text-muted">Total incidents over past 30 days</span>
          </div>
          <div className="chart-body" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-muted)" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10 }}
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
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 col-span-4-lg glass-card chart-card">
          <div className="chart-header">
            <h4>Severity Breakdown</h4>
            <span className="text-muted">Proportion of active incident classes</span>
          </div>
          <div className="chart-body flex-center" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
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
      </div>

      {/* Recent Incidents Table */}
      <div className="recent-incidents-section">
        <div className="section-header flex-between">
          <h4>Recent Cluster Alerts</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/incidents')}>
            View All Alerts
          </button>
        </div>
        <IncidentTable incidents={incidents} onSelectIncident={handleSelectIncident} />
      </div>
    </div>
  );
};

export default Dashboard;
