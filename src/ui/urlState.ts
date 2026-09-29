/**
 * The page's settings in its URL, so a link recreates the exact text:
 * #lang=dnd/elvish&order=sentences&len=3p&seed=123456&view=both, with &form=conversation&speakers=3
 * for anything but prose.
 */
import { ARRANGEMENTS, MAX_LENGTH, type Arrangement, type Length } from '../engine/arrange';
import { FORMS, SPEAKERS, type Form } from '../engine/forms';
import { NAME_KINDS, type NameKind } from '../engine/names';

export type View = 'written' | 'say' | 'both' | 'ipa';
export const VIEWS: readonly View[] = ['written', 'say', 'both', 'ipa'];

/** The alphabet a language with one of its own (Russian's Cyrillic) is shown in: that one, or Latin letters. */
export type Alphabet = 'own' | 'latin';

export interface PageState {
  /** A setting and language choice: "dnd/elvish". */
  choice: string;
  arrangement: Arrangement;
  length: Length;
  seed: number;
  view: View;
  alphabet: Alphabet;
  form: Form;
  /** How many speakers a conversation has. */
  speakers: number;
  /** What the names form names. */
  names: NameKind;
  /** A custom setting the choice belongs to, encoded, so the link works for anyone. */
  world?: string;
  /** Languages made in the builder that the page uses, encoded, for the same reason. */
  made?: string;
}

/**
 * An encoded value a hash carries, if any, before anything is checked against it. A fragment never
 * reaches a server, so only the browser limits its length.
 */
function encodedInHash(hash: string, name: string, longest: number): string | undefined {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get(name);
  return value && value.length <= longest && /^[\w-]+$/.test(value) ? value : undefined;
}

/** The encoded custom setting a hash carries, if any. */
export const worldInHash = (hash: string) => encodedInHash(hash, 'world', 20_000);

/** The encoded made languages a hash carries, if any: a language with many spelling rules runs long. */
export const madeInHash = (hash: string) => encodedInHash(hash, 'made', 60_000);

const UNIT_LETTERS: Record<Length['unit'], string> = { paragraphs: 'p', words: 'w' };

/** Whatever valid settings the hash holds. Anything missing or malformed is left out. */
export function readHash(hash: string, isChoice: (key: string) => boolean): Partial<PageState> {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const state: Partial<PageState> = {};

  const choice = params.get('lang');
  if (choice && isChoice(choice)) state.choice = choice;

  const order = params.get('order');
  if (order && (ARRANGEMENTS as readonly string[]).includes(order)) state.arrangement = order as Arrangement;

  const length = /^(\d{1,6})([pw])$/.exec(params.get('len') ?? '');
  if (length) {
    const unit = length[2] === 'p' ? 'paragraphs' : 'words';
    const count = Number(length[1]);
    if (count >= 1) state.length = { unit, count: Math.min(MAX_LENGTH[unit], count) };
  }

  const seed = /^\d{1,10}$/.exec(params.get('seed') ?? '');
  if (seed && Number(seed[0]) < 2 ** 32) state.seed = Number(seed[0]);

  const view = params.get('view');
  if (view && (VIEWS as readonly string[]).includes(view)) state.view = view as View;

  const alphabet = params.get('alphabet');
  if (alphabet === 'own' || alphabet === 'latin') state.alphabet = alphabet;

  const form = params.get('form');
  if (form && (FORMS as readonly string[]).includes(form)) state.form = form as Form;

  const names = params.get('names');
  if (names && (NAME_KINDS as readonly string[]).includes(names)) state.names = names as NameKind;

  const speakers = Number(params.get('speakers'));
  if (Number.isInteger(speakers) && speakers >= SPEAKERS.min && speakers <= SPEAKERS.max) state.speakers = speakers;

  const world = worldInHash(hash);
  if (world) state.world = world;

  const made = madeInHash(hash);
  if (made) state.made = made;

  return state;
}

export function writeHash(state: PageState): string {
  const params = new URLSearchParams({
    lang: state.choice,
    order: state.arrangement,
    len: `${state.length.count}${UNIT_LETTERS[state.length.unit]}`,
    seed: String(state.seed),
    view: state.view,
  });
  if (state.alphabet === 'latin') params.set('alphabet', 'latin');
  if (state.form !== 'prose') params.set('form', state.form);
  if (state.form === 'conversation') params.set('speakers', String(state.speakers));
  if (state.form === 'names') params.set('names', state.names);
  if (state.world) params.set('world', state.world);
  if (state.made) params.set('made', state.made);
  // The slash in "dnd/elvish" reads better unescaped, and is safe in a fragment.
  return `#${params.toString().replace(/%2F/gi, '/')}`;
}
