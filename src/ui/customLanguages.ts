/**
 * Languages made in the builder. Each is an invented language's definition, like the built-in ones
 * in data/languages, under an id of its own ("my-grukk-4k2x9"). They're kept in the browser,
 * exported and imported as JSON, and carried in share links. Anything read back is checked and
 * compiled before it's used, and a definition that doesn't compile is refused.
 */
import { SOURCE_TEXTS } from '../data/corpora';
import type { Setting } from '../data/settings';
import { compileLanguage, type InventedLanguageDef, type PunctuationDef } from '../engine/language';
import { mulberry32 } from '../engine/rng';
import type { SoundsDef, StressRule } from '../engine/sounds/system';
import { inventWord } from '../engine/sounds/words';
import { spell, type SpellingRule } from '../engine/spelling';
import { defaultStele, slug, uniqueId } from './customSettings';

/** A language made in the builder: an invented language, and the built-in one it started from. */
export type CustomLanguageDef = InventedLanguageDef & { basedOn?: string };

const STORAGE_KEY = 'dummy-text:languages';
const MAX_LANGUAGES = 30;
const MAX_NAME = 40;
/** Enough for invented English, the most spelled-out language here, with room to spare. */
const MAX_RULES = 300;

export const STRESS_RULES: readonly StressRule[] = ['initial', 'penultimate', 'final', 'phrase', 'latin', 'spanish', 'portuguese'];

/** The texts a language can take its flow from: all but lorem ipsum's short word list. */
export const FLOWS = SOURCE_TEXTS.filter((text) => text.id !== 'la-lorem-ipsum');

const NBSP = ' ';

/** Quotation marks a language can use, with any space they take inside, and a name for each. */
export const QUOTE_STYLES: readonly { quotes: readonly [string, string]; name: string }[] = [
  { quotes: ['“', '”'], name: 'English' },
  { quotes: ['‘', '’'], name: 'English, single' },
  { quotes: [`«${NBSP}`, `${NBSP}»`], name: 'French, spaced' },
  { quotes: ['«', '»'], name: 'Spanish and Italian' },
  { quotes: ['„', '“'], name: 'German and Icelandic' },
  { quotes: ['»', '«'], name: 'German, pointing in' },
  { quotes: ['”', '”'], name: 'Finnish' },
  { quotes: ['»', '»'], name: 'Finnish, pointing on' },
  { quotes: ['「', '」'], name: 'corner brackets' },
];

export const isCustomLanguage = (id: string) => id.startsWith('my-');

/** The id of the setting that lists your own languages under their own names. */
export const YOUR_LANGUAGES = 'mine';

export function languagesSetting(languages: readonly CustomLanguageDef[]): Setting {
  return {
    id: YOUR_LANGUAGES,
    name: 'Your languages',
    choices: languages.map((def) => ({ id: def.id, name: def.name, language: def.id, stele: defaultStele(def.basedOn ?? '') })),
  };
}

/** A new language's id: its name and a few random letters, so two people's languages never clash. */
export function newLanguageId(name: string, taken: ReadonlySet<string>): string {
  const random = Math.random().toString(36).slice(2, 7).padEnd(5, '0');
  return uniqueId(`my-${slug(name)}-${random}`, taken);
}

/** A language to start from nothing with: five vowels, a handful of consonants, plain spelling. */
export const SCRATCH: Omit<CustomLanguageDef, 'id' | 'name'> = {
  kind: 'invented',
  flow: 'en-treasure-island',
  sounds: {
    classes: { C: 'p t k b d g m n s l r v', V: 'a e i o u', F: 'n s r l' },
    syllables: 'CV:5 CVF:2 V:1',
    stress: 'penultimate',
  },
  spelling: [],
  punctuation: { quotes: ['“', '”'] },
  voicing: '',
};

/** A new language: a copy of a built-in one to change, or the plain one to start from nothing. */
export function newLanguage(base: InventedLanguageDef | null, taken: ReadonlySet<string>): CustomLanguageDef {
  const name = base ? `New ${base.name}` : 'New language';
  const start = base ? (JSON.parse(JSON.stringify(base)) as InventedLanguageDef) : SCRATCH;
  return { ...start, kind: 'invented', id: newLanguageId(name, taken), name, ...(base ? { basedOn: base.id } : {}) };
}

const text = (value: unknown, max: number): string | undefined => (typeof value === 'string' && value.length <= max ? value : undefined);

/** A list of sounds or shapes, as it's kept: single spaces, and none at either end. */
const tidy = (list: string) => list.trim().replace(/\s+/g, ' ');

/**
 * Whether a pattern of sounds to avoid is safe to run: short, compiling, and without a repeated
 * group of repeats ("(a+)+"), which could take forever on an unlucky word.
 */
export function isSafePattern(pattern: unknown): pattern is string {
  if (typeof pattern !== 'string' || pattern.length === 0 || pattern.length > 60) return false;
  if (/\([^()]*[*+?}][^()]*\)[*+?{]/.test(pattern)) return false;
  try {
    new RegExp(pattern, 'u');
    return true;
  } catch {
    return false;
  }
}

function sanitizeSounds(value: unknown): SoundsDef | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (!input.classes || typeof input.classes !== 'object') return null;
  const classes: Record<string, string> = {};
  for (const [name, list] of Object.entries(input.classes as Record<string, unknown>).slice(0, 26)) {
    if (/^\p{Lu}$/u.test(name) && typeof list === 'string' && list.length <= 600) classes[name] = tidy(list);
  }
  const syllables = text(input.syllables, 200);
  const stress = STRESS_RULES.find((rule) => rule === input.stress);
  if (!syllables || !stress) return null;

  const sounds: SoundsDef = { classes, syllables: tidy(syllables), stress };
  for (const key of ['first', 'last', 'single'] as const) {
    const shapes = text(input[key], 200);
    if (shapes?.trim()) sounds[key] = tidy(shapes);
  }
  if (typeof input.hiatus === 'boolean') sounds.hiatus = input.hiatus;
  const max = input.maxSyllables;
  if (typeof max === 'number' && Number.isInteger(max) && max >= 1 && max <= 8) sounds.maxSyllables = max;
  if (Array.isArray(input.avoid)) {
    const avoid = input.avoid.filter(isSafePattern).slice(0, 20);
    if (avoid.length > 0) sounds.avoid = avoid;
  }
  const irregular = input.irregularStress as Record<string, unknown> | undefined;
  if (irregular && typeof irregular === 'object') {
    const chance = irregular.chance;
    const to = Array.isArray(irregular.to) ? irregular.to.filter((place) => place === 'final' || place === 'antepenultimate') : [];
    const marked = (['all', 'final', 'none'] as const).find((value) => value === irregular.marked);
    if (typeof chance === 'number' && chance > 0 && chance <= 1 && to.length > 0 && marked) sounds.irregularStress = { chance, to, marked };
  }
  return sounds;
}

function sanitizeSpelling(value: unknown): SpellingRule[] {
  if (!Array.isArray(value)) return [];
  const rules: SpellingRule[] = [];
  for (const item of value.slice(0, MAX_RULES)) {
    if (!item || typeof item !== 'object') continue;
    const input = item as Record<string, unknown>;
    const sounds = text(input.sounds, 40);
    const write = text(input.write, 120);
    if (!sounds?.trim() || write === undefined || !write.trim()) continue;
    const rule: SpellingRule = { sounds, write };
    const before = text(input.before, 80);
    const after = text(input.after, 80);
    if (before?.trim()) rule.before = before;
    if (after?.trim()) rule.after = after;
    if (input.syllable === 'open' || input.syllable === 'closed') rule.syllable = input.syllable;
    if (input.stress === 'marked') rule.stress = 'marked';
    rules.push(rule);
  }
  return rules;
}

type SayOverride = { say?: string; sayClosed?: string; sayAlone?: string };

function sanitizeSay(value: unknown): Record<string, SayOverride> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const say: Record<string, SayOverride> = {};
  for (const [sound, override] of Object.entries(value as Record<string, unknown>).slice(0, 60)) {
    if (sound.length > 6 || !override || typeof override !== 'object') continue;
    const clean: SayOverride = {};
    for (const key of ['say', 'sayClosed', 'sayAlone'] as const) {
      const spelled = (override as Record<string, unknown>)[key];
      if (typeof spelled === 'string' && /^[a-z'-]{1,10}$/.test(spelled)) clean[key] = spelled;
    }
    if (Object.keys(clean).length > 0) say[sound] = clean;
  }
  return Object.keys(say).length > 0 ? say : undefined;
}

function sanitizePunctuation(value: unknown): PunctuationDef {
  const input = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const quotes = Array.isArray(input.quotes) ? input.quotes : [];
  const style = (QUOTE_STYLES.find(({ quotes: [open, close] }) => quotes[0] === open && quotes[1] === close) ?? QUOTE_STYLES[0]).quotes;
  const spaceBefore = typeof input.spaceBefore === 'string' ? [...new Set(input.spaceBefore)].filter((mark) => '!?:;'.includes(mark)).join('') : '';
  return spaceBefore ? { quotes: [style[0], style[1]], spaceBefore } : { quotes: [style[0], style[1]] };
}

/**
 * Whether a definition compiles, and makes words: the first thing wrong with it if not. The
 * builder shows it; anything read back that fails is refused.
 */
export function languageProblem(def: InventedLanguageDef): string | null {
  try {
    const language = compileLanguage(def);
    if (language.kind !== 'invented') return 'Not an invented language';
    const word = inventWord(language.system, mulberry32(1), { syllables: 2 });
    spell(word, language.rules, mulberry32(2));
    language.respell.say(word, word.stress);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** A valid language from untrusted data (storage, a file, a link), or null. */
export function sanitizeLanguage(data: unknown): CustomLanguageDef | null {
  if (!data || typeof data !== 'object') return null;
  const input = data as Record<string, unknown>;
  const sounds = sanitizeSounds(input.sounds);
  if (!sounds) return null;
  const name = (typeof input.name === 'string' ? input.name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) : '') || 'Unnamed language';
  const id = typeof input.id === 'string' && /^my-[a-z0-9-]{1,60}$/.test(input.id) ? input.id : `my-${slug(name)}`;
  const flow = FLOWS.find((source) => source.id === input.flow)?.id ?? SCRATCH.flow;
  const say = sanitizeSay(input.say);
  const basedOn = typeof input.basedOn === 'string' && /^[a-z-]{1,40}$/.test(input.basedOn) ? input.basedOn : undefined;
  // Real words the language keeps, as Shakespearean English keeps "thou" and "hath".
  const keep = Array.isArray(input.keep)
    ? input.keep.filter((word): word is string => typeof word === 'string' && /^[\p{L}'’-]{1,24}$/u.test(word)).slice(0, 400)
    : [];
  const def: CustomLanguageDef = {
    kind: 'invented',
    id,
    name,
    flow,
    sounds,
    spelling: sanitizeSpelling(input.spelling),
    ...(say ? { say } : {}),
    punctuation: sanitizePunctuation(input.punctuation),
    voicing: text(input.voicing, 600) ?? '',
    ...(keep.length > 0 ? { keep } : {}),
    ...(basedOn ? { basedOn } : {}),
  };
  return languageProblem(def) ? null : def;
}

export function loadCustomLanguages(): CustomLanguageDef[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(saved)) return [];
    const ids = new Set<string>();
    const languages: CustomLanguageDef[] = [];
    for (const item of saved.slice(0, MAX_LANGUAGES)) {
      const def = sanitizeLanguage(item);
      if (!def || ids.has(def.id)) continue;
      ids.add(def.id);
      languages.push(def);
    }
    return languages;
  } catch {
    return [];
  }
}

export function saveCustomLanguages(languages: readonly CustomLanguageDef[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(languages));
  } catch {
    // Storage can be full or blocked (private windows); the languages last until the page closes.
  }
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/** Languages as a URL-safe string, for share links. */
export function encodeLanguages(languages: readonly CustomLanguageDef[]): string {
  return toBase64Url(JSON.stringify(languages));
}

/** The valid languages in a string from encodeLanguages; nothing if it isn't one. */
export function decodeLanguages(encoded: string): CustomLanguageDef[] {
  try {
    const data = JSON.parse(fromBase64Url(encoded));
    if (!Array.isArray(data)) return [];
    return data
      .slice(0, 10)
      .map(sanitizeLanguage)
      .filter((def): def is CustomLanguageDef => !!def);
  } catch {
    return [];
  }
}

/** Two definitions of the same language, alike in every part. */
export function sameLanguage(a: CustomLanguageDef, b: CustomLanguageDef): boolean {
  return JSON.stringify(sanitizeLanguage(a)) === JSON.stringify(sanitizeLanguage(b));
}

/**
 * Your languages with those a link brings: a link's language takes the place of yours with the
 * same id, so the page shows what its sender saw. `shared` lists the link's languages you don't
 * have as they are.
 */
export function withLinked(own: readonly CustomLanguageDef[], linked: readonly CustomLanguageDef[]) {
  const shared = linked.filter((def) => !own.some((mine) => mine.id === def.id && sameLanguage(mine, def)));
  const all = [...own.filter((mine) => !shared.some((def) => def.id === mine.id)), ...shared];
  return { all, shared };
}
