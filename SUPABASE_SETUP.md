# Supabase Setup Guide for Saloni Sales

To make the app fully functional with persistent data and resolve security audits, follow these steps in your [Supabase Dashboard](https://supabase.com/dashboard).

## 1. Run the Schema Script (CRITICAL FIX)
1.  Go to the **SQL Editor** in your Supabase Dashboard.
2.  Click **New Query**.
3.  Copy the entire content of the file **`SUPABASE_SCHEMA.sql`** located in your project root.
    *   *Note: This file contains the fix for `text = uuid` errors, performance indexes, and optimized RLS policies.*
4.  Paste it into the SQL Editor and click **Run**.

## 2. Critical Security Configuration (Final Step)
Supabase detects if you have not enabled compromised password checks. To resolve the **"Leaked Password Protection Disabled"** warning:
1.  Go to **Authentication** (icon on left sidebar).
2.  Click on **Configuration** (or **Settings**).
3.  Click on the **Security** hook/tab.
4.  Scroll to **Password protection**.
5.  Toggle **ON** the switch for **"Prevent use of compromised passwords"**.
    *   *This checks against the HaveIBeenPwned.org database to ensure users don't use leaked passwords.*
6.  Click **Save**.

## 3. Storage Setup
1.  Go to **Storage** in the Supabase Dashboard.
2.  Create a new bucket named **`products`**.
    *   **Public bucket**: Checked (ON).
3.  Create a new bucket named **`documents`**.
    *   **Public bucket**: Checked (ON).
4.  Create a new bucket named **`videos`**.
    *   **Public bucket**: Checked (ON).
5.  Create a new bucket named **`webAssets`**.
    *   **Public bucket**: Checked (ON).

## 4. Connect Your App
To switch from Mock Data to the Real Database, create a configuration file.

1.  In the root folder of your project, create a new file named **`.env`**.
2.  Add the following content, replacing the values with your actual keys from Supabase:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Verify & Restart
1.  Restart your development server.
2.  Open the app and check the **Console** (F12).
3.  You should see: **"CONNECTED TO SUPABASE LIVE DB"**.
