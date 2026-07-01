<!--
Copyright 2026 Muhammad Waleed
Licensed under the Apache License, Version 2.0
Author: Muhammad Waleed
-->

# TAAFI AI Dashboard

> **The Self-Learning SRE Agent That Remembers — So You Don't Have To**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.12-green.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18.3-61dafb.svg)](https://react.dev/)
[![Qwen Cloud](https://img.shields.io/badge/Qwen%20Cloud-Powered-purple.svg)](https://www.alibabacloud.com/)

**Qwen Cloud Global AI Hackathon 2026 | Track 4: Autopilot Agent**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TAAFI Dashboard                       │
│  ┌───────────────────┐    ┌────────────────────────┐    │
│  │   React Frontend  │───▶│   FastAPI Backend       │    │
│  │   (Vite + TS)     │    │   (Python 3.12)         │    │
│  │   Port 5173/80    │    │   Port 8000              │    │
│  └───────────────────┘    └───────┬────────────────┘    │
│                                   │                      │
│                         ┌─────────▼──────────┐           │
│                         │  SQLite / RDS      │           │
│                         │  (PostgreSQL)      │           │
│                         └────────────────────┘           │
└──────────────────────────────┬──────────────────────────┘
                               │ REST API
                    ┌──────────▼──────────┐
                    │  TAAFI Orchestrator  │
                    │  (gRPC + Qwen AI)   │
                    └──────────┬──────────┘
                               │ gRPC + mTLS
                    ┌──────────▼──────────┐
                    │    TAAFI Agent(s)    │
                    │  (Rust + 6 Plugins) │
                    └─────────────────────┘
```

## ✨ Features

- **🔍 Real-Time Monitoring** — Live incident tracking with auto-refresh
- **🤖 AI-Powered Fixes** — Qwen Cloud generates context-aware database fixes
- **✅ Approval Queue** — Human-in-the-loop approval for all AI-generated fixes
- **📊 Analytics Dashboard** — Incident trends, severity distribution, agent health
- **💰 LLM Cost Tracking** — Daily budget management with spend alerts
- **🔐 RBAC Security** — JWT auth with bcrypt password hashing
- **🌍 GDPR Compliant** — EU region deployment on Alibaba Cloud Frankfurt

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose (for full stack)

### Development Setup

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Docker Compose (Full Stack)

```bash
cp .env.example .env
# Edit .env with your Qwen API key and secrets
docker-compose up -d
```

Services will be available at:
- Dashboard: http://localhost
- API: http://localhost:8000/docs
- Orchestrator gRPC: localhost:50051

## 📁 Project Structure

```
taafi-dashboard/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── auth.py              # JWT authentication
│   ├── db.py                # Database session management
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── incident_api.py      # Incident endpoints
│   ├── approval_api.py      # Approval queue endpoints
│   ├── agent_api.py         # Agent management endpoints
│   ├── metrics_api.py       # Analytics endpoints
│   ├── billing_api.py       # LLM cost tracking
│   ├── rate_limiter.py      # SlowAPI rate limiting
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx         # Entry point
│   │   ├── App.tsx          # Root component
│   │   ├── index.css        # Design system
│   │   ├── services/
│   │   │   └── api.ts       # Axios API client
│   │   ├── components/
│   │   │   ├── Sidebar.tsx  # Navigation sidebar
│   │   │   └── StatsCard.tsx # Reusable stats card
│   │   └── pages/
│   │       ├── Login.tsx     # Auth page
│   │       ├── Dashboard.tsx # Main dashboard
│   │       ├── Incidents.tsx # Incident management
│   │       ├── Approvals.tsx # Approval queue
│   │       ├── Agents.tsx    # Agent management
│   │       ├── Metrics.tsx   # Analytics
│   │       └── Billing.tsx   # Cost tracking
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── Dockerfile
├── docker-compose.yml        # Full stack deployment
├── nginx.conf                # Frontend reverse proxy
├── .env.example              # Environment template
├── .github/workflows/ci.yml  # CI/CD pipeline
├── LICENSE                   # Apache 2.0
├── SECURITY.md               # Security policy
└── README.md                 # This file
```

## 🔒 Security

- JWT authentication with bcrypt password hashing
- PQC-ready crypto (SHA3-256 + AES-256-GCM, upgradable to ML-KEM/ML-DSA)
- gRPC + mTLS between agent and orchestrator
- Rate limiting (100 req/min per user)
- CORS restricted to known origins
- SQL injection prevention via SQLAlchemy ORM
- CSP headers via Nginx

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## 📜 License

Apache License 2.0 — see [LICENSE](LICENSE)

## 👤 Author

**Muhammad Waleed**

Built for Qwen Cloud Global AI Hackathon 2026, Track 4: Autopilot Agent

Deployed on Alibaba Cloud eu-central-1 (Frankfurt) for GDPR compliance
