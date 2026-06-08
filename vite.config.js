import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const SOCIAL_LINKS = {
  linkedinUrl: "https://www.linkedin.com/company/108380434/admin/dashboard/",
  facebookUrl: "https://www.facebook.com/Talentsza",
  instagramUrl: "https://www.instagram.com/talentsza/",
  blogUrl: "https://talentsza.blogspot.com/"
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      __SOCIAL_LINKS__: JSON.stringify(SOCIAL_LINKS)
    },
    server: {
      host: true, // Allow network access
      proxy: {
        '/webflow-pages/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/webflow-pages\/api/, '')
        }
      }
    }
  }
})
