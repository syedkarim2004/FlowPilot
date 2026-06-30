# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-30

### Added
- **AI Assistant**: Natural language parsing into structured tasks using Groq Llama 3.
- **Notion-Style Login**: Minimalist SSO authentication via Google and Firebase.
- **Dashboard**: Consolidated view of active flow scores, critical initiatives, and overdue alerts.
- **Rescue Mode**: Emergency task breakdown system with built-in Pomodoro timer.
- **Kanban Workspace**: Drag-and-drop board for visual task management.
- **Analytics**: Beautiful Recharts integration tracking productivity over time.
- **Real-time Sync**: Instant Firestore synchronization across devices.
- **Goals & Habits**: Long-term tracking and daily streak monitoring.
- **Telegram Companion**: Webhook integration for quick capture via chat.

### Changed
- Migrated primary AI inference from Gemini to Groq for sub-second response times.
- Optimized Google OAuth scopes to resolve "Unverified App" warnings.

### Fixed
- Multi-activity task splitting bug in the AI chat endpoint.
- Responsive layout issues on the Dashboard for mobile devices.
