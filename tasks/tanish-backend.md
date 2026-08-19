# 👨💻 Tanish — Backend & AI Developer Task List & Guidelines

## 🎯 Role Focus
You are responsible for building the Node.js / Express backend server, MongoDB database models, REST APIs, and the AI Deduplication & Incident Summarization Pipeline using the Google Gemini / OpenAI API.

> ⛔ **Scope Boundary**: You must ONLY create/edit files inside `backend/`. DO NOT modify any file inside `frontend/`.

---


## 📋 Task Checklist

### Phase 1: MVP Core & Database (Priority)
- [x] **Server & Database Infrastructure**:
  - Express app entry point: `backend/src/server.js`.
  - MongoDB Atlas Mongoose connection in `src/config/db.js`.
  - CORS, `dotenv`, `express.json()` middleware setup.

- [x] **Mongoose Models**:
  - `src/models/User.js` (name, email, password hash, role).
  - `src/models/Report.js` (userId, description, location, emergencyType, incidentId).
  - `src/models/Incident.js` (type, severity, location, summary, status, reportCount, reportIds).

- [x] **Authentication APIs**:
  - Route: `src/routes/authRoutes.js`.
  - `POST /api/auth/register` (hash password using `bcryptjs`, issue JWT token).
  - `POST /api/auth/login` (validate credentials, issue JWT token).
  - Auth Middleware: `src/utils/authMiddleware.js` (verify JWT, check `ADMIN` role).

- [x] **AI Classification & Incident Management Pipeline**:
  - Service module: `src/services/aiService.js`.
  - **AI Prompt 1: Single Report Classification**:
    - Input: Report description & optional emergency type.
    - Output JSON: `{ "type": "Fire"|"Medical"|..., "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "extractedLocation": "Block B" }`
  - **AI Prompt 2: Incident Summarizer**:
    - Input: Array of report descriptions for an incident.
    - Output JSON: `{ "summary": "Multiple reports indicate a possible fire on the first floor of Block B.", "severity": "HIGH", "recommendedAction": "Evacuate Block B" }`

- [x] **Incident Management REST APIs**:
  - Route: `src/routes/incidentRoutes.js`.
  - `GET /api/incidents` (Fetch incidents + summary statistics `{ total, active, critical }`).
  - `GET /api/incidents/:id` (Fetch single incident with linked reports).
  - `PATCH /api/incidents/:id/status` (Update status: `REPORTED` → `VERIFIED` → `RESPONDING` → `RESOLVED`).

---

### Phase 2: AI Duplicate Detection Engine ⭐
- [x] **Deduplication Logic** (`src/services/deduplicationService.js`):
  - When a new report is submitted:
    1. Query active incidents (status != `RESOLVED`) within past 2 hours.
    2. Filter by geographic proximity (Haversine formula or location text match).
    3. Pass new report + candidate existing incidents to AI Duplicate Detection Prompt:
       - *"Does this new report belong to any of the existing active incidents listed below?"*
    4. If **MATCH**: Append report ID to existing Incident, increment `reportCount`, and trigger AI Summarizer update.
    5. If **NO MATCH**: Create a new Incident entry in MongoDB.

---

## 🤖 AI Prompts Specification (Gemini API)

### 1. Classification & Severity Prompt
```json
System: You are an emergency triage AI. Output strictly valid JSON.
User Prompt:
Analyze the following report:
Description: "${report.description}"
Location: "${report.location.address}"

Return JSON:
{
  "type": "Fire | Medical | Accident | Security | Natural Disaster | Other",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "keyKeywords": ["smoke", "block B"]
}
```

### 2. Incident Merger & Summary Prompt
```json
System: You are an emergency situation coordinator AI. Combine multiple user reports into one concise incident summary.
User Prompt:
Reports for this incident:
1. "Smoke coming from Block B"
2. "Fire alarm in Block B"
3. "Flames seen on first floor"

Return JSON:
{
  "summary": "Multiple reports indicate a possible fire on the first floor of Block B.",
  "severity": "HIGH",
  "primaryType": "Fire"
}
```

---

## 🔗 Shared Resources
- [API Contracts Specs](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/api-contracts.md)
- [Project Overview & Roadmap](file:///c:/Users/A%20J/OneDrive/Desktop/ai%20emergency/tasks/README.md)
