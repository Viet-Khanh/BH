import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  message,
  Select,
  Space,
} from 'antd';
import { useEffect, useState } from 'react';
import { validateDraft } from '../../domain/profileDraft.js';
import ColumnsEditor from './ColumnsEditor.jsx';

const PURPOSE_OPTIONS = [
  { value: 'issue', label: 'Xuất hoá đơn' },
  { value: 'adjust', label: 'Điều chỉnh / thay thế' },
];

// Edits a custom profile draft; saving is left to the caller.
const ProfileEditor = ({ draft, onCancel, onSave }) => {
  const [value, setValue] = useState(draft);

  useEffect(() => setValue(draft), [draft]);

  if (!value) return null;
  const set = (patch) => setValue((previous) => ({ ...previous, ...patch }));

  const save = () => {
    const problem = validateDraft(value);
    if (problem) {
      message.error(problem);
      return;
    }
    onSave(value);
  };

  return (
    <Drawer
      open={Boolean(draft)}
      width={1000}
      title="Mẫu file hoá đơn điện tử"
      onClose={onCancel}
      extra={
        <Space>
          <Button onClick={onCancel}>Huỷ</Button>
          <Button type="primary" onClick={save}>
            Lưu mẫu
          </Button>
        </Space>
      }
    >
      <Form layout="inline" style={{ marginBottom: 12, rowGap: 8 }}>
        <Form.Item label="Tên mẫu">
          <Input
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Form.Item>
        <Form.Item label="Dùng cho">
          <Select
            style={{ width: 200 }}
            value={value.purpose || 'issue'}
            options={PURPOSE_OPTIONS}
            onChange={(purpose) => set({ purpose })}
          />
        </Form.Item>
        <Form.Item label="Tên sheet">
          <Input
            value={value.sheetName}
            onChange={(e) => set({ sheetName: e.target.value })}
          />
        </Form.Item>
      </Form>
      {value.preamble?.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={`Giữ nguyên ${value.preamble.length} dòng đầu của file mẫu; tiêu đề cột ở dòng ${value.preamble.length + 1}.`}
        />
      )}
      <ColumnsEditor
        columns={value.columns}
        onChange={(columns) => set({ columns })}
      />
    </Drawer>
  );
};

export default ProfileEditor;
