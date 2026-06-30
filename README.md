# FlowPilot

> **AI Operating System for Intelligent Productivity**
> Your day, handled by AI.

FlowPilot is an AI-powered productivity platform that combines task management, autonomous planning, Kanban workflows, and an emergency "Rescue Mode" into a single dashboard. Talk to it like an assistant — it parses what you say into real tasks, schedules your day, and helps you dig out when you fall behind.

[![React](https://img.shields.io/badge/react-19-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev)
[![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express)](https://expressjs.com)
[![Groq](https://img.shields.io/badge/groq-llama%203-%23F55036.svg?style=for-the-badge)](https://groq.com)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**[Live Demo →](https://flowpilot-8728b.web.app)**

---

## ⚡ Features

### 🤖 AI Chat Agent
Talk to FlowPilot in plain English — *"I need to study math for 2 hours, hit the gym, and finish my CS project"* — and it splits that into separate tasks, writes them straight to your database, and confirms what it did without ever showing you raw JSON. Powered by Groq (Llama 3 70B).

### 📋 Intelligent Task Management
Create and organize tasks with rich-text notes, subtasks, priority levels, and AI-generated risk scores.

### 📊 Dashboard
A single command center showing your Flow Score, overdue alerts, and today's critical initiatives.

### 🚨 Rescue Mode
When a task goes overdue, Rescue Mode triggers an AI-generated emergency breakdown — a step-by-step critical path paired with a built-in Pomodoro timer to get you unstuck.

### 📈 Analytics
Interactive charts (via Recharts) tracking completion rates and focus trends over time.

### 🗂️ Kanban Workspace
Drag-and-drop board (via dnd-kit), fully synced with your global task list in real time.

### 🧭 Coach / Productivity Twin
An AI-generated "archetype" summarizing your productivity patterns.

### 🔐 Google Authentication
Single Sign-On via Firebase Auth, scoped minimally (`openid`, `email`, `profile`) to avoid Google's unverified-app warning.

### ☁️ Real-Time Firestore Sync
Tasks and updates sync instantly across devices via `onSnapshot` listeners.

---

## 🏗️ Architecture

FlowPilot is a decoupled client–server app: the React client talks directly to Firestore for real-time data, and routes anything AI-related through an Express backend so inference keys never touch the browser.

```
[ React Client (Vite) ]
       │
       ├──── (Auth Token) ────▶ [ Firebase Auth ]
       │
 (onSnapshot Sync)
       │
       ▼
[ Firestore Database ] ◀────────┐
                                 │ (Admin SDK writes)
[ Express Backend ] ─────────────┘
       │
 (REST API)
       ▼
[ Groq API — Llama 3 ]
```

1. **Authentication** — the client signs the user in via Google SSO through Firebase.
2. **Real-time sync** — Firestore listeners (`onSnapshot`) keep tasks, goals, and plans live across every open tab/device.
3. **AI orchestration** — chat messages, scheduling requests, and Rescue Mode triggers go through the Express backend, which calls Groq and writes results back to Firestore via the Admin SDK — never trusting the client directly.

---

## 🛠️ Tech Stack

**Frontend**
- React 19 · Vite 8 · TailwindCSS 4
- React Router DOM
- Framer Motion (animations)
- Recharts (analytics)
- @dnd-kit (Kanban drag-and-drop)
- Axios · Marked (markdown notes)

**Backend**
- Node.js · Express.js
- Firebase Admin SDK
- Groq SDK (`llama3-70b-8192` for reasoning, `llama3-8b-8192` for lightweight tasks)
- node-telegram-bot-api (Telegram companion bot)

**Infrastructure**
- Google Cloud Firestore
- Firebase Authentication (Google provider)
- Firebase Hosting / Google Cloud Run

---

## 📂 Folder Structure

```
flowpilot/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # AuthContext (global user state)
│   │   ├── pages/          # Dashboard, Tasks, Chat, Kanban, etc.
│   │   ├── App.jsx         # Router configuration
│   │   ├── main.jsx        # Entry point
│   │   └── firebase.js     # Client Firebase init + auth helpers
│   ├── public/
│   └── .env.example
│
├── server/                 # Express backend
│   ├── index.js             # Server, middleware, API routes
│   ├── prompts.js           # AI system prompts
│   ├── telegram.js          # Telegram webhook handler
│   └── .env.example
│
├── docs/                   # Architecture notes & screenshots
└── README.md
```

---

## 🚀 Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/syedkarim2004/FlowPilot.git
cd FlowPilot
```

### 2. Install dependencies
```bash
cd client && npm install
cd ../server && npm install
```

### 3. Configure environment variables
```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

**`client/.env`**
| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_API_URL` | URL of the Express backend (e.g. Cloud Run) |

**`server/.env`**
| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `PORT` | Server port (default `8080`) |
| `GROQ_API_KEY` | Groq inference API key |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (optional, for the companion bot) |
| `TELEGRAM_BOT_USERNAME` | Telegram bot username (optional) |

### 4. Run the backend
```bash
cd server
npm run dev
```

### 5. Run the frontend
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📸 Screenshots

| Login | Dashboard |
|---|---|
| ![Login](docs/assets/login.png) | ![Dashboard](docs/assets/dashboard.png) |

| Kanban Workspace | Rescue Mode |
|---|---|
| ![Kanban](docs/assets/kanban.png) | ![Rescue Mode](docs/assets/rescue-mode.png) |

---

## 🧪 Project Status

FlowPilot is an early-stage, actively developed project. Most core flows are fully working end-to-end; a couple of features are intentionally disabled or still placeholders while the project matures.

**Working**
- Google OAuth login and session persistence
- Real-time task CRUD via Firestore
- AI Chat — multi-task parsing and autonomous database writes
- Kanban drag-and-drop with persisted state
- Rescue Mode AI breakdown generation
- Dashboard widgets and core analytics

**Known limitations**
- **Google Calendar sync** is currently disabled — the sensitive Calendar OAuth scope was removed to avoid Google's "unverified app" warning, so `CalendarPage` will not pull or push events until verification is complete.
- **Email/password login** is hidden in favor of Google SSO only.
- A few dashboard widgets (e.g. the System Risk Radar) and empty-state analytics charts are still visual placeholders pending real data wiring.

---

## 🗺️ Roadmap

- [ ] Voice-to-text task parsing on mobile
- [ ] Restore Google Calendar sync (post Google verification)
- [ ] Telegram Agent — manage tasks directly from Telegram
- [ ] Offline-first mode with PWA support
- [ ] Shared workspaces for team collaboration

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming conventions, commit message standards, and the PR template.

## 🔒 Security

Found a vulnerability? Please see [SECURITY.md](SECURITY.md) for responsible disclosure guidelines rather than opening a public issue.

## 📄 License

Licensed under the MIT License — see [LICENSE](LICENSE) for details.
