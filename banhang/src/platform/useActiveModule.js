import { getActiveModule, hasFeature } from './moduleRuntime.js';

// The active module never changes while a page is open (the demo reloads on
// switch), so these hooks read the runtime directly without subscriptions.
export const useActiveModule = () => getActiveModule();

export const useEdition = () => getActiveModule().config;

export const useEditionFeature = (name) => hasFeature(name);
