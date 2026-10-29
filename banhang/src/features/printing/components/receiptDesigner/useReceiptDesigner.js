import { useEffect, useReducer } from 'react';
import { message } from 'antd';
import { useSettingsStore } from '../../../../store/settingsStore.js';
import { readLogoFile } from '../../receipt/logoImage.js';
import {
  designerReducer,
  initDesignerState,
  toDesignerPatch,
} from './designerState.js';

// Designer state, separate from the printer form: its "Lưu" writes only
// receiptLayout + receiptLogo; it follows the stored values while unedited.
export const useReceiptDesigner = () => {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const [state, dispatch] = useReducer(
    designerReducer,
    settings,
    initDesignerState
  );

  useEffect(() => {
    dispatch({ type: 'load', settings });
  }, [settings]);

  const pickLogo = async (file, printableMm) => {
    try {
      dispatch({ type: 'logo', logo: await readLogoFile(file, printableMm) });
    } catch (error) {
      message.error(error?.message || 'Không dùng được ảnh logo.');
    }
  };

  const save = async () => {
    try {
      await update(toDesignerPatch(state));
      dispatch({
        type: 'saved',
        settings: useSettingsStore.getState().settings,
      });
      message.success('Đã lưu thiết kế hoá đơn.');
    } catch (error) {
      message.error(error?.message || 'Không lưu được thiết kế hoá đơn.');
    }
  };

  return { settings, state, dispatch, pickLogo, save };
};
