# 🚨 AGENTS.md — EmergencyAI Workspace Instructions & Context

This file provides system instructions for Antigravity AI assistants working on **EmergencyAI**.

---

## 📌 Project Overview
**EmergencyAI** is an AI-powered emergency incident management system. It collects incident reports from multiple users, detects duplicate reports using AI (location, time, emergency type, text similarity), clusters related reports, and generates structured incident summaries with severity levels for admin response teams.

---

## 👥 Team Division & Scope

### 1. Nishit — Frontend Developer (`frontend/`)
- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide icons, Mapbox GL JS.
- **Responsibilities**:
  - UI/UX layout & dark mode theme with emergency status indicators.
  - Reporter flow (`src/app/report/page.tsx`).
  - Admin Dashboard (`src/app/admin/dashboard/page.tsx`) with live stats, incident feed, and status toggles (`REPORTED` → `VERIFIED` → `RESPONDING` → `RESOLVED`).
  - Incident Details modal displaying AI summaries & merged user reports.
  - Map View displaying incidents geographically.
- **Task Checklist**: [tasks/nishit-frontend.md](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/nishit-frontend.md)

### 2. Tanish — Backend & AI Developer (`backend/`)
- **Stack**: Node.js, Express REST API, MongoDB Atlas (Mongoose), Google Gemini API (`@google/genai`).
- **Responsibilities**:
  - MongoDB models: `User`, `Report`, `Incident`.
  - JWT Auth endpoints (`POST /api/auth/register`, `POST /api/auth/login`).
  - Emergency report processing & AI Classification engine.
  - AI Duplicate Detection & Report Clustering engine.
  - AI Incident Summarizer.
  - Incident management endpoints (`GET /api/incidents`, `PATCH /api/incidents/:id/status`).
- **Task Checklist**: [tasks/tanish-backend.md](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/tanish-backend.md)

---

## 📜 Key Contracts & Specifications
- **Shared API & DB Schemas**: Refer to [tasks/api-contracts.md](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/api-contracts.md) before implementing or modifying any REST endpoint or database model.
- **Main Demo Goal**: The system must process 5 sample user reports, merge related reports into 1 clustered Incident with an AI summary, and display 1 Incident on the Admin Dashboard.

---

## 🎨 UI Severity & Color Standards
- **CRITICAL**: Red `#EF4444` (Pulse animation for high alert)
- **HIGH**: Orange `#F97316`
- **MEDIUM**: Yellow `#EAB308`
- **LOW**: Blue `#3B82F6`
- **RESOLVED**: Green `#22C55E`

---

## ⛔ Strict Code Isolation & Conflict Prevention Rules

> [!CAUTION]
> **MANDATORY FILE BOUNDARIES TO PREVENT MERGE CONFLICTS**:
> 1. **Frontend Work (Nishit)**: Antigravity MUST ONLY edit/create files inside `frontend/` and `tasks/nishit-frontend.md`. Antigravity MUST NEVER touch, edit, or delete any file inside `backend/`.
> 2. **Backend Work (Tanish)**: Antigravity MUST ONLY edit/create files inside `backend/` and `tasks/tanish-backend.md`. Antigravity MUST NEVER touch, edit, or delete any file inside `frontend/`.
> 3. **Shared Contracts**: Neither developer should modify [`tasks/api-contracts.md`](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/api-contracts.md) without mutual agreement.

