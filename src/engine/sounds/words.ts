/** Builds invented words from a sound system: sounds first, so their pronunciation is always known. */
import type { Random } from '../rng';
import { pick, soundString, stressOf, type SoundSystem, type Syllable, type WeightedList, type WordSounds } from './system';

export interface WordRequest {
  syllables: number;
  /** Start with a vowel, as a word after an elided "l’" must in French. */
  vowelFirst?: boolean;
}

const ATTEMPTS = 60;

export function inventWord(system: SoundSystem, random: Random, request: WordRequest): WordSounds {
  const count = Math.max(1, Math.min(system.maxSyllables, Math.round(request.syllables)));
  let word: WordSounds | undefined;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const syllables: Syllable[] = [];
    for (let i = 0; i < count; i++) syllables.push(buildSyllable(system, shapesFor(system, i, count), random));
    if (request.vowelFirst) syllables[0] = { ...syllables[0], onset: [] };
    word = withIrregularStress(system, random, { syllables, stress: stressOf(system.stress, syllables) });
    if (acceptable(system, word)) return word;
  }
  // Give up gracefully: a rejected word is still a word.
  return word!;
}

/** Now and then, stress somewhere other than the rule says, marked with an accent if the language does. */
function withIrregularStress(system: SoundSystem, random: Random, word: WordSounds): WordSounds {
  const irregular = system.irregularStress;
  const n = word.syllables.length;
  if (!irregular || word.stress === null || n < 2 || random() >= irregular.chance) return word;
  const places = irregular.to
    .map((place) => (place === 'final' ? n - 1 : n - 3))
    .filter((place) => place >= 0 && place !== word.stress);
  if (places.length === 0) return word;
  const stress = places[Math.floor(random() * places.length)];
  const marked = irregular.marked === 'all' || (irregular.marked === 'final' && stress === n - 1);
  return { ...word, stress, marked };
}

function shapesFor(system: SoundSystem, index: number, count: number): WeightedList<string[]> {
  if (count === 1) return system.single;
  if (index === 0) return system.first;
  if (index === count - 1) return system.last;
  return system.syllables;
}

function buildSyllable(system: SoundSystem, shapes: WeightedList<string[]>, random: Random): Syllable {
  const onset: string[] = [];
  const coda: string[] = [];
  let nucleus = '';
  for (const name of pick(shapes, random)) {
    const soundClass = system.classes.get(name)!;
    const sounds = pick(soundClass.sounds, random);
    if (soundClass.vowels) nucleus = sounds.join('');
    else (nucleus ? coda : onset).push(...sounds);
  }
  return { onset, nucleus, coda };
}

function acceptable(system: SoundSystem, word: WordSounds): boolean {
  const { syllables } = word;
  for (let i = 1; i < syllables.length; i++) {
    const [before, after] = [syllables[i - 1], syllables[i]];
    if (!system.hiatus && before.coda.length === 0 && after.onset.length === 0) return false;
    // "tata" and "lolo" sound like baby talk.
    if (soundString({ syllables: [before], stress: null }) === soundString({ syllables: [after], stress: null })) return false;
  }
  const sounds = soundString(word);
  return !system.avoid.some((pattern) => pattern.test(sounds));
}
