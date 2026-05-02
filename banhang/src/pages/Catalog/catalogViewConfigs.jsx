import { Button } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';

export const getColumns = ({
  activeKey,
  onEdit,
  onDelete,
  showSensitiveInfo = false,
}) => {
  const actionColumn = {
    title: 'Hành động',
    render: (_, record) => (
      <div className="flex-row">
        <Button onClick={() => onEdit(record)}>Sửa</Button>
        <Button danger onClick={() => onDelete(record)}>
          Xóa
        </Button>
      </div>
    ),
  };

  if (activeKey === 'products') {
    const productColumns = [
      { title: 'STT', render: (_, __, index) => index + 1, width: 60 },
      { title: 'Mã hàng', dataIndex: 'code' },
      { title: 'Tên hàng', dataIndex: 'name' },
      { title: 'ĐVT', dataIndex: 'unit' },
      {
        title: 'Đơn giá lẻ',
        dataIndex: 'sellPriceDefault',
        render: (val) => formatMoney(val),
      },
      {
        title: 'Đơn giá sỉ',
        dataIndex: 'sellPriceWholesale',
        render: (val) => formatMoney(val),
      },
    ];

    if (showSensitiveInfo) {
      productColumns.push({
        title: 'Giá vốn',
        dataIndex: 'avgCost',
        render: (val) => formatMoney(val),
      });
    }

    return [
      ...productColumns,
      { title: 'Tồn đầu', dataIndex: 'openingStock' },
      actionColumn,
    ];
  }

  if (activeKey === 'units') {
    return [
      { title: 'STT', render: (_, __, index) => index + 1, width: 60 },
      { title: 'ĐVT', dataIndex: 'name' },
      actionColumn,
    ];
  }

  return [
    { title: 'Tên', dataIndex: 'name' },
    { title: 'SĐT', dataIndex: 'phone' },
    { title: 'Địa chỉ', dataIndex: 'address' },
    actionColumn,
  ];
};

export const getExportConfig = ({
  activeKey,
  dataSource,
  showSensitiveInfo = false,
}) => {
  if (activeKey === 'products') {
    return {
      rows: dataSource.map((item, index) => {
        const row = {
          STT: index + 1,
          Ma_hang: item.code,
          Ten_hang: item.name,
          DVT: item.unit,
          Don_gia_le: item.sellPriceDefault,
          Don_gia_si: item.sellPriceWholesale,
        };
        if (showSensitiveInfo) row.Gia_von = item.avgCost;
        row.Ton_dau = item.openingStock;
        return row;
      }),
      fileName: 'danh-muc-san-pham',
      sheetName: 'SanPham',
      title: 'Danh mục sản phẩm',
    };
  }

  if (activeKey === 'customers') {
    return {
      rows: dataSource.map((item, index) => ({
        STT: index + 1,
        'Tên khách hàng': item.name,
        'Số điện thoại': item.phone,
        'Địa chỉ': item.address,
      })),
      fileName: 'danh-muc-khach-hang',
      sheetName: 'KhachHang',
      title: 'Danh mục khách hàng',
    };
  }

  if (activeKey === 'suppliers') {
    return {
      rows: dataSource.map((item, index) => ({
        STT: index + 1,
        'Tên nhà cung cấp': item.name,
        'Số điện thoại': item.phone,
        'Địa chỉ': item.address,
      })),
      fileName: 'danh-muc-nha-cung-cap',
      sheetName: 'NhaCungCap',
      title: 'Danh mục nhà cung cấp',
    };
  }

  if (activeKey === 'units') {
    return {
      rows: dataSource.map((item, index) => ({
        STT: index + 1,
        DVT: item.name,
      })),
      fileName: 'danh-muc-don-vi',
      sheetName: 'DonVi',
      title: 'Danh mục đơn vị',
    };
  }

  return {
    rows: [],
    fileName: 'danh-muc',
    sheetName: 'DanhMuc',
    title: 'Danh mục',
  };
};
