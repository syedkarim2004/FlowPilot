# Firestore Database Schema

FlowPilot uses Google Cloud Firestore as its primary database. The structure is heavily nested under the user's document to ensure strict data isolation and simplify Security Rules.

## Root Collection: `users/{uid}`
Every authenticated user gets a root document automatically provisioned.

### Subcollection: `tasks`
Path: `users/{uid}/tasks/{taskId}`
* `title` (string)
* `description` (string)
* `status` (string: "pending", "active", "completed")
* `deadline` (timestamp)
* `estimatedHours` (number)
* `riskScore` (number)
* `createdAt` (timestamp)

### Subcollection: `goals`
Path: `users/{uid}/goals/{goalId}`
* `title` (string)
* `type` (string: "goal", "habit")
* `streak` (number)
* `history` (array of strings - dates)

### Subcollection: `plans`
Path: `users/{uid}/plans/{dateString}`
Stores the auto-generated daily schedule.
* `schedule` (array of objects with `task`, `startTime`, `endTime`)
* `generatedAt` (timestamp)

### Subcollection: `coach`
Path: `users/{uid}/coach/profile`
Stores the AI-generated Productivity Twin profile.
* `archetype` (string)
* `superpowers` (array of strings)
* `weaknesses` (array of strings)
* `description` (string)

## Security Rules
Firestore rules must be configured to ensure a user can only access their own path:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
