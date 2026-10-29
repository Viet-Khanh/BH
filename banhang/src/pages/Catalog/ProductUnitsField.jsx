import { Button, Form, Input, InputNumber, Space } from 'antd';
import { formatNumberInput, parseNumberInput } from './catalogUtils.js';

// Packaging units (thùng, lốc…) of a product; the backend validates the list.
const ProductUnitsField = () => (
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
                rules={[{ required: true, message: 'Nhập hệ số' }]}
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
              <Button onClick={() => remove(name)}>Xóa</Button>
            </Space>
          ))}
          {fields.length < 5 && (
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
