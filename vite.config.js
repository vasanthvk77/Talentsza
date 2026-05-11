import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SOCIAL_LINKS = {
  linkedinUrl: "https://www.linkedin.com/company/108380434/admin/dashboard/",
  facebookUrl: "https://www.facebook.com/Talentsza",
  instagramUrl: "https://www.instagram.com/talentsza/",
  blogUrl: "https://talentsza.blogspot.com/2026/04/talentsza-bridging-gap-between-learning.html"
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __SOCIAL_LINKS__: JSON.stringify(SOCIAL_LINKS)
  },
  ...SOCIAL_LINKS
})
