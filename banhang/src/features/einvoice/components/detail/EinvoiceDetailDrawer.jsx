import { Drawer, Typography } from 'antd';
import AdjustmentHistory from './AdjustmentHistory.jsx';
import DiffView from './DiffView.jsx';
import DocumentView from './DocumentView.jsx';
import IssuedInfo from './IssuedInfo.jsx';

const Section = ({ title, children }) => (
  <section style={{ marginBottom: 20 }}>
    <Typography.Title level={5}>{title}</Typography.Title>
    {children}
  </section>
);

// Everything about one sale's e-invoice: state, content and changes since export.
const EinvoiceDetailDrawer = ({ item, onClose }) => (
  <Drawer
    open={Boolean(item)}
    onClose={onClose}
    width={720}
    title={item ? `Hoá đơn ${item.code}` : ''}
    destroyOnClose
  >
    {item && (
      <>
        <Section title="Hoá đơn điện tử">
          <IssuedInfo item={item} />
        </Section>
        {item.status === 'changed' && (
          <Section title="Thay đổi sau khi xuất">
            <DiffView diff={item.diff} />
          </Section>
        )}
        {item.einvoice?.adjustments?.length > 0 && (
          <Section title="Đã xuất điều chỉnh/thay thế">
            <AdjustmentHistory adjustments={item.einvoice.adjustments} />
          </Section>
        )}
        <Section title="Nội dung hiện tại">
          <DocumentView document={item.document} />
        </Section>
      </>
    )}
  </Drawer>
);

export default EinvoiceDetailDrawer;
