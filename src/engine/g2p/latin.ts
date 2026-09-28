/**
 * How a written Latin word is said, in classical pronunciation: its sounds, syllables and stress.
 * Latin spelling is regular enough for rules to get this right, except for vowel length, which
 * ordinary texts don't mark; every vowel is taken as short, so stress can land a syllable early.
 */
import { stressOf, type Syllable, type WordSounds } from '../sounds/system';

const VOWEL_LETTERS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
const VOWEL_SOUNDS = new Set(['a', 'e', 'i', 'o', 'u', 'ae', 'au', 'oe']);
/** Consonant pairs that start a syllable together: "pa-trem", "ce-le-bris". */
const ONSET_PAIRS = /^[pbtdkgf][rl]$/;

function sounds(word: string): string[] {
  const letters = word
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z]/g, '');
  const vowel = (i: number) => VOWEL_LETTERS.has(letters[i] ?? '');
  const out: string[] = [];
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const pair = letter + (letters[i + 1] ?? '');
    if (pair === 'qu') {
      out.push('kw');
      i++;
    } else if (letter === 'g' && letters[i + 1] === 'u' && letters[i - 1] === 'n' && vowel(i + 2)) {
      out.push('gw'); // sanguis
      i++;
    } else if (pair === 'ch' || pair === 'ph' || pair === 'th' || pair === 'rh') {
      out.push({ ch: 'k', ph: 'f', th: 't', rh: 'r' }[pair]!);
      i++;
    } else if (pair === 'ae' || pair === 'au' || pair === 'oe') {
      out.push(pair);
      i++;
    } else if (letter === 'x') {
      out.push('k', 's');
    } else if (letter === 'c' || letter === 'k') {
      out.push('k');
    } else if (letter === 'v') {
      out.push('w');
    } else if (letter === 'j' || (letter === 'i' && vowel(i + 1) && (i === 0 || VOWEL_SOUNDS.has(out[out.length - 1])))) {
      out.push('j'); // iam, eius, maior; but not quia, where the u belongs to qu
    } else if (letter === 'y') {
      out.push('i');
    } else {
      out.push(letter);
    }
  }
  return out;
}

/** Sounds grouped into syllables: one consonant between vowels starts the next syllable, as do "tr", "pl". */
export function syllabify(list: readonly string[]): Syllable[] {
  const nuclei = list.flatMap((sound, i) => (VOWEL_SOUNDS.has(sound) ? [i] : []));
  if (nuclei.length === 0) return [{ onset: [...list], nucleus: 'ə', coda: [] }];
  const syllables: Syllable[] = nuclei.map((at) => ({ onset: [], nucleus: list[at], coda: [] }));
  syllables[0].onset = list.slice(0, nuclei[0]);
  for (let n = 0; n < nuclei.length - 1; n++) {
    const between = list.slice(nuclei[n] + 1, nuclei[n + 1]);
    const next = between.length >= 2 && ONSET_PAIRS.test(between.slice(-2).join('')) ? 2 : Math.min(1, between.length);
    syllables[n].coda = between.slice(0, between.length - next);
    syllables[n + 1].onset = between.slice(between.length - next);
  }
  syllables[syllables.length - 1].coda = list.slice(nuclei[nuclei.length - 1] + 1);
  return syllables;
}

export function pronounceLatin(word: string): WordSounds {
  const syllables = syllabify(sounds(word));
  return { syllables, stress: stressOf('latin', syllables) };
}
