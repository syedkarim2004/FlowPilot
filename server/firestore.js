/**
 * FlowPilot - Firestore Helper Functions
 * All database operations for users, tasks, sessions, plans, and logs.
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin - catch if already initialized
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
} catch (err) {
  if (err.code !== 'app/duplicate-app') {
    console.error('[Firestore] Initialization error:', err.message);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export { admin };

// ─── User Profile ────────────────────────────────────────────────────────────

/**
 * Get a user's profile document.
 */
export async function getUserProfile(userId) {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Create or set a user's profile document.
 */
export async function createUserProfile(userId, data) {
  await db.collection('users').doc(userId).set(
    {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return { id: userId, ...data };
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

/**
 * Get all tasks for a user from the tasks subcollection.
 */
export async function getUserTasks(userId) {
  const snapshot = await db
    .collection('users')
    .doc(userId)
    .collection('tasks')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a single task by ID.
 */
export async function getTask(userId, taskId) {
  const doc = await db
    .collection('users')
    .doc(userId)
    .collection('tasks')
    .doc(taskId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Create a new task. Returns the auto-generated taskId.
 */
export async function createTask(userId, taskData) {
  const docRef = await db
    .collection('users')
    .doc(userId)
    .collection('tasks')
    .add({
      ...taskData,
      status: taskData.status || 'pending',
      progressPercent: taskData.progressPercent || 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return docRef.id;
}

/**
 * Update an existing task with partial data.
 */
export async function updateTask(userId, taskId, updates) {
  await db
    .collection('users')
    .doc(userId)
    .collection('tasks')
    .doc(taskId)
    .update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

// ─── Daily Plans ─────────────────────────────────────────────────────────────

/**
 * Save a daily plan for a specific date.
 */
export async function saveDailyPlan(userId, date, planData) {
  await db
    .collection('users')
    .doc(userId)
    .collection('dailyPlans')
    .doc(date)
    .set(
      {
        ...planData,
        date,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

/**
 * Get a daily plan for a specific date.
 */
export async function getDailyPlan(userId, date) {
  const doc = await db
    .collection('users')
    .doc(userId)
    .collection('dailyPlans')
    .doc(date)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// ─── Sessions ────────────────────────────────────────────────────────────────

/**
 * Get all sessions for a user.
 */
export async function getSessions(userId) {
  const snapshot = await db
    .collection('users')
    .doc(userId)
    .collection('sessions')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a single session by ID.
 */
export async function getSession(userId, sessionId) {
  const doc = await db
    .collection('users')
    .doc(userId)
    .collection('sessions')
    .doc(sessionId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Update an existing session.
 */
export async function updateSession(userId, sessionId, updates) {
  await db
    .collection('users')
    .doc(userId)
    .collection('sessions')
    .doc(sessionId)
    .update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Create a new session. Returns the auto-generated sessionId.
 */
export async function createSession(userId, sessionData) {
  const docRef = await db
    .collection('users')
    .doc(userId)
    .collection('sessions')
    .add({
      ...sessionData,
      status: sessionData.status || 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return docRef.id;
}

// ─── Agent Logs ──────────────────────────────────────────────────────────────

/**
 * Add an agent log entry with automatic timestamp.
 */
export async function addAgentLog(userId, entry) {
  await db
    .collection('users')
    .doc(userId)
    .collection('agentLogs')
    .add({
      ...entry,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Get recent agent logs, ordered by timestamp descending.
 */
export async function getAgentLogs(userId, limit = 20) {
  const snapshot = await db
    .collection('users')
    .doc(userId)
    .collection('agentLogs')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
