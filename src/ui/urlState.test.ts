import { describe, expect, it } from 'vitest';
import { MAX_LENGTH } from '../engine/arrange';
import { readHash, writeHash, type PageState } from './urlState';

const isChoice = (key: string) => ['dnd/elvish', 'real/latin'].includes(key);

const state: PageState = {
  choice: 'dnd/elvish',
  arrangement: 'sentences',
  length: { unit: 'paragraphs', count: 3 },
  seed: 123456,
  view: 'both',
};

describe('writeHash and readHash', () => {
  it('write a readable hash and read it back', () => {
    const hash = writeHash(state);
    expect(hash).toBe('#lang=dnd/elvish&order=sentences&len=3p&seed=123456&view=both');
    expect(readHash(hash, isChoice)).toEqual(state);
  });

  it('keep word counts', () => {
    const words = { ...state, length: { unit: 'words', count: 250 } } as const;
    expect(readHash(writeHash(words), isChoice)).toEqual(words);
  });
});

describe('readHash', () => {
  it('reads nothing from an empty hash', () => {
    expect(readHash('', isChoice)).toEqual({});
  });

  it('drops anything unknown or malformed, and keeps the rest', () => {
    expect(readHash('#lang=nowhere/nothing&order=sideways&len=lots&seed=-4&view=sideways', isChoice)).toEqual({});
    expect(readHash('#lang=real/latin&seed=99999999999', isChoice)).toEqual({ choice: 'real/latin' });
  });

  it('caps a huge length', () => {
    expect(readHash('#len=999999p', isChoice).length).toEqual({ unit: 'paragraphs', count: MAX_LENGTH.paragraphs });
    expect(readHash('#len=0p', isChoice).length).toBeUndefined();
  });
});
