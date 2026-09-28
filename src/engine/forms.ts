/**
 * Text as a conversation or an inscription, besides prose. A conversation's lines are the speech in
 * the source text, shared out between two to four speakers; an inscription's are the source's
 * short phrases, one to a line. Either can keep the source's order or be shuffled, like prose.
 */
import { balanceQuotes, MAX_LENGTH, refill, wordPool, type Arrangement, type Length } from './arrange';
import { namesOf } from './names';
import { randomInt, shuffled, type Random } from './rng';
import { countWords, type Corpus, type Paragraph, type PunctToken, type Sentence, type Token, type TokenizeOptions } from './tokenize';

export type Form = 'prose' | 'conversation' | 'inscription' | 'names';

export const FORMS: readonly Form[] = ['prose', 'conversation', 'inscription', 'names'];

export const SPEAKERS = { min: 2, max: 4 } as const;

/** Speeches longer than this are monologues, not lines in a conversation. */
const MAX_LINE_WORDS = 40;
/** With fewer lines of speech than this, a conversation uses short sentences too. */
const MIN_SPEECH_LINES = 30;
const SHORT_SENTENCE_WORDS = 20;
/** An inscription's lines run from two words to seven. */
const PHRASE_WORDS = { min: 2, max: 7 } as const;

const SPACE: Token = { kind: 'space', text: ' ' };
const isWord = (token: Token) => token.kind === 'word';
const isPunct = (token: Token, pattern: RegExp) => token.kind === 'punct' && pattern.test(token.text);
const wordsIn = (tokens: readonly Token[]) => tokens.filter(isWord).length;

const DASH = /^[—–]$/u;
const ENDS = /^[.!?…]$/u;
const PAUSES = /^[,;:]$/u;

function trim(tokens: readonly Token[]): Token[] {
  let start = 0;
  let end = tokens.length;
  while (start < end && tokens[start].kind === 'space') start++;
  while (end > start && tokens[end - 1].kind === 'space') end--;
  return tokens.slice(start, end);
}

/** A quotation mark that encloses speech, rather than a single quote inside it. */
function isSpeechMark(token: Token, options: TokenizeOptions): token is PunctToken {
  return token.kind === 'punct' && !!token.quote && options.quotes.some((pair) => pair.includes(token.text));
}

const paragraphTokens = (paragraph: Paragraph): Token[] =>
  paragraph.sentences.flatMap((sentence, i) => (i === 0 ? sentence.tokens : [SPACE, ...sentence.tokens]));

/** What's said inside each quotation, in order: “I reckon,” he said—“I reckon…” has two parts. */
function quotations(tokens: readonly Token[], options: TokenizeOptions): Token[][] {
  const parts: Token[][] = [];
  let depth = 0;
  let part: Token[] = [];
  for (const token of tokens) {
    if (isSpeechMark(token, options)) {
      if (token.quote === 'open' && depth++ === 0) {
        part = [];
        continue;
      }
      if (token.quote === 'close') {
        // A stray closing mark belongs to a speech from the paragraph before.
        if (depth === 0) continue;
        if (--depth === 0) {
          parts.push(part);
          continue;
        }
      }
    }
    if (depth > 0) part.push(token);
  }
  // A speech running on into the next paragraph.
  if (depth > 0) parts.push(part);
  return parts.map(trim).filter((tokens) => tokens.some(isWord));
}

/** The parts of a speech as one line: “Kind,” sagte der Vater, “was sollen wir tun?” is "Kind, was sollen wir tun?" */
function joined(parts: readonly Token[][]): Token[] {
  const line: Token[] = [];
  for (const part of parts) {
    const last = line[line.length - 1];
    if (last) {
      // A part that starts with a capital starts a sentence: “Come here, sonny,” says he. “Come nearer.”
      // English "I" is always a capital.
      const first = part.find(isWord);
      const capital = !!first && /^\p{Lu}/u.test(first.text) && !/^I(?:$|['’])/u.test(first.text);
      const stop: Token = { kind: 'punct', text: capital ? '.' : ',' };
      if (isPunct(last, PAUSES)) {
        if (stop.text === '.') line[line.length - 1] = stop;
      } else if (!isPunct(last, ENDS) && !isPunct(last, DASH)) {
        line.push(stop);
      }
      line.push(SPACE);
    }
    line.push(...part);
  }
  return line;
}

/**
 * The line of a dialogue paragraph that starts with a dash, as in French, Spanish and Portuguese,
 * without the dash or, in Spanish, the asides between dashes: "—Sí —dijo Sancho—, lo haré" is
 * "Sí, lo haré".
 */
function dashLine(tokens: readonly Token[]): Token[] | null {
  const body = trim(tokens);
  if (!(body[0] && isPunct(body[0], DASH))) return null;
  const line: Token[] = [];
  const rest = trim(body.slice(1));
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    const next = rest[i + 1];
    const asideStarts = isPunct(token, DASH) && next?.kind === 'word' && /^\p{Ll}/u.test(next.text) && rest[i - 1]?.kind === 'space';
    if (!asideStarts) {
      line.push(token);
      continue;
    }
    // Skip to the dash that closes the aside, or to the end of the sentence.
    let end = i + 1;
    while (end < rest.length && !isPunct(rest[end], DASH) && !isPunct(rest[end], ENDS)) end++;
    if (line[line.length - 1]?.kind === 'space') line.pop();
    const closed = end < rest.length && isPunct(rest[end], DASH);
    // "—¿Qué gigantes? —dijo Sancho." already ends at its question mark, as does "—¿Pues? —dijo—. Oh".
    const ended = line.length > 0 && isPunct(line[line.length - 1], ENDS);
    if (closed) i = ended && rest[end + 1]?.text === '.' ? end + 1 : end;
    else i = ended ? end : end - 1;
  }
  return trim(line);
}

/** Names that start lines in a play's layout, as in Kivi's "Juhani. Jos siihen tulee…" */
function scriptSpeakers(corpus: Corpus): Set<string> {
  const counts = new Map<string, number>();
  for (const paragraph of corpus.paragraphs) {
    const name = scriptSpeaker(paragraph);
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, count]) => count >= 3).map(([name]) => name));
}

function scriptSpeaker(paragraph: Paragraph): string | null {
  const [first] = paragraph.sentences;
  if (paragraph.sentences.length < 2 || first.tokens.length !== 2) return null;
  const [name, stop] = first.tokens;
  return name.kind === 'word' && /^\p{Lu}/u.test(name.text) && stop.text === '.' ? name.text : null;
}

/**
 * A line that ends as a sentence would: “I reckon,” is "I reckon." A dash that only led into what
 * came next goes, but one against the last word stays, for a speech cut off: "Aber so—".
 */
function ended(tokens: Token[]): Token[] {
  const line = trim(tokens);
  if (line.length > 1 && isPunct(line[line.length - 1], DASH) && line[line.length - 2].kind === 'space') line.splice(-2);
  const last = line[line.length - 1];
  if (!last) return line;
  if (isPunct(last, PAUSES)) line[line.length - 1] = { kind: 'punct', text: '.' };
  else if (last.kind === 'word') line.push({ kind: 'punct', text: '.' });
  return line;
}

function capitalized(tokens: Token[]): Token[] {
  const i = tokens.findIndex(isWord);
  if (i < 0) return tokens;
  const text = tokens[i].text.replace(/\p{L}/u, (letter) => letter.toUpperCase());
  return tokens.map((token, j) => (j === i ? { kind: 'word', text } : token));
}

/** Marks that can't start a line: what's left of a sentence begun elsewhere, or dots for a pause (". . . hver"). */
function withoutLeadingMarks(tokens: Token[]): Token[] {
  let start = 0;
  while (start < tokens.length && (tokens[start].kind === 'space' || isPunct(tokens[start], /^[.,;:]$/u))) start++;
  return tokens.slice(start);
}

function asLine(tokens: Token[], options: TokenizeOptions): Sentence {
  const line = ended(withoutLeadingMarks(tokens));
  // A line that starts with an ellipsis carries on from something unsaid: "…og svo fór hann."
  return balanceQuotes({ tokens: line[0]?.text === '…' ? line : capitalized(line) }, options);
}

/** What a paragraph has someone say, if anything. */
function speechIn(paragraph: Paragraph, options: TokenizeOptions, speakers: ReadonlySet<string>): Token[] | null {
  const name = scriptSpeaker(paragraph);
  if (name && speakers.has(name)) return paragraphTokens({ sentences: paragraph.sentences.slice(1) });
  const tokens = paragraphTokens(paragraph);
  const dashed = dashLine(tokens);
  if (dashed) return dashed;
  const parts = quotations(tokens, options);
  return parts.length > 0 ? joined(parts) : null;
}

/** A text's lines of speech, phrases or names, worked out once and kept with it. */
function cached<T>(make: (corpus: Corpus) => T): (corpus: Corpus) => T {
  const found = new WeakMap<Corpus, T>();
  return (corpus) => {
    if (!found.has(corpus)) found.set(corpus, make(corpus));
    return found.get(corpus)!;
  };
}

const speechOf = cached((corpus) => speechLines(corpus));
const phrasesOf = cached((corpus) => phraseLines(corpus));


/** Every line of speech in the source, in order; its short sentences too, where it has little speech. */
export function speechLines(corpus: Corpus): Sentence[] {
  const { options } = corpus;
  const speakers = scriptSpeakers(corpus);
  const lines: Sentence[] = [];
  const narration: Sentence[] = [];
  for (const paragraph of corpus.paragraphs) {
    const line = speechIn(paragraph, options, speakers);
    if (!line) narration.push(...paragraph.sentences);
    else if (line.some((token) => token.kind === 'word' && /\p{L}{2}/u.test(token.text)) && wordsIn(line) <= MAX_LINE_WORDS) {
      lines.push(asLine(line, options));
    }
  }
  if (lines.length >= MIN_SPEECH_LINES) return lines;

  // Too little speech (Caesar has none): short sentences of narration stand in for it.
  const short = narration.filter((sentence) => countWords([sentence]) > 0 && countWords([sentence]) <= SHORT_SENTENCE_WORDS);
  const fallback = [...lines, ...short];
  return fallback.length > 0 ? fallback : narration.filter((sentence) => countWords([sentence]) > 0);
}

/** The source's short phrases, in order: clauses of two to seven words, without their punctuation. */
export function phraseLines(corpus: Corpus): Sentence[] {
  const phrases: Sentence[] = [];
  const add = (clause: Token[]) => {
    const tokens = trim(clause);
    const words = wordsIn(tokens);
    if (words >= PHRASE_WORDS.min && words <= PHRASE_WORDS.max) phrases.push({ tokens: capitalized(tokens) });
  };
  for (const paragraph of corpus.paragraphs) {
    for (const { tokens } of paragraph.sentences) {
      let clause: Token[] = [];
      let broken = false;
      tokens.forEach((token, i) => {
        if (token.kind !== 'punct') {
          // Spaces never pile up where punctuation was taken out.
          if (token.kind === 'word' || clause[clause.length - 1]?.kind === 'word') clause.push(token);
          return;
        }
        // A full stop inside a sentence belongs to an abbreviation ("M. de Tréville"), which would
        // read as a word without it: that clause is left out.
        if (token.text === '.' && tokens.slice(i + 1).some(isWord)) broken = true;
        if (token.text === '.' || /^[,;:—–()[\]!?…]$/u.test(token.text) || isSpeechMark(token, corpus.options)) {
          if (!broken) add(clause);
          clause = [];
          broken = false;
        }
      });
      if (!broken) add(clause);
    }
  }
  if (phrases.length >= 20) return phrases;
  // Too few (a short text of long, unbroken sentences): its words, seven at a time.
  const words = corpus.paragraphs.flatMap((paragraph) =>
    paragraph.sentences.flatMap((sentence) => sentence.tokens.filter((token) => token.kind === 'word')),
  );
  const chunks: Sentence[] = [];
  for (let i = 0; i < words.length; i += PHRASE_WORDS.max) {
    const chunk = words.slice(i, i + PHRASE_WORDS.max).flatMap((word, j) => (j === 0 ? [word] : [SPACE, word]));
    chunks.push({ tokens: capitalized(chunk) });
  }
  return [...phrases, ...chunks];
}

/** Lines from a pool until the length is reached: a number of lines, or of words. */
function take(lines: Iterator<Sentence, never>, length: Length): Paragraph[] {
  const count = Math.min(MAX_LENGTH[length.unit], Math.max(0, Math.floor(length.count)));
  const result: Paragraph[] = [];
  let words = 0;
  while (length.unit === 'paragraphs' ? result.length < count : words < count) {
    const line = lines.next().value;
    result.push({ sentences: [line] });
    words += countWords([line]);
  }
  return result;
}

/** A pool's lines in the arrangement asked for: in order from a random start, or shuffled. */
function* arranged(pool: readonly Sentence[], corpus: Corpus, arrangement: Arrangement, random: Random): Generator<Sentence, never> {
  if (arrangement === 'original') {
    for (let i = randomInt(random, pool.length); ; i = (i + 1) % pool.length) yield pool[i];
  }
  const words = arrangement === 'words' ? wordPool(corpus, random) : null;
  for (;;) for (const line of shuffled(pool, random)) yield words ? refill(line, words) : line;
}

export interface Conversation {
  /** One paragraph for each line. */
  lines: Paragraph[];
  /** For each line, which speaker says it: 0 to the number of speakers, less one. */
  order: number[];
  /** Source words to name the speakers with, in the order to try them. There are more than enough. */
  names: string[];
}

/** Lines of speech between two to four speakers, no one speaking twice in a row. */
export function conversation(corpus: Corpus, arrangement: Arrangement, length: Length, speakers: number, random: Random): Conversation {
  const speech = speechOf(corpus);
  const names = namesOf(corpus);
  if (speech.length === 0) return { lines: [], order: [], names: [] };
  const lines = take(arranged(speech, corpus, arrangement, random), length);
  const count = Math.min(SPEAKERS.max, Math.max(SPEAKERS.min, Math.floor(speakers)));
  // Everyone speaks in turn at first, then anyone but the last speaker.
  const order: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i < count) order.push(i);
    else {
      const other = randomInt(random, count - 1);
      order.push(other >= order[i - 1] ? other + 1 : other);
    }
  }
  // No one is named with a word that makes up a line: "Ned: Ned!"
  const said = new Set(
    lines
      .map((line) => line.sentences.flatMap((sentence) => sentence.tokens.filter(isWord)))
      .filter((words) => words.length === 1)
      .map(([word]) => word.text.toLowerCase()),
  );
  const usable = (words: readonly string[]) => words.filter((name) => !said.has(name.toLowerCase()));
  // A dozen of the commonest names, in a random order; then the rest, and other words if need be.
  const people = usable(names.people);
  return { lines, order, names: [...shuffled(people.slice(0, 12), random), ...people.slice(12), ...usable(names.others)] };
}

/** Short lines for an inscription. */
export function inscription(corpus: Corpus, arrangement: Arrangement, length: Length, random: Random): Paragraph[] {
  const phrases = phrasesOf(corpus);
  if (phrases.length === 0) return [];
  return take(arranged(phrases, corpus, arrangement, random), length);
}
