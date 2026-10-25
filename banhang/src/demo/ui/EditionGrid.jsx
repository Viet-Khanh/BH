import { Card, Col, Row, Tag, Typography } from 'antd';
import { DEMO_EDITIONS } from '../editions/index.js';

const onActivateKey = (callback) => (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

const EditionGrid = ({ activeId, onPick }) => (
  <Row gutter={[16, 16]}>
    {DEMO_EDITIONS.map((edition) => (
      <Col xs={24} sm={12} key={edition.id}>
        <Card
          hoverable
          role="button"
          tabIndex={0}
          className="demo-edition-card"
          onClick={() => onPick(edition.id)}
          onKeyDown={onActivateKey(() => onPick(edition.id))}
        >
          <Typography.Title level={4}>
            {edition.name}{' '}
            {edition.id === activeId && <Tag color="blue">Đang dùng</Tag>}
          </Typography.Title>
          <Typography.Text type="secondary">{edition.tagline}</Typography.Text>
        </Card>
      </Col>
    ))}
  </Row>
);

export default EditionGrid;
