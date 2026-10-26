import { Alert, Typography } from 'antd';

const rowList = (rows) =>
  rows
    .slice(0, 10)
    .map((row) => `dòng ${row.rowNumber}`)
    .join(', ') + (rows.length > 10 ? '…' : '');

// Counts of the dry run (or of the applied import).
const ResultPreview = ({ preview }) => (
  <>
    <Alert
      type={preview.matched.length ? 'success' : 'warning'}
      showIcon
      message={`${preview.matched.length} hoá đơn khớp${preview.applied ? ' — đã ghi số' : ''}`}
    />
    {preview.ambiguous.length > 0 && (
      <Typography.Paragraph type="warning" style={{ marginTop: 8 }}>
        {preview.ambiguous.length} dòng trùng nhiều hoá đơn (
        {preview.ambiguous
          .slice(0, 5)
          .map(({ row, codes }) => `dòng ${row.rowNumber}: ${codes.join('/')}`)
          .join('; ')}
        ): nhập tay số cho các hoá đơn này.
      </Typography.Paragraph>
    )}
    {preview.unmatched.length > 0 && (
      <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
        {preview.unmatched.length} dòng không tìm thấy hoá đơn (
        {rowList(preview.unmatched)}).
      </Typography.Paragraph>
    )}
  </>
);

export default ResultPreview;
