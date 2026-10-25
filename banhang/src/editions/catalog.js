// Plain data (no imports): read by vite.config.js, scripts/buildTarget.mjs and tests.
// nhomkinh keeps the original installer identity so existing installs upgrade in place.
// installerGuid = Inno Setup AppId: never change it once an installer has shipped.
export const DEFAULT_EDITION_ID = 'nhomkinh';

export const EDITION_CATALOG = {
  nhomkinh: {
    productName: 'BanHang',
    appId: 'com.rostek.banhang',
    installerGuid: 'D0196E87-7934-44B9-A107-6C5F0B6F9C72',
    installerBaseName: 'BanHang-Setup',
  },
  vlxd: {
    productName: 'BanHang-VLXD',
    appId: 'com.rostek.banhang.vlxd',
    installerGuid: '6DF1A3E5-FCDB-4868-8280-DD3CE6AA95B4',
    installerBaseName: 'BanHang-VLXD-Setup',
  },
  minimart: {
    productName: 'BanHang-TapHoa',
    appId: 'com.rostek.banhang.minimart',
    installerGuid: '74F56C7B-FE1C-48A7-BB4A-7FACB60D638F',
    installerBaseName: 'BanHang-TapHoa-Setup',
  },
  fashion: {
    productName: 'BanHang-ThoiTrang',
    appId: 'com.rostek.banhang.fashion',
    installerGuid: 'E81153A5-4EDC-4BDB-81E4-722F2136C0F7',
    installerBaseName: 'BanHang-ThoiTrang-Setup',
  },
  pharmacy: {
    productName: 'BanHang-NhaThuoc',
    appId: 'com.rostek.banhang.pharmacy',
    installerGuid: '0E9E5657-7ACC-4E5F-9F3E-0012516718D9',
    installerBaseName: 'BanHang-NhaThuoc-Setup',
  },
};

export const EDITION_IDS = Object.keys(EDITION_CATALOG);
