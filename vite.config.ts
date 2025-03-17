
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Loads the environment variables for the specified mode (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 8080
    },
    optimizeDeps: {
      exclude: [],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_FUNCTIONS_URL': JSON.stringify('https://qdbmsjbwdmewfqdgdzds.supabase.co/functions/v1'),
    },
  }
})
