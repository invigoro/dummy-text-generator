import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../rng';
import { isVowel, phoneme, PHONEMES } from './phonemes';
import { compileSounds, parseWeights, pick, soundString, stressOf, weighted, type SoundsDef, type Syllable } from './system';
import { inventWord } from './words';

const def: SoundsDef = {
  classes: { C: 'p:3 t:3 k:2 s m n l', V: 'a:3 e i o u', F: 'n s', L: 'l' },
  syllables: 'CV:6 CVF:2 CLV',
  first: 'CV:3 V',
  last: 'CVF:3 CV',
  stress: 'penultimate',
  avoid: ['aa', 'n\\.n'],
};
const system = compileSounds(def);

describe('phonemes', () => {
  it('give every sound a respelling', () => {
    for (const [symbol, sound] of Object.entries(PHONEMES)) expect(sound.say, symbol).toMatch(/^[a-z']+$/);
  });

  it('take a vowel marked for its tone as the vowel, and a nasal one as the vowel with an n', () => {
    expect(phoneme('á')).toEqual(phoneme('a'));
    expect(phoneme('íː')).toEqual(phoneme('iː'));
    expect(phoneme('ã')).toMatchObject({ type: 'vowel', say: 'ahn' });
    expect(phoneme('ɪ̃́')).toMatchObject({ say: 'ihn', sayClosed: 'in' });
    expect(phoneme('ã́ː')).toMatchObject({ say: 'ahn', long: true });
    expect(isVowel('ṍ')).toBe(true);
    // Only vowels carry tone.
    expect(() => phoneme('ń')).toThrow('Unknown sound');
  });
});

describe('parseWeights', () => {
  it('reads items with optional weights', () => {
    expect(parseWeights(' a:3  b c:0.5 ')).toEqual([
      { item: 'a', weight: 3 },
      { item: 'b', weight: 1 },
      { item: 'c', weight: 0.5 },
    ]);
  });

  it('refuses a weight that is not a positive number', () => {
    expect(() => parseWeights('a:0')).toThrow(/a:0/);
    expect(() => parseWeights('a:x')).toThrow(/a:x/);
  });
});

describe('pick', () => {
  it('follows the weights', () => {
    const list = weighted([
      { item: 'common', weight: 9 },
      { item: 'rare', weight: 1 },
    ]);
    const random = mulberry32(4);
    const picks = Array.from({ length: 5000 }, () => pick(list, random));
    const share = picks.filter((item) => item === 'rare').length / picks.length;
    expect(share).toBeGreaterThan(0.07);
    expect(share).toBeLessThan(0.13);
  });
});

describe('compileSounds', () => {
  it('rejects unknown sounds, mixed classes and shapes without one vowel', () => {
    expect(() => compileSounds({ ...def, classes: { ...def.classes, C: 'p qq' } })).toThrow(/qq/);
    expect(() => compileSounds({ ...def, classes: { ...def.classes, C: 'p a' } })).toThrow(/mixes/);
    expect(() => compileSounds({ ...def, syllables: 'CC' })).toThrow(/vowel/);
    expect(() => compileSounds({ ...def, syllables: 'CVX' })).toThrow(/unknown class X/);
    expect(() => compileSounds({ ...def, classes: { ...def.classes, V: 'a+i' } })).toThrow(/diphthong/);
  });

  it('joins sounds with + into one item', () => {
    const joined = compileSounds({ ...def, classes: { ...def.classes, F: 'n+t' }, syllables: 'CVF', first: 'CVF', last: 'CVF' });
    const word = inventWord(joined, mulberry32(1), { syllables: 1 });
    expect(word.syllables[0].coda).toEqual(['n', 't']);
  });
});

describe('inventWord', () => {
  const words = Array.from({ length: 500 }, (_, seed) => inventWord(system, mulberry32(seed), { syllables: 1 + (seed % 4) }));

  it('gives the same word for the same seed', () => {
    expect(inventWord(system, mulberry32(77), { syllables: 3 })).toEqual(inventWord(system, mulberry32(77), { syllables: 3 }));
  });

  it('gives as many syllables as asked for, up to the maximum', () => {
    words.forEach((word, seed) => expect(word.syllables).toHaveLength(1 + (seed % 4)));
    expect(inventWord(compileSounds({ ...def, maxSyllables: 2 }), mulberry32(1), { syllables: 9 }).syllables).toHaveLength(2);
  });

  it('uses the shapes for first and last syllables', () => {
    for (const word of words.filter((w) => w.syllables.length > 1)) {
      expect(word.syllables[0].coda).toEqual([]);
      expect(word.syllables.at(-1)!.onset).toHaveLength(1);
    }
  });

  it('avoids the patterns it’s told to, repeated syllables and vowels meeting', () => {
    for (const word of words) {
      const sounds = soundString(word);
      expect(sounds).not.toMatch(/aa|n\.n/);
      const parts = sounds.split('.');
      parts.slice(1).forEach((part, i) => expect(part).not.toBe(parts[i]));
      word.syllables.slice(1).forEach((syllable, i) => {
        expect(word.syllables[i].coda.length + syllable.onset.length).toBeGreaterThan(0);
      });
    }
  });

  it('can start with a vowel', () => {
    for (let seed = 0; seed < 50; seed++) expect(inventWord(system, mulberry32(seed), { syllables: 2, vowelFirst: true }).syllables[0].onset).toEqual([]);
  });

  it('marks the stress by the language’s rule', () => {
    for (const word of words) expect(word.stress).toBe(Math.max(0, word.syllables.length - 2));
  });

  it('sometimes stresses a word elsewhere, and marks it if the language writes that', () => {
    const irregular = compileSounds({ ...def, irregularStress: { chance: 1, to: ['final'], marked: 'final' } });
    const word = inventWord(irregular, mulberry32(4), { syllables: 3 });
    expect(word.stress).toBe(2);
    expect(word.marked).toBe(true);
    const unmarked = compileSounds({ ...def, irregularStress: { chance: 1, to: ['antepenultimate'], marked: 'final' } });
    const other = inventWord(unmarked, mulberry32(4), { syllables: 3 });
    expect(other.stress).toBe(0);
    expect(other.marked).toBe(false);
  });

  it('never moves the stress of a one-syllable word', () => {
    const irregular = compileSounds({ ...def, irregularStress: { chance: 1, to: ['final', 'antepenultimate'], marked: 'all' } });
    expect(inventWord(irregular, mulberry32(4), { syllables: 1 }).marked).toBeUndefined();
  });
});

describe('stressOf', () => {
  const open = (nucleus = 'a'): Syllable => ({ onset: ['t'], nucleus, coda: [] });
  const closed: Syllable = { onset: ['t'], nucleus: 'a', coda: ['n'] };

  it('puts stress first, second to last, last, or on the phrase', () => {
    const three = [open(), open(), open()];
    expect(stressOf('initial', three)).toBe(0);
    expect(stressOf('penultimate', three)).toBe(1);
    expect(stressOf('final', three)).toBe(2);
    expect(stressOf('phrase', three)).toBeNull();
  });

  it('follows the Spanish rule: second-to-last after a vowel, n or s, otherwise last', () => {
    const ending = (coda: string[]): Syllable => ({ onset: ['t'], nucleus: 'a', coda });
    expect(stressOf('spanish', [open(), ending([])])).toBe(0);
    expect(stressOf('spanish', [open(), ending(['n'])])).toBe(0);
    expect(stressOf('spanish', [open(), ending(['s'])])).toBe(0);
    expect(stressOf('spanish', [open(), ending(['r'])])).toBe(1);
  });

  it('follows the Latin rule: a heavy second-to-last syllable, otherwise the one before', () => {
    expect(stressOf('latin', [open(), closed, open()])).toBe(1);
    expect(stressOf('latin', [open(), open('aː'), open()])).toBe(1);
    expect(stressOf('latin', [open(), open(), open(), open()])).toBe(1);
    expect(stressOf('latin', [open(), open()])).toBe(0);
  });
});
