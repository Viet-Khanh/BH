import { Typography } from 'antd';

// Customer-only page: lives in src/customers/example and ships only in that build.
const ExampleHelpPage = () => (
  <div className="page-card">
    <Typography.Title level={3}>Hướng dẫn khách hàng mẫu</Typography.Title>
    <Typography.Paragraph>
      Trang này thuộc module khách hàng mẫu (<code>src/customers/example</code>)
      và chỉ có trong bản cài đặt của khách này. Dùng thư mục này làm khuôn khi
      cần làm riêng cho một khách: đổi cấu hình, thêm màn hình, thay thành phần
      của ngành mà không sửa phần lõi.
    </Typography.Paragraph>
  </div>
);

export default ExampleHelpPage;
