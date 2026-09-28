import { describe, expect, it } from 'vitest';
import { renderParagraph, type Paragraph } from '../../engine/tokenize';
import { loadCorpus, SOURCE_TEXTS, sourceText } from './index';

/** Opening minus closing speech marks in a paragraph. */
const openQuotes = (paragraph: Paragraph) =>
  paragraph.sentences
    .flatMap((sentence) => sentence.tokens)
    .reduce((depth, token) => (token.kind === 'punct' && token.quote && token.text !== '‘' && token.text !== '’' ? depth + (token.quote === 'open' ? 1 : -1) : depth), 0);

describe.each(SOURCE_TEXTS.map((source) => [source.id, source] as const))('%s', (id, source) => {
  it('is clean prose: no Project Gutenberg text, headings or markup', async () => {
    const text = await source.load();
    expect(text).not.toMatch(/gutenberg|\*\*\*|--|_/i);
    expect(text).not.toMatch(/\r|\n{3,}| {2,}/);
    expect(text.endsWith('\n')).toBe(true);
  });

  it('comes back exactly from the tokenizer, paragraph by paragraph', async () => {
    const [text, corpus] = await Promise.all([source.load(), loadCorpus(id)]);
    const paragraphs = text.trimEnd().split('\n\n');
    expect(corpus.paragraphs).toHaveLength(paragraphs.length);
    corpus.paragraphs.forEach((paragraph, i) => expect(renderParagraph(paragraph)).toBe(paragraphs[i]));
  });

  it('closes nearly every quotation within its paragraph', async () => {
    const { paragraphs } = await loadCorpus(id);
    // Speeches running on to the next paragraph are the only ones left open, and never more closed than opened.
    expect(paragraphs.filter((paragraph) => openQuotes(paragraph) !== 0).length).toBeLessThan(paragraphs.length / 100);
    expect(paragraphs.every((paragraph) => openQuotes(paragraph) >= 0)).toBe(true);
  });
});

describe('Treasure Island', () => {
  it('runs from the first chapter to the last line', async () => {
    const text = await sourceText('en-treasure-island').load();
    expect(text.startsWith('Squire Trelawney, Dr. Livesey, and the rest of these gentlemen')).toBe(true);
    expect(text.trimEnd().endsWith('“Pieces of eight! Pieces of eight!”')).toBe(true);
    expect(text).toContain('the Hispaniola');
    expect(text).not.toMatch(/HISPANIOLA|To the Hesitating Purchaser|CONTENTS/);
  });

  it('is long enough to shuffle well', async () => {
    const { paragraphs } = await loadCorpus('en-treasure-island');
    expect(paragraphs.length).toBeGreaterThan(1000);
    expect(paragraphs.reduce((n, paragraph) => n + paragraph.sentences.length, 0)).toBeGreaterThan(2000);
  });
});

describe('loadCorpus', () => {
  it('loads each text once', () => {
    expect(loadCorpus('en-treasure-island')).toBe(loadCorpus('en-treasure-island'));
  });

  it('rejects an unknown text, and can be asked again', async () => {
    await expect(loadCorpus('xx-nothing')).rejects.toThrow(/xx-nothing/);
    await expect(loadCorpus('xx-nothing')).rejects.toThrow(/xx-nothing/);
  });
});
