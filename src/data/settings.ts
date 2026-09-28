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

const PAPER: SteleOptions = { medium: 'paper' };
const PARCHMENT: SteleOptions = { medium: 'parchment' };
const RUNES: SteleOptions = { medium: 'granite', script: 'elder-futhark' };

export const SETTINGS: readonly Setting[] = [
  {
    id: 'real',
    name: 'Real world',
    choices: [
      { id: 'english', name: 'Real English', language: 'english', stele: PAPER },
      { id: 'english-invented', name: 'Invented English', language: 'english-invented', stele: PAPER },
      { id: 'french', name: 'French', language: 'french', stele: PARCHMENT },
      { id: 'french-real', name: 'Real French', language: 'french-real', stele: PARCHMENT },
      { id: 'spanish', name: 'Spanish', language: 'spanish', stele: PARCHMENT },
      { id: 'portuguese', name: 'Portuguese', language: 'portuguese', stele: PARCHMENT },
      { id: 'italian', name: 'Italian', language: 'italian', stele: PARCHMENT },
      { id: 'german', name: 'German', language: 'german', stele: { medium: 'paper', font: 'unifrakturmaguntia' } },
      { id: 'latin', name: 'Latin', language: 'latin', stele: { medium: 'marble', roman: true } },
      { id: 'lorem-ipsum', name: 'Lorem ipsum', language: 'lorem-ipsum', stele: PARCHMENT },
      { id: 'finnish', name: 'Finnish', language: 'finnish', stele: PAPER },
      { id: 'welsh', name: 'Welsh', language: 'welsh', stele: { medium: 'slate' } },
      { id: 'old-english', name: 'Old English', language: 'old-english', stele: { medium: 'parchment', font: 'uncial-antiqua' } },
      { id: 'old-norse', name: 'Old Norse', language: 'old-norse', stele: { medium: 'granite', script: 'younger-futhark' } },
      { id: 'enochian', name: 'Enochian', language: 'enochian', stele: PARCHMENT },
    ],
  },
  {
    id: 'dnd',
    name: 'D&D 5e',
    choices: [
      { id: 'common', name: 'Common', language: 'english', stele: PAPER },
      { id: 'dwarvish', name: 'Dwarvish', language: 'old-norse', stele: RUNES },
      { id: 'elvish', name: 'Elvish', language: 'french', stele: PARCHMENT },
      { id: 'high-elvish', name: 'High Elvish', language: 'finnish', stele: { medium: 'parchment', font: 'fondamento' } },
      { id: 'giant', name: 'Giant', language: 'old-norse', stele: { medium: 'granite', script: 'younger-futhark' } },
      { id: 'gnomish', name: 'Gnomish', language: 'german', stele: PAPER },
      { id: 'goblin', name: 'Goblin', language: 'orcish', stele: { medium: 'wood', script: 'younger-futhark' } },
      { id: 'halfling', name: 'Halfling', language: 'english-invented', stele: PAPER },
      { id: 'orc', name: 'Orc', language: 'orcish', stele: { medium: 'slate', script: 'younger-futhark' } },
      { id: 'abyssal', name: 'Abyssal', language: 'abyssal', stele: { medium: 'clay', script: 'cuneiform' } },
      { id: 'celestial', name: 'Celestial', language: 'enochian', stele: { medium: 'marble' } },
      { id: 'deep-speech', name: 'Deep Speech', language: 'abyssal', stele: { medium: 'clay', script: 'cuneiform' } },
      { id: 'draconic', name: 'Draconic', language: 'draconic', stele: { medium: 'bronze' } },
      { id: 'infernal', name: 'Infernal', language: 'infernal', stele: { medium: 'parchment', font: 'unifrakturmaguntia' } },
      { id: 'aquan', name: 'Primordial (Aquan)', language: 'aquan', stele: { medium: 'slate' } },
      { id: 'auran', name: 'Primordial (Auran)', language: 'auran', stele: { medium: 'papyrus' } },
      { id: 'ignan', name: 'Primordial (Ignan)', language: 'ignan', stele: { medium: 'bronze' } },
      { id: 'terran', name: 'Primordial (Terran)', language: 'terran', stele: { medium: 'sandstone' } },
      { id: 'sylvan', name: 'Sylvan', language: 'welsh', stele: { medium: 'wood', font: 'uncial-antiqua' } },
      { id: 'undercommon', name: 'Undercommon', language: 'portuguese', stele: { medium: 'slate' } },
      { id: 'druidic', name: 'Druidic', language: 'welsh', stele: { medium: 'wood', font: 'uncial-antiqua' } },
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
