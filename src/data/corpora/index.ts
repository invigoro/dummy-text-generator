import { tokenize, type Corpus } from '../../engine/tokenize';

/** A public-domain text the generator draws from. SOURCES.md records where each one came from. */
export interface SourceText {
  id: string;
  /** BCP 47 language tag. */
  language: string;
  title: string;
  author: string;
  year: number;
  /** The cleaned text. Each one is built as its own file and fetched only when first used. */
  load: () => Promise<string>;
}

export const SOURCE_TEXTS: readonly SourceText[] = [
  {
    id: 'en-treasure-island',
    language: 'en',
    title: 'Treasure Island',
    author: 'Robert Louis Stevenson',
    year: 1883,
    load: () => import('./en/treasure-island.txt?raw').then((module) => module.default),
  },
];

export function sourceText(id: string): SourceText {
  const source = SOURCE_TEXTS.find((text) => text.id === id);
  if (!source) throw new Error(`No source text "${id}"`);
  return source;
}

const loaded = new Map<string, Promise<Corpus>>();

/** A source text split into paragraphs, sentences and words. Loaded once, then kept. */
export function loadCorpus(id: string): Promise<Corpus> {
  let corpus = loaded.get(id);
  if (!corpus) {
    corpus = Promise.resolve()
      .then(() => sourceText(id).load())
      .then((text) => tokenize(text));
    // A failed download can be tried again.
    corpus.catch(() => loaded.delete(id));
    loaded.set(id, corpus);
  }
  return corpus;
}
