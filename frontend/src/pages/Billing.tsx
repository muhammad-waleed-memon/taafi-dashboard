// Copyright 2026 Muhammad Waleed
// Licensed under the Apache License, Version 2.0
// Author: Muhammad Waleed

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CreditCard, AlertTriangle, Coins, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import './Billing.css';

interface BillingSummary {
  daily_spend: number;
  daily_budget: number;
  total_spend: number;
  calls_today: number;
}

interface BillingHistoryRecord {
  date: string;
  spend_usd: number;
  calls_count: number;
}

const Billing: React.FC = () => {
  const [summary, setSummary] = useState<BillingSummary>({
    daily_spend: 0,
    daily_budget: 5.0,
    total_spend: 0,
    calls_today: 0
  });
  const [history, setHistory] = useState<BillingHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBillingData = async () => {
    try {
      const summaryRes = await axios.get('/api/billing/');
      setSummary(summaryRes.data);

      const historyRes = await axios.get('/api/billing/history');
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Failed to load billing metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const spendPercentage = Math.min(100, (summary.daily_spend / (summary.daily_budget || 1)) * 100);
  const isBudgetWarning = spendPercentage >= 80;

  return (
    <div className="billing-page animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">LLM Usage & Budget Tracking</h2>
        <p className="page-subtitle">Monitor Qwen Cloud token usage expenses and enforce SRE budget policies</p>
      </div>

      {isLoading ? (
        <div className="billing-loading flex-center">
          <div className="custom-loader"></div>
        </div>
      ) : (
        <>
          {/* Top Budget Alert Warning */}
          {isBudgetWarning && (
            <div className="glass-card budget-warning-alert flex-center gap-4 animate-fade-in">
              <AlertTriangle size={24} className="alert-icon-warning" />
              <div className="alert-text">
                <h5>Approaching Daily Token Budget Threshold</h5>
                <p>Today's LLM token spend has reached <strong>{spendPercentage.toFixed(0)}%</strong> of your daily allowance. Fallback to local Ollama queries will trigger automatically when limit is reached.</p>
              </div>
            </div>
          )}

          <div className="grid-cols-12 billing-summary-row">
            {/* Current Spend Box */}
            <div className="col-span-12 col-span-8-lg glass-card progress-budget-card">
              <div className="card-top flex-between">
                <div className="budget-title-section">
                  <span className="card-label">Daily Token Spend Allowance</span>
                  <div className="spend-display flex-center gap-2">
                    <h3 className="current-spend-val">${summary.daily_spend.toFixed(3)}</h3>
                    <span className="divider">/</span>
                    <span className="budget-limit-val">${summary.daily_budget.toFixed(2)}</span>
                  </div>
                </div>
                <Coins size={32} className="coins-icon text-cyan" />
              </div>

              <div className="progress-bar-wrapper">
                <div className="progress-bar-track">
                  <div 
                    className={`progress-bar-fill ${isBudgetWarning ? 'warning-fill' : ''}`}
                    style={{ width: `${spendPercentage}%` }}
                  ></div>
                </div>
                <div className="progress-labels flex-between">
                  <span>{spendPercentage.toFixed(1)}% Consumed</span>
                  <span>${(summary.daily_budget - summary.daily_spend).toFixed(3)} Remaining</span>
                </div>
              </div>
            </div>

            {/* Total Spend Box */}
            <div className="col-span-12 col-span-4-lg glass-card cumulative-spend-card">
              <div className="card-top flex-between">
                <div className="spend-info">
                  <span className="card-label">Total Cumulative Spend</span>
                  <h3 className="cumulative-value">${summary.total_spend.toFixed(2)}</h3>
                  <p className="billing-cycle-sub">Active Billing Cycle: <strong>June 2026</strong></p>
                </div>
                <CreditCard size={32} className="card-icon text-purple" />
              </div>
            </div>
          </div>

          <div className="grid-cols-12 billing-details-section">
            {/* 7-Day Spending Chart */}
            <div className="col-span-12 col-span-8-lg glass-card billing-chart-card">
              <div className="chart-header flex-between">
                <div>
                  <h4>7-Day Spending History</h4>
                  <p className="text-muted">Daily spending details for Qwen Cloud SRE API prompts</p>
                </div>
                <div className="chart-legend flex-center gap-2">
                  <Calendar size={14} className="text-muted" />
                  <span className="legend-label">Daily Spend (USD)</span>
                </div>
              </div>

              <div className="chart-body" style={{ height: '260px', padding: '1rem 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history} barSize={32}>
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
                      cursor={{ fill: 'rgba(255,255,255,0.01)' }}
                    />
                    <Bar dataKey="spend_usd" fill="var(--accent-primary)">
                      {history.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.spend_usd >= summary.daily_budget * 0.1 ? 'var(--accent-secondary)' : 'var(--accent-primary)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Breakdown box */}
            <div className="col-span-12 col-span-4-lg glass-card breakdown-card">
              <h4>Usage Breakdown</h4>
              <p className="text-muted">Detailed parameters of today's LLM operation sessions</p>
              
              <div className="breakdown-list">
                <div className="breakdown-item flex-between">
                  <div className="item-label flex-center gap-2">
                    <TrendingUp size={14} />
                    <span>LLM Execution Sessions</span>
                  </div>
                  <strong>{summary.calls_today} calls</strong>
                </div>

                <div className="breakdown-item flex-between">
                  <div className="item-label flex-center gap-2">
                    <DollarSign size={14} />
                    <span>Cost Per Session (Est.)</span>
                  </div>
                  <strong>$0.003</strong>
                </div>

                <div className="breakdown-item flex-between">
                  <div className="item-label flex-center gap-2">
                    <Coins size={14} />
                    <span>Engine Type</span>
                  </div>
                  <strong className="engine-badge">Qwen-Max (Paid)</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Billing;
