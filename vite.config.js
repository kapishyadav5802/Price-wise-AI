import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  // Prevent Vite from complaining about firebase's internal dynamic imports
  optimizeDeps: {
    include: ["firebase/app", "firebase/auth", "firebase/analytics"],
  },
});
