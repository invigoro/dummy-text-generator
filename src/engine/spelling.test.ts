import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';
import type { WordSounds } from './sounds/system';
import { compileSpelling, spell, type SpellingRule } from './spelling';

/** A word from syllables written as "onset.nucleus.coda" with sounds separated by spaces: 'k|a|' */
function word(...syllables: string[]): WordSounds {
  return {
    syllables: syllables.map((syllable) => {
      const [onset, nucleus, coda] = syllable.split('|');
      return { onset: onset.split(' ').filter(Boolean), nucleus, coda: coda.split(' ').filter(Boolean) };
    }),
    stress: null,
  };
}

const rules = compileSpelling([
  { sounds: 'k s', write: 'x' },
  { sounds: 'k', write: 'qu', before: 'front' },
  { sounds: 'k', write: 'que', before: '#' },
  { sounds: 'k', write: 'c' },
  { sounds: 'wa', write: 'oi' },
  { sounds: 'ɛ', write: 'e', syllable: 'closed' },
  { sounds: 'ɛ', write: 'è' },
  { sounds: 's', write: 'ss', after: 'V', before: 'V' },
  { sounds: 'ʃ', write: 'ch' },
  { sounds: 'h', write: '∅' },
] satisfies SpellingRule[]);

const write = (w: WordSounds) => spell(w, rules, mulberry32(1));

describe('spell', () => {
  it('uses the first rule whose context fits', () => {
    expect(write(word('k|i|'))).toBe('qui');
    expect(write(word('k|a|'))).toBe('ca');
    expect(write(word('|a|k'))).toBe('aque');
  });

  it('matches runs of sounds, even across syllables', () => {
    expect(write(word('ʃ|a|k s'))).toBe('chax');
    expect(write(word('|a|k', 's|a|'))).toBe('axa');
    expect(write(word('ʃ|wa|'))).toBe('choi');
  });

  it('tells open syllables from closed ones', () => {
    expect(write(word('ʃ|ɛ|'))).toBe('chè');
    expect(write(word('ʃ|ɛ|l'))).toBe('chel');
  });

  it('checks what comes before and after, across syllables', () => {
    expect(write(word('k|a|', 's|a|'))).toBe('cassa');
    expect(write(word('s|a|'))).toBe('sa');
  });

  it('can write nothing, and writes plain sounds as themselves', () => {
    expect(write(word('h|a|t'))).toBe('at');
    expect(write(word('m|o|n'))).toBe('mon');
  });

  it('chooses among spellings by weight, and the same seed chooses the same', () => {
    const choice = compileSpelling([{ sounds: 'o', write: 'o:1 eau:1' }]);
    const results = new Set(Array.from({ length: 40 }, (_, seed) => spell(word('|o|'), choice, mulberry32(seed))));
    expect(results).toEqual(new Set(['o', 'eau']));
    expect(spell(word('|o|'), choice, mulberry32(3))).toBe(spell(word('|o|'), choice, mulberry32(3)));
  });

  it('refuses rules with unknown sounds', () => {
    expect(() => compileSpelling([{ sounds: 'qq', write: 'x' }])).toThrow(/qq/);
    expect(() => compileSpelling([{ sounds: 'k', write: 'x', before: 'zz' }])).toThrow(/zz/);
  });
});
