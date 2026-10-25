import { useEffect } from 'react';

// F1 adds the pending product while the modal is active.
export const useAddShortcut = ({ enabled, onAdd }) => {
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event) => {
      if (event.key !== 'F1') return;
      event.preventDefault();
      onAdd();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onAdd]);
};
