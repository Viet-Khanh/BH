import { InputNumber } from 'antd';
import { FONT_SIZE_RANGE } from '../../receipt/receiptLayout.js';
import DesignerBlockRow from './DesignerBlockRow.jsx';

// Left column: font size + blocks in print order.
const DesignerBlockList = ({ layout, dispatch, extra }) => {
  const [min, max] = FONT_SIZE_RANGE;
  const last = layout.blocks.length - 1;

  return (
    <div className="receipt-designer-blocks">
      <label className="receipt-designer-font">
        <span>Cỡ chữ (px)</span>
        <InputNumber
          size="small"
          min={min}
          max={max}
          precision={0}
          value={layout.fontSizePx}
          onChange={(value) =>
            value !== null && dispatch({ type: 'fontSize', value })
          }
        />
      </label>
      {layout.blocks.map((block, index) => (
        <DesignerBlockRow
          key={block.key}
          block={block}
          isFirst={index === 0}
          isLast={index === last}
          dispatch={dispatch}
          extra={extra}
        />
      ))}
    </div>
  );
};

export default DesignerBlockList;
