import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
    const themePlugin = await import(
        "@replit/vite-plugin-shadcn-theme-json"
    ).then((m) => m.default());
    const runtimeErrorOverlay = await import(
        "@replit/vite-plugin-runtime-error-modal"
    ).then((m) => m.default());

    return {
        plugins: [
            react(),
            runtimeErrorOverlay,
            themePlugin,
            ...(process.env.NODE_ENV !== "production" &&
                process.env.REPL_ID !== undefined
                ? [
                      await import("@replit/vite-plugin-cartographer").then(
                          (m) => m.cartographer()
                      ),
                  ]
                : []),
    ],
    
    server: {
    host: '0.0.0.0',
    port: 5000,
    hmr: {
      clientPort: 443,
      host: process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:9002',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, '/api'),
      },
      '/ws': {
        target: 'ws://localhost:9002',
        ws: true,
      },
    },
  },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "client", "src"),
            "@shared": path.resolve(__dirname, "shared"),
            "@assets": path.resolve(__dirname, "attached_assets"),
        },
    },
    root: path.resolve(__dirname, "client"),
    build: {
        outDir: path.resolve(__dirname, "dist/public"),
        emptyOutDir: true,
    },
    };
});
