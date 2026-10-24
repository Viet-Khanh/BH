import { Alert, Typography } from 'antd';
import EditionGrid from './EditionGrid.jsx';

const EditionPicker = ({ notices = [], onPick }) => (
  <main className="demo-picker">
    <Typography.Title level={2}>
      Chọn loại cửa hàng để dùng thử
    </Typography.Title>
    <Typography.Paragraph type="secondary">
      Dữ liệu mẫu được tạo sẵn và chỉ lưu trên trình duyệt này. Bạn có thể đổi
      loại cửa hàng bất cứ lúc nào.
    </Typography.Paragraph>
    {notices.map((notice) => (
      <Alert
        key={notice}
        type="info"
        showIcon
        message={notice}
        className="demo-notice"
      />
    ))}
    <EditionGrid onPick={onPick} />
  </main>
);

export default EditionPicker;
