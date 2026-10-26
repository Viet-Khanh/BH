import { Form, InputNumber, Select } from 'antd';
import { RESULT_KEYS } from '../../domain/resultRows.js';

// Which column of the provider file holds each value.
const ResultMapping = ({ state }) => {
  const options = state.headers.map((header, index) => ({
    value: index,
    label: String(header || `Cột ${index + 1}`),
  }));
  return (
    <Form layout="horizontal" labelCol={{ span: 8 }} size="small">
      <Form.Item label="Dòng tiêu đề">
        <InputNumber
          min={1}
          max={state.sheet.rows.length}
          value={state.headerRow}
          onChange={(row) => row && state.chooseHeaderRow(row)}
        />
      </Form.Item>
      {RESULT_KEYS.map(({ key, label, required }) => (
        <Form.Item key={key} label={label} required={required}>
          <Select
            allowClear
            placeholder="Không có"
            value={state.mapping[key]}
            options={options}
            onChange={(index) => state.setMappingKey(key, index)}
          />
        </Form.Item>
      ))}
    </Form>
  );
};

export default ResultMapping;
