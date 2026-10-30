import { Tooltip } from 'antd';

const HINTS = {
  unit: 'Số lượng luôn đếm theo SL trên phiếu (tấm, cái...), không quy đổi ra m².',
  opening:
    'Tồn tính đến 00:00 ngày bắt đầu, bằng tồn cuối ngày hôm trước. Đã gồm các lần sửa tồn thủ công.',
  in: 'Tổng SL trên phiếu nhập có ngày trong khoảng lọc. m² = SL × dài × rộng, chỉ tính các dòng có nhập kích thước.',
  out: 'Tổng SL trên hóa đơn bán có ngày trong khoảng lọc. m² = SL × dài × rộng, chỉ tính các dòng có nhập kích thước.',
  closing:
    'Tồn cuối = Tồn đầu + Nhập SL − Xuất SL. Tính theo SL, không theo m².',
};

const HeaderLabel = ({ title, hint, subtitle }) => (
  <Tooltip title={hint}>
    <span style={{ cursor: 'help' }}>
      {title} ⓘ
      {subtitle ? (
        <div style={{ fontWeight: 400, fontSize: 12 }}>{subtitle}</div>
      ) : null}
    </span>
  </Tooltip>
);

const StockMovementHeader = ({ labels }) => (
  <thead>
    <tr>
      <th rowSpan={2}>Tên hàng</th>
      <th rowSpan={2}>
        <HeaderLabel title="ĐVT" hint={HINTS.unit} />
      </th>
      <th rowSpan={2}>
        <HeaderLabel
          title="Tồn đầu"
          hint={HINTS.opening}
          subtitle={labels.opening}
        />
      </th>
      <th colSpan={2}>
        <HeaderLabel title="Nhập" hint={HINTS.in} subtitle={labels.period} />
      </th>
      <th colSpan={2}>
        <HeaderLabel title="Xuất" hint={HINTS.out} subtitle={labels.period} />
      </th>
      <th rowSpan={2}>
        <HeaderLabel
          title="Tồn cuối"
          hint={HINTS.closing}
          subtitle={labels.closing}
        />
      </th>
    </tr>
    <tr>
      <th>SL</th>
      <th>m²</th>
      <th>SL</th>
      <th>m²</th>
    </tr>
  </thead>
);

export default StockMovementHeader;
