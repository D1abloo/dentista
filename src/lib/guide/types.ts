export type GuideScreenshot = {
  src: string;
  alt: string;
  caption: string;
};

export type GuideStep = {
  title: string;
  detail: string;
};

export type GuideSection = {
  id: string;
  title: string;
  summary: string;
  goal: string;
  audience: string;
  prerequisites?: string[];
  screenshots: GuideScreenshot[];
  steps: GuideStep[];
  tips?: string[];
  warnings?: string[];
  related?: { label: string; href: string }[];
};

export type HelpAudience = 'patient' | 'admin';

export type HelpFaq = {
  id: string;
  audience: HelpAudience | 'all';
  question: string;
  answer: string;
};

export type HelpQuickLink = {
  id: string;
  label: string;
  description: string;
  href: string;
  external?: boolean;
};

export type HelpAudienceMeta = {
  id: HelpAudience;
  label: string;
  hash: string;
  description: string;
};
