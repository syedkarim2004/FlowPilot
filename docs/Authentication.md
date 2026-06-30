# Authentication Flow

FlowPilot relies on **Firebase Authentication** for secure, passwordless Single Sign-On (SSO) using Google accounts.

## Why Google SSO?
To minimize friction and present a professional, enterprise-ready experience, we removed all email/password login forms. The app relies exclusively on the Google Auth Provider.

## The Flow

1. **Client Request:** The user clicks "Continue with Google" on the `LoginPage`.
2. **Popup Execution:** `signInWithPopup(auth, googleProvider)` is called.
3. **Scope Management:** The Google Provider strictly requests the `openid`, `email`, and `profile` scopes. We intentionally *omitted* sensitive scopes (like Google Calendar access) from the initial login flow to prevent Google Cloud "Unverified App" warnings.
4. **Token Generation:** Upon success, Firebase provisions a secure JWT (ID Token).
5. **Context Binding:** The `AuthContext` listens to `onAuthStateChanged`. When a user is detected, they are routed to `/dashboard`.
6. **API Authorization:** For any calls to the Express backend, Axios intercepts the request, retrieves the current Firebase ID Token, and attaches it as a `Bearer` token.
7. **Server Verification:** The Express server's `authMiddleware` uses `admin.auth().verifyIdToken()` to validate the token cryptographically.

## Security Considerations
* The Express server never trusts the client's assertion of identity (e.g., passing `{"userId": "123"}` in the body). It solely relies on the cryptographic signature of the Firebase token.
* Firestore Security Rules isolate user data at the database level.
