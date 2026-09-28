/**
 * Every sound a language can use, written in IPA, with what the "say it" line writes for it. The
 * respellings follow Wikipedia's style for English readers: "ah" as in father, "ay" as in say,
 * "zh" as in measure, "kh" as in Scottish loch.
 */

export interface Phoneme {
  type: 'consonant' | 'vowel';
  /** How an English reader would spell it. For a vowel, in a syllable that ends with it. */
  say: string;
  /** A vowel's spelling in a syllable closed by a consonant, if different: "e" (bet), not "eh". */
  sayClosed?: string;
  /** A vowel's spelling when nothing comes before it in its syllable, if different: "eye", not "y". */
  sayAlone?: string;
  /** A vowel said with the tongue forward (i, e, y…). "g" before it would be read as "j". */
  front?: boolean;
  /** A long vowel or a diphthong, which makes a syllable heavy for Latin-style stress. */
  long?: boolean;
  /** A consonant made with the lips. French writes "m" rather than "n" before one ("tomber"). */
  labial?: boolean;
}

const vowel = (say: string, extra: Omit<Phoneme, 'type' | 'say'> = {}): Phoneme => ({ type: 'vowel', say, ...extra });
const consonant = (say: string, extra: Omit<Phoneme, 'type' | 'say'> = {}): Phoneme => ({ type: 'consonant', say, ...extra });

/** "eye" alone, "y" after a consonant (sky), "igh" before one (night). */
const EYE = { sayAlone: 'eye', sayClosed: 'igh', long: true } as const;

export const PHONEMES: Readonly<Record<string, Phoneme>> = {
  // Vowels
  a: vowel('ah'),
  aː: vowel('ah', { long: true }),
  ɑ: vowel('ah'),
  ɑː: vowel('ah', { long: true }),
  æ: vowel('a'),
  e: vowel('ay', { front: true }),
  eː: vowel('ay', { front: true, long: true }),
  ɛ: vowel('eh', { sayClosed: 'e', front: true }),
  ɛː: vowel('eh', { sayClosed: 'e', front: true, long: true }),
  ə: vowel('uh'),
  i: vowel('ee', { front: true }),
  iː: vowel('ee', { front: true, long: true }),
  ɪ: vowel('ih', { sayClosed: 'i', front: true }),
  o: vowel('oh'),
  oː: vowel('oh', { long: true }),
  ɔ: vowel('aw', { sayClosed: 'o' }),
  ɔː: vowel('aw', { long: true }),
  u: vowel('oo'),
  uː: vowel('oo', { long: true }),
  ʊ: vowel('uu'),
  y: vowel('ew', { front: true }),
  yː: vowel('ew', { front: true, long: true }),
  ø: vowel('uh', { front: true }),
  øː: vowel('uh', { front: true, long: true }),
  œ: vowel('uh', { front: true }),
  ʌ: vowel('uh', { sayClosed: 'u' }),
  ɐ: vowel('uh'),
  ɨ: vowel('ih'),
  ɯ: vowel('oo'),
  // Nasal vowels: said through the nose, without finishing the n.
  ɑ̃: vowel('ahn'),
  ɔ̃: vowel('ohn'),
  ɛ̃: vowel('an', { front: true }),
  œ̃: vowel('uhn'),
  // Diphthongs
  aɪ: vowel('y', EYE),
  ae: vowel('y', EYE),
  aʊ: vowel('ow', { long: true }),
  au: vowel('ow', { long: true }),
  ɔɪ: vowel('oy', { long: true }),
  oe: vowel('oy', { long: true }),
  eɪ: vowel('ay', { front: true, long: true }),
  ei: vowel('ay', { front: true, long: true }),
  ey: vowel('ay', { front: true, long: true }),
  oʊ: vowel('oh', { long: true }),
  // French "oi".
  wa: vowel('wah'),

  // Consonants
  p: consonant('p', { labial: true }),
  b: consonant('b', { labial: true }),
  t: consonant('t'),
  d: consonant('d'),
  k: consonant('k'),
  g: consonant('g'),
  q: consonant('k'),
  ʔ: consonant("'"),
  f: consonant('f', { labial: true }),
  v: consonant('v', { labial: true }),
  θ: consonant('th'),
  ð: consonant('dh'),
  s: consonant('s'),
  z: consonant('z'),
  ʃ: consonant('sh'),
  ʒ: consonant('zh'),
  x: consonant('kh'),
  χ: consonant('kh'),
  ɣ: consonant('gh'),
  ʁ: consonant('r'),
  h: consonant('h'),
  ħ: consonant('h'),
  ç: consonant('kh'),
  m: consonant('m', { labial: true }),
  n: consonant('n'),
  ɲ: consonant('ny'),
  ŋ: consonant('ng'),
  l: consonant('l'),
  ʎ: consonant('ly'),
  ɬ: consonant('hl'),
  r: consonant('r'),
  ɾ: consonant('r'),
  ɹ: consonant('r'),
  j: consonant('y'),
  w: consonant('w', { labial: true }),
  ɥ: consonant('w'),
  tʃ: consonant('ch'),
  dʒ: consonant('j'),
  ts: consonant('ts'),
  dz: consonant('dz'),
  pf: consonant('pf', { labial: true }),
  kw: consonant('kw'),
  gw: consonant('gw'),
  β: consonant('v', { labial: true }),
  ɸ: consonant('f', { labial: true }),
};

export function phoneme(symbol: string): Phoneme {
  const found = PHONEMES[symbol];
  if (!found) throw new Error(`Unknown sound "${symbol}"`);
  return found;
}

export const isVowel = (symbol: string) => PHONEMES[symbol]?.type === 'vowel';
