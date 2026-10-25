import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { banhangModules } from './vite/modulesPlugin.js';

const fromHere = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const isDemo = env.VITE_DEMO === 'true';
  return {
    plugins: [
      react(),
      banhangModules({
        // Demo picks the edition at runtime; tests need every edition.
        allEditions: isDemo || mode === 'test',
        edition: env.VITE_EDITION,
        customer: env.VITE_CUSTOMER,
      }),
    ],
    base: process.env.ELECTRON ? './' : '/',
    define: {
      // Build-time flag. Demo code is only reachable behind `if (__DEMO__)`.
      __DEMO__: JSON.stringify(isDemo),
    },
    resolve: {
      alias: {
        '@backend': fromHere('../banhang-backend/src'),
        // The frontend never imports these; only backend code reached by the demo does.
        express: fromHere('./src/demo/shims/express.js'),
        mongoose: fromHere('./src/demo/shims/mongoose.js'),
      },
      // Backend files must use banhang's copies (banhang-backend/node_modules is absent on Vercel).
      dedupe: ['dayjs', 'uuid'],
    },
    server: {
      fs: { allow: [fromHere('..')] },
    },
  };
});
