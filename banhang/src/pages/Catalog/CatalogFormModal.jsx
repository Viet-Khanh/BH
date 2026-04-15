import { Col, Form, Input, InputNumber, Modal, Row } from 'antd';
import { formatNumberInput, parseNumberInput } from './catalogUtils.js';

const CatalogFormModal = ({
  open,
  editing,
  activeKey,
  form,
  onCancel,
  onSave,
  onNameChange,
  onCodeChange,
  confirmLoading = false,
}) => (
  <Modal
    title={editing ? 'Sửa dữ liệu' : 'Tạo mới'}
    open={open}
    onCancel={onCancel}
    onOk={onSave}
    okText="Lưu"
    cancelText="Hủy"
    confirmLoading={confirmLoading}
  >
    {activeKey === 'products' && (
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Tên hàng"
              name="name"
              rules={[{ required: true }]}
            >
              <Input onChange={onNameChange} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Mã hàng" name="code" rules={[{ required: true }]}>
              <Input onChange={onCodeChange} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={24}>
            <Form.Item label="ĐVT" name="unit" rules={[{ required: true }]}>
              <Input placeholder="Nhập ĐVT" />
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
);

export default CatalogFormModal;
