import { Pagination } from 'antd';

const ReportInvoicePagination = ({
  page,
  pageSize,
  total,
  setPage,
  setPageSize,
  label = 'hóa đơn',
}) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
    <Pagination
      current={page}
      pageSize={pageSize}
      total={total}
      showSizeChanger
      pageSizeOptions={['10', '20', '50', '100']}
      onChange={(nextPage, nextPageSize) => {
        const normalizedPageSize = Number(nextPageSize || pageSize);
        if (normalizedPageSize !== pageSize) {
          setPage(1);
          setPageSize(normalizedPageSize);
          return;
        }
        setPage(nextPage);
        setPageSize(normalizedPageSize);
      }}
      showTotal={(value) => `Tổng ${value} ${label}`}
    />
  </div>
);

export default ReportInvoicePagination;
