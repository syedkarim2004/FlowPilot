# FlowPilot

> **AI Operating System for Intelligent Productivity**

FlowPilot is an AI-powered productivity platform that combines intelligent task management, autonomous planning, AI assistance, analytics, Kanban workflows, Rescue Mode, and Google Authentication into a modern productivity operating system.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Google Cloud](https://img.shields.io/badge/GoogleCloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-%238E75B2.svg?style=for-the-badge&logo=googlebard&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

---

## ⚡ Features

### 🤖 AI Assistant
A conversational AI agent that understands your context. Ask it to organize your day, create multi-part tasks, or summarize your goals. It autonomously translates natural language into database actions.

### 📋 Intelligent Task Management
Create, edit, and organize tasks with rich text notes, subtasks, priority levels, and AI-driven risk scores.

### 📊 Dashboard
A unified command center providing a birds-eye view of your productivity, flow score, overdue alerts, and today's critical initiatives.

### 🚨 Rescue Mode
Detects overdue initiatives and triggers an emergency breakdown, generating a step-by-step critical path with a built-in Pomodoro timer to help you get unstuck.

### 📈 Analytics
Visualizes your productivity metrics, completion rates, and focus trends over time using interactive charts.

### 🗂️ Kanban Board
A drag-and-drop workspace for visual workflow management, perfectly synchronized with your global task list.

### 🔐 Google Authentication
Secure, seamless Single Sign-On (SSO) powered by Google and Firebase Authentication.

### ☁️ Firestore Sync
Real-time database synchronization ensures your tasks and updates reflect instantly across all your devices.

---

## 🏗️ Architecture

FlowPilot operates on a decoupled client-server architecture, utilizing real-time listeners and AI inference APIs.

```
[ React Client ]
       │
       ├────── (Auth Token) ─────▶ [ Firebase Auth ]
       │
 (onSnapshot Sync)
       │
       ▼
[ Firestore Database ] ◀────────┐
                                │
[ Express Backend ] ────────────┘
       │
 (REST API / Inference)
       ▼
[ Groq / Gemini LLM API ]
```

1. **Authentication:** The React client authenticates the user via Google SSO.
2. **Real-time Sync:** The client establishes a WebSocket connection to Firestore, instantly syncing task updates.
3. **AI Orchestration:** Complex AI requests are routed securely through the Express backend, which talks to the LLM and orchestrates database updates.

---

## 🛠️ Tech Stack

**Frontend**
* React 19
* Vite 8
* TailwindCSS 4
* React Router DOM
* Framer Motion
* Recharts
* dnd-kit

**Backend**
* Node.js
* Express.js
* Firebase Admin SDK

**Database & Auth**
* Google Cloud Firestore
* Firebase Authentication (Google Provider)

**Cloud & AI**
* Google Cloud Run / Firebase Hosting
* Groq / Gemini API

---

## 📂 Folder Structure

```text
flowpilot/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers (Auth)
│   │   ├── pages/          # Route components (Dashboard, Tasks, etc)
│   │   ├── App.jsx         # Router configuration
│   │   ├── main.jsx        # Entry point
│   │   └── firebase.js     # Client Firebase initialization
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── server/                 # Backend Express API
│   ├── index.js            # Main server file & routes
│   ├── prompts.js          # AI System prompts
│   ├── .env.example
│   └── package.json
│
├── docs/                   # Technical Documentation
└── README.md
```

---

## 🚀 Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/flowpilot.git
cd flowpilot
```

### 2. Install dependencies
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Environment Variables
Copy the example files and fill in your Firebase and AI API keys.
```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

### 4. Run Backend
```bash
cd server
npm run dev
```

### 5. Run Frontend
```bash
cd client
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## 📸 Screenshots

### Login
![Login](docs/assets/login.png)

### Dashboard
![Dashboard](docs/assets/dashboard.png)

### Kanban Workspace
![Kanban](docs/assets/kanban.png)

### Rescue Mode
![Rescue Mode](docs/assets/rescue-mode.png)

---

## 🗺️ Future Roadmap
* [ ] **Voice AI:** Voice-to-text task parsing on mobile.
* [ ] **Google Calendar Sync:** Full bi-directional calendar integration.
* [ ] **Telegram Agent:** Interact with FlowPilot directly from Telegram.
* [ ] **Offline Mode:** Local-first architecture with PWA support.
* [ ] **Collaboration:** Shared workspaces for teams.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
* Branch naming conventions
* Commit message standards
* Pull Request templates

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
