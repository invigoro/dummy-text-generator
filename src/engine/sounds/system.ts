/**
 * A language's sound system: which sounds it uses and how often, how they make syllables, and
 * where the stress falls. Languages write these as short "item:weight" lists; this module turns
 * them into something the generator can draw from.
 */
import { randomInt, type Random } from '../rng';
import { normalizeSound, phoneme } from './phonemes';

/** A syllable: the consonants before its vowel, the vowel, and the consonants after. */
export interface Syllable {
  onset: string[];
  nucleus: string;
  coda: string[];
}

/** A word as sounds. `stress` is the stressed syllable, or null where stress belongs to the phrase. */
export interface WordSounds {
  syllables: Syllable[];
  stress: number | null;
  /** The stress is not where the rule puts it, and the spelling marks it with an accent. */
  marked?: boolean;
}

/**
 * Where stress falls: on a word's first, second-to-last or last syllable; on the last syllable of
 * each phrase, as in French; by the Latin rule (the second-to-last syllable if it's heavy,
 * otherwise the one before); or by the Spanish rule (second-to-last after a vowel, n or s,
 * otherwise last).
 */
export type StressRule = 'initial' | 'penultimate' | 'final' | 'phrase' | 'latin' | 'spanish';

export interface SoundsDef {
  /**
   * Named classes of sounds, as "sound:weight" lists. A weight of 1 can be left off, and "+" joins
   * sounds into one item: { C: 'p:3 t:5 k', F: 's:4 n+t' }.
   */
  classes: Readonly<Record<string, string>>;
  /** Syllable shapes, one class name per letter, with weights: 'CV:6 CVC:2 V'. */
  syllables: string;
  /** Shapes for a word's first syllable, if different. */
  first?: string;
  /** Shapes for the last syllable of a longer word, if different. This is where word endings come from. */
  last?: string;
  /** Shapes for a word of one syllable, if different. */
  single?: string;
  stress: StressRule;
  /**
   * Some words stressed elsewhere, as Spanish "árbol" or Italian "tavola" and "città" are. `to`
   * lists where the stress may move; `marked` says which moves the spelling shows with an accent
   * (Spanish marks all of them, Italian only a stressed last syllable).
   */
  irregularStress?: { chance: number; to: readonly ('final' | 'antepenultimate')[]; marked: 'all' | 'final' | 'none' };
  /** Whether a syllable may end in a vowel with the next beginning with one ("de-us"). */
  hiatus?: boolean;
  /**
   * Sound sequences to avoid, as regular expressions over the word's sounds written with a dot
   * between syllables. 'ə[^.]*$' avoids a schwa in the last syllable.
   */
  avoid?: readonly string[];
  /** The most syllables a word gets. */
  maxSyllables?: number;
}

export interface WeightedList<T> {
  items: readonly T[];
  /** Running totals of the weights, for picking. */
  cumulative: readonly number[];
}

interface SoundClass {
  sounds: WeightedList<string[]>;
  vowels: boolean;
}

export interface SoundSystem {
  classes: ReadonlyMap<string, SoundClass>;
  syllables: WeightedList<string[]>;
  first: WeightedList<string[]>;
  last: WeightedList<string[]>;
  single: WeightedList<string[]>;
  stress: StressRule;
  irregularStress?: SoundsDef['irregularStress'];
  hiatus: boolean;
  avoid: readonly RegExp[];
  maxSyllables: number;
}

/** "a:3 b c:0.5" as items and weights. */
export function parseWeights(list: string): { item: string; weight: number }[] {
  return list
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((entry) => {
      const colon = entry.lastIndexOf(':');
      if (colon <= 0) return { item: entry, weight: 1 };
      const weight = Number(entry.slice(colon + 1));
      if (!(weight > 0)) throw new Error(`Bad weight in "${entry}"`);
      return { item: entry.slice(0, colon), weight };
    });
}

export function weighted<T>(entries: readonly { item: T; weight: number }[]): WeightedList<T> {
  if (entries.length === 0) throw new Error('A weighted list needs at least one item');
  let total = 0;
  return { items: entries.map((entry) => entry.item), cumulative: entries.map((entry) => (total += entry.weight)) };
}

export function pick<T>(list: WeightedList<T>, random: Random): T {
  const { items, cumulative } = list;
  if (items.length === 1) return items[0];
  const target = random() * cumulative[cumulative.length - 1];
  let low = 0;
  let high = cumulative.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (cumulative[mid] > target) high = mid;
    else low = mid + 1;
  }
  return items[low];
}

/** An item picked with equal odds, for when weights don't matter. */
export const pickAny = <T>(items: readonly T[], random: Random): T => items[randomInt(random, items.length)];

export function compileSounds(def: SoundsDef): SoundSystem {
  const classes = new Map<string, SoundClass>();
  for (const [name, list] of Object.entries(def.classes)) {
    if (!/^\p{Lu}$/u.test(name)) throw new Error(`Class names are single capital letters, not "${name}"`);
    const entries = parseWeights(list).map(({ item, weight }) => ({ item: item.split('+').map(normalizeSound), weight }));
    const types = new Set(entries.flatMap(({ item }) => item.map((sound) => phoneme(sound).type)));
    if (types.size !== 1) throw new Error(`Class ${name} mixes vowels and consonants`);
    if (types.has('vowel') && entries.some(({ item }) => item.length > 1)) throw new Error(`Class ${name} joins vowels; use a diphthong`);
    classes.set(name, { sounds: weighted(entries), vowels: types.has('vowel') });
  }

  const shapes = (list: string) =>
    weighted(
      parseWeights(list).map(({ item, weight }) => {
        const names = [...item];
        for (const name of names) if (!classes.has(name)) throw new Error(`Shape "${item}" uses unknown class ${name}`);
        if (names.filter((name) => classes.get(name)!.vowels).length !== 1) throw new Error(`Shape "${item}" needs exactly one vowel class`);
        return { item: names, weight };
      }),
    );

  const syllables = shapes(def.syllables);
  return {
    classes,
    syllables,
    first: def.first ? shapes(def.first) : syllables,
    last: def.last ? shapes(def.last) : syllables,
    single: def.single ? shapes(def.single) : syllables,
    stress: def.stress,
    irregularStress: def.irregularStress,
    hiatus: def.hiatus ?? false,
    avoid: (def.avoid ?? []).map((pattern) => new RegExp(pattern, 'u')),
    maxSyllables: def.maxSyllables ?? 5,
  };
}

/** The word's sounds with a dot between syllables, as `avoid` patterns see them. */
export function soundString(word: WordSounds): string {
  return word.syllables.map((syllable) => [...syllable.onset, syllable.nucleus, ...syllable.coda].join('')).join('.');
}

export function isHeavy(syllable: Syllable): boolean {
  return syllable.coda.length > 0 || !!phoneme(syllable.nucleus).long;
}

/** The stressed syllable under a rule, or null for stress that belongs to the phrase. */
export function stressOf(rule: StressRule, syllables: readonly Syllable[]): number | null {
  const n = syllables.length;
  switch (rule) {
    case 'initial':
      return 0;
    case 'penultimate':
      return Math.max(0, n - 2);
    case 'final':
      return n - 1;
    case 'phrase':
      return null;
    case 'latin':
      if (n <= 2) return 0;
      return isHeavy(syllables[n - 2]) ? n - 2 : n - 3;
    case 'spanish': {
      const coda = syllables[n - 1].coda;
      const last = coda[coda.length - 1];
      return coda.length === 0 || last === 'n' || last === 's' ? Math.max(0, n - 2) : n - 1;
    }
  }
}
