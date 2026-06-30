# Architecture Overview

FlowPilot operates on a decoupled client-server architecture, utilizing real-time database listeners for state synchronization and a Node.js Express backend for secure AI orchestration.

## High-Level Data Flow

1. **Client (React):** Renders the UI and establishes a persistent WebSocket connection to Firebase Firestore via `onSnapshot` listeners.
2. **Authentication (Firebase Auth):** Manages user sessions. The client retrieves an ID token and passes it in the `Authorization` header to the backend.
3. **Backend (Express):** Receives requests, verifies the ID token using the Firebase Admin SDK, and executes business logic (such as calling the Groq LLM API).
4. **Database (Firestore):** The single source of truth. Both the client and the backend can write to Firestore. When the backend writes to Firestore, the client's `onSnapshot` listeners instantly update the UI without needing a manual refresh.

## Component Responsibilities

### Client (`/client`)
* **Routing:** `react-router-dom` with a `ProtectedRoute` wrapper.
* **State:** Avoids Redux by binding React state directly to Firestore collections.
* **Styling:** TailwindCSS for rapid, utility-first design.

### Server (`/server`)
* **Security:** Enforces authentication via the `authMiddleware`.
* **AI Orchestration:** Uses structured system prompts to force the LLM to output predictable JSON, which the backend then parses and writes to Firestore.
* **Statelessness:** The Express server holds no session state. All state is in Firestore or the JWT.

## Design Decisions
* **Why Groq?** We migrated from Gemini to Groq (Llama 3) for the chat interface to achieve sub-second latency, making the "AI Agent" feel instantly responsive.
* **Why Firebase?** Firestore's real-time capabilities eliminate the need for complex state management (like Redux) or manual WebSockets (like Socket.io).
