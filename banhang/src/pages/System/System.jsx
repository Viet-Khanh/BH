import { useEffect } from 'react';
import { Button, Grid, Menu, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { hasFeature } from '../../platform/moduleRuntime.js';
import { useCustomerStore } from '../../store/customerStore.js';
import { useProductStore } from '../../store/productStore.js';
import { useSettingsStore } from '../../store/settingsStore.js';
import SystemGroupContent from './groups/SystemGroupContent.jsx';
import { consumeSystemAccess } from './systemAccess.js';
import { getVisibleGroups } from './systemGroups.js';
import { useSystemTab } from './useSystemTab.js';
import './System.css';

// System page shell: access check, group menu (left; top on narrow screens), selected group.
const System = () => {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const loadSettings = useSettingsStore((state) => state.load);
  const loadProducts = useProductStore((state) => state.load);
  const loadCustomers = useCustomerStore((state) => state.load);
  const groups = getVisibleGroups(hasFeature);
  const [activeKey, selectTab] = useSystemTab(groups);
  const activeGroup = groups.find((group) => group.key === activeKey);

  useEffect(() => {
    const bootstrap = async () => {
      if (!consumeSystemAccess()) {
        message.error('Vui lòng nhập mật khẩu từ Trang chủ để vào Hệ thống.');
        navigate('/', { replace: true });
        return;
      }
      await Promise.all([loadSettings(), loadProducts(), loadCustomers()]);
    };
    bootstrap();
  }, [loadCustomers, loadProducts, loadSettings, navigate]);

  return (
    <div className="page-card">
      <div className="page-title">Hệ thống</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>
          Quay lại
        </Button>
      </div>

      <div className="system-layout">
        <Menu
          className="system-menu"
          mode={screens.md === false ? 'horizontal' : 'inline'}
          selectedKeys={[activeKey]}
          items={groups.map(({ key, label }) => ({ key, label }))}
          onClick={({ key }) => selectTab(key)}
        />
        {activeGroup && <SystemGroupContent group={activeGroup} />}
      </div>
    </div>
  );
};

export default System;
