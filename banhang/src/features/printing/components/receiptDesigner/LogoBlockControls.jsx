import { Button, Upload } from 'antd';

// Logo row extras: pick an image (processed in the browser, never uploaded), remove, thumbnail.
const LogoBlockControls = ({ logo, onPick, onRemove }) => (
  <div className="receipt-designer-logo">
    {logo && <img src={logo} alt="Logo" />}
    <Upload
      accept="image/*"
      showUploadList={false}
      beforeUpload={(file) => {
        onPick(file);
        return false;
      }}
    >
      <Button size="small">{logo ? 'Đổi logo' : 'Chọn ảnh logo'}</Button>
    </Upload>
    {logo && (
      <Button size="small" danger onClick={onRemove}>
        Xoá logo
      </Button>
    )}
  </div>
);

export default LogoBlockControls;
