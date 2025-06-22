import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite"
import path from "path";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // allowedHosts: [
    //   '*', // Add your host here
    // ],
    // hmr: {
    //   clientPort: 5173,
    //   host: "*",
    //   protocol:"wss",
    //   timeout: 10000,
    // },
    cors: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
