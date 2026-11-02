export const CRITERIA = [
  { key: 'clarity',            label: 'Clarity' },
  { key: 'marketability',      label: 'Marketability' },
  { key: 'distinctiveness',    label: 'Distinctiveness' },
  { key: 'emotionalResonance', label: 'Emotional Resonance' },
  { key: 'extensibility',      label: 'Extensibility' },
];

// Network observations never affect the subjective ranking.
export const SIGNALS = [
  ...CRITERIA,
  { key: 'likability',   label: 'Likability (computed)' },
];

export const DEFAULT_WEIGHTS = {
  clarity: 1.0,
  marketability: 1.3,
  distinctiveness: 1.2,
  emotionalResonance: 0.9,
  extensibility: 1.2,
  likability: 1.5,
};


export const DEFAULT_OBJECTIVE = 'Choose a clear, memorable name for a new product. Compare the shortlisted ideas and suggest one refinement for each.';
export const initialIdeas = [
  { id: 'sample-1', category: 'App Name', name: 'Bright Harbor', description: 'A welcoming name for a planning tool.', grades: { clarity: 8, marketability: 7, distinctiveness: 6, emotionalResonance: 8, extensibility: 7 }, notes: 'Sample idea — replace with your own.', selected: true },
  { id: 'sample-2', category: 'App Name', name: 'Daylight', description: 'A short name that suggests clarity.', grades: { clarity: 8, marketability: 8, distinctiveness: 5, emotionalResonance: 8, extensibility: 8 }, notes: 'Sample idea — replace with your own.', selected: false },
];
