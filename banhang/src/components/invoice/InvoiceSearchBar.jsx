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
}) => (
  <div className="pos-search">
    <Space wrap>
      {/* <Input
        placeholder="Gõ mã hoặc tên hàng..."
        value={searchKeyword}
        onChange={(event) => onSearchKeywordChange(event.target.value)}
        onPressEnter={onPressEnter}
        style={{ minWidth: 260 }}
      /> */}
      <Button size="large" onClick={onOpenSearch}>
        Tìm kiếm
      </Button>
      <Button size="large" onClick={onPrint}>
        In A4
      </Button>
      {/* <Button size="large" onClick={onShowTemplate}>
        Mẫu hóa đơn
      </Button> */}
    </Space>
    {filteredQuick.length > 0 && (
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
