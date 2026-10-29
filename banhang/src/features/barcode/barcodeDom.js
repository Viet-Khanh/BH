// DOM helpers for scanning and barcode shortcuts.

// True while an Ant Design modal is visible (scanning and F4 then leave the keyboard alone).
export const isModalOpen = () =>
  Array.from(document.querySelectorAll('.ant-modal-wrap')).some(
    (node) => node.style.display !== 'none'
  );

const isField = (node) =>
  node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement;

// The focused text field and its current value, or null.
export const getFocusedField = () => {
  const node = document.activeElement;
  return isField(node) ? { node, value: node.value } : null;
};

// Puts back a field's value (React-controlled inputs need the native setter + input event).
export const restoreField = (snapshot) => {
  if (!snapshot || !isField(snapshot.node)) return;
  if (snapshot.node.value === snapshot.value) return;
  const proto = Object.getPrototypeOf(snapshot.node);
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(
    snapshot.node,
    snapshot.value
  );
  snapshot.node.dispatchEvent(new Event('input', { bubbles: true }));
};
