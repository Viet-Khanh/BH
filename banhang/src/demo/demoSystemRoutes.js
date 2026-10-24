import { clearNamespace, getActiveNamespace } from './db/localStore.js';
import { seedEdition } from './seed/seedEdition.js';
import { markEditionSeeded } from './session/demoMeta.js';

// Demo versions of the server-only routes defined in banhang-backend/src/app.js.
export const registerDemoSystemRoutes = (app, { dispatch }) => {
  app.get('/api/health', (req, res) => res.json({ ok: true, demo: true }));

  app.post('/api/reset', (req, res) => {
    clearNamespace(getActiveNamespace());
    res.json({ ok: true });
  });

  app.post('/api/seed', async (req, res) => {
    const editionId = getActiveNamespace();
    await seedEdition(editionId, { dispatch });
    markEditionSeeded(editionId);
    res.json({ ok: true });
  });
};
