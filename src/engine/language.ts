/**
 * What a language is to the generator. There are three kinds:
 *
 * - **invented:** words built from a sound system and spelled by the language's rules, on the flow
 *   of a public-domain text (French, Latin, Old Norse).
 * - **vocabulary:** real words from a short word list, on another text's flow (classic lorem ipsum).
 * - **real:** the source text's own words, shuffled or not (English for Common). A real language
 *   can say its words too, as real French does, from their spelling.
 */
import { respeller, type Respeller, type SayOverrides } from './respell';
import { compileSounds, type SoundsDef, type SoundSystem, type StressRule, type WordSounds } from './sounds/system';
import { compileSpelling, type CompiledRule, type SpellingRule } from './spelling';

export interface PunctuationDef {
  /** Opening and closing quotation marks, with any space they take inside: ['« ', ' »']. */
  quotes: readonly [string, string];
  /** Marks that take a (no-break) space before them, as in French: '!?:;'. */
  spaceBefore?: string;
}

interface LanguageBase {
  id: string;
  name: string;
  /** The source text whose flow (sentence lengths, punctuation, which words repeat) it borrows. */
  flow: string;
  /** A tip for reading it aloud. */
  voicing?: string;
}

export interface InventedLanguageDef extends LanguageBase {
  kind: 'invented';
  sounds: SoundsDef;
  spelling: readonly SpellingRule[];
  say?: SayOverrides;
  punctuation: PunctuationDef;
  voicing: string;
}

export interface VocabularyLanguageDef extends LanguageBase {
  kind: 'vocabulary';
  /** The source text whose words it uses. */
  vocabulary: string;
  /** A sentence the text always starts with: "Lorem ipsum dolor sit amet…" */
  opening?: string;
  /** How a word from the list is said. */
  pronounce: (word: string) => WordSounds;
  stress: StressRule;
  say?: SayOverrides;
  voicing: string;
}

export interface RealLanguageDef extends LanguageBase {
  kind: 'real';
  /**
   * How a word of the text is said, for a real language with a "say it" line: one entry for each
   * part of a hyphenated word. Without it, the text is only written.
   */
  pronounce?: (word: string) => WordSounds[];
  /** Where its stress falls, when it says its words. */
  stress?: StressRule;
  say?: SayOverrides;
}

export type LanguageDef = InventedLanguageDef | VocabularyLanguageDef | RealLanguageDef;

export type Language =
  | (InventedLanguageDef & { system: SoundSystem; rules: CompiledRule[]; respell: Respeller })
  | (VocabularyLanguageDef & { respell: Respeller })
  | (RealLanguageDef & { respell?: Respeller });

export function compileLanguage(def: LanguageDef): Language {
  switch (def.kind) {
    case 'invented':
      return { ...def, system: compileSounds(def.sounds), rules: compileSpelling(def.spelling), respell: respeller(def.say) };
    case 'vocabulary':
      return { ...def, respell: respeller(def.say) };
    case 'real':
      return def.pronounce ? { ...def, respell: respeller(def.say) } : def;
  }
}

export function stressRule(language: Language): StressRule | null {
  if (language.kind === 'invented') return language.system.stress;
  if (language.kind === 'vocabulary') return language.stress;
  return language.pronounce ? (language.stress ?? 'phrase') : null;
}

/** What a language needs to say its words: where its stress falls, and its respelling for English readers. */
export interface Voice {
  rule: StressRule;
  respell: Respeller;
}

/** How the language says its words, or null for one that's only written (real English). */
export function voiceOf(language: Language): Voice | null {
  const rule = stressRule(language);
  return rule && language.respell ? { rule, respell: language.respell } : null;
}

/** Whether the language's words come with a "say it" line. */
export const isSpoken = (language: Language) => voiceOf(language) !== null;
