import { describe, expect, it } from 'vitest';
import { balanceQuotes } from '../../engine/arrange';
import { isSlur } from '../../engine/blocklist';
import { renderParagraph, tokenize, tokenizerFor, type Corpus, type Sentence, type TokenizeOptions } from '../../engine/tokenize';
import { loadCorpus, SOURCE_TEXTS, sourceText } from './index';

const sentenceCount = (corpus: Corpus) => corpus.paragraphs.reduce((n, paragraph) => n + paragraph.sentences.length, 0);

/** How deep in quotation a sentence ends, and the shallowest it gets on the way (below 0 is a stray closing mark). */
function quoteDepth(sentence: Sentence, options: TokenizeOptions) {
  let depth = 0;
  let lowest = 0;
  for (const token of sentence.tokens) {
    if (token.kind !== 'punct' || !token.quote || !options.quotes.some((pair) => pair.includes(token.text))) continue;
    depth += token.quote === 'open' ? 1 : -1;
    lowest = Math.min(lowest, depth);
  }
  return { depth, lowest };
}

describe.each(SOURCE_TEXTS.map((source) => [source.id, source] as const))('%s', (id, source) => {
  it('is clean prose: no Project Gutenberg text, headings or markup', async () => {
    const text = await source.load();
    // (Manzoni's own "***" for names he keeps back is fine; Gutenberg's "*** START" markers aren't.)
    expect(text).not.toMatch(/gutenberg|\*\*\* ?(?:START|END)|--|_/i);
    expect(text).not.toMatch(/\r|\n{3,}| {2,}/);
    expect(text.endsWith('\n')).toBe(true);
  });

  it('comes back exactly from the tokenizer, paragraph by paragraph', async () => {
    const text = await source.load();
    const corpus = tokenize(text, tokenizerFor(source.language));
    const paragraphs = text.trimEnd().split('\n\n');
    expect(corpus.paragraphs).toHaveLength(paragraphs.length);
    corpus.paragraphs.forEach((paragraph, i) => expect(renderParagraph(paragraph)).toBe(paragraphs[i]));
  });

  it('loads without any slurs', async () => {
    const { paragraphs } = await loadCorpus(id);
    const words = paragraphs.flatMap((p) => p.sentences.flatMap((s) => s.tokens.filter((t) => t.kind === 'word').map((t) => t.text)));
    expect(words.filter((word) => isSlur(word, source.language))).toEqual([]);
  });

  it('balances every sentence once its quotation marks are paired up', async () => {
    const corpus = await loadCorpus(id);
    for (const paragraph of corpus.paragraphs) {
      for (const sentence of paragraph.sentences) {
        expect(quoteDepth(balanceQuotes(sentence, corpus.options), corpus.options)).toEqual({ depth: 0, lowest: 0 });
      }
    }
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
    const corpus = await loadCorpus('en-treasure-island');
    expect(corpus.paragraphs.length).toBeGreaterThan(1000);
    expect(sentenceCount(corpus)).toBeGreaterThan(2000);
  });

  it('loses only the three sentences with slurs', async () => {
    // "Negroes … and half-bloods", "his old Negress", and "like what the gipsies carry".
    const whole = tokenize(await sourceText('en-treasure-island').load());
    expect(sentenceCount(whole) - sentenceCount(await loadCorpus('en-treasure-island'))).toBe(3);
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
