import { message, Modal } from 'antd';
import { useCallback, useState } from 'react';
import { activateEdition, resetEdition } from '../session/demoSession.js';

// Edition switch/reset change every store's data, so the page reloads afterwards.
export const useDemoActions = (edition) => {
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (task) => {
    setBusy(true);
    try {
      await task();
      window.location.reload();
    } catch (error) {
      message.error(error.message);
      setBusy(false);
    }
  }, []);

  const switchTo = useCallback(
    (editionId) => run(() => activateEdition(editionId)),
    [run]
  );

  const restore = useCallback(() => {
    Modal.confirm({
      title: 'Khôi phục dữ liệu mẫu?',
      content: `Toàn bộ dữ liệu đã nhập cho "${edition.name}" sẽ bị xoá và thay bằng dữ liệu mẫu.`,
      okText: 'Khôi phục',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: () => run(() => resetEdition(edition.id)),
    });
  }, [edition, run]);

  return { busy, switchTo, restore };
};
