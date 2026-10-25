import express from 'express';
import { defineBackendModule } from '../../platform/defineBackendModule.js';

// Template for customer-specific API: copy this folder, keep routes under /api/<customer>.
const router = express.Router();

router.get('/ping', (req, res) => {
  res.json({ ok: true, module: 'example' });
});

export default defineBackendModule({
  id: 'example',
  routers: [['/api/example', router]],
});
