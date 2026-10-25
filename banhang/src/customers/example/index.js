import { defineCustomer } from '../../platform/defineModule.js';
import ExampleHelpPage from './ExampleHelpPage.jsx';

// Template for real customers: copy this folder, register it in ../catalog.js.
export default defineCustomer({
  id: 'example',
  extends: 'nhomkinh',
  config: { appTitle: 'PHẦN MỀM BÁN HÀNG - KHÁCH HÀNG MẪU' },
  routes: [
    { module: 'example-help', path: '/example-help', page: ExampleHelpPage },
  ],
  homeTiles: [
    {
      module: 'example-help',
      label: 'HƯỚNG DẪN',
      tone: 'linear-gradient(135deg, #3f5bd9, #6b4fd6)',
      to: '/example-help',
    },
  ],
});
