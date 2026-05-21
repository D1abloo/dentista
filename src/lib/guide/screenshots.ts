import type { GuideScreenshot, GuideSection, GuideStep } from '@/lib/guide/types';

export const guideMobile = (name: string) => `/images/guides/mobile/${name}.png`;

export function resolveStepScreenshot(section: GuideSection, step: GuideStep, stepIndex: number): GuideScreenshot | null {
  if (step.shot) {
    const src = step.shot.startsWith('/') ? step.shot : guideMobile(step.shot);
    const existing = section.screenshots.find((s) => s.src === src);
    if (existing) return existing;
    return {
      src,
      alt: step.title,
      caption: section.screenshots.find((s) => s.src === src)?.caption ?? ''
    };
  }
  return section.screenshots[stepIndex] ?? section.screenshots[0] ?? null;
}
