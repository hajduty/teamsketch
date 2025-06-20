import { useRef } from 'react';

export function useIsDoubleClick(delay = 300) {
  const lastClickTime = useRef<number | null>(null);

  return () => {
    const now = Date.now();
    const isDouble = lastClickTime.current && now - lastClickTime.current < delay;
    lastClickTime.current = isDouble ? null : now; // Reset if double-click detected
    return isDouble;
  };
}