/**
 * Writes an invented word's sounds in its language's own spelling. Each language lists rules in
 * order, and the first that fits a sound (or run of sounds) in its context wins:
 *
 *   { sounds: 'k', write: 'qu', before: 'front' }   // k before e or i is "qu" in French
 *   { sounds: 'o', write: 'eau:2 o:2 ot aud', before: '#' }   // several spellings at the end of a word
 *
 * A sound no rule covers is written as itself, which suits plain letters like "t" or "a".
 */
import type { Random } from './rng';
import { normalizeSound, phoneme } from './sounds/phonemes';
import { parseWeights, pick, weighted, type WeightedList, type WordSounds } from './sounds/system';

export interface SpellingRule {
  /** The sounds to match, separated by spaces: 'k', 'w a', 'ɛ l'. */
  sounds: string;
  /** What to write, as "letters:weight" choices. "∅" writes nothing. */
  write: string;
  /**
   * What must come next: sounds, or 'V' (a vowel), 'C' (a consonant), 'front' or 'back' (vowels),
   * 'labial', and '#' for the end of the word. Space-separated alternatives.
   */
  before?: string;
  /** What must come just before, in the same terms, with '#' for the start of the word. */
  after?: string;
  /** For a vowel: only in a syllable that ends with it ('open') or with a consonant ('closed'). */
  syllable?: 'open' | 'closed';
  /**
   * 'marked': only for the stressed vowel of a word whose stress is irregular and written with an
   * accent, as in Spanish "canción" or Italian "città".
   */
  stress?: 'marked';
}

interface Slot {
  sound: string;
  /** Whether this sound's syllable ends with a consonant. */
  closed: boolean;
  /** Whether this is the stressed vowel of a word whose stress is marked with an accent. */
  marked: boolean;
}

type Context = (slot: Slot | undefined) => boolean;

export interface CompiledRule {
  sounds: readonly string[];
  write: WeightedList<string>;
  before?: Context;
  after?: Context;
  syllable?: 'open' | 'closed';
  stress?: 'marked';
}

function context(alternatives: string): Context {
  const tests = alternatives
    .split(/\s+/)
    .filter(Boolean)
    .map((token): Context => {
      switch (token) {
        case '#':
          return (slot) => !slot;
        case 'V':
          return (slot) => !!slot && phoneme(slot.sound).type === 'vowel';
        case 'C':
          return (slot) => !!slot && phoneme(slot.sound).type === 'consonant';
        case 'front':
          return (slot) => !!slot && phoneme(slot.sound).type === 'vowel' && !!phoneme(slot.sound).front;
        case 'back':
          return (slot) => !!slot && phoneme(slot.sound).type === 'vowel' && !phoneme(slot.sound).front;
        case 'labial':
          return (slot) => !!slot && !!phoneme(slot.sound).labial;
        default: {
          phoneme(token); // an unknown sound is a mistake in the rules
          const sound = normalizeSound(token);
          return (slot) => slot?.sound === sound;
        }
      }
    });
  return (slot) => tests.some((test) => test(slot));
}

export function compileSpelling(rules: readonly SpellingRule[]): CompiledRule[] {
  return rules.map((rule) => {
    const sounds = rule.sounds.split(/\s+/).filter(Boolean).map(normalizeSound);
    for (const sound of sounds) phoneme(sound);
    return {
      sounds,
      write: weighted(parseWeights(rule.write).map(({ item, weight }) => ({ item: item === '∅' ? '' : item, weight }))),
      before: rule.before ? context(rule.before) : undefined,
      after: rule.after ? context(rule.after) : undefined,
      syllable: rule.syllable,
      stress: rule.stress,
    };
  });
}

function slots(word: WordSounds): Slot[] {
  return word.syllables.flatMap((syllable, index) => {
    const closed = syllable.coda.length > 0;
    const marked = !!word.marked && index === word.stress;
    return [
      ...syllable.onset.map((sound) => ({ sound: normalizeSound(sound), closed, marked: false })),
      { sound: normalizeSound(syllable.nucleus), closed, marked },
      ...syllable.coda.map((sound) => ({ sound: normalizeSound(sound), closed, marked: false })),
    ];
  });
}

function fits(rule: CompiledRule, sounds: readonly Slot[], at: number): boolean {
  if (at + rule.sounds.length > sounds.length) return false;
  for (let i = 0; i < rule.sounds.length; i++) if (sounds[at + i].sound !== rule.sounds[i]) return false;
  if (rule.syllable && (sounds[at].closed ? 'closed' : 'open') !== rule.syllable) return false;
  if (rule.stress === 'marked' && !sounds[at].marked) return false;
  if (rule.before && !rule.before(sounds[at + rule.sounds.length])) return false;
  if (rule.after && !rule.after(sounds[at - 1])) return false;
  return true;
}

/** The word in its language's spelling, lowercase. */
export function spell(word: WordSounds, rules: readonly CompiledRule[], random: Random): string {
  const sounds = slots(word);
  let written = '';
  for (let at = 0; at < sounds.length; ) {
    const rule = rules.find((candidate) => fits(candidate, sounds, at));
    if (rule) {
      written += pick(rule.write, random);
      at += rule.sounds.length;
    } else {
      // A long sound no rule covers is written doubled: "tː" as "tt", Finnish "aː" as "aa".
      const { sound } = sounds[at];
      written += sound.endsWith('ː') ? sound.slice(0, -1).repeat(2) : sound;
      at++;
    }
  }
  // Letters with accents composed, as they're typed: "á", not "a" and an accent.
  return written.normalize('NFC');
}
