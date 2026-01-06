
# How to Deploy Saloni Sales Portal on GoDaddy

Follow these steps to deploy your React app to GoDaddy's hosting (cPanel/Plesk).

## 1. Prepare for Production
1.  Open your terminal in the project folder.
2.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root if you haven't already, and add your API keys:
    ```env
    API_KEY=your_google_gemini_key_here
    ```

## 2. Build the App
Run the build command to generate the static f    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
iles:
```bash
npm run build
```
This will create a `dist` folder in your project directory containing `index.html`, `assets/`, etc.

## 3. Upload to GoDaddy
1.  **Log in to GoDaddy** and go to your **My Products** page.
2.  Launch the **cPanel Admin** (for Linux Hosting) or **Plesk** (for Windows Hosting).
3.  Open **File Manager**.
4.  Navigate to the `public_html` folder (or the specific folder for `www.salonisale.com`).
5.  **Clear existing files** (backup first if needed) so the folder is empty.
6.  **Upload** the contents of your local `dist` folder.
    *   *Tip: Zip the contents of `dist`, upload the zip, and extract it on the server for speed.*
7.  Ensure `index.html` is in the root of `public_html`.

## 4. Configure Routing (Important!)
Since this is a Single Page Application (SPA) using client-side routing, you need to ensure all requests are redirected to `index.html`.

**For cPanel (Apache/Linux):**
Create or edit the `.htaccess` file in `public_html` and add:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**For Plesk (Windows/IIS):**
Create a `web.config` file in the root directory:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

*Note: The app is currently configured to use `HashRouter` (/#/route). If you keep `HashRouter` in `App.tsx`, the above configuration is optional but recommended. If you switch to `BrowserRouter`, the above config is mandatory.*

## 5. Verify
Visit `www.salonisale.com` in your browser. The app should load.
