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
    id: 'la-lorem-ipsum',
    language: 'la',
    title: 'Lorem ipsum',
    author: 'after Cicero',
    date: '45 BC',
    load: () => import('./la/lorem-ipsum.txt?raw').then((module) => module.default),
  },
  {
    id: 'is-saefarinn',
    language: 'is',
    title: 'Sæfarinn',
    author: 'Jules Verne, in an anonymous Icelandic translation',
    date: '1908',
    load: () => import('./is/saefarinn.txt?raw').then((module) => module.default),
  },
  {
    id: 'es-don-quijote',
    language: 'es',
    title: 'Don Quijote',
    author: 'Miguel de Cervantes',
    date: '1605',
    load: () => import('./es/don-quijote.txt?raw').then((module) => module.default),
  },
  {
    id: 'pt-os-maias',
    language: 'pt',
    title: 'Os Maias',
    author: 'Eça de Queirós',
    date: '1888',
    load: () => import('./pt/os-maias.txt?raw').then((module) => module.default),
  },
  {
    id: 'it-promessi-sposi',
    language: 'it',
    title: 'I promessi sposi',
    author: 'Alessandro Manzoni',
    date: '1840',
    load: () => import('./it/promessi-sposi.txt?raw').then((module) => module.default),
  },
  {
    id: 'fi-seitseman-veljesta',
    language: 'fi',
    title: 'Seitsemän veljestä',
    author: 'Aleksis Kivi',
    date: '1870',
    load: () => import('./fi/seitseman-veljesta.txt?raw').then((module) => module.default),
  },
  {
    id: 'cy-cartrefi-cymru',
    language: 'cy',
    title: 'Cartrefi Cymru',
    author: 'Owen M. Edwards',
    date: '1896',
    load: () => import('./cy/cartrefi-cymru.txt?raw').then((module) => module.default),
  },
  {
    id: 'de-verwandlung',
    language: 'de',
    title: 'Die Verwandlung',
    author: 'Franz Kafka',
    date: '1915',
    load: () => import('./de/verwandlung.txt?raw').then((module) => module.default),
  },
  {
    id: 'enm-canterbury-prose',
    language: 'enm',
    title: 'The Canterbury Tales',
    author: 'Geoffrey Chaucer',
    date: 'c. 1390',
    load: () => import('./enm/canterbury-prose.txt?raw').then((module) => module.default),
  },
  {
    id: 'en-hamlet',
    language: 'en',
    title: 'Hamlet',
    author: 'William Shakespeare',
    date: 'c. 1600',
    load: () => import('./en/hamlet.txt?raw').then((module) => module.default),
  },
  {
    id: 'nah-chimalpahin',
    language: 'nah',
    title: 'Sixth and Seventh Relations',
    author: 'Domingo Chimalpahin',
    date: 'c. 1620',
    load: () => import('./nah/chimalpahin.txt?raw').then((module) => module.default),
  },
  {
    id: 'qu-tercero',
    language: 'qu',
    title: 'Tercero catecismo',
    author: 'the Third Council of Lima',
    date: '1585',
    load: () => import('./qu/tercero.txt?raw').then((module) => module.default),
  },
  {
    id: 'oj-catechism',
    language: 'oj',
    title: 'A Short Compendium of the Catechism for the Indians',
    author: 'N. L. Sifferath',
    date: '1869',
    load: () => import('./oj/catechism.txt?raw').then((module) => module.default),
  },
  {
    id: 'nv-narratives',
    language: 'nv',
    title: 'The Trouble at Round Rock and Navajo Historical Selections',
    author: 'Robert W. Young and William Morgan',
    date: '1952–54',
    load: () => import('./nv/narratives.txt?raw').then((module) => module.default),
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
      const corpus = withoutSlurs(tokenize(await source.load(), tokenizerFor(source.language)), source.language);
      return { ...corpus, language: source.language };
    });
    // A failed download can be tried again.
    corpus.catch(() => loaded.delete(id));
    loaded.set(id, corpus);
  }
  return corpus;
}
