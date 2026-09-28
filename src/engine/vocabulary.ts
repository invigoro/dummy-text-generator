/**
 * A vocabulary language's words: every distinct word of the flow text gets a real word from the
 * vocabulary, with about as many syllables. The most frequent words get the most frequent
 * vocabulary words, so classic lorem ipsum's "et", "in" and "ut" do the work of Caesar's.
 */
import { estimateSyllables, pieces } from './lexicon';
import type { Language } from './language';
import { hashString } from './rng';
import type { WordSounds } from './sounds/system';
import type { Corpus } from './tokenize';

type VocabularyLanguage = Extract<Language, { kind: 'vocabulary' }>;

export interface VocabularyWord {
  spelling: string;
  sounds: WordSounds;
}

function counts(corpus: Corpus): Map<string, number> {
  const found = new Map<string, number>();
  for (const paragraph of corpus.paragraphs) {
    for (const sentence of paragraph.sentences) {
      for (const token of sentence.tokens) {
        if (token.kind !== 'word') continue;
        for (const piece of pieces(token.text, corpus.options.elision)) {
          if (piece.kind !== 'part' || !/\p{L}/u.test(piece.text)) continue;
          const key = piece.text.toLowerCase();
          found.set(key, (found.get(key) ?? 0) + 1);
        }
      }
    }
  }
  return found;
}

const byFrequency = (found: Map<string, number>) => [...found].sort(([a, x], [b, y]) => y - x || (a < b ? -1 : 1));

export class Vocabulary {
  readonly language: VocabularyLanguage;
  /** The flow text's language, as a BCP 47 tag, for estimating syllables. */
  private readonly sourceLanguage: string;
  private readonly mapping = new Map<string, string>();
  /** Vocabulary words by syllable count, most frequent first. */
  private readonly bySyllables = new Map<number, string[]>();
  private readonly used = new Set<string>();

  constructor(language: VocabularyLanguage, flow: Corpus, vocabulary: Corpus, sourceLanguage: string) {
    this.language = language;
    this.sourceLanguage = sourceLanguage;
    for (const [word] of byFrequency(counts(vocabulary))) {
      const syllables = language.pronounce(word).syllables.length;
      this.bySyllables.set(syllables, [...(this.bySyllables.get(syllables) ?? []), word]);
    }
    for (const [key] of byFrequency(counts(flow))) this.mapping.set(key, this.choose(key));
  }

  word(source: string): VocabularyWord {
    const key = source.toLowerCase();
    let spelling = this.mapping.get(key);
    if (!spelling) {
      spelling = this.choose(key);
      this.mapping.set(key, spelling);
    }
    return { spelling, sounds: this.language.pronounce(spelling) };
  }

  /** The unused vocabulary word nearest in length, or, once all are used, one picked by the word's hash. */
  private choose(key: string): string {
    const target = estimateSyllables(key, this.sourceLanguage);
    const lengths = [...this.bySyllables.keys()].sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b);
    for (const length of lengths) {
      const unused = this.bySyllables.get(length)!.find((word) => !this.used.has(word));
      if (unused) {
        this.used.add(unused);
        return unused;
      }
    }
    const nearest = this.bySyllables.get(lengths[0])!;
    return nearest[hashString(key) % nearest.length];
  }
}
