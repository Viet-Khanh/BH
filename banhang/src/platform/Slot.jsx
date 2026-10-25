import { resolveSlot } from './resolveSlot.js';

// Renders the module component registered for `name`, else `fallback` (or nothing).
const Slot = ({ name, fallback = null, ...props }) => {
  const Component = resolveSlot(name, fallback);
  return Component ? <Component {...props} /> : null;
};

export default Slot;
