
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Stringify env variables to ensure they are embedded into the build
      'process.env': {
          API_KEY: JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
          // We don't strictly need these in process.env if we use import.meta.env, 
          // but keeping them for compatibility with existing code structure
          SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
          SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
          NODE_ENV: JSON.stringify(mode)
      }
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            ai: ['@google/genai'],
            db: ['@supabase/supabase-js']
          }
        }
      }
    }
  }
})
