
# Deployment Guide: Saloni Sales Portal

## 1. Supabase (Backend) Setup
1.  **Create Project**: Log in to [Supabase](https://supabase.com) and create a new project.
2.  **Run Schema**:
    *   Go to **SQL Editor** (sidebar).
    *   Click **New Query**.
    *   Open `SUPABASE_SCHEMA.sql` from this repository, copy all contents, paste into the editor, and click **Run**.
    *   *Success Check*: You should see "Success" and new tables in the Table Editor.
3.  **Security Config**:
    *   Go to **Authentication** > **Settings**.
    *   Enable **"Prevent use of compromised passwords"**.
4.  **Get Credentials**:
    *   Go to **Project Settings** > **API**.
    *   Copy the `Project URL` and `anon` public key.

## 2. Environment Variables
Create the environment variables in your hosting provider (Vercel/Netlify).

| Variable Name | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL (e.g., https://xyz.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase `anon` public key |
| `API_KEY` | Your Google Gemini API Key (from AI Studio) |

## 3. Deploy Frontend (Vercel Recommended)
1.  Push your code to **GitHub**.
2.  Import project into **Vercel**.
3.  Add the **Environment Variables** listed above.
4.  Click **Deploy**.

## 4. Post-Deployment Verification
1.  Open the live URL.
2.  Register a new user (this creates a row in `auth.users` and `public.profiles`).
3.  Log in as that user.
4.  Check **Supabase Table Editor** > `profiles` to confirm the user exists.
5.  Test an AI feature (e.g., Smart Stocker) to ensure `API_KEY` is working.

## 5. Emergency Access (Bootstrap Admin)
If you need to access the Admin Panel immediately (e.g., before Supabase is fully linked or populated), use the hardcoded fallback credentials:

*   **Login URL**: `/admin/login` or `/login`
*   **Email**: `sarthak_huria@yahoo.com`
*   **Password**: `Saloni@Growth2025!`

*Note: This account bypasses the database auth check if the database is unreachable or the user doesn't exist.*

## Troubleshooting
*   **"Table not found"**: Ensure you ran the `SUPABASE_SCHEMA.sql` script.
*   **AI Errors**: Check if `API_KEY` is set correctly in Vercel settings.
*   **Storage Errors**: Go to Supabase > Storage and ensure buckets named `products` and `documents` exist and are set to **Public**.
