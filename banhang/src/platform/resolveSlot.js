import { getActiveModule } from './moduleRuntime.js';
import { resolveSlotIn } from './slots.js';

// Module override for an extension point in the running app, or core's fallback.
export const resolveSlot = (name, fallback) =>
  resolveSlotIn(getActiveModule(), name, fallback);
