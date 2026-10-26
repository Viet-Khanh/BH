import { Button, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import { copyProfile } from '../../domain/profileDraft.js';
import { useCustomProfiles } from '../../hooks/useCustomProfiles.js';
import { allProfiles, getProfile } from '../../profiles/index.js';
import ProfileEditor from './ProfileEditor.jsx';
import TemplateUploadModal from './TemplateUploadModal.jsx';

const SOURCE_TAGS = {
  sample: { color: 'green', label: 'Theo file mẫu thật' },
  docs: { color: 'gold', label: 'Theo tài liệu công khai' },
  partial: { color: 'orange', label: 'Chưa đủ thông tin' },
};

const SourceTag = ({ profile }) => {
  if (profile.custom) return <Tag color="blue">Tự tạo</Tag>;
  const tag = SOURCE_TAGS[profile.source?.status];
  return tag ? <Tag color={tag.color}>{tag.label}</Tag> : <Tag>Cài sẵn</Tag>;
};

const HELP =
  'Mẫu cài sẵn của nhà cung cấp làm theo tài liệu công khai: hãy thử nhập một file vào tài khoản của cửa hàng trước khi dùng thật. Nếu nhà cung cấp đổi mẫu, tải file mẫu mới lên để tạo mẫu tự động.';

// "Mẫu file" tab: built-in + custom export profiles.
const ProfilesTab = () => {
  const { settings, save, remove } = useCustomProfiles();
  const [draft, setDraft] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const columns = [
    { title: 'Mẫu', dataIndex: 'name' },
    {
      title: 'Dùng cho',
      render: (profile) =>
        profile.purpose === 'adjust' ? 'Điều chỉnh/thay thế' : 'Xuất hoá đơn',
    },
    { title: 'Nguồn', render: (profile) => <SourceTag profile={profile} /> },
    {
      title: '',
      render: (profile) => (
        <Space size="small">
          <Button size="small" onClick={() => setDraft(copyProfile(profile))}>
            Sao chép
          </Button>
          {profile.custom && (
            <Button size="small" onClick={() => setDraft(profile)}>
              Sửa
            </Button>
          )}
          {profile.custom && (
            <Popconfirm
              title="Xoá mẫu này?"
              okText="Xoá"
              cancelText="Huỷ"
              onConfirm={() => remove(profile.id)}
            >
              <Button size="small" danger>
                Xoá
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Text type="secondary">{HELP}</Typography.Text>
      <Space>
        <Button type="primary" onClick={() => setUploadOpen(true)}>
          Tạo từ file mẫu nhà cung cấp
        </Button>
        <Button onClick={() => setDraft(copyProfile(getProfile('generic')))}>
          Tạo mới từ mẫu chuẩn
        </Button>
      </Space>
      <Table
        rowKey="id"
        size="middle"
        pagination={false}
        dataSource={allProfiles(settings)}
        columns={columns}
      />
      <TemplateUploadModal
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        onCreate={(profile) => {
          setUploadOpen(false);
          setDraft(profile);
        }}
      />
      <ProfileEditor
        draft={draft}
        onCancel={() => setDraft(null)}
        onSave={async (profile) => {
          await save(profile);
          setDraft(null);
        }}
      />
    </Space>
  );
};

export default ProfilesTab;
