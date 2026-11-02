import { SIGNALS } from './defaults.js';

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const RARE = new Set(['q', 'x', 'z']);

export function likability(rawName) {
  const name = (rawName || '').toLowerCase();
  const letters = name.replace(/[^a-z]/g, '');
  if (!letters) {
    return { total: 0, breakdown: {}, syllables: 0, letters: 0 };
  }

  const len = letters.length;
  const wordCount = name.trim().split(/[\s\-_]+/).filter(Boolean).length || 1;

  // 1. Length: sweet spot 5-9 characters
  const lengthScore = clamp(10 - Math.abs(len - 7) * 0.9, 1, 10);

  // 2. Vowel balance: ideal ratio ~0.4 (40% vowels)
  const vowelCount = [...letters].filter(c => VOWELS.has(c)).length;
  const vowelRatio = vowelCount / len;
  const vowelBalance = clamp(10 - Math.abs(vowelRatio - 0.4) * 22, 1, 10);

  // 3. Consonant flow: penalize 3+ consonant clusters
  const clusters = (letters.match(/[^aeiou]{3,}/g) || []);
  const clusterPenalty = clusters.reduce((s, c) => s + (c.length - 2) * 1.4, 0);
  const consonantFlow = clamp(10 - clusterPenalty, 1, 10);

  // 4. Syllable rhythm: approximate by counting vowel groups; ideal 2-3
  const syllables = (letters.match(/[aeiouy]+/g) || []).length || 1;
  const syllableRhythm = clamp(10 - Math.abs(syllables - 2.5) * 2.2, 1, 10);

  // 5. Rarity penalty: q/x/z are memorable but can feel forced when piled on
  const rareCount = [...letters].filter(c => RARE.has(c)).length;
  const rarityScore = clamp(10 - Math.max(0, rareCount - 1) * 2.5, 1, 10);

  // 6. Memorability: alliteration + first-letter repetition + rhyme tail
  const first = letters[0];
  const firstRepeats = [...letters].filter(c => c === first).length;
  const words = name.trim().toLowerCase().split(/[\s\-_]+/).filter(Boolean);
  const alliteration = words.length > 1 && words.every(w => w[0] === words[0][0]) ? 2 : 0;
  const tail = letters.slice(-2);
  const tailRepeats = (letters.match(new RegExp(tail, 'g')) || []).length;
  const memorability = clamp(4 + firstRepeats * 0.6 + alliteration + (tailRepeats > 1 ? 1.5 : 0), 1, 10);

  // 7. Simplicity: one-word preferred, fewer hyphens/spaces
  const simplicity = clamp(10 - (wordCount - 1) * 2.2 - (name.includes('-') ? 1 : 0), 1, 10);

  // 8. Phonetic openness: ends on vowel or liquid consonant (l, r, n, m, y)
  const lastChar = letters[len - 1];
  const open = VOWELS.has(lastChar) || 'lrnmy'.includes(lastChar);
  const phonetic = open ? 9 : 6;

  const breakdown = {
    length: round1(lengthScore),
    vowelBalance: round1(vowelBalance),
    consonantFlow: round1(consonantFlow),
    syllableRhythm: round1(syllableRhythm),
    letterRarity: round1(rarityScore),
    memorability: round1(memorability),
    simplicity: round1(simplicity),
    phoneticOpenness: round1(phonetic),
  };

  const total = round1(
    Object.values(breakdown).reduce((a, b) => a + b, 0) / Object.keys(breakdown).length
  );

  return { total, breakdown, syllables, letters: len };
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
export function round1(n) { return Math.round(n * 10) / 10; }


export function scoreIdea(idea, weights) {
  const signals = { ...idea.grades, likability: likability(idea.name).total };
  let total = 0;
  let maximum = 0;
  for (const { key } of SIGNALS) {
    const weight = weights[key] ?? 1;
    total += signals[key] * weight;
    maximum += 10 * weight;
  }
  return maximum ? round1(total / maximum * 100) : 0;
}
