# Deployment Guide

FlowPilot utilizes Google Cloud infrastructure for both the frontend and backend deployments, ensuring high availability and seamless scalability.

## Frontend: Firebase Hosting

The React frontend is statically built using Vite and deployed to Firebase Hosting.

### Deployment Steps
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Build the production bundle:
   ```bash
   npm run build
   ```
3. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

Firebase Hosting automatically serves the assets from a global CDN and provides SSL certificates out of the box.

## Backend: Google Cloud Run

The Express backend is containerized and deployed to Google Cloud Run, allowing it to scale automatically from zero to handle bursty AI traffic.

### Deployment Steps
1. Ensure your `gcloud` CLI is authenticated and pointing to the correct project.
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Deploy using gcloud:
   ```bash
   gcloud run deploy flowpilot-api \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GROQ_API_KEY=your_key,FIREBASE_PROJECT_ID=flowpilot-xxxx"
   ```
4. After deployment, update your `client/.env` file with the generated Cloud Run URL (`VITE_API_URL`).

## CI/CD Pipeline (Optional)

For a production environment, it is highly recommended to set up GitHub Actions to automate these deployment steps upon merging to the `main` branch.
