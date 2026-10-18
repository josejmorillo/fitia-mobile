import { useEffect, useRef } from 'react';

/**
 * Pulsación con auto-repetición y aceleración: el primer paso es inmediato y,
 * mientras se mantiene pulsado, se repite cada vez más rápido.
 */
export function useHoldRepeat(onStep: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delay = useRef(350);
  const stepRef = useRef(onStep);

  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  function clear() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function schedule() {
    timer.current = setTimeout(() => {
      stepRef.current();
      delay.current = Math.max(60, Math.round(delay.current * 0.75));
      schedule();
    }, delay.current);
  }

  function start() {
    clear();
    delay.current = 350;
    stepRef.current();
    schedule();
  }

  function stop() {
    clear();
    delay.current = 350;
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { start, stop };
}
