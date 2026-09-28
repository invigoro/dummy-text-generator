// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { LANGUAGES } from '../data/languages';
import type { InventedLanguageDef } from '../engine/language';
import {
  decodeLanguages,
  encodeLanguages,
  isSafePattern,
  languageProblem,
  languagesSetting,
  loadCustomLanguages,
  newLanguage,
  sameLanguage,
  sanitizeLanguage,
  saveCustomLanguages,
  SCRATCH,
  withLinked,
  type CustomLanguageDef,
} from './customLanguages';

const invented = LANGUAGES.filter((def): def is InventedLanguageDef => def.kind === 'invented');
const orcish = invented.find((def) => def.id === 'orcish')!;

const grukk = (): CustomLanguageDef => ({ ...newLanguage(orcish, new Set()), id: 'my-grukk-abcde', name: 'Grukk' });

afterEach(() => localStorage.clear());

describe('newLanguage', () => {
  it('copies a built-in language to change, under a new id', () => {
    const copy = newLanguage(orcish, new Set());
    expect(copy.id).toMatch(/^my-new-orcish-[a-z0-9]{5}$/);
    expect(copy.name).toBe('New Orcish');
    expect(copy.basedOn).toBe('orcish');
    expect(copy.sounds).toEqual(orcish.sounds);
    expect(copy.sounds).not.toBe(orcish.sounds);
  });

  it('starts from nothing with a plain language that works', () => {
    const plain = newLanguage(null, new Set());
    expect(plain.name).toBe('New language');
    expect(plain.sounds).toEqual(SCRATCH.sounds);
    expect(languageProblem(plain)).toBeNull();
  });
});

describe('sanitizeLanguage', () => {
  it('keeps every built-in language as it is, so a copy of one loses nothing', () => {
    for (const def of invented) {
      const copy = { ...def, id: `my-${def.id}` };
      expect(sanitizeLanguage(copy), def.id).toEqual(copy);
    }
  });

  it('refuses a language that doesn’t work, saying what’s wrong', () => {
    const broken = { ...grukk(), sounds: { ...grukk().sounds, classes: { ...grukk().sounds.classes, V: 'a ʘ' } } };
    expect(languageProblem(broken)).toMatch(/Unknown sound "ʘ"/);
    expect(sanitizeLanguage(broken)).toBeNull();
    const noVowel = { ...grukk(), sounds: { ...grukk().sounds, syllables: 'CF' } };
    expect(languageProblem(noVowel)).toMatch(/needs exactly one vowel class/);
    expect(sanitizeLanguage({ name: 'Nothing' })).toBeNull();
    expect(sanitizeLanguage({ ...grukk(), sounds: { ...grukk().sounds, stress: 'sideways' } })).toBeNull();
  });

  it('fills in or drops what’s missing or wrong around a working language', () => {
    const language = sanitizeLanguage({
      ...grukk(),
      id: 'not an id',
      name: '   ',
      flow: 'la-lorem-ipsum',
      punctuation: { quotes: ['<', '>'], spaceBefore: '!x?' },
      voicing: 42,
      say: { x: { say: 'KH!' }, ʁ: { say: 'gh' } },
      spelling: [{ sounds: 'x', write: 'kh' }, { sounds: '', write: 'q' }, 'junk'],
    })!;
    expect(language.id).toBe('my-unnamed-language');
    expect(language.name).toBe('Unnamed language');
    expect(language.flow).toBe('en-treasure-island');
    expect(language.punctuation).toEqual({ quotes: ['“', '”'], spaceBefore: '!?' });
    expect(language.voicing).toBe('');
    expect(language.say).toEqual({ ʁ: { say: 'gh' } });
    expect(language.spelling).toEqual([{ sounds: 'x', write: 'kh' }]);
  });

  it('keeps only patterns that are safe to run', () => {
    const language = sanitizeLanguage({ ...grukk(), sounds: { ...grukk().sounds, avoid: ['^ʔ', '(a+)+$', '(', '(k)\\.\\1'] } })!;
    expect(language.sounds.avoid).toEqual(['^ʔ', '(k)\\.\\1']);
  });
});

describe('isSafePattern', () => {
  it('accepts the patterns built-in languages use, and refuses risky ones', () => {
    for (const def of invented) for (const pattern of def.sounds.avoid ?? []) expect(isSafePattern(pattern), pattern).toBe(true);
    for (const pattern of ['(a+)+', '(a*)*b', '(ab?){2,}', '[', '', 'a'.repeat(61), 3]) expect(isSafePattern(pattern), String(pattern)).toBe(false);
  });
});

describe('storage and links', () => {
  it('saves and loads languages, and copes with junk', () => {
    saveCustomLanguages([grukk()]);
    expect(loadCustomLanguages()).toEqual([grukk()]);
    localStorage.setItem('dummy-text:languages', '[{"name": "broken"}, 7]');
    expect(loadCustomLanguages()).toEqual([]);
  });

  it('round-trips languages through a link', () => {
    const encoded = encodeLanguages([grukk()]);
    expect(encoded).toMatch(/^[\w-]+$/);
    expect(decodeLanguages(encoded)).toEqual([grukk()]);
    expect(decodeLanguages('%%%')).toEqual([]);
  });

  it('knows a language by every part of it', () => {
    expect(sameLanguage(grukk(), decodeLanguages(encodeLanguages([grukk()]))[0])).toBe(true);
    expect(sameLanguage(grukk(), { ...grukk(), voicing: 'Growl.' })).toBe(false);
  });

  it('lets a link’s version of a language stand in for yours', () => {
    const mine = grukk();
    const theirs = { ...grukk(), voicing: 'Growl.' };
    const other = { ...grukk(), id: 'my-other-abcde', name: 'Other' };
    expect(withLinked([mine], [mine])).toEqual({ all: [mine], shared: [] });
    expect(withLinked([mine], [theirs, other])).toEqual({ all: [theirs, other], shared: [theirs, other] });
  });

  it('lists your languages as a setting of their own', () => {
    const setting = languagesSetting([grukk()]);
    expect(setting.id).toBe('mine');
    expect(setting.choices).toEqual([{ id: 'my-grukk-abcde', name: 'Grukk', language: 'my-grukk-abcde', stele: { medium: 'parchment' } }]);
  });
});
