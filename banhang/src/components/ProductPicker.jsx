import { useMemo, useState } from 'react';
import { Input } from 'antd';
import { hasSearchMatch, normalizeSearchText } from '../utils/searchText.js';

const ProductPicker = ({
  products = [],
  value,
  onChange,
  keyword: keywordProp,
  onKeywordChange,
  inputRef,
  showStock = false,
}) => {
  const [keyword, setKeyword] = useState('');
  const searchValue = keywordProp !== undefined ? keywordProp : keyword;

  const activeProducts = useMemo(
    () => products.filter((item) => !item.isDeleted),
    [products]
  );

  const filtered = useMemo(() => {
    const key = normalizeSearchText(searchValue);
    if (!key) return activeProducts.slice(0, 20);
    return activeProducts
      .filter((item) => hasSearchMatch(item, key))
      .slice(0, 20);
  }, [searchValue, activeProducts]);

  const handleKeywordChange = (event) => {
    const next = event.target.value;
    if (onKeywordChange) onKeywordChange(next);
    if (keywordProp === undefined) setKeyword(next);
  };

  const formatStock = (item) => {
    const rawStock = Number(item?.stock ?? item?.openingStock ?? 0);
    if (!Number.isFinite(rawStock)) return '0';
    return rawStock.toLocaleString('vi-VN');
  };

  return (
    <div className="product-picker">
      <Input
        ref={inputRef}
        size="large"
        placeholder="Gõ tên sản phẩm..."
        value={searchValue}
        onChange={handleKeywordChange}
      />
      <div className="product-picker-list">
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`product-option ${value === item.id ? 'active' : ''}`}
            onClick={() => onChange(item.id)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <div><strong>{item.name}</strong></div>
              <div>
                {item.code || '---'} · {item.group} · {item.unit}
              </div>
            </div>
            <div>
              {showStock ? `Tồn: ${formatStock(item)}` : ''}
            </div>
          </button>
        ))}
        {!filtered.length && <div>Không tìm thấy sản phẩm.</div>}
      </div>
    </div>
  );
};

export default ProductPicker;
