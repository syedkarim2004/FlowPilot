# Security Policy

## Supported Versions

Currently, only the `main` branch of FlowPilot is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Responsible Disclosure

We take the security of FlowPilot and our users' data very seriously. If you believe you have found a security vulnerability in FlowPilot, we encourage you to report it to us responsibly. 

Please **do not** report security vulnerabilities through public GitHub issues.

## Reporting a Vulnerability

If you discover a potential security issue, please notify us immediately by emailing **security@flowpilot.ai** (replace with actual maintainer email). 

Please include:
* A detailed description of the vulnerability.
* Steps to reproduce the issue.
* Potential impact and any suggested mitigations.

We will acknowledge your report within 48 hours and provide a timeline for the resolution.

## Environment Variables & Secrets

FlowPilot uses Firebase Authentication and Firestore. The client-side `VITE_FIREBASE_*` configuration variables are considered public and safe to expose in the frontend bundle.

However, the following must **NEVER** be exposed to the client:
* Service Account Keys (JSON files)
* Backend AI API Keys (`GROQ_API_KEY`, `GEMINI_API_KEY`)
* Telegram Bot Tokens

If you accidentally commit a secret, you must rotate it immediately. Do not rely on git history removal.

## Firebase Authentication & Firestore Rules

FlowPilot relies on strict Firestore Security Rules to isolate user data. All rules enforce that a user can only read, write, and delete documents where the path matches their authenticated `request.auth.uid`.

If contributing features that require new collections, you **must** submit updated Firestore Security Rules alongside your PR.
