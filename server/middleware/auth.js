/**
 * FlowPilot - Firebase Auth Middleware
 * Verifies Firebase Auth ID tokens from the Authorization header.
 */

import admin from 'firebase-admin';

let adminInitialized = false;

export default async function authMiddleware(req, res, next) {
  try {
    if (!adminInitialized) {
      if (!admin.apps.length) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
          admin.initializeApp({ 
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) 
          });
        } else {
          // In Cloud Run (or local with Firebase emulator/ADC), initializeApp() works automatically.
          // Fallback to projectId for token verification if no credentials exist.
          admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'flowpilot-8728b'
          });
        }
      }
      adminInitialized = true;
    }

    const authHeader = req.headers.authorization;
    console.log('[Auth Debug] Auth Header received:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    console.log('[Auth Debug] Token verified successfully. req.uid:', req.uid);
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.stack || err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
