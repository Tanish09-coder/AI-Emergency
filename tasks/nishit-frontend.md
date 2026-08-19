# 👨💻 Nishit — Frontend Developer Task List & Guidelines

## 🎯 Role Focus
You are responsible for building the Next.js Frontend for **EmergencyAI**, ensuring a clean, modern, and responsive user experience for both Citizens/Reporters and Response Coordinators (Admins).

> ⛔ **Scope Boundary**: You must ONLY create/edit files inside `frontend/`. DO NOT modify any file inside `backend/`.

---


## 📋 Task Checklist

### Phase 1: MVP Core (Priority)
- [x] **Setup Project Architecture**:
  - Next.js App Router setup under `frontend/src/app`.
  - Configure Tailwind CSS tokens (Dark mode theme with emergency accent colors: Red 🔴, Yellow 🟡, Green 🟢).
  - Setup Axios / API Client singleton in `src/services/api.ts` pointing to `NEXT_PUBLIC_API_BASE_URL`.

- [x] **Authentication Flow**:
  - Page: `src/app/login/page.tsx` (Login & Register toggles + 1-Click Instant Demo Login buttons).
  - User role selection (`REPORTER` vs `ADMIN`).
  - Store JWT Token securely in `localStorage` / HTTP headers.

- [x] **Reporter Flow (Emergency Report Page)**:
  - Page: `src/app/report/page.tsx`.
  - Form Fields: Description (required), Emergency Type (dropdown/chips), Location address + GPS coords auto-detect.
  - Success toast & status viewer for submitted reports.

- [x] **Admin Dashboard View**:
  - Page: `src/app/admin/dashboard/page.tsx`.
  - **Metrics Summary Bar**: Cards displaying `Total Incidents`, `Active Incidents`, and `Critical Incidents`.
  - **Incidents Table / List View**: Columns for Type, Severity Badge (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), Location, Report Count, Status Dropdown (`REPORTED`, `VERIFIED`, `RESPONDING`, `RESOLVED`), and Created Time.
  - Status change API handler (`PATCH /api/incidents/:id/status`).

- [x] **Incident Details & AI Summary Modal**:
  - Modal component: `src/components/IncidentDetailModal.tsx`.
  - Displays AI Generated Incident Summary prominently.
  - Lists all underlying individual user reports merged into this incident.

---

### Phase 2: Map & Enhancements
- [x] **Map View**:
  - Page/Component: `src/components/MapView.tsx`.
  - Integrate Mapbox GL JS to display incident pins geographically.
  - Color code markers by severity (🔴 Critical/High, 🟡 Medium, 🟢 Resolved).
  - Click marker → Opens Incident Details modal.

- [ ] **Image Upload**:
  - Add image file picker to report submission form.

---

## 🎨 Design Guidelines & Aesthetics
- **Theme**: Dark mode primary background (`#0F172A` / `#1E293B`) with high contrast emergency badges.
- **Severity Colors**:
  - `CRITICAL`: Red `#EF4444` with pulse animation.
  - `HIGH`: Orange `#F97316`.
  - `MEDIUM`: Yellow `#EAB308`.
  - `LOW`: Blue `#3B82F6`.
- **Typography**: Inter / Outfit sans-serif fonts.

---

## 🔗 Shared Resources
- [API Contracts Specs](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/api-contracts.md)
- [Project Overview & Goals](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/README.md)
