# Supabase Setup Guide for Saloni Sales

To make the app fully functional with persistent data and resolve security audits, follow these steps in your [Supabase Dashboard](https://supabase.com/dashboard).

## 1. Run the Schema Script
1.  Go to the **SQL Editor** in your Supabase Dashboard.
2.  Click **New Query**.
3.  Copy the entire content of the file `SUPABASE_SCHEMA.sql` located in your project root.
4.  Paste it into the SQL Editor and click **Run**.

## 2. Critical Security Configuration (Resolve Leaked Password Warning)
Supabase detects if you have not enabled compromised password checks. To resolve the "Leaked Password Protection Disabled" warning:
1.  Go to **Authentication** > **Settings**.
2.  Find the **Security Audit** or **Security** section.
3.  Toggle **ON** the switch for **"Prevent use of compromised passwords"**.
4.  This will check new passwords against the `HaveIBeenPwned` database.

## 3. Row Level Security (RLS)
The provided `SUPABASE_SCHEMA.sql` script automatically enables RLS and creates policies. 
- If you see a warning for `stock_logs`, ensure the `stock_logs_admin_only` policy from the script was successfully applied.

## 4. Storage Setup
1.  Go to **Storage** in the Supabase Dashboard.
2.  Create a new bucket named **`products`**.
    *   **Public bucket**: Checked (ON).
3.  Create a new bucket named **`documents`**.
    *   **Public bucket**: Checked (ON).

## 5. Connect Your App
To switch from Mock Data to the Real Database, create a configuration file.

1.  In the root folder of your project, create a new file named **`.env`**.
2.  Add the following content, replacing the values with your actual keys from Supabase:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 6. Verify & Restart
1.  Restart your development server.
2.  Open the app and check the **Console** (F12).
3.  You should see: **"CONNECTED TO SUPABASE LIVE DB"**.