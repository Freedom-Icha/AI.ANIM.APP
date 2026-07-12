import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Deploy to Vercel as a separate project from the frontend, with its own
// domain (e.g. admin.animai.app). Build command `npm run build`, output `dist`.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  preview: { port: 5174 },
});
