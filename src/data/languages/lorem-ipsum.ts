import { pronounceLatin } from '../../engine/g2p/latin';
import type { VocabularyLanguageDef } from '../../engine/language';
import { LATIN_SAY, LATIN_VOICING } from './latin';

/**
 * Classic lorem ipsum: its own scrambled Latin words, on the flow of Caesar's prose, starting
 * the way it always does.
 */
const loremIpsum: VocabularyLanguageDef = {
  kind: 'vocabulary',
  id: 'lorem-ipsum',
  name: 'Lorem ipsum',
  flow: 'la-de-bello-gallico',
  vocabulary: 'la-lorem-ipsum',
  opening: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  pronounce: pronounceLatin,
  stress: 'latin',
  say: LATIN_SAY,
  voicing: LATIN_VOICING,
};

export default loremIpsum;
