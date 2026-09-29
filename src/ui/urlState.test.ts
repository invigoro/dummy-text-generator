import { describe, expect, it } from 'vitest';
import { MAX_LENGTH } from '../engine/arrange';
import { readHash, worldInHash, writeHash, type PageState } from './urlState';

const isChoice = (key: string) => ['dnd/elvish', 'real/latin'].includes(key);

/** What a prose page's hash holds: prose, and the speakers it doesn't need, go without saying. */
const inHash = (page: PageState) => ({
  ...page,
  alphabet: page.alphabet === 'own' ? undefined : page.alphabet,
  form: page.form === 'prose' ? undefined : page.form,
  speakers: page.form === 'conversation' ? page.speakers : undefined,
  names: page.form === 'names' ? page.names : undefined,
});

const state: PageState = {
  choice: 'dnd/elvish',
  arrangement: 'sentences',
  length: { unit: 'paragraphs', count: 3 },
  seed: 123456,
  view: 'both',
  alphabet: 'own',
  form: 'prose',
  speakers: 2,
  names: 'people',
};

describe('writeHash and readHash', () => {
  it('write a readable hash and read it back', () => {
    const hash = writeHash(state);
    expect(hash).toBe('#lang=dnd/elvish&order=sentences&len=3p&seed=123456&view=both');
    expect(readHash(hash, isChoice)).toEqual(inHash(state));
  });

  it('keep word counts', () => {
    const words = { ...state, length: { unit: 'words', count: 250 } } as const;
    expect(readHash(writeHash(words), isChoice)).toEqual(inHash(words));
  });

  it('carry a conversation and its speakers, and leave both out for prose', () => {
    const talk = { ...state, form: 'conversation', speakers: 3 } as const;
    expect(writeHash(talk)).toBe('#lang=dnd/elvish&order=sentences&len=3p&seed=123456&view=both&form=conversation&speakers=3');
    expect(readHash(writeHash(talk), isChoice)).toEqual(inHash(talk));
    expect(writeHash({ ...state, form: 'inscription' })).toMatch(/&form=inscription$/);
    const places = { ...state, form: 'names', names: 'places' } as const;
    expect(writeHash(places)).toMatch(/&form=names&names=places$/);
    expect(readHash(writeHash(places), isChoice)).toEqual(inHash(places));
    expect(readHash('#form=song&speakers=9', isChoice)).toEqual({});
  });

  it('carry Latin letters for a language with an alphabet of its own, and leave its own out', () => {
    const latin = { ...state, choice: 'real/latin', alphabet: 'latin' } as const;
    expect(writeHash(latin)).toBe('#lang=real/latin&order=sentences&len=3p&seed=123456&view=both&alphabet=latin');
    expect(readHash(writeHash(latin), isChoice)).toEqual(inHash(latin));
    expect(readHash('#alphabet=greek', isChoice)).toEqual({});
  });

  it('carry a custom setting last, and only when there is one', () => {
    const custom = { ...state, choice: 'my-world/renan', world: 'eyJpZCI6Im15LXdvcmxkIn0' };
    const hash = writeHash(custom);
    expect(hash).toBe('#lang=my-world/renan&order=sentences&len=3p&seed=123456&view=both&world=eyJpZCI6Im15LXdvcmxkIn0');
    expect(readHash(hash, () => true)).toEqual(inHash(custom));
  });
});

describe('worldInHash', () => {
  it('finds an encoded setting, and nothing that isn’t one', () => {
    expect(worldInHash('#lang=my-world/renan&world=abc_-123')).toBe('abc_-123');
    expect(worldInHash('#lang=dnd/elvish')).toBeUndefined();
    expect(worldInHash('#world=<script>')).toBeUndefined();
    expect(worldInHash(`#world=${'a'.repeat(20001)}`)).toBeUndefined();
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
