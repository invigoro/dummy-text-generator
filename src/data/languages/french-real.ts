import { pronounceFrench } from '../../engine/g2p/french';
import type { RealLanguageDef } from '../../engine/language';
import french from './french';

/**
 * Real French from Les Trois Mousquetaires, with a "say it" line worked out from its spelling:
 * near enough to read aloud, though not always right.
 */
const frenchReal: RealLanguageDef = {
  kind: 'real',
  id: 'french-real',
  name: 'Real French',
  flow: 'fr-trois-mousquetaires',
  pronounce: pronounceFrench,
  stress: 'phrase',
  voicing: `${french.voicing} The “say it” line is worked out from the spelling, so now and then it’s a little off, and it leaves out the silent letters French says before a vowel (“les amis” as “lay-zah-MEE”).`,
};

export default frenchReal;
