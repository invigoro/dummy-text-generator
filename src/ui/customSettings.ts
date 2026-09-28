/**
 * Settings made by the person using the page: their game world's names for languages ("Renan"
 * for French). They're kept in the browser, exported and imported as JSON, and carried in share
 * links, so the person opening a link sees the same names. Anything read back is checked first.
 */
import { LANGUAGES } from '../data/languages';
import { SETTINGS, type LanguageChoice, type Setting } from '../data/settings';
import type { SteleMedium, SteleOptions, SteleScript } from '../engine/stele';

const STORAGE_KEY = 'dummy-text:settings';
const MAX_SETTINGS = 20;
const MAX_CHOICES = 40;
const MAX_NAME = 40;
/** A language id: "old-deciman". */
const ID = /^(?=.{1,60}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MEDIA: readonly SteleMedium[] = ['marble', 'sandstone', 'granite', 'slate', 'clay', 'bronze', 'wood', 'paper', 'parchment', 'papyrus'];
const SCRIPTS: readonly SteleScript[] = ['latin', 'elder-futhark', 'younger-futhark', 'futhorc', 'cuneiform'];

/** Custom settings' ids start "my-", so they never clash with the built-in ones. */
export const isCustomSetting = (setting: Setting) => setting.id.startsWith('my-');

/** A name as an id: "Old Deciman" is "old-deciman". */
export function slug(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'language';
}

/** An id not in `taken`: "renan", or "renan-2" if that's in use. */
export function uniqueId(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** The Stele style the Real world setting gives a language, as the default for a new name for it. */
export function defaultStele(language: string): SteleOptions {
  const real = SETTINGS.find((setting) => setting.id === 'real')?.choices.find((choice) => choice.language === language);
  return real?.stele ?? { medium: 'parchment' };
}

/** Names shown for ones left blank, so a setting half-typed when the page closed isn't lost. */
export const UNTITLED_SETTING = 'Untitled setting';
export const UNNAMED_LANGUAGE = 'Unnamed language';

const cleanName = (value: unknown, fallback: string): string =>
  (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) : '') || fallback;

function sanitizeStele(value: unknown, language: string): SteleOptions {
  const fallback = defaultStele(language);
  if (!value || typeof value !== 'object') return fallback;
  const { medium, script, roman, font } = value as Record<string, unknown>;
  const stele: SteleOptions = { medium: MEDIA.includes(medium as SteleMedium) ? (medium as SteleMedium) : fallback.medium };
  if (SCRIPTS.includes(script as SteleScript) && script !== 'latin') stele.script = script as SteleScript;
  if (roman === true) stele.roman = true;
  if (typeof font === 'string' && /^[a-z0-9-]{1,40}$/.test(font)) stele.font = font;
  return stele;
}

const BUILT_IN = new Set(LANGUAGES.map((language) => language.id));

/**
 * Whether a setting can name a language: a built-in one, or one made in the builder ("my-…"). A
 * made language that's missing, deleted or not yet loaded from a link, is kept all the same, and
 * the page leaves it out until it's there.
 */
const isLanguageId = (id: unknown): id is string => typeof id === 'string' && (BUILT_IN.has(id) || /^my-[a-z0-9-]{1,70}$/.test(id));

/** A valid custom setting from untrusted data (storage, a file, a link), or null. */
export function sanitizeSetting(data: unknown): Setting | null {
  if (!data || typeof data !== 'object') return null;
  const input = data as Record<string, unknown>;
  if (!Array.isArray(input.choices)) return null;
  const name = cleanName(input.name, UNTITLED_SETTING);
  const ids = new Set<string>();
  const choices: LanguageChoice[] = [];
  for (const item of input.choices.slice(0, MAX_CHOICES)) {
    if (!item || typeof item !== 'object') continue;
    const { id: given, name: choiceName, language, stele } = item as Record<string, unknown>;
    if (!isLanguageId(language)) continue;
    const cleaned = cleanName(choiceName, UNNAMED_LANGUAGE);
    // A language keeps its id when renamed, so links to it still work.
    const id = uniqueId(typeof given === 'string' && ID.test(given) ? given : slug(cleaned), ids);
    ids.add(id);
    choices.push({ id, name: cleaned, language, stele: sanitizeStele(stele, language) });
  }
  const id = typeof input.id === 'string' && /^my-[a-z0-9-]{1,60}$/.test(input.id) ? input.id : `my-${slug(name)}`;
  return { id, name, choices };
}

export function loadCustomSettings(): Setting[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(saved)) return [];
    return withUniqueIds(saved.slice(0, MAX_SETTINGS).map(sanitizeSetting).filter((setting): setting is Setting => !!setting));
  } catch {
    return [];
  }
}

export function saveCustomSettings(settings: readonly Setting[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be full or blocked (private windows); the settings last until the page closes.
  }
}

/** The settings with no two sharing an id. */
export function withUniqueIds(settings: readonly Setting[]): Setting[] {
  const ids = new Set(SETTINGS.map((setting) => setting.id));
  return settings.map((setting) => {
    const id = uniqueId(setting.id, ids);
    ids.add(id);
    return id === setting.id ? setting : { ...setting, id };
  });
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/** A setting as a short, URL-safe string, for share links. Stele styles are left out where they're the default. */
export function encodeSetting(setting: Setting): string {
  const choices = setting.choices.map(({ stele, ...choice }) =>
    JSON.stringify(stele) === JSON.stringify(defaultStele(choice.language)) ? choice : { ...choice, stele },
  );
  return toBase64Url(JSON.stringify({ ...setting, choices }));
}

/** The setting in a string from encodeSetting, or null if it isn't one. */
export function decodeSetting(encoded: string): Setting | null {
  try {
    return sanitizeSetting(JSON.parse(fromBase64Url(encoded)));
  } catch {
    return null;
  }
}

/**
 * The custom setting a link carries, beside the person's own: null if they have it saved already,
 * or a copy with an id of its own if one of theirs has its id. `choice` finds the link's language
 * ("my-world/renan") in whichever of the two it ended up.
 */
export function settingFromLink(world: string | undefined, own: readonly Setting[]): { setting: Setting | null; choice: (key: string) => string } {
  const linked = world ? decodeSetting(world) : null;
  if (!linked) return { setting: null, choice: (key) => key };
  const saved = own.find((setting) => sameSetting(setting, linked));
  const setting = saved ?? { ...linked, id: uniqueId(linked.id, new Set([...SETTINGS, ...own].map((known) => known.id))) };
  const prefix = `${linked.id}/`;
  return {
    setting: saved ? null : setting,
    choice: (key) => (key.startsWith(prefix) ? `${setting.id}/${key.slice(prefix.length)}` : key),
  };
}

/** Two settings with the same names for the same languages, whatever their ids. */
export function sameSetting(a: Setting, b: Setting): boolean {
  const canonical = (setting: Setting) => JSON.stringify(sanitizeSetting({ ...setting, id: 'my-setting' }));
  return canonical(a) === canonical(b);
}
