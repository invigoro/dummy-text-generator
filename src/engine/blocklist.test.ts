import { describe, expect, it } from 'vitest';
import { isOffensive, isSlur, withoutSlurs } from './blocklist';
import { renderParagraph, tokenize } from './tokenize';

describe('isSlur', () => {
  it('matches whatever the case or apostrophe', () => {
    expect(isSlur('Negroes', 'en')).toBe(true);
    expect(isSlur('HALF-BLOODS', 'en-GB')).toBe(true);
    expect(isSlur('negroni', 'en')).toBe(false);
  });

  it('only uses the list for the text’s own language', () => {
    // "Negro" is Spanish and Portuguese for the colour black.
    expect(isSlur('negro', 'es')).toBe(false);
  });
});

describe('isOffensive', () => {
  it('catches a swear word in the spelling, with or without accents', () => {
    expect(isOffensive('merde', 'MERD', 'fr')).toBe(true);
    expect(isOffensive('pédé', 'pay-DAY', 'fr')).toBe(true);
  });

  it('catches an English one in the "say it" line, however it’s spelled', () => {
    expect(isOffensive('fucque', 'FUK', 'fr')).toBe(true);
    expect(isOffensive('xyz', 'shit', 'la')).toBe(true);
  });

  it('catches the worst roots inside longer words', () => {
    expect(isOffensive('abcunta', 'ahb-KOON-tah', 'la')).toBe(true);
  });

  it('lets ordinary invented words through', () => {
    expect(isOffensive('lérant', 'lay-RAHN', 'fr')).toBe(false);
    expect(isOffensive('hrafnir', 'HRAHF-nir', 'is')).toBe(false);
  });

  it('only checks a language’s own list against words in that language', () => {
    expect(isOffensive('con', 'kohn', 'fr')).toBe(true);
    expect(isOffensive('con', 'kohn', 'la')).toBe(false);
  });
});

describe('withoutSlurs', () => {
  it('drops the sentences with slurs, and paragraphs left empty', () => {
    const corpus = tokenize('One fine day. Boats full of Negroes came. Then night.\n\nHe met his old Negress.\n\nThe end.');
    expect(withoutSlurs(corpus, 'en').paragraphs.map(renderParagraph)).toEqual(['One fine day. Then night.', 'The end.']);
  });

  it('leaves a text with no list for its language alone', () => {
    const corpus = tokenize('Un negro gato.');
    expect(withoutSlurs(corpus, 'es')).toBe(corpus);
  });
});
