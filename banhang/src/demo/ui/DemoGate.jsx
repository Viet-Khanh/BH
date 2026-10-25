import { Button, Result, Spin, Typography } from 'antd';
import DemoBanner from './DemoBanner.jsx';
import EditionPicker from './EditionPicker.jsx';
import { useDemoSession } from './useDemoSession.js';

const Loading = ({ text }) => (
  <div className="demo-center">
    <Spin size="large" />
    <Typography.Text type="secondary">{text}</Typography.Text>
  </div>
);

// Wraps <App/> in demo builds: storage check, edition choice, then app + banner.
const DemoGate = ({ app }) => {
  const { state, chooseEdition } = useDemoSession();

  switch (state.status) {
    case 'booting':
      return <Loading text="Đang mở bản dùng thử..." />;
    case 'seeding':
      return <Loading text="Đang tạo dữ liệu mẫu, vui lòng chờ vài giây..." />;
    case 'blocked':
      return (
        <Result
          status="warning"
          title="Không chạy được bản dùng thử"
          subTitle="Trình duyệt đang chặn lưu trữ cục bộ. Hãy tắt chế độ ẩn danh hoặc cho phép trang web lưu dữ liệu rồi tải lại trang."
        />
      );
    case 'error':
      return (
        <Result
          status="error"
          title="Không khởi tạo được bản dùng thử"
          subTitle={state.error}
          extra={
            <Button onClick={() => window.location.reload()}>Tải lại</Button>
          }
        />
      );
    case 'picking':
      return <EditionPicker notices={state.notices} onPick={chooseEdition} />;
    default:
      return (
        <>
          <DemoBanner edition={state.edition} notices={state.notices} />
          {app}
        </>
      );
  }
};

export default DemoGate;
