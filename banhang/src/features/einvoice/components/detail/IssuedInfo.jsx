import { Descriptions, Tag } from 'antd';
import dayjs from 'dayjs';
import { getStatusOption } from '../../domain/statusLabels.js';

const formatTime = (value) =>
  value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';

// Export state + provider data (number, series, codes) of one invoice.
const IssuedInfo = ({ item }) => {
  const option = getStatusOption(item.status);
  const einvoice = item.einvoice || {};
  return (
    <Descriptions size="small" column={2} bordered>
      <Descriptions.Item label="Trạng thái" span={2}>
        <Tag color={option.color}>{option.label}</Tag>
        {item.deleted && <Tag color="red">Đã xoá</Tag>}
      </Descriptions.Item>
      <Descriptions.Item label="Xuất lúc">
        {formatTime(einvoice.exportedAt)}
      </Descriptions.Item>
      <Descriptions.Item label="Số HĐĐT">
        {einvoice.number || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Ký hiệu">
        {einvoice.series || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Mã tra cứu">
        {einvoice.lookupCode || '—'}
      </Descriptions.Item>
    </Descriptions>
  );
};

export default IssuedInfo;
