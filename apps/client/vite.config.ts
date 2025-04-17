import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/trpc": {
        target: "http://0.0.0.0:3001",
        secure: false,
        changeOrigin: true,
      },
      "/downloads": {
        target: "http://0.0.0.0:3001",
        secure: false,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@trpc/react-query", "@trpc/server"],
  },
});
