import { Checkbox, Col, Form, Input, InputNumber, Modal, Row } from 'antd';
import CustomerTaxFields from '../../features/einvoice/components/catalog/CustomerTaxFields.jsx';
import ProductTaxField from '../../features/einvoice/components/catalog/ProductTaxField.jsx';
import Slot from '../../platform/Slot.jsx';
import { SLOTS } from '../../platform/slots.js';
import {
  useEdition,
  useEditionFeature,
} from '../../platform/useActiveModule.js';
import ProductUnitsField from './ProductUnitsField.jsx';
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
}) => {
  const { labels } = useEdition();
  // Units are off when dimensions (m2 lines) are on.
  const units = useEditionFeature('units');
  const dimensions = useEditionFeature('dimensions');
  const showUnits = units && !dimensions;
  const showBarcode = useEditionFeature('barcode');
  return (
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
            <Col xs={24} md={showBarcode ? 8 : 12}>
              <Form.Item
                label="Tên hàng"
                name="name"
                rules={[{ required: true }]}
              >
                <Input onChange={onNameChange} />
              </Form.Item>
            </Col>
            <Col xs={24} md={showBarcode ? 8 : 12}>
              <Form.Item
                label="Mã hàng"
                name="code"
                rules={[{ required: true }]}
              >
                <Input onChange={onCodeChange} />
              </Form.Item>
            </Col>
            {showBarcode && (
              <Col xs={24} md={8}>
                <Form.Item label="Mã vạch" name="barcode">
                  <Input
                    placeholder="Quét hoặc nhập mã vạch"
                    onPressEnter={(event) => event.preventDefault()}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={24}>
              <Form.Item label="ĐVT" name="unit" rules={[{ required: true }]}>
                <Input placeholder="Nhập ĐVT" />
              </Form.Item>
            </Col>
          </Row>
          {showUnits && <ProductUnitsField showBarcode={showBarcode} />}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label={labels.group} name="group">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={labels.spec} name="spec">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Slot name={SLOTS.catalogProductFields} form={form} labels={labels} />
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
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="excludeFromProfit" valuePropName="checked">
                <Checkbox>Không tính vào lợi nhuận</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <ProductTaxField />
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
          {activeKey === 'customers' && <CustomerTaxFields />}
        </Form>
      )}
    </Modal>
  );
};

export default CatalogFormModal;
