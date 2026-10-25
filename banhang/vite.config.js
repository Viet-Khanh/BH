import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { EDITION_IDS } from './src/editions/editionIds.js';

const fromHere = (path) => fileURLToPath(new URL(path, import.meta.url));

const assertKnownEdition = (edition) => {
  if (edition && !EDITION_IDS.includes(edition)) {
    throw new Error(
      `Unknown VITE_EDITION "${edition}". Use one of: ${EDITION_IDS.join(', ')}`
    );
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  assertKnownEdition(env.VITE_EDITION);
  return {
    plugins: [react()],
    base: process.env.ELECTRON ? './' : '/',
    define: {
      // Build-time flag. Demo code is only reachable behind `if (__DEMO__)`.
      __DEMO__: JSON.stringify(env.VITE_DEMO === 'true'),
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
