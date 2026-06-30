# API Reference

The FlowPilot backend exposes a REST API for complex operations that require server-side orchestration, primarily interacting with the AI models.

## Base URL
In development: `http://localhost:8080/api`
In production: `https://your-cloud-run-url.a.run.app/api`

## Authentication
All endpoints (except webhooks) require a Firebase ID Token in the Authorization header.
```
Authorization: Bearer <firebase_id_token>
```

---

## Endpoints

### 1. Chat with AI
`POST /chat`

Processes natural language input, injects the user's current tasks into the context, and returns a response along with actionable database commands.

**Request Body:**
```json
{
  "message": "I need to study for 2 hours.",
  "tasks": [...],
  "goals": [...]
}
```

**Response:**
```json
{
  "reply": "I've added the study session to your tasks.",
  "actions": [
    {
      "action": "ADD_TASK",
      "payload": {
        "title": "Study",
        "estimatedHours": 2
      }
    }
  ]
}
```

### 2. Auto-Schedule Day
`POST /generate-daily`

Takes a list of pending tasks and uses the AI to organize them into a realistic time-blocked schedule.

**Request Body:**
```json
{
  "tasks": [
    { "title": "Math Homework", "estimatedHours": 1 },
    { "title": "Gym", "estimatedHours": 1.5 }
  ]
}
```

**Response:**
```json
{
  "schedule": [
    { "task": "Math Homework", "startTime": "09:00", "endTime": "10:00" },
    { "task": "Gym", "startTime": "10:30", "endTime": "12:00" }
  ]
}
```

### 3. Rescue Mode
`POST /rescue-mode`

Breaks down an overwhelming or overdue task into actionable micro-steps.

**Request Body:**
```json
{
  "taskTitle": "Write Final Term Paper",
  "taskDescription": ""
}
```

**Response:**
```json
{
  "breakdown": [
    "Open Google Docs and write the title",
    "Write a 3-bullet point outline",
    "Draft the introduction paragraph"
  ]
}
```
