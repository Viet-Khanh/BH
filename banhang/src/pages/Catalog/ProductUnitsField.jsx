import { Button, Form, Input, InputNumber, Space } from 'antd';
import { MAX_PRODUCT_UNITS } from '../../utils/productUnits.js';
import { formatNumberInput, parseNumberInput } from './catalogUtils.js';

// Packaging units (thùng, lốc…) of a product; the backend validates the list.
const ProductUnitsField = ({ showBarcode = false }) => (
  <Form.Item label="Đơn vị quy đổi (tùy chọn)">
    <Form.List name="units">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name }) => (
            <Space key={key} align="baseline" wrap>
              <Form.Item
                name={[name, 'name']}
                rules={[{ required: true, message: 'Nhập tên' }]}
              >
                <Input placeholder="Tên (vd: thùng)" />
              </Form.Item>
              <Form.Item
                name={[name, 'factor']}
                rules={[
                  { required: true, message: 'Nhập hệ số' },
                  {
                    validator: (_, value) =>
                      value === null || value === undefined || value > 1
                        ? Promise.resolve()
                        : Promise.reject(new Error('Hệ số phải lớn hơn 1')),
                  },
                ]}
              >
                <InputNumber min={1} placeholder="= bao nhiêu ĐVT" />
              </Form.Item>
              <Form.Item name={[name, 'sellPrice']}>
                <InputNumber
                  min={0}
                  placeholder="Giá bán (trống = tự tính)"
                  style={{ width: 200 }}
                  formatter={formatNumberInput}
                  parser={parseNumberInput}
                />
              </Form.Item>
              {showBarcode && (
                <Form.Item name={[name, 'barcode']}>
                  <Input
                    placeholder="Mã vạch"
                    style={{ width: 160 }}
                    onPressEnter={(event) => event.preventDefault()}
                  />
                </Form.Item>
              )}
              <Button onClick={() => remove(name)}>Xóa</Button>
            </Space>
          ))}
          {fields.length < MAX_PRODUCT_UNITS && (
            <Button type="dashed" onClick={() => add()}>
              + Thêm đơn vị quy đổi
            </Button>
          )}
        </>
      )}
    </Form.List>
  </Form.Item>
);

export default ProductUnitsField;
