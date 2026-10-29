// Enter prints from anywhere in the label modal, except where Enter already means something:
// a focused button/switch (it clicks itself) or an open select (it prevents the default).
export const isPrintEnterKey = (event) =>
  event?.key === 'Enter' &&
  !event.defaultPrevented &&
  !event.repeat &&
  !event.isComposing &&
  !event.ctrlKey &&
  !event.altKey &&
  !event.metaKey &&
  event.target?.tagName !== 'BUTTON';
