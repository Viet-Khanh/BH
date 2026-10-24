import { dispatch } from '../demoApp.js';
import {
  findCorruptCollections,
  isStorageAvailable,
  setActiveNamespace,
} from '../db/localStore.js';
import { getEdition } from '../editions/index.js';
import { seedEdition } from '../seed/seedEdition.js';
import {
  ensureSchemaVersion,
  isEditionSeeded,
  markEditionSeeded,
  readMeta,
  setActiveEdition,
} from './demoMeta.js';

export const DEMO_NOTICES = {
  schemaReset: 'Bản demo vừa được cập nhật, dữ liệu mẫu đã được làm mới.',
  corruptReset: 'Dữ liệu demo bị lỗi nên đã được tạo lại từ dữ liệu mẫu.',
};

const requireEdition = (editionId) => {
  const edition = getEdition(editionId);
  if (!edition) throw new Error(`Không tìm thấy ngành hàng ${editionId}.`);
  return edition;
};

export const resetEdition = async (editionId) => {
  requireEdition(editionId);
  setActiveNamespace(editionId);
  await seedEdition(editionId, { dispatch });
  markEditionSeeded(editionId);
};

// Decides what the UI shows first: blocked, edition picker, or the app.
export const bootDemoSession = async () => {
  if (!isStorageAvailable()) return { status: 'blocked' };
  const notices = [];
  if (ensureSchemaVersion()) notices.push(DEMO_NOTICES.schemaReset);

  const edition = getEdition(readMeta().activeEdition);
  if (!edition) return { status: 'picking', notices };

  const corrupt = findCorruptCollections(edition.id).length > 0;
  if (corrupt) notices.push(DEMO_NOTICES.corruptReset);
  if (corrupt || !isEditionSeeded(edition.id)) {
    await resetEdition(edition.id);
  } else {
    setActiveNamespace(edition.id);
  }
  return { status: 'ready', edition, notices };
};

// Switches to an edition, seeding it the first time. Data of other editions is kept.
export const activateEdition = async (editionId) => {
  const edition = requireEdition(editionId);
  if (isEditionSeeded(editionId)) {
    setActiveNamespace(editionId);
  } else {
    await resetEdition(editionId);
  }
  setActiveEdition(editionId);
  return edition;
};
