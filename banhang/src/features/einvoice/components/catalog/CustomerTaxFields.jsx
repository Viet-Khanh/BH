import { Form, Input } from 'antd';

// Buyer details printed on e-invoices. A tax code marks the customer as an organisation.
const CustomerTaxFields = () => (
  <>
    <Form.Item label="Mã số thuế" name="taxCode">
      <Input placeholder="Chỉ nhập nếu khách lấy hoá đơn công ty" />
    </Form.Item>
    <Form.Item label="Người mua hàng (nếu khác tên)" name="buyerName">
      <Input />
    </Form.Item>
    <Form.Item
      label="Email nhận hoá đơn"
      name="email"
      rules={[{ type: 'email', message: 'Email không hợp lệ.' }]}
    >
      <Input />
    </Form.Item>
  </>
);

export default CustomerTaxFields;
