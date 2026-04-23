import { Card, Empty, List } from 'antd';

const DashboardSummaryCard = ({
  title,
  metrics = [],
  items = [],
  emptyText,
  renderItem,
}) => (
  <Card title={title} className="today-dashboard-card">
    <div className="today-dashboard-metrics">
      {metrics.map((metric) => (
        <div key={metric.label} className="today-dashboard-metric">
          <span>{metric.label}</span>
          <strong className={metric.tone ? `metric-${metric.tone}` : ''}>
            {metric.value}
          </strong>
        </div>
      ))}
    </div>

    {renderItem && (
      <div className="today-dashboard-list">
        {items.length ? (
          <List
            size="small"
            dataSource={items}
            renderItem={(item, index) => (
              <List.Item>{renderItem(item, index)}</List.Item>
            )}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
        )}
      </div>
    )}
  </Card>
);

export default DashboardSummaryCard;
