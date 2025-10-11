import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        plugins: [react()],
        optimizeDeps: {
            include: ["lucide-react"],
        },
        server: {
            port: parseInt(env.FRONTEND_PORT) || 5173,
        },
    };
});
