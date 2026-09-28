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

/**
 * Words an invented word must not turn out to be, in the languages its readers are likely to know:
 * English, since the "say it" line is read by English speakers, and the language it imitates.
 */
const OFFENSIVE: Readonly<Record<string, readonly string[]>> = {
  en: [
    'fuck', 'fuk', 'fucker', 'shit', 'shite', 'shyt', 'cunt', 'kunt', 'cock', 'kok', 'dick', 'dik', 'piss',
    'bitch', 'bich', 'twat', 'wank', 'wanker', 'slut', 'whore', 'hore', 'fag', 'fagot', 'faggot', 'nigger', 'nigga',
    'niga', 'niger', 'negro', 'spic', 'spik', 'kike', 'kyke', 'chink', 'gook', 'coon', 'kaffir', 'retard', 'rape',
    'rapist', 'porn', 'dildo', 'penis', 'vagina', 'tits', 'arse', 'ass', 'arsehole', 'asshole', 'bastard',
    'bollocks', 'bugger', 'crap', 'turd', 'jizz', 'cum', 'kum', 'anal', 'anus', 'nazi', 'hitler',
  ],
  fr: [
    'merde', 'putain', 'pute', 'salope', 'connard', 'connasse', 'con', 'conne', 'cul', 'bite', 'couille', 'couilles',
    'encule', 'nique', 'niquer', 'chier', 'foutre', 'branler', 'bordel', 'pede', 'negre', 'negresse', 'bougnoule',
    'youpin', 'tapette',
  ],
  la: ['cunnus', 'mentula', 'futuo', 'futue', 'pedico', 'irrumo', 'landica', 'verpa', 'cacare'],
  is: ['hora', 'tussa', 'kunta', 'typpi', 'rassgat'],
};

/** Roots too offensive to allow even inside a longer word. */
const OFFENSIVE_ROOTS = ['fuck', 'fuk', 'cunt', 'kunt', 'nigg', 'nigr', 'niga', 'fagot', 'faggot'];

/** Lowercase, without accents or the hyphens of the "say it" line. */
const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[-\s'’]/g, '');

/**
 * Whether an invented word is (or, read aloud, sounds like) a swear word or slur in English or in
 * the language it imitates. `language` is a BCP 47 tag.
 */
export function isOffensive(spelling: string, say: string, language: string): boolean {
  const code = language.toLowerCase().split('-')[0];
  const words = new Set([...OFFENSIVE.en, ...(OFFENSIVE[code] ?? []), ...(SLURS.en ?? []), ...(SLURS[code] ?? [])]);
  return [plain(spelling), plain(say)].some((form) => words.has(form) || OFFENSIVE_ROOTS.some((root) => form.includes(root)));
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
