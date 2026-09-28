import { beforeAll, describe, expect, it } from 'vitest';
import { loadCorpus } from '../data/corpora';
import { arrange, ARRANGEMENTS, balanceQuotes, MAX_LENGTH, type Arrangement, type Length } from './arrange';
import { mulberry32 } from './rng';
import {
  countWords,
  renderParagraph,
  renderSentence,
  tokenize,
  tokenizeParagraph,
  tokenizerFor,
  type Corpus,
  type Paragraph,
  type Sentence,
} from './tokenize';

const small = tokenize(
  [
    'The ship sailed. “Aye,” said he. Hawkins waved.',
    'Silver laughed at the crew. The crew cheered.',
    '“Where is the map? I want it,” said Silver.',
    'Night fell.',
    '“A speech that runs on. And on.',
  ].join('\n\n'),
);
const sourceParagraphs = small.paragraphs.map(renderParagraph);
const sourceSentences = small.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => renderSentence(balanceQuotes(sentence))));

const run = (arrangement: Arrangement, length: Length, seed = 1, corpus: Corpus = small) =>
  arrange(corpus, arrangement, length, mulberry32(seed));
const sentencesOf = (paragraphs: Paragraph[]) => paragraphs.flatMap((paragraph) => paragraph.sentences);
const sorted = (items: string[]) => [...items].sort();

/** Opening minus closing double quotation marks. */
const openQuotes = (sentences: Sentence[]) =>
  sentences
    .flatMap((sentence) => sentence.tokens)
    .reduce((depth, token) => depth + (token.text === '“' ? 1 : token.text === '”' ? -1 : 0), 0);

/** A sentence's punctuation and spacing, with every word as "w". */
const shape = (sentence: Sentence) => sentence.tokens.map((token) => (token.kind === 'word' ? 'w' : token.text)).join('');

let novel: Corpus;
beforeAll(async () => {
  novel = await loadCorpus('en-treasure-island');
});

describe('original order', () => {
  it('gives consecutive paragraphs from a random start, wrapping around', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const out = run('original', { unit: 'paragraphs', count: 7 }, seed).map(renderParagraph);
      const start = sourceParagraphs.indexOf(out[0]);
      const expected = out.map((_, i) => sourceParagraphs[(start + i) % sourceParagraphs.length]);
      expect(out.slice(0, -1)).toEqual(expected.slice(0, -1));
      expect([expected.at(-1), `${expected.at(-1)}”`]).toContain(out.at(-1));
    }
  });

  it('starts in different places for different seeds', () => {
    const starts = new Set(Array.from({ length: 30 }, (_, seed) => renderParagraph(run('original', { unit: 'paragraphs', count: 1 }, seed)[0])));
    expect(starts.size).toBeGreaterThan(2);
  });

  it('closes a speech left open where the passage stops', () => {
    const seed = Array.from({ length: 100 }, (_, i) => i).find(
      (i) => renderParagraph(run('original', { unit: 'paragraphs', count: 1 }, i)[0]) === '“A speech that runs on. And on.”',
    );
    expect(seed).toBeDefined();
    // Mid-passage, the speech stays open: the next paragraph carries it on.
    const passage = run('original', { unit: 'paragraphs', count: 2 }, seed).map(renderParagraph);
    expect(passage[0]).toBe('“A speech that runs on. And on.');
  });
});

describe('shuffled paragraphs', () => {
  it('uses every paragraph once before using any twice', () => {
    const once = run('paragraphs', { unit: 'paragraphs', count: 5 }).map(renderParagraph);
    const twice = run('paragraphs', { unit: 'paragraphs', count: 10 }).map(renderParagraph);
    const balancedSource = sourceParagraphs.map((text) => (text.startsWith('“A speech') ? `${text}”` : text));
    expect(sorted(once)).toEqual(sorted(balancedSource));
    expect(sorted(twice)).toEqual(sorted([...balancedSource, ...balancedSource]));
  });

  it('changes the order with the seed', () => {
    const orders = new Set(Array.from({ length: 10 }, (_, seed) => run('paragraphs', { unit: 'paragraphs', count: 5 }, seed).map(renderParagraph).join('|')));
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe('shuffled sentences', () => {
  it('uses every sentence once before using any twice', () => {
    const out = sentencesOf(run('sentences', { unit: 'words', count: 200 })).map(renderSentence);
    expect(sorted(out.slice(0, sourceSentences.length))).toEqual(sorted(sourceSentences));
    expect(sorted(out.slice(sourceSentences.length, sourceSentences.length * 2))).toEqual(sorted(sourceSentences));
  });

  it('groups sentences into paragraphs sized like the source’s', () => {
    const sizes = new Set(small.paragraphs.map((paragraph) => paragraph.sentences.length));
    for (const paragraph of run('sentences', { unit: 'paragraphs', count: 30 })) expect(sizes).toContain(paragraph.sentences.length);
  });
});

describe('shuffled words', () => {
  const out = sentencesOf(run('words', { unit: 'paragraphs', count: 40 }));
  const words = out.flatMap((sentence) => sentence.tokens.filter((token) => token.kind === 'word').map((token) => token.text));

  it('keeps each sentence’s punctuation', () => {
    const shapes = new Set(small.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => shape(balanceQuotes(sentence)))));
    for (const sentence of out) expect(shapes).toContain(shape(sentence));
  });

  it('only uses words from the source', () => {
    const vocabulary = new Set(sentencesOf(small.paragraphs).flatMap((s) => s.tokens.filter((t) => t.kind === 'word').map((t) => t.text.toLowerCase())));
    for (const word of words) expect(vocabulary).toContain(word.toLowerCase());
  });

  it('capitalizes the start of each sentence', () => {
    for (const sentence of out) {
      const first = sentence.tokens.find((token) => token.kind === 'word')!;
      expect(first.text).toMatch(/^\p{Lu}/u);
    }
  });

  it('keeps capitals on names and "I", and drops ones that came from position', () => {
    expect(words).toContain('Hawkins');
    expect(words).toContain('I');
    expect(words).not.toContain('hawkins');
    expect(words).not.toContain('i');
    // "The" only started sentences; mid-sentence it becomes "the".
    const midSentence = out.flatMap((sentence) => sentence.tokens.filter((token, i) => token.kind === 'word' && i > 0 && sentence.tokens[i - 1].kind === 'space' && sentence.tokens[i - 2]?.kind === 'word'));
    expect(midSentence.map((token) => token.text)).not.toContain('The');
    expect(words).toContain('the');
  });

  it('works on the whole novel', () => {
    const sentences = sentencesOf(run('words', { unit: 'words', count: 3000 }, 7, novel));
    const starts = sentences.map((sentence) => sentence.tokens.find((token) => token.kind === 'word')?.text ?? '');
    expect(starts.filter((word) => /^\p{Lu}/u.test(word)).length / starts.length).toBeGreaterThan(0.98);
    const all = sentences.flatMap((sentence) => sentence.tokens).filter((token) => token.kind === 'word').map((token) => token.text);
    expect(all).not.toContain('i');
  });
});

describe.each(ARRANGEMENTS.map((arrangement) => [arrangement]))('%s', (arrangement) => {
  it('gives exactly the number of paragraphs asked for', () => {
    for (const count of [1, 3, 12]) expect(run(arrangement, { unit: 'paragraphs', count }, 3, novel)).toHaveLength(count);
  });

  it('stops at the first sentence end past the word count', () => {
    for (const count of [1, 50, 400, 2500]) {
      const sentences = sentencesOf(run(arrangement, { unit: 'words', count }, 11, novel));
      const total = countWords(sentences);
      expect(total).toBeGreaterThanOrEqual(count);
      expect(total - countWords(sentences.slice(-1))).toBeLessThan(count);
    }
  });

  it('leaves no quotation open, except inside a passage in original order', () => {
    for (let seed = 0; seed < 20; seed++) {
      const paragraphs = run(arrangement, { unit: 'paragraphs', count: 8 }, seed, novel);
      const checked = arrangement === 'original' ? paragraphs.slice(-1) : paragraphs;
      for (const paragraph of checked) expect(openQuotes(paragraph.sentences)).toBe(0);
    }
  });

  it('is the same every time for the same seed', () => {
    const once = run(arrangement, { unit: 'words', count: 300 }, 42, novel).map(renderParagraph);
    expect(run(arrangement, { unit: 'words', count: 300 }, 42, novel).map(renderParagraph)).toEqual(once);
    expect(run(arrangement, { unit: 'words', count: 300 }, 43, novel).map(renderParagraph)).not.toEqual(once);
  });

  it('gives nothing for a length of zero, and caps huge lengths', () => {
    expect(run(arrangement, { unit: 'paragraphs', count: 0 })).toEqual([]);
    expect(run(arrangement, { unit: 'words', count: -5 })).toEqual([]);
    expect(run(arrangement, { unit: 'paragraphs', count: 1e9 })).toHaveLength(MAX_LENGTH.paragraphs);
  });

  it('gives nothing from a source with no words', () => {
    expect(run(arrangement, { unit: 'words', count: 10 }, 1, tokenize(''))).toEqual([]);
    expect(run(arrangement, { unit: 'words', count: 10 }, 1, tokenize('…\n\n!'))).toEqual([]);
  });
});

describe('balanceQuotes', () => {
  const sentence = (text: string) => tokenizeParagraph(text).sentences[0];

  it('closes a quotation left open', () => {
    expect(renderSentence(balanceQuotes(sentence('“A speech that runs on.')))).toBe('“A speech that runs on.”');
    expect(renderSentence(balanceQuotes(sentence('"Straight quotes run on.')))).toBe('"Straight quotes run on."');
  });

  it('opens a quotation that was only closed', () => {
    expect(renderSentence(balanceQuotes(sentence('A stray end.”')))).toBe('“A stray end.”');
  });

  it('leaves a balanced sentence as it was', () => {
    const balanced = sentence('“Aye,” said he, “by thunder!”');
    expect(balanceQuotes(balanced)).toBe(balanced);
  });

  it('drops a stray closing mark in French, and still closes an open one', () => {
    const french = tokenizerFor('fr');
    const stray = tokenizeParagraph('— Mais je vous parle, moi! » s’écria le jeune homme.', french).sentences[0];
    expect(renderSentence(balanceQuotes(stray, french))).toBe('— Mais je vous parle, moi! s’écria le jeune homme.');
    const open = tokenizeParagraph('« Monsieur, dit-il, venez.', french).sentences[0];
    expect(renderSentence(balanceQuotes(open, french))).toBe('« Monsieur, dit-il, venez.»');
  });
});
