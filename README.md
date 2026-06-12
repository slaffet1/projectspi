<div align="center">

# Charikty — SaaS Business Management Platform

**A multitenant, AI-powered business management platform built for Tunisian SMEs.**  
Invoicing · Inventory · Client Management · AI Financial Advisor

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-AKS-326CE5?logo=kubernetes&logoColor=white)](https://azure.microsoft.com/en-us/products/kubernetes-service)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-Jenkins-D24939?logo=jenkins&logoColor=white)](https://www.jenkins.io)
[![SonarQube](https://img.shields.io/badge/Code%20Quality-SonarQube-4E9BCD?logo=sonarqube&logoColor=white)](https://www.sonarsource.com)

🌐 **Live Demo:** [charikty.swedencentral.cloudapp.azure.com](http://charikty.swedencentral.cloudapp.azure.com)

</div>

---

## Overview

Tunisia is undergoing a mandatory transition to electronic invoicing as part of its national digital transformation strategy. Most existing platforms — Fatoora, BISON, Swiver — are designed for accountants and large companies, leaving small businesses and freelancers without accessible tools.

Charikty is a multitenant SaaS platform that makes the full business management cycle — from quote creation to stock tracking — accessible to any user, regardless of accounting expertise.

---

## Key Features

### Business Operations
- **Invoice & Quote Management** — Full lifecycle: draft → confirm → send → track payment status
- **PDF Generation** — Branded PDF invoices, quotes, and delivery notes
- **Client & Supplier Management** — Centralized contact management with search and filtering
- **Product Catalog** — With automatic stock deduction on invoice/delivery confirmation
- **Expense Tracking** — Submission, approval workflow, and payment recording
- **Inventory Management** — Warehouse management, physical counts, variance reports

### AI-Powered Features
- **AI Financial Advisor** — Chat widget powered by Groq API (LLaMA 3.3 70B), pulling live Prisma data to generate financial insights and expense recommendations
- **Voice Invoice Creation** — Natural language invoice creation in Tunisian dialect (Derja) via NLP assistant

### Platform
- **Multitenant** — Complete data isolation per organization using `business_id` row-level scoping
- **RBAC** — Role hierarchy: Platform Admin → Business Owner → Business Admin → Accountant → Team Member
- **Real-time Dashboard** — KPIs, revenue charts, and financial summaries with live API integration
- **Dark Mode** — Persistent theme toggle

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite, Tailwind CSS, shadcn/ui, Redux, React Hook Form |
| Backend | NestJS 10, TypeScript 5, REST API, JWT Auth, Bcrypt, Nodemailer, PDFKit |
| Database | PostgreSQL 15+, Prisma ORM v5 |
| AI | Groq API (LLaMA 3.3 70B Versatile) |
| DevOps | Docker, Kubernetes (Azure AKS), Jenkins CI/CD, GitHub Actions, SonarQube, Prometheus, Grafana |

---

## Architecture

### Logical Architecture

```
┌─────────────────┐     HTTPS/REST API      ┌─────────────────────────┐
│   React 18 SPA  │ ◄──────────────────────► │   NestJS 10 (Modular)   │
│   TypeScript    │                          │   JWT · RBAC · CORS     │
│   Tailwind CSS  │                          │   Rate Limiting         │
└─────────────────┘                          └───────────┬─────────────┘
                                                         │ Prisma ORM
                                                         ▼
                                             ┌─────────────────────────┐
                                             │   PostgreSQL 15+        │
                                             │   Multitenant Isolation │
                                             │   (business_id scoping) │
                                             └─────────────────────────┘
```

### Infrastructure (Azure AKS)

```
GitHub → Jenkins CI/CD → Docker Build → Push to Registry → AKS Deployment
                                                              ├── frontend pod
                                                              ├── backend pod
                                                              └── PostgreSQL (PVC)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (or use the provided Docker setup)

### Local Setup

```bash
git clone https://github.com/slaffet1/projectspi.git
cd projectspi

# Start all services
docker compose up --build

# Or run manually:

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Variables

```env
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/charikty
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
GROQ_API_KEY=your_groq_api_key
SMTP_HOST=smtp.example.com
SMTP_USER=your_email
SMTP_PASS=your_password
```

---

## Project Structure

```
projectspi/
├── frontend/               # React 18 SPA
│   ├── src/
│   │   ├── app/pages/      # Route-level page components
│   │   ├── components/     # Shared UI components
│   │   ├── store/          # Redux state management
│   │   └── services/       # API service layer
│   └── Dockerfile
│
├── backend/                # NestJS 10 API
│   ├── src/
│   │   ├── auth/           # JWT authentication & guards
│   │   ├── users/          # User management
│   │   ├── business/       # Multitenant company management
│   │   ├── invoices/       # Invoice lifecycle
│   │   ├── products/       # Product catalog & stock
│   │   ├── ai-advisor/     # Groq API integration
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma
│   └── Dockerfile
│
├── k8s/                    # Kubernetes manifests
│   ├── frontend-deployment.yaml
│   ├── backend-deployment.yaml
│   └── postgres-statefulset.yaml
│
└── docker-compose.yml
```

---

## CI/CD Pipeline

Dual Jenkins pipeline (frontend and backend independently):

```
Push to main
    │
    ├── Install dependencies
    ├── Lint
    ├── Unit tests (Jest — 7 modules)
    ├── SonarQube analysis
    ├── Docker build & push
    └── Deploy to Azure AKS
```

Monitoring: Prometheus + Grafana on AKS.

---

## Testing

```bash
cd backend
npm run test
npm run test:cov
```

Unit tests cover 7 modules: auth, users, business, invoices, products, quotes, expenses.
