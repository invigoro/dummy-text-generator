/**
 * The invented vocabulary of a language: one invented word for every distinct word of its source
 * text, the same every time. Frequent source words are short, so their invented words are too,
 * and "de" becomes one little word that turns up everywhere, as a real function word would.
 */
import { isOffensive } from './blocklist';
import type { Language } from './language';
import { hashString, mulberry32 } from './rng';
import { inventWord } from './sounds/words';
import type { WordSounds } from './sounds/system';
import { spell } from './spelling';
import type { Corpus, TokenizeOptions } from './tokenize';

type InventedLanguage = Extract<Language, { kind: 'invented' }>;

export interface InventedWord {
  /** The spelling, in lowercase. */
  spelling: string;
  sounds: WordSounds;
}

/** A short elided word, like "l’" or "’t": consonants only, said as part of the word next to it. */
export interface InventedClitic {
  spelling: string;
  consonants: string[];
}

/** One piece of a word token: "l’auteur" is l, ’ and auteur; "sea-chest" is sea, - and chest. */
export type Piece =
  | { kind: 'part'; text: string; clitic: boolean; vowelFirst: boolean }
  | { kind: 'join'; text: string };

const APOSTROPHE = /^['’]$/;

/**
 * A word token cut at its apostrophes and hyphens. Short elided words are clitics: before the
 * apostrophe in French ("l’", "qu’"), after it in English ("’t", "’ll"). A word after a French
 * elision starts with a vowel, and its invented word must too.
 */
export function pieces(text: string, elision: TokenizeOptions['elision'] = 'after'): Piece[] {
  const raw = text.split(/(['’-])/).filter((piece) => piece !== '');
  return raw.map((piece, i): Piece => {
    if (/^['’-]$/.test(piece)) return { kind: 'join', text: piece };
    const before = raw[i - 1];
    const after = raw[i + 1];
    const beforeWord = raw[i - 2];
    const afterWord = raw[i + 2];
    const letters = [...piece].length;
    const clitic =
      elision === 'before'
        ? !!after && APOSTROPHE.test(after) && !!afterWord && letters <= 3
        : !!before && APOSTROPHE.test(before) && !!beforeWord && !/^['’-]$/.test(beforeWord) && letters <= 2;
    const vowelFirst =
      elision === 'before' && !!before && APOSTROPHE.test(before) && !!beforeWord && [...beforeWord].length <= 3;
    return { kind: 'part', text: piece, clitic, vowelFirst };
  });
}

const VOWEL_GROUPS = /[aeiouyàâäáãåæéèêëíìîïóòôöõøœúùûüýÿ]+/giu;

/** Roughly how many syllables a word of the source text has, from its vowel letters. */
export function estimateSyllables(word: string, language: string): number {
  const lower = word.toLowerCase();
  let count = (lower.match(VOWEL_GROUPS) ?? []).length;
  // French and English leave final e silent: "porte", "parlent", "stone".
  const code = language.toLowerCase().split('-')[0];
  if ((code === 'fr' || code === 'en') && count > 1 && /[^aeiouy](e|es|ent)$/u.test(lower)) count--;
  return Math.max(1, count);
}

interface Entry {
  count: number;
  syllables: number;
  vowelFirst: boolean;
}

/** How often each word appears in the corpus, and what the lexicon needs to know about it. */
function survey(corpus: Corpus, language: string): Map<string, Entry> {
  const entries = new Map<string, Entry>();
  for (const paragraph of corpus.paragraphs) {
    for (const sentence of paragraph.sentences) {
      for (const token of sentence.tokens) {
        if (token.kind !== 'word') continue;
        for (const piece of pieces(token.text, corpus.options.elision)) {
          if (piece.kind !== 'part' || piece.clitic) continue;
          const key = piece.text.toLowerCase();
          const entry = entries.get(key);
          if (entry) {
            entry.count++;
            entry.vowelFirst ||= piece.vowelFirst;
          } else {
            entries.set(key, { count: 1, syllables: estimateSyllables(key, language), vowelFirst: piece.vowelFirst });
          }
        }
      }
    }
  }
  return entries;
}

const ATTEMPTS = 12;

export class Lexicon {
  readonly language: InventedLanguage;
  /** The corpus's language, as a BCP 47 tag, for estimating syllables. */
  private readonly sourceLanguage: string;
  private readonly words = new Map<string, InventedWord>();
  private readonly clitics = new Map<string, InventedClitic>();
  private readonly taken = new Set<string>();

  constructor(language: InventedLanguage, corpus: Corpus, sourceLanguage: string) {
    this.language = language;
    this.sourceLanguage = sourceLanguage;
    const entries = [...survey(corpus, sourceLanguage)].sort(([a, x], [b, y]) => y.count - x.count || (a < b ? -1 : 1));
    for (const [key, entry] of entries) this.words.set(key, this.invent(key, entry));
  }

  /** The invented word for a source word (any case). */
  word(source: string): InventedWord {
    const key = source.toLowerCase();
    let word = this.words.get(key);
    if (!word) {
      word = this.invent(key, { count: 0, syllables: estimateSyllables(key, this.sourceLanguage), vowelFirst: false });
      this.words.set(key, word);
    }
    return word;
  }

  /** The invented clitic for a short elided word, like "l’" or "’t". */
  clitic(source: string): InventedClitic {
    const key = source.toLowerCase();
    let clitic = this.clitics.get(key);
    if (!clitic) {
      clitic = this.inventClitic(key);
      this.clitics.set(key, clitic);
    }
    return clitic;
  }

  private invent(key: string, entry: Entry): InventedWord {
    const { system, rules, respell, id } = this.language;
    let candidate: InventedWord | undefined;
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const seed = hashString(`${id}/${key}/${attempt}`);
      const sounds = inventWord(system, mulberry32(seed), { syllables: entry.syllables, vowelFirst: entry.vowelFirst });
      const spelling = spell(sounds, rules, mulberry32(seed ^ 0x5bd1e995));
      const said = respell.say(sounds, sounds.stress);
      if (isOffensive(spelling, said, this.sourceLanguage)) continue;
      candidate = { spelling, sounds };
      // Two words that look alike would blur the vocabulary, though a few short ones may share.
      if (!this.taken.has(spelling)) break;
    }
    // Every attempt was offensive or taken: take the last clean one, or a plain fallback.
    const word = candidate ?? { spelling: 'a', sounds: { syllables: [{ onset: [], nucleus: 'a', coda: [] }], stress: 0 } };
    this.taken.add(word.spelling);
    return word;
  }

  private inventClitic(key: string): InventedClitic {
    const { system, rules, id } = this.language;
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const seed = hashString(`${id}/clitic/${key}/${attempt}`);
      const syllable = inventWord(system, mulberry32(seed), { syllables: 1 }).syllables[0];
      const consonants = syllable.onset.length > 0 ? syllable.onset : syllable.coda;
      if (consonants.length !== 1) continue;
      // Spell the consonant as it would be before "a", then drop the a.
      const written = spell({ syllables: [{ onset: consonants, nucleus: 'a', coda: [] }], stress: null }, rules, mulberry32(seed));
      const spelling = written.replace(/[aàâáä]+$/u, '');
      if (spelling) return { spelling, consonants };
    }
    return { spelling: 'l', consonants: ['l'] };
  }
}
