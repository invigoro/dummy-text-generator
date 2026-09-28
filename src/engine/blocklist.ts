/**
 * Words the generator never shows. A sentence of real text that contains a slur is left out, so
 * shuffling can't lift one out of its context. Checked in lowercase, with curly apostrophes made
 * straight.
 */
import type { Corpus, Sentence } from './tokenize';

const SLURS: Readonly<Record<string, readonly string[]>> = {
  en: [
    // Racial and ethnic terms common in 19th- and early 20th-century fiction.
    'negro', 'negroes', 'negress', 'negresses', 'nigger', 'niggers',
    'darkey', 'darkeys', 'darkie', 'darkies', 'darky',
    'half-blood', 'half-bloods', 'half-breed', 'half-breeds', 'mulatto', 'mulattoes', 'mulattos', 'quadroon', 'quadroons',
    'coolie', 'coolies', 'chinaman', 'chinamen', 'jap', 'japs',
    'squaw', 'squaws', 'redskin', 'redskins', 'kaffir', 'kaffirs',
    'gypsy', 'gypsies', 'gipsy', 'gipsies',
  ],
};

const normalize = (word: string) => word.toLowerCase().replace(/’/g, "'");

/** The slurs for a language, from its BCP 47 tag ("en-GB" uses "en"). */
function slursFor(language: string): ReadonlySet<string> {
  return new Set(SLURS[language.toLowerCase().split('-')[0]] ?? []);
}

export function isSlur(word: string, language: string): boolean {
  return slursFor(language).has(normalize(word));
}

/** The corpus without any sentence containing a slur, and without paragraphs left empty. */
export function withoutSlurs(corpus: Corpus, language: string): Corpus {
  const slurs = slursFor(language);
  if (slurs.size === 0) return corpus;
  const clean = (sentence: Sentence) => !sentence.tokens.some((token) => token.kind === 'word' && slurs.has(normalize(token.text)));
  return {
    ...corpus,
    paragraphs: corpus.paragraphs
      .map((paragraph) => ({ sentences: paragraph.sentences.filter(clean) }))
      .filter((paragraph) => paragraph.sentences.length > 0),
  };
}
