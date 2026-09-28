import { arrange, type Arrangement, type Length } from './arrange';
import { mulberry32 } from './rng';
import { countWords, renderParagraph, type Corpus } from './tokenize';

export interface GenerateOptions {
  arrangement: Arrangement;
  length: Length;
  /** The same seed and options always give the same text. */
  seed: number;
}

export interface GeneratedText {
  paragraphs: string[];
  words: number;
}

export function generate(corpus: Corpus, options: GenerateOptions): GeneratedText {
  const paragraphs = arrange(corpus, options.arrangement, options.length, mulberry32(options.seed));
  return {
    paragraphs: paragraphs.map(renderParagraph),
    words: paragraphs.reduce((count, paragraph) => count + countWords(paragraph.sentences), 0),
  };
}

/** The text as plain text, with a blank line between paragraphs. */
export function plainText(text: GeneratedText): string {
  return text.paragraphs.join('\n\n');
}
