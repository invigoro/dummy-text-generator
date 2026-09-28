import { describe, expect, it } from 'vitest';
import { generate, plainText } from './generate';
import { tokenize } from './tokenize';

const corpus = tokenize('The ship sailed. The crew cheered.\n\nNight fell on the island.\n\n“Aye,” said he.');

describe('generate', () => {
  it('renders the paragraphs and counts their words', () => {
    const text = generate(corpus, { arrangement: 'paragraphs', length: { unit: 'paragraphs', count: 3 }, seed: 1 });
    expect([...text.paragraphs].sort()).toEqual(['Night fell on the island.', 'The ship sailed. The crew cheered.', '“Aye,” said he.']);
    expect(text.words).toBe(14);
  });

  it('is reproducible from its seed', () => {
    const options = { arrangement: 'words', length: { unit: 'words', count: 40 }, seed: 99 } as const;
    expect(generate(corpus, options)).toEqual(generate(corpus, options));
  });
});

describe('plainText', () => {
  it('puts a blank line between paragraphs', () => {
    expect(plainText({ paragraphs: ['One.', 'Two.'], words: 2 })).toBe('One.\n\nTwo.');
  });
});
