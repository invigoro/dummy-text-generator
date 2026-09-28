import { describe, expect, it } from 'vitest';
import { respeller } from './respell';
import type { WordSounds } from './sounds/system';

/** A word from syllables written as "onset|nucleus|coda", sounds separated by spaces. */
function word(...syllables: string[]): WordSounds {
  return {
    syllables: syllables.map((syllable) => {
      const [onset, nucleus, coda] = syllable.split('|');
      return { onset: onset.split(' ').filter(Boolean), nucleus, coda: coda.split(' ').filter(Boolean) };
    }),
    stress: null,
  };
}

const { say, ipa } = respeller();

describe('say', () => {
  it('joins syllables with hyphens and puts the stressed one in capitals', () => {
    expect(say(word('l|e|', 'ʁ|ɑ̃|'), 1)).toBe('lay-RAHN');
    expect(say(word('d|o|', 'l|o|ʁ'), 0)).toBe('DOH-lohr');
    expect(say(word('ʒ|e|'), null)).toBe('zhay');
  });

  it('spells sounds English lacks the way English readers expect', () => {
    expect(say(word('ʃ|a|', 'θ|ɛ|ð'), null)).toBe('shah-thedh');
    expect(say(word('x|ɔ̃|'), null)).toBe('khohn');
    expect(say(word('ɬ|y|'), null)).toBe('hlew');
  });

  it('uses a closed-syllable spelling where the vowel has one', () => {
    expect(say(word('b|ɛ|l'), null)).toBe('bel');
    expect(say(word('b|ɛ|'), null)).toBe('beh');
  });

  it('spells "eye" three ways: alone, after a consonant, and before one', () => {
    expect(say(word('|aɪ|'), null)).toBe('eye');
    expect(say(word('k|aɪ|'), null)).toBe('ky');
    expect(say(word('t|aɪ|m'), null)).toBe('tighm');
  });

  it('writes a hard g as "gh" before e and i', () => {
    expect(say(word('g|i|'), null)).toBe('ghee');
    expect(say(word('g|a|'), null)).toBe('gah');
    expect(say(word('g l|i|'), null)).toBe('glee');
  });

  it('doubles a final s after a long vowel, where it would read as z', () => {
    expect(say(word('d|e|s'), null)).toBe('dayss');
    expect(say(word('d|ɛ|s'), null)).toBe('des');
  });

  it('writes ng before k or g as n', () => {
    expect(say(word('b|a|ŋ', 'k|a|'), null)).toBe('bahn-kah');
  });

  it('takes a language’s own vowel spellings', () => {
    const latin = respeller({ u: { sayClosed: 'u' }, i: { sayClosed: 'i' } });
    expect(latin.say(word('|i|p', 's|u|m'), 0)).toBe('IP-sum');
    expect(say(word('|i|p', 's|u|m'), 0)).toBe('EEP-soom');
  });
});

describe('double consonants', () => {
  it('are said across the syllable break', () => {
    expect(say(word('g|a|', 'tː|o|'), 0)).toBe('GAHT-toh');
    expect(ipa(word('g|a|', 'tː|o|'), 0)).toBe('ˈgat.to');
  });
});

describe('ipa', () => {
  it('writes syllables with dots and a stress mark', () => {
    expect(ipa(word('d|o|', 'l|o|ʁ'), 0)).toBe('ˈdo.loʁ');
    expect(ipa(word('|a|', 'm|ɛ|t'), 1)).toBe('aˈmɛt');
    expect(ipa(word('l|e|', 'ʁ|ɑ̃|'), null)).toBe('le.ʁɑ̃');
  });
});
