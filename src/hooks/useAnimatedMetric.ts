import { useEffect, useState } from 'react';

type Options = {
  end: number;
  duration?: number;
  decimals?: number;
  enabled?: boolean;
};

export function useAnimatedMetric({ end, duration = 1400, decimals = 0, enabled = true }: Options) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(end * eased);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, duration, enabled]);

  return formatAnimatedMetric(value, decimals);
}

export function formatAnimatedMetric(n: number, decimals = 0): string {
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
