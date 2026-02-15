import { Button, Input, Space } from 'antd';

const InvoiceSearchBar = ({
  searchKeyword,
  onSearchKeywordChange,
  onPressEnter,
  onOpenSearch,
  onPrint,
  onShowTemplate,
  filteredQuick,
  onQuickSelect,
  showInput = false,
  inputPlaceholder = 'Gõ mã hoặc tên hàng...',
  showPrint = true,
  printLabel = 'In A4',
  searchLabel = 'Tìm kiếm',
  disabled = false,
}) => (
  <div className="pos-search">
    <Space wrap>
      {showInput && (
        <Input
          placeholder={inputPlaceholder}
          value={searchKeyword}
          onChange={(event) => onSearchKeywordChange(event.target.value)}
          onPressEnter={onPressEnter}
          style={{ minWidth: 260 }}
          disabled={disabled}
        />
      )}
      <Button size="large" onClick={onOpenSearch} disabled={disabled}>
        {searchLabel}
      </Button>
      {showPrint && onPrint && (
        <Button size="large" onClick={onPrint}>
          {printLabel}
        </Button>
      )}
      {/* <Button size="large" onClick={onShowTemplate}>
        Mẫu hóa đơn
      </Button> */}
    </Space>
    {!disabled && filteredQuick.length > 0 && (
      <div className="pos-quick-list">
        {filteredQuick.map((item) => (
          <button
            key={item.id}
            type="button"
            className="product-option"
            onClick={() => onQuickSelect(item.id)}
          >
            <div><strong>{item.name}</strong></div>
            <div>{item.code || '---'} · {item.unit}</div>
          </button>
        ))}
      </div>
    )}
  </div>
);

export default InvoiceSearchBar;
