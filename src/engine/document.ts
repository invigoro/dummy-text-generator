/**
 * Generated text as a document: every word keeps how it's written and, for a spoken language, how
 * it's said. The views (written, "say it", IPA) are all rendered from the same document, so
 * switching between them never changes the text.
 */
import type { PunctuationDef } from './language';
import { pieces, type Lexicon } from './lexicon';
import type { Respeller } from './respell';
import type { StressRule, Syllable, WordSounds } from './sounds/system';
import type { Paragraph, Token, TokenizeOptions } from './tokenize';
import type { Vocabulary } from './vocabulary';

export interface DocWord {
  kind: 'word';
  text: string;
  /** The word in Latin letters, for a language written in another alphabet. */
  latin?: string;
  /** How it's said: one entry per word it's made of ("sea-chest" has two). Missing for numbers and real words. */
  spoken?: WordSounds[];
}

export type DocToken = DocWord | { kind: 'punct'; text: string; quote?: 'open' | 'close' } | { kind: 'space'; text: string };

export interface DocSentence {
  tokens: DocToken[];
}

export interface DocParagraph {
  sentences: DocSentence[];
  /** In a conversation, who says it: their name and a colon, in the language. */
  speaker?: DocSentence;
}

/** Real words, as they are, and how each is said where the language can say them (real French). */
export function realWords(paragraphs: Paragraph[], pronounce?: (word: string) => WordSounds[]): DocParagraph[] {
  const convert = (token: Token): DocToken => {
    if (token.kind !== 'word' || !pronounce || isNumber(token.text)) return { ...token };
    const spoken = pronounce(token.text);
    return spoken.length > 0 ? { kind: 'word', text: token.text, spoken } : { kind: 'word', text: token.text };
  };
  return paragraphs.map((paragraph) => ({ sentences: paragraph.sentences.map((sentence) => ({ tokens: sentence.tokens.map(convert) })) }));
}

const ROMAN = /^(?=[MDCLXVI]{2,}$)M{0,4}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/;

/** Numbers stay numbers: digits, and Roman numerals of two letters or more ("XIII"). */
const isNumber = (text: string) => /^\p{N}+$/u.test(text) || ROMAN.test(text);

/** The invented word written with the source word's capitals: "Lérant", "LÉRANT" or "lérant". */
function caseLike(source: string, word: string): string {
  const letters = source.replace(/[^\p{L}]/gu, '');
  if (letters.length > 1 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) return word.toUpperCase();
  if (/^\p{Lu}/u.test(source)) return word.replace(/\p{L}/u, (letter) => letter.toUpperCase());
  return word;
}

/** One source word replaced by its invented word, keeping apostrophes, hyphens and capitals. */
export function inventWordToken(text: string, lexicon: Lexicon, elision: TokenizeOptions['elision'], prefixes?: readonly string[]): DocWord {
  // A kept word stays real, and has no "say it" form: it's read as it's written.
  if (isNumber(text) || lexicon.keeps(text)) return { kind: 'word', text };

  const parts = pieces(text, elision, prefixes);
  let written = '';
  // The same in Latin letters, for a language written in another alphabet.
  let latin = '';
  const inLatinToo = !!lexicon.language.latinRules;
  const spoken: WordSounds[] = [];
  // Consonants of a clitic waiting for the next word ("l’" before "homme").
  let pending: string[] = [];
  for (const piece of parts) {
    if (piece.kind === 'join') {
      written += piece.text;
      latin += piece.latin ?? piece.text;
      continue;
    }
    if (piece.clitic) {
      const clitic = lexicon.clitic(piece.text);
      written += caseLike(piece.text, clitic.spelling);
      latin += caseLike(piece.text, clitic.latin ?? clitic.spelling);
      if (elision === 'before') {
        pending = [...pending, ...clitic.consonants];
      } else if (spoken.length > 0) {
        // "’t" after "don": the consonant closes the word before it.
        const last = spoken[spoken.length - 1];
        const syllables = last.syllables.map((syllable, i, all): Syllable =>
          i === all.length - 1 ? { ...syllable, coda: [...syllable.coda, ...clitic.consonants] } : syllable,
        );
        spoken[spoken.length - 1] = { ...last, syllables };
      }
      continue;
    }
    const word = lexicon.word(piece.text);
    written += caseLike(piece.text, word.spelling);
    latin += caseLike(piece.text, word.latin ?? word.spelling);
    if (pending.length > 0) {
      const [first, ...rest] = word.sounds.syllables;
      spoken.push({ ...word.sounds, syllables: [{ ...first, onset: [...pending, ...first.onset] }, ...rest] });
      pending = [];
    } else {
      spoken.push(word.sounds);
    }
  }
  return {
    kind: 'word',
    text: written,
    ...(inLatinToo ? { latin } : {}),
    spoken: spoken.length > 0 ? spoken : undefined,
  };
}

/**
 * Initials and titles stay as they are ("M. de Tréville", "Mme Bonacieux", "C. Iulius"): an
 * invented word followed by a full stop would look like the end of a sentence.
 */
function isAbbreviation(text: string, next: Token | undefined, source: TokenizeOptions): boolean {
  if (source.abbreviations.has(text)) return true;
  return next?.kind === 'punct' && next.text === '.' && /^\p{Lu}$/u.test(text) && text !== 'I';
}

/** The paragraphs with every word replaced by a word from a vocabulary (lorem ipsum's). */
export function vocabularyWords(paragraphs: Paragraph[], vocabulary: Vocabulary, source: TokenizeOptions): DocParagraph[] {
  const convert = (token: Token, i: number, tokens: Token[]): DocToken => {
    if (token.kind !== 'word') return { ...token };
    if (isNumber(token.text) || isAbbreviation(token.text, tokens[i + 1], source)) return { kind: 'word', text: token.text };
    let written = '';
    const spoken: WordSounds[] = [];
    for (const piece of pieces(token.text, source.elision)) {
      if (piece.kind === 'join') {
        written += piece.text;
      } else {
        const word = vocabulary.word(piece.text);
        written += caseLike(piece.text, word.spelling);
        spoken.push(word.sounds);
      }
    }
    return { kind: 'word', text: written, spoken };
  };
  return paragraphs.map((paragraph) => ({ sentences: paragraph.sentences.map((sentence) => ({ tokens: sentence.tokens.map(convert) })) }));
}

/** A fixed sentence with each word said by `pronounce`: lorem ipsum's opening line. */
export function spokenSentence(tokens: readonly Token[], pronounce: (word: string) => WordSounds): DocSentence {
  return {
    tokens: tokens.map((token): DocToken => (token.kind === 'word' ? { kind: 'word', text: token.text, spoken: [pronounce(token.text)] } : { ...token })),
  };
}

/**
 * The paragraphs with every word replaced by its invented word, and quotation marks and spacing
 * changed to the invented language's own.
 */
export function inventedWords(
  paragraphs: Paragraph[],
  lexicon: Lexicon,
  source: TokenizeOptions,
  target: PunctuationDef,
): DocParagraph[] {
  const convert = (token: Token, i: number, tokens: Token[]): DocToken => {
    if (token.kind === 'word') {
      return isAbbreviation(token.text, tokens[i + 1], source)
        ? { kind: 'word', text: token.text }
        : inventWordToken(token.text, lexicon, source.elision, source.prefixes);
    }
    if (token.kind === 'punct' && token.quote && source.quotes.some((pair) => pair.includes(token.text))) {
      return { kind: 'punct', text: token.quote === 'open' ? target.quotes[0] : target.quotes[1], quote: token.quote };
    }
    return { ...token };
  };
  return paragraphs.map((paragraph) => ({
    sentences: paragraph.sentences.map((sentence) => ({ tokens: spaceLike(sentence.tokens.map(convert), target) })),
  }));
}

const NBSP = ' ';

/** Spacing by the language's rules: French puts a no-break space before ! ? : ; and inside « ». */
function spaceLike(tokens: DocToken[], target: PunctuationDef): DocToken[] {
  const spaceBefore = target.spaceBefore ?? '';
  const out: DocToken[] = [];
  for (const token of tokens) {
    const previous = out[out.length - 1];
    if (token.kind === 'punct' && token.text.length === 1 && spaceBefore.includes(token.text) && previous) {
      if (previous.kind === 'space') out[out.length - 1] = { kind: 'space', text: NBSP };
      else if (!(previous.kind === 'punct' && previous.text.endsWith(NBSP))) out.push({ kind: 'space', text: NBSP });
      out.push(token);
      continue;
    }
    // A quotation mark that brings its own space inside doesn't need another.
    if (token.kind === 'punct' && token.quote === 'close' && token.text.startsWith(NBSP) && previous?.kind === 'space') out.pop();
    if (token.kind === 'space' && previous?.kind === 'punct' && previous.quote === 'open' && previous.text.endsWith(NBSP)) continue;
    out.push(token);
  }
  return out;
}

export function sentenceText(sentence: DocSentence): string {
  return sentence.tokens.map((token) => token.text).join('');
}

export function paragraphText(paragraph: DocParagraph): string {
  const text = paragraph.sentences.map(sentenceText).join(' ');
  return paragraph.speaker ? `${sentenceText(paragraph.speaker)} ${text}` : text;
}

/** The written text: a blank line between paragraphs, or a line break between an inscription's lines. */
export function writtenText(paragraphs: readonly DocParagraph[], separator = '\n\n'): string {
  return paragraphs.map(paragraphText).join(separator);
}

export function countDocWords(paragraphs: readonly DocParagraph[]): number {
  let count = 0;
  for (const paragraph of paragraphs) for (const sentence of paragraph.sentences) for (const token of sentence.tokens) if (token.kind === 'word') count++;
  return count;
}

export interface SaidWord {
  say: string;
  ipa: string;
}

/** Punctuation that ends a phrase, where French-style stress falls. */
const PHRASE_END = /[,;:.!?…—–()]/u;

/**
 * How each word of a sentence is said (null for punctuation and spaces). Stress needs the whole
 * sentence: in French it falls on the last syllable before each comma or full stop.
 */
export function sayWords(sentence: DocSentence, rule: StressRule, respell: Respeller): (SaidWord | null)[] {
  const { tokens } = sentence;
  const endsPhrase = (index: number) => {
    for (let i = index + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.kind === 'word') return false;
      if (token.kind === 'punct' && PHRASE_END.test(token.text)) return true;
    }
    return true;
  };
  return tokens.map((token, index) => {
    if (token.kind !== 'word') return null;
    if (!token.spoken) return { say: latinDigits(token.latin ?? token.text), ipa: latinDigits(token.latin ?? token.text) };
    const last = endsPhrase(index);
    const said = token.spoken.map((word, part) => {
      const final = part === token.spoken!.length - 1;
      const stressed =
        rule === 'phrase' ? (last && final ? word.syllables.length - 1 : null) : word.syllables.length > 1 ? word.stress : null;
      return { say: respell.say(word, stressed), ipa: respell.ipa(word, stressed) };
    });
    return { say: said.map((s) => s.say).join(' '), ipa: said.map((s) => s.ipa).join(' ') };
  });
}

/** Punctuation a script writes its own way, as the Latin alphabet writes it: Arabic's ، ؛ ؟. */
const LATIN_PUNCTUATION: Readonly<Record<string, string>> = { '،': ',', '؛': ';', '؟': '?', '٪': '%' };

/** Digits of another script, such as Arabic's ٣, as 0 to 9. */
const latinDigits = (text: string) => text.replace(/[\u0660-\u0669]/gu, (digit) => String(digit.charCodeAt(0) - 0x0660));

/** A sentence's punctuation for English readers: plain quotation marks, and no French spaces. */
function plainPunctuation(token: DocToken): string {
  if (token.kind === 'punct' && token.quote) return token.quote === 'open' ? '“' : '”';
  if (token.kind === 'space' && token.text === NBSP) return '';
  if (token.kind === 'punct') return LATIN_PUNCTUATION[token.text] ?? token.text;
  return token.text;
}

/** A word with a capital: its first letter that has one, so "ʿalī" is "ʿAlī". */
const capitalized = (word: string) => word.replace(/\p{Ll}/u, (letter) => letter.toUpperCase());

/**
 * The text in Latin letters, for a language written in another alphabet, punctuated as Latin
 * letters are. Where the alphabet has no capitals, as Arabic's hasn't, a sentence starts with one,
 * and every word of a name (a speaker's, or each of a list of names) does.
 */
export function inLatin(paragraphs: readonly DocParagraph[], names = false): DocParagraph[] {
  const convert = (sentence: DocSentence, everyWord: boolean): DocSentence => {
    let first = true;
    const tokens = sentence.tokens.map((token): DocToken => {
      // A quotation starts with a capital too.
      if (token.kind === 'punct' && token.quote === 'open') first = true;
      if (token.kind === 'punct') return { ...token, text: LATIN_PUNCTUATION[token.text] ?? token.text };
      if (token.kind !== 'word') return token;
      const caseless = !/[\p{Lu}\p{Ll}]/u.test(token.text);
      const text = latinDigits(token.latin ?? token.text);
      const shown = caseless && (first || everyWord) ? capitalized(text) : text;
      first = false;
      return { ...token, text: shown };
    });
    return { tokens };
  };
  return paragraphs.map((paragraph) => ({
    sentences: paragraph.sentences.map((sentence) => convert(sentence, names)),
    ...(paragraph.speaker ? { speaker: convert(paragraph.speaker, true) } : {}),
  }));
}

/** The "say it" or IPA line for every paragraph. */
export function spokenText(
  paragraphs: readonly DocParagraph[],
  rule: StressRule,
  respell: Respeller,
  form: keyof SaidWord,
  separator = '\n\n',
): string {
  const spoken = (sentence: DocSentence) => {
    const said = sayWords(sentence, rule, respell);
    return sentence.tokens.map((token, i) => said[i]?.[form] ?? plainPunctuation(token)).join('');
  };
  return paragraphs
    .map((paragraph) => {
      const text = paragraph.sentences.map(spoken).join(' ');
      return paragraph.speaker ? `${spoken(paragraph.speaker)} ${text}` : text;
    })
    .join(separator);
}
