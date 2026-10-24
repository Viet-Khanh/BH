import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const fromHere = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(() => ({
  plugins: [react()],
  base: process.env.ELECTRON ? './' : '/',
  define: {
    // Build-time flag. Demo code is only reachable behind `if (__DEMO__)`.
    __DEMO__: JSON.stringify(process.env.VITE_DEMO === 'true'),
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
}));
