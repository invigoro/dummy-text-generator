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
  /**
   * A double consonant, written with ː: the tt of Italian "gatto" or Finnish "kukka". It starts a
   * syllable, and is said across the break: "GAHT-toh".
   */
  geminate?: boolean;
  /**
   * A soft consonant, said with the tongue raised to the palate, as Russian's are: "ty", "ly". The
   * y is only written before a, o and u; before e and i, and at a syllable's end, it's heard anyway.
   */
  soft?: boolean;
}

const vowel = (say: string, extra: Omit<Phoneme, 'type' | 'say'> = {}): Phoneme => ({ type: 'vowel', say, ...extra });
const consonant = (say: string, extra: Omit<Phoneme, 'type' | 'say'> = {}): Phoneme => ({ type: 'consonant', say, ...extra });

/** "eye" alone, "y" after a consonant (sky), "igh" before one (night). */
const EYE = { sayAlone: 'eye', sayClosed: 'igh', long: true } as const;

const BASE: Readonly<Record<string, Phoneme>> = {
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
  // English: the o of "lot", the ur of "bird".
  ɒ: vowel('o'),
  ɜ: vowel('ur'),
  ɜː: vowel('ur', { long: true }),
  // Finnish ää, Old English ǣ.
  æː: vowel('a', { long: true }),
  // Portuguese nasal vowels and diphthongs: "sim", "bom", "mão", "põe", "mãe".
  ẽ: vowel('ayn', { front: true }),
  ĩ: vowel('een', { front: true }),
  õ: vowel('ohn'),
  ũ: vowel('oon'),
  ɐ̃: vowel('ahn'),
  ɐ̃w̃: vowel('owng', { long: true }),
  õj̃: vowel('oyng', { long: true }),
  ɐ̃j̃: vowel('ayng', { front: true, long: true }),
  // Welsh diphthongs: "cau", "oer", "wyth", "tew", "byw".
  aɨ: vowel('y', EYE),
  ɔɨ: vowel('oy', { long: true }),
  ʊɨ: vowel('wee', { long: true }),
  ɛu: vowel('ehoo', { long: true }),
  ɨu: vowel('ew', { long: true }),
  // Old English "ea" and "eo".
  eɑ: vowel('eah', { long: true }),
  eo: vowel('ayo', { long: true }),
  // Dutch: the u of "bus", and the diphthongs of "wijn", "huis" and "koud".
  ʏ: vowel('uh', { sayClosed: 'u', front: true }),
  ɛi: vowel('ay', { front: true, long: true }),
  œy: vowel('ow', { long: true }),
  ɑu: vowel('ow', { long: true }),

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
  // Dutch h, voiced, and w, between a v and a w.
  ɦ: consonant('h'),
  ʋ: consonant('w', { labial: true }),
  ħ: consonant('h'),
  ʕ: consonant("'"),
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
  // Nahuatl tl, one sound that can start a word or end one: "tlalli", "atl".
  tɬ: consonant('tl'),
  kw: consonant('kw'),
  kʷ: consonant('kw'),
  // Stops with a puff of air after them (Quechua ph, kh; Navajo t, k), said as the plain sound,
  // since English says its own that way; never "ph" or "th", which would read as f and th.
  pʰ: consonant('p', { labial: true }),
  tʰ: consonant('t'),
  kʰ: consonant('k'),
  qʰ: consonant('k'),
  tʃʰ: consonant('ch'),
  tsʰ: consonant('ts'),
  tɬʰ: consonant('tl'),
  // Ejectives, popped with a closed throat (Quechua t’anta, Navajo ch’ah), with an apostrophe.
  pʼ: consonant("p'", { labial: true }),
  tʼ: consonant("t'"),
  kʼ: consonant("k'"),
  qʼ: consonant("k'"),
  tʃʼ: consonant("ch'"),
  tsʼ: consonant("ts'"),
  tɬʼ: consonant("tl'"),
  // Russian's hushing sounds: ш, ж, щ and ч.
  ʂ: consonant('sh'),
  ʐ: consonant('zh'),
  ɕ: consonant('sh'),
  tɕ: consonant('ch'),
  // Arabic's emphatic consonants, said far back with the tongue low: ص, ض, ط, ظ.
  sˤ: consonant('s'),
  dˤ: consonant('d'),
  tˤ: consonant('t'),
  ðˤ: consonant('dh'),
  gw: consonant('gw'),
  β: consonant('v', { labial: true }),
  ɸ: consonant('f', { labial: true }),
};

/** Consonants that can be doubled, as in Italian, Finnish, Old Norse or Arabic. */
const DOUBLED = [
  ...['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'm', 'n', 'l', 'r', 'ɲ', 'ʎ', 'tʃ', 'dʒ', 'ts', 'dz', 'θ', 'ð', 'x', 'j', 'ŋ'],
  ...['q', 'ħ', 'ʕ', 'w', 'sˤ', 'dˤ', 'tˤ'],
];

/** Russian's soft consonants: the ones it has hard, said with the tongue raised to the palate. */
const SOFTENED = ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'm', 'n', 'l', 'r', 'x'];

/** Sound symbols are compared in decomposed form, so "ẽ" matches however it was typed. */
export const normalizeSound = (symbol: string) => symbol.normalize('NFD');

export const PHONEMES: Readonly<Record<string, Phoneme>> = Object.fromEntries([
  ...Object.entries(BASE).map(([symbol, sound]) => [normalizeSound(symbol), sound]),
  ...DOUBLED.map((symbol) => [`${symbol}ː`, { ...BASE[symbol], geminate: true }]),
  ...SOFTENED.map((symbol) => [`${symbol}ʲ`, { ...BASE[symbol], say: `${BASE[symbol].say}y`, soft: true }]),
]);

const HIGH_OR_LOW = /[̀́]/gu;
const NASAL = '̃';

/**
 * A vowel marked for its tone, as Navajo marks a high one ("á"), is said as the vowel is: the
 * "say it" line can't show pitch. A nasal vowel the list doesn't have ("ą", written ã) is the
 * vowel with an n, as the ones it has are.
 */
function marked(symbol: string): Phoneme | undefined {
  const toneless = untoned(symbol);
  if (toneless !== symbol) {
    const found = PHONEMES[toneless] ?? marked(toneless);
    return found?.type === 'vowel' ? found : undefined;
  }
  if (!symbol.includes(NASAL)) return undefined;
  const oral = PHONEMES[symbol.replace(NASAL, '')];
  if (oral?.type !== 'vowel') return undefined;
  const nasal = (say: string | undefined) => say && `${say}n`;
  return { ...oral, say: nasal(oral.say)!, sayClosed: nasal(oral.sayClosed), sayAlone: nasal(oral.sayAlone) };
}

/** A sound without the accents that mark its tone: "á" is "a". */
export const untoned = (symbol: string) => normalizeSound(symbol).replace(HIGH_OR_LOW, '');

export function phoneme(symbol: string): Phoneme {
  const key = normalizeSound(symbol);
  const found = PHONEMES[key] ?? marked(key);
  if (!found) throw new Error(`Unknown sound "${symbol}"`);
  return found;
}

export const isVowel = (symbol: string) => {
  const key = normalizeSound(symbol);
  return (PHONEMES[key] ?? marked(key))?.type === 'vowel';
};

/** A double consonant's single form: "tː" is "t". */
export const single = (symbol: string) => (phoneme(symbol).geminate ? symbol.slice(0, -1) : symbol);
