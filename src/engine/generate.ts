import { arrange, type Arrangement, type Length } from './arrange';
import type { DocParagraph } from './document';
import { mulberry32 } from './rng';
import type { Corpus, Paragraph } from './tokenize';

export interface GenerateOptions {
  arrangement: Arrangement;
  length: Length;
  /** The same seed and options always give the same text. */
  seed: number;
}

/** Where a language's text comes from: a flow to arrange, and a way to put it in the language's words. */
export interface TextSource {
  flow: Corpus;
  words(paragraphs: Paragraph[]): DocParagraph[];
}

export function generate(source: TextSource, options: GenerateOptions): DocParagraph[] {
  return source.words(arrange(source.flow, options.arrangement, options.length, mulberry32(options.seed)));
}
