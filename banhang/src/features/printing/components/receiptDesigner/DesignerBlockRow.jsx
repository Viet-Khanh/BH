import { Button, Input, Radio, Switch, Typography } from 'antd';
import { FORCED_BLOCKS } from '../../receipt/receiptLayout.js';
import { BLOCK_LABELS, ITEMS_STYLE_OPTIONS } from './designerState.js';
import LogoBlockControls from './LogoBlockControls.jsx';

const TEXT_MAX_LENGTH = 80;

// One block of the designer list: on/off, label, move up/down and its own options.
// `extra` = { logo, onPickLogo, bankMissing }.
const DesignerBlockRow = ({ block, isFirst, isLast, dispatch, extra }) => {
  const { key } = block;
  const label = BLOCK_LABELS[key] || key;

  return (
    <div className="receipt-designer-row">
      <div className="receipt-designer-row-head">
        <Switch
          size="small"
          checked={block.on}
          disabled={FORCED_BLOCKS.includes(key)}
          onChange={(on) => dispatch({ type: 'toggle', key, on })}
          aria-label={label}
        />
        <span className="receipt-designer-label">{label}</span>
        <Button
          size="small"
          disabled={isFirst}
          aria-label={`Đưa ${label} lên`}
          onClick={() => dispatch({ type: 'move', key, delta: -1 })}
        >
          ↑
        </Button>
        <Button
          size="small"
          disabled={isLast}
          aria-label={`Đưa ${label} xuống`}
          onClick={() => dispatch({ type: 'move', key, delta: 1 })}
        >
          ↓
        </Button>
      </div>
      {'text' in block && (
        <Input
          size="small"
          value={block.text}
          maxLength={TEXT_MAX_LENGTH}
          onChange={(event) =>
            dispatch({ type: 'text', key, text: event.target.value })
          }
        />
      )}
      {key === 'items' && (
        <Radio.Group
          size="small"
          options={ITEMS_STYLE_OPTIONS}
          value={block.style}
          onChange={(event) =>
            dispatch({ type: 'itemsStyle', style: event.target.value })
          }
        />
      )}
      {key === 'qr' && extra.bankMissing && (
        <Typography.Text type="warning" className="receipt-designer-hint">
          Nhập tài khoản ngân hàng ở mục Cửa hàng
        </Typography.Text>
      )}
      {key === 'logo' && (
        <LogoBlockControls
          logo={extra.logo}
          onPick={extra.onPickLogo}
          onRemove={() => dispatch({ type: 'logo', logo: '' })}
        />
      )}
    </div>
  );
};

export default DesignerBlockRow;
