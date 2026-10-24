import { clearNamespace, getActiveNamespace } from '../db/localStore.js';
import { getEdition } from '../editions/index.js';
import { buildMasterData } from './buildMasterData.js';
import { buildTransactions } from './buildTransactions.js';
import { createRandom } from './random.js';
import { replayTransactions } from './replayTransactions.js';
import { createSeedApi } from './seedApi.js';

// Wipes the edition's data and rebuilds it through the real API. Caller activates the namespace.
export const seedEdition = async (editionId, { dispatch, now = new Date() }) => {
  const edition = getEdition(editionId);
  if (!edition) throw new Error(`Không tìm thấy ngành hàng ${editionId}.`);
  if (getActiveNamespace() !== editionId) {
    throw new Error(
      `seedEdition: namespace đang là ${getActiveNamespace()}, cần ${editionId}.`
    );
  }

  clearNamespace(editionId);
  const api = createSeedApi(dispatch);
  const master = buildMasterData(edition, now);
  await api.put('/settings/main', master.settings);
  await api.post('/units/bulk', master.units);
  await api.post('/products/bulk', master.products);
  await api.post('/customers/bulk', master.customers);
  await api.post('/suppliers/bulk', master.suppliers);

  const random = createRandom(edition.seed);
  const events = buildTransactions({ edition, master, now, random });
  await replayTransactions(events, api);
};
