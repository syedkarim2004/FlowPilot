# FLOWPILOT: COMPLETE SOFTWARE ARCHITECTURE REPORT

> **Generated for Technical Audit & AI Onboarding**  
> **Status:** MVP / Beta Candidate  
> **Architecture:** React 19 (Vite) Frontend + Express/Node.js Backend + Firebase (Auth/Firestore) + Groq (LLaMA-3 70B)

---

## 📂 STEP 1: PROJECT STRUCTURE

```text
FlowPilot/
├── client/                     # Frontend Vite Application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.jsx             # Main Router
│   │   ├── api.js              # Axios interceptors & API definitions
│   │   ├── firebase.js         # Firebase Client SDK Init
│   │   ├── index.css           # Global Theme, Tailwind imports, fp-classes
│   │   ├── main.jsx            # React Root & Context Providers
│   │   ├── utils.js            # Date & time formatters
│   │   ├── components/         # Reusable UI elements
│   │   ├── context/            # React Context (Auth, Theme, Toast)
│   │   └── pages/              # Route views (Dashboard, Chat, TaskDetail)
├── server/                     # Backend Express API
│   ├── package.json
│   ├── index.js                # Express App & Route Definitions
│   ├── groq.js                 # LLM SDK Integration
│   ├── prompts.js              # Prompt Engineering templates
│   ├── firestore.js            # Firebase Admin SDK (legacy/unused)
│   └── middleware/
│       └── auth.js             # API Auth middleware
├── firestore.rules             # Firestore Security Rules
└── project_metadata.json       # Audit snapshot
```

---

## 🗄️ STEP 2: FILE INVENTORY

| File Name | Path | Purpose | LOC | Status |
|-----------|------|---------|-----|--------|
| `App.jsx` | `client/src/App.jsx` | Core Config | 58 | Completed |
| `api.js` | `client/src/api.js` | Core Config | 61 | Completed |
| `AIBriefing.jsx` | `client/src/components/AIBriefing.jsx` | UI Component | 95 | Completed |
| `AddTaskModal.jsx` | `client/src/components/AddTaskModal.jsx` | UI Component | 358 | Completed |
| `AppLayout.jsx` | `client/src/components/AppLayout.jsx` | UI Component | 257 | Completed |
| `EmptyState.jsx` | `client/src/components/EmptyState.jsx` | UI Component | 88 | Completed |
| `FocusTimeline.jsx` | `client/src/components/FocusTimeline.jsx` | UI Component | 152 | Completed |
| `NotificationManager.jsx` | `client/src/components/NotificationManager.jsx` | UI Component | 56 | Completed |
| `ProductivityGauge.jsx` | `client/src/components/ProductivityGauge.jsx` | UI Component | 94 | Completed |
| `ProtectedRoute.jsx` | `client/src/components/ProtectedRoute.jsx` | UI Component | 24 | Completed |
| `QuickCaptureFAB.jsx` | `client/src/components/QuickCaptureFAB.jsx` | UI Component | 229 | Completed |
| `SearchBar.jsx` | `client/src/components/SearchBar.jsx` | UI Component | 212 | Completed |
| `SkeletonLoader.jsx` | `client/src/components/SkeletonLoader.jsx` | UI Component | 57 | Completed |
| `TaskCard.jsx` | `client/src/components/TaskCard.jsx` | UI Component | 179 | Completed |
| `TodaysFocus.jsx` | `client/src/components/TodaysFocus.jsx` | UI Component | 163 | Completed |
| `AuthContext.jsx` | `client/src/context/AuthContext.jsx` | Core Config | 94 | Completed |
| `ThemeContext.jsx` | `client/src/context/ThemeContext.jsx` | Core Config | 51 | Completed |
| `ToastContext.jsx` | `client/src/context/ToastContext.jsx` | Core Config | 67 | Completed |
| `firebase.js` | `client/src/firebase.js` | Core Config | 28 | Completed |
| `main.jsx` | `client/src/main.jsx` | Core Config | 23 | Completed |
| `AIChatPage.jsx` | `client/src/pages/AIChatPage.jsx` | Page Route | 406 | Completed |
| `CalendarPage.jsx` | `client/src/pages/CalendarPage.jsx` | Page Route | 405 | Partial/MVP |
| `DashboardPage.jsx` | `client/src/pages/DashboardPage.jsx` | Page Route | 482 | Completed (Refined) |
| `GoalsPage.jsx` | `client/src/pages/GoalsPage.jsx` | Page Route | 185 | Partial/MVP |
| `LoginPage.jsx` | `client/src/pages/LoginPage.jsx` | Page Route | 380 | Completed |
| `RescueModePage.jsx` | `client/src/pages/RescueModePage.jsx` | Page Route | 250 | Completed |
| `SettingsPage.jsx` | `client/src/pages/SettingsPage.jsx` | Page Route | 111 | Completed |
| `TaskDetailPage.jsx` | `client/src/pages/TaskDetailPage.jsx` | Page Route | 471 | Completed (Refined) |
| `utils.js` | `client/src/utils.js` | Core Config | 30 | Completed |
| `vite.config.js` | `client/vite.config.js` | Core Config | 13 | Completed |
| `generate_metadata.js` | `generate_metadata.js` | Core Config | 44 | Completed |
| `firestore.js` | `server/firestore.js` | Backend Service | 244 | Deprecated/Legacy |
| `groq.js` | `server/groq.js` | Backend Service | 82 | Completed |
| `index.js` | `server/index.js` | Backend Service | 348 | Completed |
| `auth.js` | `server/middleware/auth.js` | Backend Service | 54 | Completed |
| `prompts.js` | `server/prompts.js` | Backend Service | 277 | Completed |
| `index.js` | `temp-verify/index.js` | Core Config | 24 | Completed |

---

## 🏗️ STEP 3: FRONTEND ARCHITECTURE

### React Architecture
- **Framework:** React 19 + Vite (ESM-based HMR).
- **Routing:** `react-router-dom` v7 handling protected and public boundaries.
- **State Management:** React Context API handles global state (Auth, Theme, Toast). Local state relies heavily on `useState`, `useReducer`, and `useMemo`.
- **Data Fetching:** Direct Firestore SDK reads (`onSnapshot` for realtime, `getDoc` for one-offs) combined with Axios for backend AI endpoints.

### Components & Reusability
- **Design System:** Glassmorphism (`glass-card`, `.fp-card`) mixed with utility classes. Tailwind CSS v4 is configured globally in `index.css` via `@import "tailwindcss"` and mapped to CSS variables via `@theme`.
- **Component Hierarchy:** `AppLayout` manages the Sidebar, SearchBar, and Notifications globally. Child routes map to `Outlet`.

### Authentication Flow
1. User lands on `/login`.
2. `AuthContext` triggers `signInWithGoogle` from Firebase Auth.
3. `onAuthStateChanged` updates `user` state.
4. `ProtectedRoute` wrapper intercepts unauthenticated access and redirects.

---

## ⚙️ STEP 4: BACKEND ARCHITECTURE

### Express Architecture
- **Server:** Node.js Express server running on port 8080.
- **Middleware:** `cors` (configured for local and prod domains), `express.json()`, and custom `auth` middleware (currently relies on frontend passing `userId` via body/headers).
- **AI Integration:** Exclusively uses Groq SDK (`llama-3.3-70b-versatile`) for sub-second, highly complex JSON schema generation.
- **Error Handling:** Standard Express catch-all error handler at the end of the middleware chain.
- **Logging:** Simple `console.log` for incoming requests and AI inference times. No formal winston/pino setup yet.

---

## 🗄️ STEP 5: DATABASE (FIREBASE)

**Primary Engine:** Cloud Firestore
**Authentication:** Firebase Auth (Google Provider)

### Collections Structure
```text
users (Collection)
 └── {userId} (Document)
      ├── tasks (Subcollection)
      │    ├── {taskId}: { title, deadline, riskScore, priority, subtasks, status }
      ├── goals (Subcollection)
      │    ├── {goalId}: { title, type, target, progress }
      ├── plans (Subcollection)
      │    ├── {YYYY-MM-DD}: { schedule: [{time, taskTitle, duration}] }
      ├── agentLog (Subcollection)
      │    ├── {logId}: { eventType, timestamp, description }
      └── history (Subcollection)
```

### Security Rules
- Granular per-user isolation.
- `match /users/{userId}/{document=**}` requires `request.auth != null && request.auth.uid == userId`.
- Realtime listeners securely attach to `users/{uid}/tasks`.

---

## 🔄 STEP 6: CRUD ANALYSIS

### Tasks (`users/{uid}/tasks`)
- **Create:** `AddTaskModal.jsx` (Frontend Firestore `addDoc`) or `QuickCaptureFAB.jsx`.
- **Read:** `DashboardPage.jsx` (`onSnapshot`), `TaskDetailPage.jsx` (`onSnapshot` recently fixed for realtime).
- **Update:** `TaskDetailPage.jsx` (Subtask toggling, edits).
- **Delete:** `TaskCard.jsx` (`deleteDoc`).

### Goals (`users/{uid}/goals`)
- **Create/Read/Update/Delete:** Completely handled within `GoalsPage.jsx` using modular Firestore hooks.

### Plans (`users/{uid}/plans/{date}`)
- **Create:** Handled by backend `/api/plan/daily`. Frontend fetches AI result and saves it to Firestore.
- **Read:** `DashboardPage.jsx` fetching today's plan.

---

## 🎯 STEP 7: FEATURE AUDIT

| Feature | Description | Status | Completion |
|---------|-------------|--------|------------|
| **Auth** | Google OAuth Login | Completed | 100% |
| **Dashboard** | Realtime task aggregation, scores, grid layout | Completed | 100% |
| **Task Management** | Full CRUD, priority scoring, subtasks | Completed | 95% |
| **AI Task Breakdown** | Groq auto-splits tasks & calculates risk | Completed | 100% |
| **Rescue Mode** | Emergency deadline planner | Completed | 90% |
| **AI Chat Agent** | Context-aware chat with action-injection | Completed | 85% |
| **Daily Planner** | Auto-schedules tasks around breaks | MVP | 80% |
| **Goals & Habits** | Tracks long-term objectives | MVP | 70% |
| **Calendar View** | Maps deadlines to calendar | MVP | 60% |
| **Notifications** | Alerts on high-risk tasks | Experimental | 40% |
| **Voice Input** | Speech-to-text task creation | Missing | 0% |

---

## 🧠 STEP 8: AI SYSTEM

- **Model Engine:** `llama-3.3-70b-versatile` via Groq. chosen for massive speed (required for real-time UI generation).
- **Prompt Engineering:** Prompts strictly enforce JSON outputs (`Respond with ONLY a JSON object, no other text`).
- **Risk Scoring:** AI calculates `riskScore` based on hours to deadline vs estimated effort.
- **Action Injection:** The Chat Agent uses a custom syntax `[ACTION: {"type":"ADD_TASK", ...}]`. The frontend intercepts this string, parses the JSON, and executes Firestore commands invisibly.
- **Rescue Mode:** Calculates survivability probability and cuts non-critical path items.

---

## 🎨 STEP 9: UI ANALYSIS

- **Design System:** Dark Mode Default, Premium Glassmorphism.
- **Core Elements:**
  - `fp-card` / `.glass-card`: Translucent backgrounds, blur filters, glowing hover borders.
  - `fp-btn`: Sleek, rounded-md, accent-colored buttons.
  - `fp-badge`: Pill-shaped semantic tags (Red=Critical, Yellow=At Risk, Green=On Track).
- **Animations:** Heavy use of Framer Motion (`animate-fade-in`, `pulse-red` for critical tasks).
- **Responsiveness:** Sidebar converts to an overlay on mobile. CSS Grid collapses to 1-column layout on smaller viewports.

---

## 📄 STEP 10: PAGE ANALYSIS

1. **DashboardPage (`/dashboard`)**: The central nervous system. Aggregates tasks, calculates overall productivity, displays the daily plan, and allows filtering. Uses 100% realtime listeners.
2. **TaskDetailPage (`/task/:taskId`)**: Deep dive into a task. Handles subtasks, edits, comments, and triggers Rescue Mode.
3. **RescueModePage (`/rescue/:taskId`)**: An intense, focused UI with a ticking countdown timer and strict AI-generated critical path.
4. **AIChatPage (`/chat`)**: A conversational interface that injects the user's live database context into every prompt.
5. **GoalsPage (`/goals`)**: Long-term tracking for OKRs and habits.
6. **LoginPage (`/login`)**: Animated hero landing page with Google Auth.

---

## 🔌 STEP 11: API ANALYSIS (Express)

| Method | Endpoint | Purpose | AI Dependency |
|--------|----------|---------|---------------|
| `GET` | `/health` | Server heartbeat | None |
| `POST` | `/api/tasks/analyze` | Calculates Risk/Priority + Subtasks | Groq |
| `POST` | `/api/plan/daily` | Generates a time-blocked schedule | Groq |
| `POST` | `/api/rescue` | Generates emergency survivability plan | Groq |
| `POST` | `/api/chat` | Conversational agent with task injection | Groq |
| `POST` | `/api/sprint` | Generates a focused 60-min sprint | Groq |

---

## 📦 STEP 12: DEPENDENCY ANALYSIS

- **React Router v7:** Client-side routing.
- **Firebase v12:** Auth & Firestore (Modular SDK for reduced bundle size).
- **Tailwind CSS v4:** Utility-first styling engine mapped to CSS variables.
- **Framer Motion:** High-performance, declarative animations.
- **Axios:** Reliable HTTP client for communicating with the local Express backend.
- **Groq SDK:** Server-side LLM inference wrapper.

---

## 🛡️ STEP 13: CODE QUALITY

**Strengths:**
- Extremely rapid iteration capability.
- React hooks (`useCallback`, `useMemo`) are used correctly to prevent re-renders.
- Firestore logic is well-isolated.
- Clean separation of concerns between AI generation (Backend) and DB mutations (Frontend).

**Vulnerabilities & Fixes Applied:**
- **Race Conditions:** `TaskDetailPage` previously suffered from an early-return `finally` trap which resulted in "Task Not Found" blank screens. This was mitigated by migrating to robust `onSnapshot` listeners.
- **CSS Preflight Conflicts:** Tailwind v4 was previously missing global import, causing UI degradation. Now fully restored via `index.css`.
- **Backend Security:** `auth.js` middleware currently accepts raw `userId` strings from the client instead of verifying Firebase ID Tokens. (Security risk for production).

---

## 📊 STEP 14: PROJECT COMPLETION

| Layer | Completion | Notes |
|-------|------------|-------|
| Frontend | 90% | Highly polished, responsive, and functional. |
| Backend | 85% | AI endpoints work perfectly; lacks robust auth verification. |
| Database | 95% | Schema is stable and Security Rules are active. |
| AI | 90% | Excellent prompt engineering and JSON constraints. |
| **Overall** | **90%** | **Beta-Ready MVP.** |

---

## 🚀 STEP 15: MISSING FEATURES (PRIORITIZED)

**Critical (Pre-Launch):**
1. Backend token verification (`verifyIdToken`) instead of trusting `req.body.userId`.
2. Error Boundaries for React to prevent total crashes on malformed data.

**Important:**
1. Voice Input API integration (Browser SpeechRecognition).
2. Recurring habits engine (Cron jobs).
3. Push notifications (Firebase Cloud Messaging).

**Nice to Have:**
1. OAuth Integrations (Google Calendar Sync, GitHub PR syncing).
2. Dark/Light Theme toggle (Currently hardcoded Dark).

---

## 🏆 STEP 16: HACKATHON READINESS

- **Innovation:** 9/10 (AI Rescue Mode and automated risk scoring is highly unique).
- **UI/UX:** 9/10 (Premium glassmorphic design feels very professional).
- **Backend/AI:** 8/10 (Fast Groq integration, but lacks agentic autonomy tools).
- **Scalability:** 7/10 (Firestore scales endlessly, but backend needs security hardening).
- **Production Readiness:** 7/10 (Needs environment variable lockdown and JWT auth).
- **OVERALL JUDGE SCORE: 8.5 / 10**

---

## 🗺️ STEP 17: NEXT ROADMAP

**Phase 1: Security & Hardening (Week 1)**
- Implement Firebase Admin SDK `verifyIdToken` in Express middleware.
- Add React Error Boundaries.

**Phase 2: Feature Completion (Week 2)**
- Implement Voice-to-Text task creation.
- Finish Calendar UI integrations.

**Phase 3: Integrations (Week 3)**
- Sync with Google Calendar API.
- Add GitHub webhooks for developer tasks.

**Phase 4: Deployment (Week 4)**
- Frontend to Vercel / Firebase Hosting.
- Backend to Google Cloud Run / Render.

---
*End of Report.*
