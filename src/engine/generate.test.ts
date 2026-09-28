import { describe, expect, it } from 'vitest';
import { realWords, writtenText, type DocParagraph } from './document';
import { generate } from './generate';
import { tokenize, type Paragraph } from './tokenize';

const flow = tokenize('The ship sailed. The crew cheered.\n\nNight fell on the island.\n\n“Aye,” said he.');

describe('generate', () => {
  it('arranges the flow text and puts it in the language’s words', () => {
    const seen: Paragraph[][] = [];
    const words = (paragraphs: Paragraph[]): DocParagraph[] => {
      seen.push(paragraphs);
      return realWords(paragraphs);
    };
    const doc = generate({ flow, words }, { arrangement: 'paragraphs', length: { unit: 'paragraphs', count: 3 }, seed: 1 });
    expect(seen).toHaveLength(1);
    expect(writtenText(doc).split('\n\n').sort()).toEqual(['Night fell on the island.', 'The ship sailed. The crew cheered.', '“Aye,” said he.']);
  });

  it('is reproducible from its seed', () => {
    const options = { arrangement: 'words', length: { unit: 'words', count: 40 }, seed: 99 } as const;
    const words = (paragraphs: Paragraph[]) => realWords(paragraphs);
    expect(generate({ flow, words }, options)).toEqual(generate({ flow, words }, options));
  });
});
