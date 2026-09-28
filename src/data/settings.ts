import type { SteleOptions } from '../engine/stele';

/**
 * A language as a game world names it. D&D's Elvish is written in invented French here; in a
 * colonial setting, Renan could be the same.
 */
export interface LanguageChoice {
  /** Unique within its setting. With the setting's id it makes the key in share links: "dnd/elvish". */
  id: string;
  name: string;
  /** The language it's written in (see data/languages). */
  language: string;
  /** How Stele shows it: the medium, and any script or lettering. */
  stele: SteleOptions;
}

/** A game world's names for its languages. */
export interface Setting {
  id: string;
  name: string;
  choices: readonly LanguageChoice[];
}

export const SETTINGS: readonly Setting[] = [
  {
    id: 'real',
    name: 'Real world',
    choices: [
      { id: 'english', name: 'English', language: 'english', stele: { medium: 'paper' } },
      { id: 'french', name: 'French', language: 'french', stele: { medium: 'parchment' } },
      { id: 'latin', name: 'Latin', language: 'latin', stele: { medium: 'marble', roman: true } },
      { id: 'lorem-ipsum', name: 'Lorem ipsum', language: 'lorem-ipsum', stele: { medium: 'parchment' } },
      { id: 'old-norse', name: 'Old Norse', language: 'old-norse', stele: { medium: 'granite', script: 'younger-futhark' } },
    ],
  },
  {
    id: 'dnd',
    name: 'D&D 5e',
    choices: [
      { id: 'common', name: 'Common', language: 'english', stele: { medium: 'paper' } },
      { id: 'elvish', name: 'Elvish', language: 'french', stele: { medium: 'parchment' } },
      { id: 'dwarvish', name: 'Dwarvish', language: 'old-norse', stele: { medium: 'granite', script: 'elder-futhark' } },
    ],
  },
];

export const DEFAULT_CHOICE = 'dnd/elvish';

export interface FoundChoice {
  key: string;
  setting: Setting;
  choice: LanguageChoice;
}

export function allChoices(settings: readonly Setting[] = SETTINGS): FoundChoice[] {
  return settings.flatMap((setting) => setting.choices.map((choice) => ({ key: `${setting.id}/${choice.id}`, setting, choice })));
}

export function findChoice(key: string, settings: readonly Setting[] = SETTINGS): FoundChoice | undefined {
  return allChoices(settings).find((found) => found.key === key);
}
