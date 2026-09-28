/**
 * Takes text from a source in one of four arrangements: a passage in its original order, or the
 * source's paragraphs, sentences or words shuffled. Shuffled sentences are regrouped into
 * paragraphs sized like the source's own, and shuffled words keep each sentence's punctuation, so
 * the result keeps the rhythm of the original.
 */
import { randomInt, shuffled, type Random } from './rng';
import { countWords, ENGLISH, type Corpus, type Paragraph, type Sentence, type Token } from './tokenize';

export type Arrangement = 'original' | 'paragraphs' | 'sentences' | 'words';

export const ARRANGEMENTS: readonly Arrangement[] = ['original', 'paragraphs', 'sentences', 'words'];

export interface Length {
  unit: 'paragraphs' | 'words';
  count: number;
}

/** The most that can be asked for, so a typo can't freeze the page. */
export const MAX_LENGTH: Readonly<Record<Length['unit'], number>> = { paragraphs: 100, words: 20_000 };

export function arrange(corpus: Corpus, arrangement: Arrangement, length: Length, random: Random): Paragraph[] {
  // With no words at all there's nothing to take, and asking for words would never finish.
  if (!corpus.paragraphs.some((paragraph) => countWords(paragraph.sentences) > 0)) return [];
  const count = Math.min(MAX_LENGTH[length.unit], Math.max(0, Math.floor(length.count)));

  switch (arrangement) {
    case 'original': {
      const paragraphs = take(inOrder(corpus, random), { unit: length.unit, count });
      // A passage can stop partway through a speech that runs on to the next paragraph.
      const last = paragraphs.at(-1);
      if (last) last.sentences = last.sentences.map((sentence, i, all) => (i === all.length - 1 ? balanceQuotes(sentence) : sentence));
      return paragraphs;
    }
    case 'paragraphs':
      return balanced(take(shuffledParagraphs(corpus, random), { unit: length.unit, count }));
    case 'sentences':
      return balanced(take(regrouped(corpus, random, sentencePool(corpus, random)), { unit: length.unit, count }));
    case 'words': {
      const words = wordPool(corpus, random);
      const sentences = mapSentences(sentencePool(corpus, random), (sentence) => refill(sentence, words));
      return balanced(take(regrouped(corpus, random, sentences), { unit: length.unit, count }));
    }
  }
}

/** Paragraphs from the stream until the length is reached, stopping at the end of a sentence. */
function take(paragraphs: Iterator<Paragraph, never>, length: Length): Paragraph[] {
  const result: Paragraph[] = [];
  if (length.unit === 'paragraphs') {
    for (let i = 0; i < length.count; i++) result.push(paragraphs.next().value);
    return result;
  }
  let words = 0;
  while (words < length.count) {
    const sentences: Sentence[] = [];
    for (const sentence of paragraphs.next().value.sentences) {
      sentences.push(sentence);
      words += countWords([sentence]);
      if (words >= length.count) break;
    }
    result.push({ sentences });
  }
  return result;
}

/** Consecutive paragraphs from a random starting point, wrapping around at the end. */
function* inOrder(corpus: Corpus, random: Random): Generator<Paragraph, never> {
  const { paragraphs } = corpus;
  for (let i = randomInt(random, paragraphs.length); ; i = (i + 1) % paragraphs.length) {
    yield { sentences: paragraphs[i].sentences };
  }
}

/** Every paragraph once in a random order, then again in a new order. */
function* shuffledParagraphs(corpus: Corpus, random: Random): Generator<Paragraph, never> {
  for (;;) for (const paragraph of shuffled(corpus.paragraphs, random)) yield { sentences: paragraph.sentences };
}

/** Every sentence once in a random order, then again in a new order. */
function* sentencePool(corpus: Corpus, random: Random): Generator<Sentence, never> {
  const sentences = corpus.paragraphs.flatMap((paragraph) => paragraph.sentences);
  for (;;) yield* shuffled(sentences, random);
}

function* mapSentences(sentences: Iterator<Sentence, never>, change: (sentence: Sentence) => Sentence): Generator<Sentence, never> {
  for (;;) yield change(sentences.next().value);
}

/** Sentences grouped into paragraphs whose sizes are drawn from the source's own paragraphs. */
function* regrouped(corpus: Corpus, random: Random, sentences: Iterator<Sentence, never>): Generator<Paragraph, never> {
  const sizes = corpus.paragraphs.map((paragraph) => paragraph.sentences.length).filter((size) => size > 0);
  for (;;) {
    const size = sizes[randomInt(random, sizes.length)];
    yield { sentences: Array.from({ length: size }, () => sentences.next().value) };
  }
}

function balanced(paragraphs: Paragraph[]): Paragraph[] {
  return paragraphs.map((paragraph) => ({ sentences: paragraph.sentences.map((sentence) => balanceQuotes(sentence)) }));
}

/**
 * The sentence with its speech marks paired up: a quotation left open (a speech running on to the
 * next paragraph) gets its closing mark, and a stray closing mark gets an opening one.
 */
export function balanceQuotes(sentence: Sentence, pairs: readonly (readonly [string, string])[] = ENGLISH.quotes): Sentence {
  const closers: string[] = [];
  const openers: string[] = [];
  for (const token of sentence.tokens) {
    if (token.kind !== 'punct' || !token.quote) continue;
    const pair = pairs.find((marks) => marks.includes(token.text));
    if (!pair) continue;
    if (token.quote === 'open') closers.push(pair[1]);
    else if (closers.length > 0) closers.pop();
    else openers.push(pair[0]);
  }
  if (closers.length === 0 && openers.length === 0) return sentence;
  const mark = (text: string, quote: 'open' | 'close'): Token => ({ kind: 'punct', text, quote });
  return {
    tokens: [
      ...openers.reverse().map((text) => mark(text, 'open')),
      ...sentence.tokens,
      ...closers.reverse().map((text) => mark(text, 'close')),
    ],
  };
}

const PRONOUN_I = /^I(?:$|['’])/u;
const upper = (word: string) => /^\p{Lu}/u.test(word);
const capitalize = (word: string) => word.replace(/\p{L}/u, (letter) => letter.toUpperCase());

/**
 * Whether the word at `index` comes at a break: the start of the sentence, of a quotation, or of
 * a new sentence inside a quotation. A capital there may only be because of where the word is.
 */
function atBreak(tokens: readonly Token[], index: number): boolean {
  for (let i = index - 1; i >= 0; i--) {
    const token = tokens[i];
    if (token.kind === 'space') continue;
    if (token.kind === 'word') return false;
    if (token.quote === 'open' || token.text === '(' || token.text === '[') return true;
    if (/^[.!?…]$/u.test(token.text)) return true;
    // Look back past the closing mark in .” He
    if (token.quote === 'close' || token.text === ')' || token.text === ']') continue;
    return false;
  }
  return true;
}

interface WordStats {
  /** Every word in the source, without capitals that only come from being first in a sentence. */
  words: string[];
}

const stats = new WeakMap<Corpus, WordStats>();

function wordStats(corpus: Corpus): WordStats {
  const cached = stats.get(corpus);
  if (cached) return cached;

  // How often each word appears in lowercase, and capitalized where position doesn't explain it.
  const lowercase = new Map<string, number>();
  const capitalized = new Map<string, number>();
  const occurrences: { word: string; atBreak: boolean }[] = [];
  for (const paragraph of corpus.paragraphs) {
    for (const { tokens } of paragraph.sentences) {
      tokens.forEach((token, i) => {
        if (token.kind !== 'word') return;
        const key = token.text.toLowerCase();
        const broken = atBreak(tokens, i);
        occurrences.push({ word: token.text, atBreak: broken });
        if (!upper(token.text)) lowercase.set(key, (lowercase.get(key) ?? 0) + 1);
        else if (!broken) capitalized.set(key, (capitalized.get(key) ?? 0) + 1);
      });
    }
  }

  // A capital at a break is kept for "I", and for words that are names more often than not
  // ("Silver" but not "The"), or never appear in lowercase at all ("Hawkins").
  const words = occurrences.map(({ word, atBreak: broken }) => {
    if (!broken || !upper(word) || PRONOUN_I.test(word)) return word;
    const key = word.toLowerCase();
    const lower = lowercase.get(key) ?? 0;
    const isName = lower === 0 || (capitalized.get(key) ?? 0) > lower;
    return isName ? word : word[0].toLowerCase() + word.slice(1);
  });

  const result = { words };
  stats.set(corpus, result);
  return result;
}

/** Every word in the source once in a random order, then again in a new order. */
function* wordPool(corpus: Corpus, random: Random): Generator<string, never> {
  const { words } = wordStats(corpus);
  for (;;) yield* shuffled(words, random);
}

/** The sentence with the same punctuation and capitals, and every word replaced from the pool. */
function refill(sentence: Sentence, words: Iterator<string, never>): Sentence {
  return {
    tokens: sentence.tokens.map((token, i, tokens) => {
      if (token.kind !== 'word') return token;
      const word = words.next().value;
      return { kind: 'word', text: upper(token.text) && atBreak(tokens, i) ? capitalize(word) : word };
    }),
  };
}
