
# Google Cloud Platform & GoDaddy Deployment Guide

This app can be deployed using **Firebase Hosting** (Recommended for React) or **Cloud Run** (Docker).

---

## Option 1: Firebase Hosting (Easiest & Free SSL)

Firebase is part of Google Cloud. This is the standard way to host React apps.

### 1. Prerequisites
1.  Install Firebase CLI: `npm install -g firebase-tools`
2.  Login: `firebase login`

### 2. Initialize
1.  Run `firebase init hosting` in the project root.
2.  Select **"Use an existing project"** (Select your GCP project) or **"Create a new project"**.
3.  **Public directory**: Type `dist`
4.  **Configure as single-page app?**: Type `y`
5.  **Set up automatic builds and deploys with GitHub?**: `n` (unless you want that)
6.  **File overwrites**: Say `n` (No) if it asks to overwrite `index.html` or `firebase.json` (I created a configured `firebase.json` for you).

### 3. Build & Deploy
1.  Create a `.env.production` file with your real keys:
    ```env
    API_KEY=your_google_gemini_key
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_key
    ```
2.  Build the app:
    ```bash
    npm run build
    ```
3.  Deploy:
    ```bash
    firebase deploy
    ```
    *You will get a Hosting URL (e.g., `https://saloni-sales.web.app`).*

### 4. Connect GoDaddy Domain
1.  Go to **Firebase Console** > **Hosting**.
2.  Click **"Add Custom Domain"**.
3.  Enter your GoDaddy domain (e.g., `www.salonisales.com`).
4.  Firebase will verify ownership (it will ask you to add a `TXT` record in GoDaddy).
5.  **GoDaddy DNS Setup**:
    *   Login to GoDaddy > DNS Management.
    *   Add the `TXT` record provided by Firebase.
    *   Once verified, Firebase will give you `A` records (IP addresses).
    *   In GoDaddy, delete existing `A` records for `@` (Parked) and add the two `A` records provided by Firebase.
    *   Firebase handles the SSL certificate automatically (takes ~1 hour to propagate).

---

## Option 2: Google Cloud Run (Docker)

Use this if you specifically want to manage a container in the Google Cloud Console.

### 1. Enable APIs
In Google Cloud Console, enable:
*   Artifact Registry API
*   Cloud Run API
*   Cloud Build API

### 2. Build & Push Container
You need the `gcloud` CLI installed.

1.  **Authenticate**:
    ```bash
    gcloud auth login
    gcloud config set project YOUR_PROJECT_ID
    ```
2.  **Submit Build**:
    (Replace `YOUR_REGION` with e.g., `asia-south1`)
    ```bash
    gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/saloni-portal
    ```

### 3. Deploy to Cloud Run
1.  Go to **Google Cloud Console** > **Cloud Run**.
2.  Click **Create Service**.
3.  Select "Deploy one revision from an existing container image".
4.  Select the image `saloni-portal` you just built.
5.  **Authentication**: Select "Allow unauthenticated invocations" (so the public can see the website).
6.  **Environment Variables**:
    *   Click "Container, Variables & Secrets, Connections".
    *   Under "Variables", add:
        *   `API_KEY`
        *   `VITE_SUPABASE_URL`
        *   `VITE_SUPABASE_ANON_KEY`
    *   *Note: Since Vite is a build-time tool, it's actually better to include these in a `.env` file BEFORE running the docker build, or pass them as `--build-arg` in step 2.*
7.  Click **Create**.

### 4. Connect GoDaddy Domain (Cloud Run)
1.  In Cloud Run Service details, go to **"Integrations"** or **"Manage Custom Domains"**.
2.  Click **"Add Mapping"**.
3.  Select "Cloud Run Domain Mappings".
4.  Verify domain ownership via Webmaster Central (requires adding a `TXT` record in GoDaddy).
5.  Once verified, Google will provide:
    *   Record Type: `CNAME` or `A`
    *   Data: `ghs.googlehosted.com` (usually)
6.  **GoDaddy DNS**:
    *   Add the `CNAME` or `A` records provided by Google.
    *   Google manages the SSL certificate.

---

## Summary Checklist
1.  [ ] **Supabase**: Ensure `SUPABASE_SCHEMA.sql` is run and tables exist.
2.  [ ] **Keys**: Ensure `.env` or build environment has `API_KEY` (Gemini) and Supabase keys.
3.  [ ] **Build**: Run `npm run build` locally to check for errors.
4.  [ ] **Deploy**: Run `firebase deploy` (Option 1) OR `gcloud builds submit` (Option 2).
5.  [ ] **DNS**: Update GoDaddy DNS records (A/CNAME/TXT) based on the hosting provider's instructions.
