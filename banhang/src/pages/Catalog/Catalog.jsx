import { useMemo, useState } from 'react';
import { Button, Col, Form, Input, InputNumber, Modal, Row, Select, Table, Tabs, message } from 'antd';
import { v4 as uuid } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../../store/productStore.js';
import { useCustomerStore } from '../../store/customerStore.js';
import { useSupplierStore } from '../../store/supplierStore.js';
import { useUnitStore } from '../../store/unitStore.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const normalizeSearchText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const buildSearchText = (record) =>
  Object.values(record ?? {})
    .filter((value) => value !== null && value !== undefined)
    .join(' ');

const hasSearchMatch = (record, keyword) => {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) return true;
  const haystack = normalizeSearchText(buildSearchText(record));
  return normalizedKeyword.split(' ').every((term) => haystack.includes(term));
};

const buildCodeFromName = (name = '') => {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (!cleaned) return '';
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase())
    .join('');
};

const parseNumberInput = (value) => {
  if (!value) return '';
  return String(value).replace(/\./g, '').replace(/,/g, '');
};

const formatNumberInput = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const numeric = typeof value === 'number' ? value : Number(parseNumberInput(value));
  if (Number.isNaN(numeric)) return '';
  return formatMoney(numeric);
};

const Catalog = () => {
  const navigate = useNavigate();
  const { items: products, add: addProduct, update: updateProduct, remove: removeProduct } = useProductStore();
  const { items: customers, add: addCustomer, update: updateCustomer, remove: removeCustomer } = useCustomerStore();
  const { items: suppliers, add: addSupplier, update: updateSupplier, remove: removeSupplier } = useSupplierStore();
  const { items: units, add: addUnit, update: updateUnit, remove: removeUnit } = useUnitStore();

  const [activeKey, setActiveKey] = useState('products');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [codeEdited, setCodeEdited] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const activeProducts = useMemo(() => products.filter((item) => !item.isDeleted), [products]);
  const activeCustomers = useMemo(() => customers.filter((item) => !item.isDeleted), [customers]);
  const activeSuppliers = useMemo(() => suppliers.filter((item) => !item.isDeleted), [suppliers]);
  const activeUnits = useMemo(() => units.filter((item) => !item.isDeleted), [units]);

  const unitOptions = useMemo(
    () => activeUnits.map((unit) => ({ value: unit.name, label: unit.name })),
    [activeUnits]
  );

  const dataSource = useMemo(() => {
    let source = activeProducts;
    if (activeKey === 'customers') source = activeCustomers;
    if (activeKey === 'suppliers') source = activeSuppliers;
    if (activeKey === 'units') source = activeUnits;
    if (activeKey === 'units') return source;
    return source.filter((item) => hasSearchMatch(item, searchText));
  }, [activeKey, activeProducts, activeCustomers, activeSuppliers, activeUnits, searchText]);

  const handleTabChange = (key) => {
    setActiveKey(key);
    setSearchText('');
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setCodeEdited(false);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setCodeEdited(activeKey === 'products');
    setModalOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Xóa dữ liệu?',
      content: 'Thao tác này không thể hoàn tác.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: async () => {
        if (activeKey === 'customers') await removeCustomer(record.id);
        else if (activeKey === 'suppliers') await removeSupplier(record.id);
        else if (activeKey === 'units') await removeUnit(record.id);
        else await removeProduct(record.id);
        message.success('Đã xóa.');
      },
    });
  };

  const handleNameChange = (event) => {
    const name = event.target.value || '';
    if (!codeEdited) {
      form.setFieldsValue({ code: buildCodeFromName(name) });
    }
  };

  const handleCodeChange = (event) => {
    const value = event.target.value || '';
    setCodeEdited(value.trim().length > 0);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (activeKey === 'products') {
      const payload = {
        ...values,
        code: values.code || buildCodeFromName(values.name || ''),
        avgCost: Number(values.avgCost || 0),
        sellPriceDefault: Number(values.sellPriceDefault || 0),
        sellPriceWholesale: Number(values.sellPriceWholesale || 0),
        openingStock: Number(values.openingStock || 0),
      };
      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await addProduct({
          ...payload,
          id: uuid(),
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (activeKey === 'customers') {
      if (editing) await updateCustomer(editing.id, values);
      else await addCustomer({ ...values, id: uuid() });
    }

    if (activeKey === 'suppliers') {
      if (editing) await updateSupplier(editing.id, values);
      else await addSupplier({ ...values, id: uuid() });
    }

    if (activeKey === 'units') {
      if (editing) await updateUnit(editing.id, values);
      else await addUnit({ ...values, id: uuid(), createdAt: new Date().toISOString() });
    }

    message.success('Đã lưu.');
    setModalOpen(false);
  };

  const columns = useMemo(() => {
    if (activeKey === 'products') {
      return [
        { title: 'STT', render: (_, __, index) => index + 1, width: 60 },
        { title: 'Mã hàng', dataIndex: 'code' },
        { title: 'Tên hàng', dataIndex: 'name' },
        { title: 'ĐVT', dataIndex: 'unit' },
        { title: 'Đơn giá lẻ', dataIndex: 'sellPriceDefault', render: (val) => formatMoney(val) },
        { title: 'Đơn giá sỉ', dataIndex: 'sellPriceWholesale', render: (val) => formatMoney(val) },
        { title: 'Nhóm hàng', dataIndex: 'group' },
        { title: 'Giá vốn', dataIndex: 'avgCost', render: (val) => formatMoney(val) },
        { title: 'Tồn đầu', dataIndex: 'openingStock' },
        {
          title: 'Hành động',
          render: (_, record) => (
            <div className="flex-row">
              <Button onClick={() => openEdit(record)}>Sửa</Button>
              <Button danger onClick={() => handleDelete(record)}>
                Xóa
              </Button>
            </div>
          ),
        },
      ];
    }

    if (activeKey === 'units') {
      return [
        { title: 'STT', render: (_, __, index) => index + 1, width: 60 },
        { title: 'ĐVT', dataIndex: 'name' },
        {
          title: 'Hành động',
          render: (_, record) => (
            <div className="flex-row">
              <Button onClick={() => openEdit(record)}>Sửa</Button>
              <Button danger onClick={() => handleDelete(record)}>
                Xóa
              </Button>
            </div>
          ),
        },
      ];
    }

    return [
      { title: 'Tên', dataIndex: 'name' },
      { title: 'SĐT', dataIndex: 'phone' },
      { title: 'Địa chỉ', dataIndex: 'address' },
      {
        title: 'Hành động',
        render: (_, record) => (
          <div className="flex-row">
            <Button onClick={() => openEdit(record)}>Sửa</Button>
            <Button danger onClick={() => handleDelete(record)}>
              Xóa
            </Button>
          </div>
        ),
      },
    ];
  }, [activeKey, units]);

  return (
    <div className="page-card">
      <div className="page-title">Danh mục</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>Quay lại</Button>
        <Button size="large" type="primary" className="btn-primary" onClick={openCreate}>
          Tạo mới
        </Button>
      </div>

      <Tabs
        type='card'
        activeKey={activeKey}
        onChange={handleTabChange}
        items={[
          { key: 'products', label: 'Sản phẩm' },
          { key: 'units', label: 'ĐVT' },
          { key: 'customers', label: 'Khách hàng/Đại lý' },
          { key: 'suppliers', label: 'Nhà cung cấp' },
        ]}
      />

      {activeKey !== 'units' && (
        <div className="action-row">
          <Input
            allowClear
            placeholder="Tìm kiếm..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>
      )}

      <div className="table-wrapper">
        <Table
          rowKey="id"
          dataSource={dataSource}
          columns={columns}
          pagination={activeKey === 'units' ? { pageSize: 8 } : false}
          scroll={{ x: 1100 }}
        />
      </div>

      <Modal
        title={editing ? 'Sửa dữ liệu' : 'Tạo mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
      >
        {activeKey === 'products' && (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Tên hàng" name="name" rules={[{ required: true }]}> 
                  <Input onChange={handleNameChange} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Mã hàng" name="code" rules={[{ required: true }]}> 
                  <Input onChange={handleCodeChange} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="ĐVT" name="unit" rules={[{ required: true }]}> 
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={unitOptions}
                    placeholder="Chọn ĐVT"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Nhóm hàng" name="group" rules={[{ required: true }]}> 
                  <Select
                    options={[
                      { value: 'Nhôm', label: 'Nhôm' },
                      { value: 'Sắt', label: 'Sắt' },
                      { value: 'Kính', label: 'Kính' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Đơn giá lẻ" name="sellPriceDefault">
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={formatNumberInput}
                    parser={parseNumberInput}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Đơn giá sỉ" name="sellPriceWholesale">
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={formatNumberInput}
                    parser={parseNumberInput}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Giá vốn" name="avgCost">
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={formatNumberInput}
                    parser={parseNumberInput}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Tồn đầu" name="openingStock">
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={formatNumberInput}
                    parser={parseNumberInput}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}

        {activeKey === 'units' && (
          <Form form={form} layout="vertical">
            <Form.Item label="ĐVT" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Form>
        )}

        {activeKey !== 'products' && activeKey !== 'units' && (
          <Form form={form} layout="vertical">
            <Form.Item label="Tên" name="name" rules={[{ required: true }]}> 
              <Input />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Input />
            </Form.Item>
            <Form.Item label="Địa chỉ" name="address">
              <Input />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Catalog;
