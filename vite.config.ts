import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  publicDir: path.resolve(__dirname, "../frontend/public"),
  server: {
    host: "::",
    port: 8081,
    hmr: {
      overlay: false,
    },
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@/components": path.resolve(__dirname, "../frontend/src/components"),
      "@/hooks": path.resolve(__dirname, "../frontend/src/hooks"),
      "@/lib": path.resolve(__dirname, "../frontend/src/lib"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/contexts": path.resolve(__dirname, "./src/contexts"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
