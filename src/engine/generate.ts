import { arrange, type Arrangement, type Length } from './arrange';
import type { DocParagraph, DocSentence } from './document';
import { conversation, inscription, SPEAKERS, type Form } from './forms';
import { mulberry32 } from './rng';
import type { Corpus, Paragraph } from './tokenize';

export interface GenerateOptions {
  arrangement: Arrangement;
  length: Length;
  /** The same seed and options always give the same text. */
  seed: number;
  /** Prose unless it says otherwise. */
  form?: Form;
  /** How many speakers a conversation has: two to four. */
  speakers?: number;
}

export interface WordsOptions {
  /** Whether to start with the language's set opening, if it has one (lorem ipsum's). Prose does. */
  opening?: boolean;
}

/** Where a language's text comes from: a flow to arrange, and a way to put it in the language's words. */
export interface TextSource {
  flow: Corpus;
  words(paragraphs: Paragraph[], options?: WordsOptions): DocParagraph[];
}

export function generate(source: TextSource, options: GenerateOptions): DocParagraph[] {
  const random = mulberry32(options.seed);
  const { arrangement, length } = options;
  switch (options.form ?? 'prose') {
    case 'prose':
      return source.words(arrange(source.flow, arrangement, length, random));
    case 'inscription':
      return source.words(inscription(source.flow, arrangement, length, random), { opening: false });
    case 'conversation': {
      const talk = conversation(source.flow, arrangement, length, options.speakers ?? SPEAKERS.min, random);
      const names = speakerNames(source, talk.names, Math.max(0, ...talk.order) + 1);
      return source.words(talk.lines, { opening: false }).map((line, i) => ({ ...line, speaker: names[talk.order[i]] }));
    }
  }
}

/**
 * Names for the speakers, in the language: source names turned into its words, each followed by a
 * colon ("Athos:" in French is "Ouvanis :"). Two source names can come out as one word, as in lorem
 * ipsum's small vocabulary, so each is checked against those already taken.
 */
function speakerNames(source: TextSource, candidates: readonly string[], count: number): DocSentence[] {
  const names: DocSentence[] = [];
  const taken = new Set<string>();
  for (const candidate of candidates) {
    if (names.length === count) break;
    const [paragraph] = source.words([{ sentences: [{ tokens: [{ kind: 'word', text: candidate }, { kind: 'punct', text: ':' }] }] }], {
      opening: false,
    });
    const name = paragraph?.sentences[0];
    const written = name?.tokens.find((token) => token.kind === 'word')?.text;
    if (!name || !written || taken.has(written.toLowerCase())) continue;
    taken.add(written.toLowerCase());
    names.push(name);
  }
  // Short of names (a text with almost no words), speakers are lettered.
  for (let i = names.length; i < count; i++) {
    names.push({ tokens: [{ kind: 'word', text: String.fromCharCode(65 + i) }, { kind: 'punct', text: ':' }] });
  }
  return names;
}
