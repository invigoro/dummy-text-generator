import { describe, expect, it } from 'vitest';
import { isSlur, withoutSlurs } from './blocklist';
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
