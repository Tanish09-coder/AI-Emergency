# 🚨 EmergencyAI — AI-Powered Emergency Situation Summarizer

## Overview
**EmergencyAI** is an emergency incident management system designed to solve information overload during emergencies. When multiple citizens report the same incident, EmergencyAI leverages AI (Google Gemini / OpenAI) to classify, detect duplicate reports, cluster related incidents, and generate structured, actionable incident summaries for emergency response teams.

---

## 👥 Team Responsibilities
- **Frontend Lead**: Nishit ([nishit-frontend.md](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/nishit-frontend.md))
- **Backend & AI Lead**: Tanish ([tanish-backend.md](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/tanish-backend.md))
- **Shared API Specifications**: ([api-contracts.md](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/api-contracts.md))

---

## 🎯 Main Demo Goal (Success Criteria)
Demonstrate 5 individual user reports being submitted sequentially:
1. `"Smoke coming from Block B"`
2. `"Fire alarm ringing in Block B"`
3. `"Flames seen on the 1st floor"`
4. `"Car crash at main street intersection"`
5. `"Black smoke near Block B"`

**Expected Result**:
- The AI Engine detects reports 1, 2, 3, and 5 belong to **Incident #1 (Fire - Block B)** and merges them.
- Report 4 is recognized as a separate **Incident #2 (Accident - Main Street)**.
- The Admin Dashboard displays 2 distinct incidents with high/critical severity rating and AI summaries.

---

## 🚀 System Architecture Flow

```
[User Report] 
      │
      ▼
[Express REST API]
      │
      ▼
[AI Classification] ──► Extracted: Type, Location, Severity
      │
      ▼
[Duplicate Detection Engine]
   ├─ Location Proximity
   ├─ Time Window
   ├─ Type Match
   └─ Text Similarity
      │
   ┌──┴────────────────────────┐
   ▼                           ▼
[MATCH FOUND: Merge]     [NO MATCH: Create]
   │                           │
   └───► [AI Summarizer] ◄─────┘
               │
               ▼
      [MongoDB Database]
               │
               ▼
      [Admin Dashboard UI]
```

---

## 📅 Roadmap & MVP Phases

### Phase 1: MVP Core (Current Target)
- [ ] Auth System (Reporter & Admin roles)
- [ ] Single Emergency Reporting form
- [ ] MongoDB Data Models (`User`, `Report`, `Incident`)
- [ ] AI Incident Classification (Type & Severity)
- [ ] AI Incident Summarization
- [ ] Admin Dashboard with live stats & status transitions (`REPORTED` → `VERIFIED` → `RESPONDING` → `RESOLVED`)

### Phase 2: Intelligence & Visualization
- [ ] AI Duplicate Detection & Report Merging
- [ ] Interactive Mapbox Map View with incident pins
- [ ] Image Upload support
- [ ] Basic Notifications

### Phase 3: Advanced Features
- [ ] Real-time updates via WebSockets / Socket.io
- [ ] Image Analysis using Multimodal AI
- [ ] Response team assignment module
