import { useRef, useState } from 'react';

const MIN_HEIGHT_PX = 120;

// True-size preview: an isolated document (receipt CSS must not leak into the app)
// as wide as the paper; height follows the content.
const ReceiptPreview = ({ html, widthMm }) => {
  const frameRef = useRef(null);
  const [height, setHeight] = useState(MIN_HEIGHT_PX);

  const fitHeight = () => {
    const root = frameRef.current?.contentDocument?.documentElement;
    if (root) setHeight(Math.max(MIN_HEIGHT_PX, root.scrollHeight));
  };

  return (
    <iframe
      ref={frameRef}
      title="Xem trước hoá đơn"
      className="receipt-preview"
      sandbox="allow-same-origin"
      srcDoc={html}
      onLoad={fitHeight}
      style={{ width: `${widthMm}mm`, height }}
    />
  );
};

export default ReceiptPreview;
