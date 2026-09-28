import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../data/languages';
import type { InventedLanguageDef } from '../engine/language';
import { tokenize } from '../engine/tokenize';
import { excerpt, hasProblems, preview, problems } from './builderPreview';
import { newLanguage } from './customLanguages';

const orcish = LANGUAGES.find((def): def is InventedLanguageDef => def.id === 'orcish')!;
const grukk = () => newLanguage(orcish, new Set());

const flow = tokenize(
  Array.from({ length: 30 }, (_, i) => `“Ahoy there, ${i},” said the captain. The crew went ashore, and the ship sailed on.`).join('\n\n'),
);

describe('problems', () => {
  it('finds nothing wrong with a working language', () => {
    expect(hasProblems(problems(grukk()))).toBe(false);
  });

  it('puts each problem beside its part', () => {
    const language = grukk();
    const badSound = { ...language, sounds: { ...language.sounds, classes: { ...language.sounds.classes, V: 'a ʘ' } } };
    expect(problems(badSound)).toEqual({ sounds: 'Unknown sound "ʘ"' });
    const badShape = { ...language, sounds: { ...language.sounds, syllables: 'CXV' } };
    expect(problems(badShape).sounds).toMatch(/unknown class X/);
    const badRule = { ...language, spelling: [{ sounds: 'ʘ', write: 'q' }] };
    expect(problems(badRule)).toEqual({ spelling: 'Unknown sound "ʘ"' });
    const badContext = { ...language, spelling: [{ sounds: 'k', write: 'q', before: 'somewhere' }] };
    expect(problems(badContext).spelling).toMatch(/Unknown sound "somewhere"/);
  });

  it('says plainly what’s missing, and waits for a rule to be finished', () => {
    const language = grukk();
    expect(problems({ ...language, sounds: { ...language.sounds, classes: { ...language.sounds.classes, Q: ' ' } } })).toEqual({
      sounds: 'Class Q has no sounds yet',
    });
    expect(problems({ ...language, sounds: { ...language.sounds, syllables: '' } })).toEqual({ sounds: 'Syllables need a shape or two' });
    expect(hasProblems(problems({ ...language, spelling: [...language.spelling, { sounds: 'k', write: '' }] }))).toBe(false);
  });
});

describe('preview', () => {
  it('shows words from the sound system and a passage on the flow’s rhythm', () => {
    const shown = preview(grukk(), flow, 1)!;
    expect(shown.words).toHaveLength(16);
    for (const word of shown.words) {
      expect(word.written).toMatch(/^[\p{L}'-]+$/u);
      expect(word.say).toMatch(/^[a-zA-Z'-]+$/);
    }
    expect(shown.passage!.written).toMatch(/\p{L}/u);
    expect(shown.passage!.say).toMatch(/[A-Z]/);
  });

  it('is the same for the same language and seed, and different for another seed', () => {
    const language = grukk();
    expect(preview(language, flow, 3)).toEqual(preview(language, flow, 3));
    expect(preview(language, flow, 3)!.words).not.toEqual(preview(language, flow, 4)!.words);
  });

  it('shows words before the flow text has loaded, and nothing for a language that doesn’t work', () => {
    expect(preview(grukk(), null, 1)!.passage).toBeNull();
    const broken = { ...grukk(), sounds: { ...grukk().sounds, syllables: 'CF' } };
    expect(preview(broken, flow, 1)).toBeNull();
  });
});

describe('excerpt', () => {
  it('keeps the first few thousand words of a long text', () => {
    const long = tokenize(Array.from({ length: 2000 }, () => 'One two three four five.').join('\n\n'));
    const short = excerpt(long);
    expect(short.paragraphs.length).toBe(600);
    expect(excerpt(long)).toBe(short);
    expect(excerpt(flow).paragraphs).toHaveLength(30);
  });
});
