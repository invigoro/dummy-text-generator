/**
 * The "say it" line: invented words respelled for English readers, Wikipedia style, with
 * hyphens between syllables and the stressed one in capitals ("lay-RAHN"). Also IPA, for anyone
 * who reads it.
 */
import { phoneme, type Phoneme } from './sounds/phonemes';
import type { Syllable, WordSounds } from './sounds/system';

/** A language's own tweaks to how its vowels are respelled: Latin wants "IP-sum", not "IP-soom". */
export type SayOverrides = Readonly<Record<string, Partial<Pick<Phoneme, 'say' | 'sayClosed' | 'sayAlone'>>>>;

export interface Respeller {
  /** The word respelled, with `stressed` (a syllable index, or null for none) in capitals. */
  say(word: WordSounds, stressed: number | null): string;
  /** The word in IPA, with a stress mark before `stressed`. */
  ipa(word: WordSounds, stressed: number | null): string;
}

export function respeller(overrides: SayOverrides = {}): Respeller {
  const sound = (symbol: string) => ({ ...phoneme(symbol), ...overrides[symbol] });

  function saySyllable(syllable: Syllable, next: Syllable | undefined): string {
    const vowel = sound(syllable.nucleus);
    const onset = syllable.onset
      .map((symbol, i) => {
        // "g" before e or i reads as "j" (gem), so it gets an h (ghee).
        if (symbol === 'g' && i === syllable.onset.length - 1 && vowel.front) return 'gh';
        return sound(symbol).say;
      })
      .join('');
    const nucleus =
      syllable.onset.length === 0 && vowel.sayAlone
        ? vowel.sayAlone
        : syllable.coda.length > 0
          ? (vowel.sayClosed ?? vowel.say)
          : vowel.say;
    const coda = syllable.coda
      .map((symbol, i) => {
        const following = syllable.coda[i + 1] ?? next?.onset[0];
        if (symbol === 'ŋ' && (following === 'k' || following === 'g')) return 'n';
        // After a long vowel, a final s reads as z ("days"), so it doubles: "dayss".
        if (symbol === 's' && syllable.coda.length === 1 && nucleus.length > 1) return 'ss';
        return sound(symbol).say;
      })
      .join('');
    return onset + nucleus + coda;
  }

  return {
    say(word, stressed) {
      return word.syllables
        .map((syllable, i) => {
          const text = saySyllable(syllable, word.syllables[i + 1]);
          return i === stressed ? text.toUpperCase() : text;
        })
        .join('-');
    },
    ipa(word, stressed) {
      return word.syllables
        .map((syllable, i) => {
          const text = [...syllable.onset, syllable.nucleus, ...syllable.coda].join('');
          if (i === stressed) return `ˈ${text}`;
          return i === 0 ? text : `.${text}`;
        })
        .join('');
    },
  };
}
