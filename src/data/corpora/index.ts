import { withoutSlurs } from '../../engine/blocklist';
import { tokenize, tokenizerFor, type Corpus } from '../../engine/tokenize';

/** A public-domain text the generator draws from. SOURCES.md records where each one came from. */
export interface SourceText {
  id: string;
  /** BCP 47 language tag. */
  language: string;
  title: string;
  author: string;
  /** When it was written or published, for display: "1883", "c. 50 BC". */
  date: string;
  /** The cleaned text. Each one is built as its own file and fetched only when first used. */
  load: () => Promise<string>;
}

export const SOURCE_TEXTS: readonly SourceText[] = [
  {
    id: 'en-treasure-island',
    language: 'en',
    title: 'Treasure Island',
    author: 'Robert Louis Stevenson',
    date: '1883',
    load: () => import('./en/treasure-island.txt?raw').then((module) => module.default),
  },
  {
    id: 'fr-trois-mousquetaires',
    language: 'fr',
    title: 'Les Trois Mousquetaires',
    author: 'Alexandre Dumas',
    date: '1844',
    load: () => import('./fr/trois-mousquetaires.txt?raw').then((module) => module.default),
  },
  {
    id: 'la-de-bello-gallico',
    language: 'la',
    title: 'De Bello Gallico',
    author: 'Julius Caesar',
    date: 'c. 50 BC',
    load: () => import('./la/de-bello-gallico.txt?raw').then((module) => module.default),
  },
  {
    id: 'is-saefarinn',
    language: 'is',
    title: 'Sæfarinn',
    author: 'Jules Verne, in an anonymous Icelandic translation',
    date: '1908',
    load: () => import('./is/saefarinn.txt?raw').then((module) => module.default),
  },
];

export function sourceText(id: string): SourceText {
  const source = SOURCE_TEXTS.find((text) => text.id === id);
  if (!source) throw new Error(`No source text "${id}"`);
  return source;
}

const loaded = new Map<string, Promise<Corpus>>();

/**
 * A source text split into paragraphs, sentences and words, without any sentence containing a
 * slur. Loaded once, then kept.
 */
export function loadCorpus(id: string): Promise<Corpus> {
  let corpus = loaded.get(id);
  if (!corpus) {
    corpus = Promise.resolve().then(async () => {
      const source = sourceText(id);
      return withoutSlurs(tokenize(await source.load(), tokenizerFor(source.language)), source.language);
    });
    // A failed download can be tried again.
    corpus.catch(() => loaded.delete(id));
    loaded.set(id, corpus);
  }
  return corpus;
}
