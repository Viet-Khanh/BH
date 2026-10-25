import { getEdition, hasFeature } from './editionRuntime.js';

// The edition never changes while a page is open (the demo reloads on switch),
// so these hooks read the runtime directly without subscriptions.
export const useEdition = () => getEdition();

export const useEditionFeature = (name) => hasFeature(name);
