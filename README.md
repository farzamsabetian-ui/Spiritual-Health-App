# 🕊️ Portal de Salud Espiritual & Dynamic Form Management Platform

> **Full-Stack Enterprise Web Application** featuring dynamic drag-and-drop form construction, multi-role access control (Admin, Auditor, MCA User, Health Team), real-time validation, regional analytics dashboards, automated AI analysis, and print-ready PDF export engines.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38b2ac.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg?logo=express)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-8e75ff.svg?logo=google)](https://ai.google.dev/)
[![D3.js / Recharts](https://img.shields.io/badge/Data%20Viz-D3%20%26%20Recharts-orange.svg)](https://recharts.org/)
[![License: Demonstration Only](https://img.shields.io/badge/License-Demonstration%20Only-red.svg)](LICENSE)
[![Architecture Guide](https://img.shields.io/badge/Architecture-Deep%20Dive-emerald.svg)](ARCHITECTURE.md)

---

## 📌 Executive Summary

The **Portal de Salud Espiritual** is an end-to-end data gathering, validation, and executive analytics platform built for institutional coordinators and Auxiliary Board Members (MCA). It bridges complex qualitative and quantitative field reporting with institutional-grade data validation, multi-user reconciliation, automated AI-assisted synthesis, and print-ready PDF exports.

> 📖 **Deep Dive**: For an in-depth architectural breakdown of design decisions, data models, and engineering rationale, see [**ARCHITECTURE.md**](ARCHITECTURE.md).

Designed for high usability across varying technical backgrounds, the platform provides distinct, role-tailored workflows ranging from dynamic form generation for administrators to step-by-step reporting for field coordinators and cross-regional data exploration for regional analytics teams.

---

## ✨ Key Capabilities & Architectural Highlights

### 1. 🛠️ Visual Dynamic Form Builder
- **Zero-Code Schema Construction**: Administrators can dynamically create, edit, reorder, and remove fields without touching source code or altering backend migrations.
- **Rich Field Types**:
  - Text, Multi-line TextArea, and Number with custom min/max/step validation.
  - Date pickers with calendar view and standardized formatting.
  - Single/Multi-Select dropdowns with custom "Other" option inputs.
  - Custom Matrix / Data Tables with configurable column schemas and predefined rows.
  - Boolean with mandatory justification requirements.
  - Visual Sections and categorized layout dividers.
- **Drag-and-Drop Order Management**: Intuitive reordering of questions and sections with automatic sequence synchronization.

### 2. 📋 Guided MCA Reporting Interface
- **Stepped Form Stepper**: Multi-phase workflow breaking down lengthy surveys into manageable, thematic steps.
- **Real-Time Validation & Error Highlighting**: Proactive input validation preventing missing required fields before submission.
- **Draft Auto-Saving & History Management**: Local draft recovery alongside historical submission editing and review.
- **Conflict Detection Engine**: Multi-user synchronization that identifies discrepancies when multiple coordinators submit conflicting numbers for the same administrative unit.
- **High-Fidelity PDF / Print Engine**: Dedicated print stylesheet generating clean, official institutional reports with zero extraneous UI chrome.

### 3. 📊 Regional Analytics & Data Visualization
- **Geospatial & Choropleth Maps**: Visual distribution of field activities and community health indices across territories.
- **Interactive D3 & Recharts Visualizations**: Comparative bar charts, activity distribution radars, and longitudinal trend lines.
- **Multi-Dimensional Filtering**: Real-time filtering by country, geographical region, coordinator group, and date ranges.
- **Automated AI Intelligence (Google Gemini 2.5)**: Server-side AI integration providing executive summaries, anomaly detection, and qualitative insight synthesis.

### 4. 🔐 Enterprise Security & Role-Based Access (RBAC)
- **Role Hierarchy**:
  - `admin`: Full administrative control, form builder, user management, and raw database console.
  - `auditor`: Read-only access to regional dashboards, comparative reports, and export tools.
  - `health_team`: Specialized access to spiritual health metrics and regional summaries.
  - `user` (MCA): Form submission, history management, and PDF report printing.
- **Protected Database Console**: In-browser raw database editor protected by secondary administrative authentication (`X-Admin-Password`).

---

## 🏗️ Architecture & Technology Stack

```
├── Client Application (React 19 + TypeScript + Vite)
│   ├── src/components/
│   │   ├── UserForm.tsx               # MCA reporting interface, stepper, print rendering
│   │   ├── AdminDashboard.tsx         # Drag-and-drop form builder, user admin, DB editor
│   │   ├── RegionalStatsDashboard.tsx # D3/Recharts analytics, maps, AI synthesis
│   │   └── LoginModal.tsx             # Authentication and session management
│   ├── src/types.ts                   # Core TypeScript type definitions & interfaces
│   └── src/index.css                  # Tailwind CSS v4 setup & custom print stylesheets
│
├── Server & Backend API (Node.js + Express + TypeScript)
│   ├── server.ts                      # REST endpoints, authentication, Gemini proxy, SSR
│   └── src/db/
│       ├── schema.ts                  # Relational database schema definitions (Drizzle ORM)
│       └── migrate.ts                 # Dual-mode synchronization & database bridge
│
└── Configuration & Blueprints
    ├── server-db.example.json         # Sanitized initial blueprint and demo schema
    ├── .env.example                   # Environment configuration documentation
    └── metadata.json                  # Platform runtime metadata
```

### Technology Matrix

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 6 |
| **Styling & Design System** | Tailwind CSS v4, Motion (animations), Lucide Icons |
| **Data Visualization** | Recharts, D3.js, TopoJSON/GeoJSON layers |
| **Backend Framework** | Node.js, Express.js 4.21, `tsx` runtime |
| **Artificial Intelligence** | Google Gemini 2.5 Flash via `@google/genai` TypeScript SDK |
| **Database & ORM** | Drizzle ORM, PostgreSQL driver (`pg`), Dual-mode JSON persistence |
| **Build & Tooling** | esbuild, Vite, TypeScript Compiler (`tsc`) |

---

## 🔒 Security, Privacy & Data Isolation

This codebase is structured with **strict separation between application architecture and private organizational records**:

1. **Zero Data Exposure in Git**: Live data files (`server-db.json`, `.sqlite`, `.db`, `exports/`, `backups/`) and active `.env` files are explicitly excluded via `.gitignore`.
2. **Sanitized Blueprint Provided**: `server-db.example.json` provides a complete working demo schema with fictional test users so anyone cloning the repository can run the platform immediately.
3. **Server-Side API Key Protection**: All AI processing (Gemini API) and database operations happen server-side; API keys are never exposed in browser bundles.

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: `v18.0.0` or newer
- **Package Manager**: `npm` (or `bun` / `pnpm` / `yarn`)

### Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/portal-salud-espiritual.git
   cd portal-salud-espiritual
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` if you wish to configure a custom `ADMIN_DB_PASSWORD` or connect a `GEMINI_API_KEY`.*

4. **Initialize Local Database Blueprint**:
   ```bash
   cp server-db.example.json server-db.json
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at **`http://localhost:3000`**.

---

## 👥 Demo Accounts & Credentials

The demo database template (`server-db.example.json`) comes pre-seeded with the following credentials:

| Role | Email | Password | Scope & Access |
|---|---|---|---|
| **Administrator** | `admin@demo.org` | `Password123!` | Full control: Form builder, user management, raw DB console |
| **MCA Coordinator** | `mca@demo.org` | `Password123!` | Form reporting, draft management, submission history, PDF printing |
| **Auditor** | `auditor@demo.org` | `Password123!` | Executive dashboard, regional analytics, report reviews |

*Database Console Access Password (Default)*: `admin-valida-2026`

---

## 📡 REST API Reference

### Authentication & Users
- `POST /api/auth/login`: Authenticate user and initialize session.
- `GET /api/users`: List registered coordinators (Admin only).
- `POST /api/users`: Create a new user with assigned role and geographical grouping.
- `PUT /api/users/:email`: Update user permissions, region, or password.
- `DELETE /api/users/:email`: Remove or archive user access.

### Dynamic Form Schema
- `GET /api/form/fields`: Retrieve current form structure and validation rules.
- `POST /api/form/fields`: Update form schema and ordering.

### Submissions & Reporting
- `GET /api/form/submissions`: Retrieve historical submissions.
- `POST /api/form/submissions`: Submit or update a reporting entry with automated validation.

### Intelligence & Database Management
- `POST /api/ai/analyze`: Execute Gemini 2.5 AI synthesis and trend analysis.
- `GET /api/admin/database/raw`: Inspect raw database state (Requires `X-Admin-Password`).
- `POST /api/admin/database/save`: Overwrite database structure with validation checks.

---

## 💼 Portfolio Highlights

- **Complex State Management**: Handles deeply nested form state, dynamic schema generation, and optimistic UI updates without external state library bloat.
- **Enterprise-Grade Validation**: Dual-layer validation (client-side interactive feedback + server-side schema verification).
- **Modern Responsive Design**: Accessible, dark-mode and light-mode compatible design system built with Tailwind CSS v4.
- **Print Optimization**: Custom CSS media queries ensuring that field submissions export as professional institutional documents.

---

## 📄 License & Restrictions

This software is provided for **Demonstration and Evaluation Purposes Only**. 

All rights reserved. Unauthorized commercial use, reproduction, distribution, or deployment of this software or its domain-specific workflows without prior written permission is strictly prohibited. See the [LICENSE](LICENSE) file for complete details.
