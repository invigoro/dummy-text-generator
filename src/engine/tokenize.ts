/**
 * Splits prose into paragraphs, sentences, words and punctuation, keeping everything needed to put
 * it back together exactly. A sentence never breaks inside a quotation, so a line of dialogue and
 * its "said he" stay together, with their quotation marks, however the text is shuffled.
 */

export interface WordToken {
  kind: 'word';
  text: string;
}

export interface SpaceToken {
  kind: 'space';
  text: string;
}

export interface PunctToken {
  kind: 'punct';
  text: string;
  /** Set on quotation marks: whether this one opens or closes a quotation. */
  quote?: 'open' | 'close';
}

export type Token = WordToken | SpaceToken | PunctToken;

/** A sentence, or several kept together because a quotation runs through them. */
export interface Sentence {
  tokens: Token[];
}

export interface Paragraph {
  sentences: Sentence[];
}

export interface Corpus {
  paragraphs: Paragraph[];
  /** The rules the text was split with, which also say how its quotation marks pair up. */
  options: TokenizeOptions;
  /** The text's language, as a BCP 47 tag, where it's known: how it names people and places. */
  language?: string;
}

export interface TokenizeOptions {
  /** Words that take a full stop without ending a sentence ("Mr" in "Mr. Hands"). */
  abbreviations: ReadonlySet<string>;
  /**
   * The quotation marks that enclose speech, as [opening, closing] pairs. A mark that is both its
   * own opening and closing mark (a straight quote) is told apart by what's around it.
   */
  quotes: readonly (readonly [string, string])[];
  /** Words written with a leading straight apostrophe ('em, 'tis), which otherwise opens a quote. */
  elisions: ReadonlySet<string>;
  /** Whether a lowercase letter and a full stop is an abbreviation too, as in Latin "a. u. c.". */
  lowercaseInitials?: boolean;
  /**
   * What to do, when sentences are shuffled, with a closing quotation mark whose opening one is in
   * an earlier paragraph. English and most languages add an opening mark ('open'). In French, where
   * « can open a whole exchange of lines that each start with a dash, the mark goes ('drop').
   */
  strayCloser?: 'open' | 'drop';
  /**
   * Which side of an apostrophe a short elided word sits on: before it in French ("l’homme",
   * "qu’il"), after it in English ("don’t", "he’ll").
   */
  elision?: 'before' | 'after';
  /** Little words written joined to the next, which are words of their own: Arabic's article ال. */
  prefixes?: readonly string[];
}

export const ENGLISH: TokenizeOptions = {
  abbreviations: new Set([
    'Mr', 'Mrs', 'Ms', 'Dr', 'St', 'Capt', 'Col', 'Gen', 'Lt', 'Sgt', 'Rev', 'Messrs', 'Jr', 'Sr', 'Esq', 'Mt',
  ]),
  quotes: [
    ['“', '”'],
    ['"', '"'],
  ],
  elisions: new Set(['em', 'tis', 'twas', 'twere', 'twill', 'twould', 'un', 'ere', 'n', 'cept', 'bout']),
  elision: 'after',
};

const FRENCH: TokenizeOptions = {
  abbreviations: new Set(['MM', 'Mme', 'Mmes', 'Mlle', 'Mlles', 'Mgr', 'Dr', 'St', 'Ste']),
  quotes: [
    ['«', '»'],
    ['“', '”'],
    ['"', '"'],
  ],
  elisions: new Set(),
  strayCloser: 'drop',
  elision: 'before',
};

const LATIN: TokenizeOptions = {
  // Roman first names and dates: Cn. Pompeius, a. d. VI Id. Nov.
  abbreviations: new Set(['Cn', 'Sp', 'Ti', 'Ser', 'Sex', 'Tib', 'App', 'Mam', 'Id', 'Kal', 'Non']),
  quotes: ENGLISH.quotes,
  elisions: new Set(),
  lowercaseInitials: true,
};

const ICELANDIC: TokenizeOptions = {
  abbreviations: new Set(['frv', 'bls', 'nr', 'sbr', 'þ']),
  quotes: [
    ['„', '“'],
    ['"', '"'],
  ],
  elisions: new Set(),
  lowercaseInitials: true,
};

const SPANISH: TokenizeOptions = {
  abbreviations: new Set(['Sr', 'Sra', 'Srta', 'Sres', 'Dña', 'Ud', 'Uds', 'Vd', 'Vds', 'Dr', 'Sto', 'Sta']),
  quotes: FRENCH.quotes,
  elisions: new Set(),
};

const PORTUGUESE: TokenizeOptions = {
  abbreviations: new Set(['Sr', 'Sra', 'Srs', 'Snr', 'Snra', 'Dr', 'Exc', 'Exma', 'Exmo', 'Sta', 'Sto', 'Mme', 'Ex']),
  quotes: FRENCH.quotes,
  elisions: new Set(),
  // Older Portuguese elides like French: "d'Israel", "n'uma".
  elision: 'before',
};

const ITALIAN: TokenizeOptions = {
  abbreviations: new Set(['Sig', 'Sigg', 'Sigra', 'Dott', 'Prof', 'Don', 'Mons']),
  quotes: FRENCH.quotes,
  elisions: new Set(),
  // "l'uomo", "dell'Adda", "un'altra".
  elision: 'before',
};

const FINNISH: TokenizeOptions = {
  abbreviations: new Set(['esim', 'ks', 'mm', 'n', 'ym', 'yms', 'jne']),
  // Finnish opens and closes a quotation with the same mark: »Niin», sanoi hän.
  quotes: [
    ['»', '»'],
    ['”', '”'],
    ['"', '"'],
  ],
  elisions: new Set(),
  lowercaseInitials: true,
};

const WELSH: TokenizeOptions = {
  abbreviations: new Set(['Mr', 'Mrs', 'Dr', 'St', 'Parch']),
  quotes: ENGLISH.quotes,
  elisions: new Set(),
  // "i’r", "a’r", "Cymru’n": the short word follows the apostrophe.
  elision: 'after',
};

const GERMAN: TokenizeOptions = {
  abbreviations: new Set(['Hr', 'Hrn', 'Fr', 'Frl', 'Dr', 'St', 'Nr', 'usw', 'bzw', 'vgl', 'ca']),
  // German prints quotations »like this« or „like this“.
  quotes: [
    ['»', '«'],
    ['„', '“'],
    ['"', '"'],
  ],
  elisions: new Set(),
  lowercaseInitials: true,
  elision: 'after',
};

const MIDDLE_ENGLISH: TokenizeOptions = {
  abbreviations: new Set(),
  // Skeat's Chaucer puts speech in single marks, and what someone quotes in double ones.
  quotes: [
    ['‘', '’'],
    ['“', '”'],
  ],
  elisions: new Set(),
  elision: 'after',
};

const RUSSIAN: TokenizeOptions = {
  abbreviations: new Set(['г', 'гг', 'т', 'тт', 'д', 'пр', 'др', 'см', 'ул']),
  quotes: [
    ['«', '»'],
    ['„', '“'],
  ],
  elisions: new Set(),
};

const ARABIC: TokenizeOptions = {
  abbreviations: new Set(),
  quotes: [
    ['«', '»'],
    ['“', '”'],
    ['"', '"'],
  ],
  elisions: new Set(),
  // The article, and the article after "and", "with" and "so".
  prefixes: ['وال', 'بال', 'فال', 'ال'],
};

const DUTCH: TokenizeOptions = {
  abbreviations: new Set(['Mr', 'Mevr', 'Dr', 'St', 'bijv', 'enz', 'blz', 'jhr', 'mej']),
  // Van Eeden puts speech in straight single quotes: 'Ja Johannes!'
  quotes: [
    ["'", "'"],
    ['„', '”'],
    ['“', '”'],
    ['"', '"'],
  ],
  // 't, 's, 'n and 'k: het, des, een and ik.
  elisions: new Set(['t', 's', 'n', 'k']),
  elision: 'after',
};

const TOKENIZERS: Readonly<Record<string, TokenizeOptions>> = {
  en: ENGLISH,
  fr: FRENCH,
  la: LATIN,
  is: ICELANDIC,
  es: SPANISH,
  pt: PORTUGUESE,
  it: ITALIAN,
  fi: FINNISH,
  cy: WELSH,
  de: GERMAN,
  enm: MIDDLE_ENGLISH,
  ru: RUSSIAN,
  ar: ARABIC,
  nl: DUTCH,
};

/** The options for text in a language, from its BCP 47 tag. English rules if there are none. */
export function tokenizerFor(language: string): TokenizeOptions {
  return TOKENIZERS[language.toLowerCase().split('-')[0]] ?? ENGLISH;
}

/** Letters and digits, with apostrophes or hyphens allowed between them ("Cap’n", "sea-chest"). */
const WORD = /[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*/uy;
const SPACE = /\s+/uy;
// Arabic's question mark is ؟.
const STOP = /^[.!?…؟]$/u;
const SINGLE_QUOTES = new Set(['‘', '’', "'"]);

function lex(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    SPACE.lastIndex = i;
    const space = SPACE.exec(text);
    if (space) {
      tokens.push({ kind: 'space', text: space[0] });
      i += space[0].length;
      continue;
    }
    WORD.lastIndex = i;
    const word = WORD.exec(text);
    if (word) {
      tokens.push({ kind: 'word', text: word[0] });
      i += word[0].length;
      continue;
    }
    const char = String.fromCodePoint(text.codePointAt(i)!);
    tokens.push({ kind: 'punct', text: char });
    i += char.length;
  }
  return tokens;
}

/**
 * Decides, for each single quotation mark or apostrophe at the edge of a word, which it is. An
 * apostrophe joins the word (’em, o’, lyin’); a quotation mark stays punctuation, marked as opening
 * or closing. A trailing mark closes a quotation only while a single quotation is open.
 */
function resolveApostrophes(tokens: Token[], options: TokenizeOptions): Token[] {
  const out: Token[] = [];
  let open = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind !== 'punct' || !SINGLE_QUOTES.has(token.text)) {
      out.push(token);
      continue;
    }
    const prev = out[out.length - 1];
    const next = tokens[i + 1];
    const afterWord = prev?.kind === 'word';
    const beforeWord = next?.kind === 'word';

    if (token.text === '‘') {
      open++;
      out.push({ ...token, quote: 'open' });
    } else if (!afterWord && beforeWord) {
      // A curly ’ never opens a quotation, so before a word it's always an apostrophe.
      if (token.text === '’' || options.elisions.has(next.text.toLowerCase())) {
        tokens[i + 1] = { kind: 'word', text: token.text + next.text };
      } else {
        open++;
        out.push({ ...token, quote: 'open' });
      }
    } else if (open > 0) {
      open--;
      out.push({ ...token, quote: 'close' });
    } else if (afterWord) {
      out[out.length - 1] = { kind: 'word', text: prev.text + token.text };
    } else {
      out.push(token);
    }
  }
  return out;
}

/** Marks each quotation mark for speech as opening or closing. */
function markQuotes(tokens: Token[], options: TokenizeOptions): Token[] {
  return tokens.map((token, i) => {
    if (token.kind !== 'punct' || token.quote) return token;
    const pair = options.quotes.find(([opening, closing]) => token.text === opening || token.text === closing);
    if (!pair) return token;
    const [opening, closing] = pair;
    if (opening !== closing) return { ...token, quote: token.text === opening ? 'open' : 'close' };
    // A straight quote opens after a space, at the start, or after an opening bracket or dash.
    const prev = tokens[i - 1];
    const opens =
      !prev || prev.kind === 'space' || (prev.kind === 'punct' && (prev.quote === 'open' || /^[([{—–-]$/u.test(prev.text)));
    return { ...token, quote: opens ? 'open' : 'close' };
  });
}

/** Whether a token is a quotation mark for speech (not a single quote inside speech). */
function isSpeechMark(token: Token, options: TokenizeOptions): token is PunctToken {
  return token.kind === 'punct' && !!token.quote && options.quotes.some((pair) => pair.includes(token.text));
}

function depthAfter(depth: number, token: Token, options: TokenizeOptions): number {
  if (!isSpeechMark(token, options)) return depth;
  // A stray closing mark (a speech carried over from the previous paragraph) never goes below zero.
  return token.quote === 'open' ? depth + 1 : Math.max(0, depth - 1);
}

/** Marks that can follow a full stop and still belong to the same sentence: .” ?) !’ … */
function isEndingMark(token: Token): boolean {
  return token.kind === 'punct' && (STOP.test(token.text) || token.quote === 'close' || token.text === ')' || token.text === ']');
}

function isAbbreviation(tokens: Token[], stop: number, options: TokenizeOptions): boolean {
  const word = tokens[stop - 1];
  if (word?.kind !== 'word') return false;
  // A single capital is an initial ("J. F. Flint"), except the pronoun I.
  return (
    options.abbreviations.has(word.text) ||
    (/^\p{Lu}$/u.test(word.text) && word.text !== 'I') ||
    (!!options.lowercaseInitials && /^\p{Ll}$/u.test(word.text))
  );
}

/** A capital starts a sentence, or a number; so does any letter of a script without capitals, as Arabic is. */
const startsUpper = (text: string) => /^[\p{Lu}\p{Lt}\p{Lo}\p{N}]/u.test(text);

function startsSentence(tokens: Token[], index: number, afterQuotation: boolean): boolean {
  const token = tokens[index];
  if (token.kind === 'word') {
    // “Much hurt?” I asked him: after a quotation, "I" is usually the start of "I said".
    if (afterQuotation && /^I(?:$|['’])/u.test(token.text)) return false;
    return startsUpper(token.text);
  }
  if (token.kind === 'punct' && token.quote === 'open') {
    const next = tokens[index + 1];
    return next?.kind !== 'word' || startsUpper(next.text);
  }
  return token.kind === 'punct' && (token.text === '(' || token.text === '[');
}

function trimSpaces(tokens: Token[]): Token[] {
  let start = 0;
  let end = tokens.length;
  while (start < end && tokens[start].kind === 'space') start++;
  while (end > start && tokens[end - 1].kind === 'space') end--;
  return tokens.slice(start, end);
}

function splitSentences(tokens: Token[], options: TokenizeOptions): Sentence[] {
  const sentences: Sentence[] = [];
  let start = 0;
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    depth = depthAfter(depth, tokens[i], options);
    const token = tokens[i];
    if (token.kind !== 'punct' || !STOP.test(token.text)) continue;

    const stop = i;
    let afterQuotation = false;
    while (i + 1 < tokens.length && isEndingMark(tokens[i + 1])) {
      i++;
      depth = depthAfter(depth, tokens[i], options);
      if (isSpeechMark(tokens[i], options)) afterQuotation = true;
    }
    if (depth > 0) continue;
    if (token.text === '.' && isAbbreviation(tokens, stop, options)) continue;

    let next = i + 1;
    while (next < tokens.length && tokens[next].kind === 'space') next++;
    if (next >= tokens.length || !startsSentence(tokens, next, afterQuotation)) continue;

    sentences.push({ tokens: trimSpaces(tokens.slice(start, i + 1)) });
    start = next;
    i = next - 1;
  }
  const rest = trimSpaces(tokens.slice(start));
  if (rest.length > 0) sentences.push({ tokens: rest });
  return sentences;
}

/** One paragraph of prose. Line breaks and runs of spaces inside it become single spaces. */
export function tokenizeParagraph(text: string, options: TokenizeOptions = ENGLISH): Paragraph {
  const tokens = markQuotes(resolveApostrophes(lex(text.replace(/\s+/gu, ' ').trim()), options), options);
  return { sentences: splitSentences(tokens, options) };
}

/** Prose with paragraphs separated by blank lines. */
export function tokenize(text: string, options: TokenizeOptions = ENGLISH): Corpus {
  return {
    paragraphs: text
      .replace(/\r\n?/g, '\n')
      .split(/\n[ \t]*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
      .map((paragraph) => tokenizeParagraph(paragraph, options)),
    options,
  };
}

export function renderSentence(sentence: Sentence): string {
  return sentence.tokens.map((token) => token.text).join('');
}

export function renderParagraph(paragraph: Paragraph): string {
  return paragraph.sentences.map(renderSentence).join(' ');
}

export function countWords(sentences: readonly Sentence[]): number {
  let count = 0;
  for (const sentence of sentences) for (const token of sentence.tokens) if (token.kind === 'word') count++;
  return count;
}
