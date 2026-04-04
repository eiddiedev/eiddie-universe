import { defineConfig, loadEnv } from "vite";

import { handleNodeAssistant } from "./server/assistant-handler.mjs";

const assistantApiPlugin = () => ({
  name: "portfolio-assistant-api",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/ask")) {
        next();
        return;
      }

      await handleNodeAssistant(req, res);
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/ask")) {
        next();
        return;
      }

      await handleNodeAssistant(req, res);
    });
  },
});

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    plugins: [assistantApiPlugin()],
  };
});
