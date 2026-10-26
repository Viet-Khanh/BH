import { DatePicker, Form, Input, Switch } from 'antd';

// Reminder, lock and receipt settings of the e-invoice section.
const EinvoiceWorkflowFields = () => (
  <>
    <Form.Item
      label="Ngày bắt đầu dùng hoá đơn điện tử"
      name="einvoiceStartDate"
      extra="Nhắc việc chỉ tính các đơn bán từ ngày này (để trống: 30 ngày gần nhất)."
    >
      <DatePicker format="DD/MM/YYYY" />
    </Form.Item>
    <Form.Item
      label="Nhắc hoá đơn chưa xuất ở màn hình chính"
      name="einvoiceReminder"
      valuePropName="checked"
    >
      <Switch />
    </Form.Item>
    <Form.Item
      label="Khoá hoá đơn đã xuất HĐĐT"
      name="einvoiceLockExported"
      valuePropName="checked"
      extra='Bật: không cho sửa nội dung hoặc xoá đơn đã xuất (vẫn thu tiền được). Muốn sửa thì vào Hoá đơn điện tử → "Bỏ đánh dấu".'
    >
      <Switch />
    </Form.Item>
    <Form.Item
      label="Trang tra cứu hoá đơn của nhà cung cấp"
      name="einvoiceLookupUrl"
      extra="In trên phiếu cùng số HĐĐT và mã tra cứu: mẫu in dùng {{einvoice.block}} (hoặc {{einvoice.number}}, {{einvoice.series}}, {{einvoice.lookupCode}}, {{einvoice.lookupUrl}})."
    >
      <Input placeholder="https://" />
    </Form.Item>
  </>
);

export default EinvoiceWorkflowFields;
