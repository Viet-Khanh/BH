import EinvoiceSettingsSection from '../../../features/einvoice/components/settings/EinvoiceSettingsSection.jsx';
import DataGroup from './DataGroup.jsx';
import PrintingGroup from './PrintingGroup.jsx';
import SalesGroup from './SalesGroup.jsx';
import SecurityGroup from './SecurityGroup.jsx';
import ShopGroup from './ShopGroup.jsx';

const GROUP_COMPONENTS = {
  shop: ShopGroup,
  sales: SalesGroup,
  printing: PrintingGroup,
  einvoice: EinvoiceSettingsSection,
  security: SecurityGroup,
  data: DataGroup,
};

// Heading + content of the selected System group (`group` from systemGroups.js).
const SystemGroupContent = ({ group }) => {
  const Content = GROUP_COMPONENTS[group.key];
  return (
    <section className="system-content">
      <div className="section-title">{group.label}</div>
      {Content && <Content />}
    </section>
  );
};

export default SystemGroupContent;
