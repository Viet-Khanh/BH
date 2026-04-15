const InvoicePreview = ({ html }) => {
  return (
    <div
      className="preview-box"
      id="print-area"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default InvoicePreview;
