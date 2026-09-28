import { describe, expect, it } from 'vitest';
import type { DocParagraph, DocWord } from '../engine/document';
import type { Syllable } from '../engine/sounds/system';
import { tally, textStats } from './stats';

const syllable = (onset: string, nucleus: string, coda = ''): Syllable => ({
  onset: onset ? onset.split(' ') : [],
  nucleus,
  coda: coda ? coda.split(' ') : [],
});

const word = (text: string, ...syllables: Syllable[]): DocWord => ({ kind: 'word', text, spoken: [{ syllables, stress: 0 }] });

describe('tally', () => {
  it('counts items, most common first, with their shares', () => {
    expect(tally(['b', 'a', 'b', 'c'])).toEqual([
      { item: 'b', count: 2, share: 0.5 },
      { item: 'a', count: 1, share: 0.25 },
      { item: 'c', count: 1, share: 0.25 },
    ]);
    expect(tally([])).toEqual([]);
  });
});

describe('textStats', () => {
  const text: DocParagraph[] = [
    {
      sentences: [
        {
          tokens: [
            word('Lérant', syllable('l', 'e'), syllable('ʁ', 'ɑ̃')),
            { kind: 'space', text: ' ' },
            word('dou', syllable('d', 'u')),
            { kind: 'punct', text: ',' },
            { kind: 'space', text: ' ' },
            word('ast', syllable('', 'a', 's t')),
            { kind: 'space', text: ' ' },
            word('dou', syllable('d', 'u')),
          ],
        },
      ],
    },
  ];

  it('counts words, letters and syllables', () => {
    const stats = textStats(text);
    expect(stats.words).toBe(4);
    expect(stats.vocabulary).toBe(3);
    expect(stats.letters).toBe(3.75);
    expect(stats.syllables).toEqual([0.75, 0.25, 0, 0, 0]);
    expect(stats.common[0]).toEqual({ item: 'dou', count: 2, share: 0.5 });
    // Ties go alphabetically: a, d, o, t and u are all there twice.
    expect(stats.alphabet.slice(0, 5).map((letter) => letter.item)).toEqual(['a', 'd', 'o', 't', 'u']);
  });

  it('counts sounds, closed syllables and words that start with a vowel', () => {
    const stats = textStats(text);
    expect(stats.sounds.slice(0, 2).map((sound) => sound.item)).toEqual(['d', 'u']);
    expect(stats.closed).toBe(0.2);
    expect(stats.vowelFirst).toBe(0.25);
    expect(stats.marked).toBe(0);
  });

  it('works on real words, which have no sounds', () => {
    const stats = textStats([{ sentences: [{ tokens: [{ kind: 'word', text: 'Ahoy' }] }] }]);
    expect(stats.words).toBe(1);
    expect(stats.syllables).toEqual([]);
    expect(stats.sounds).toEqual([]);
    expect(textStats([]).letters).toBe(0);
  });
});
