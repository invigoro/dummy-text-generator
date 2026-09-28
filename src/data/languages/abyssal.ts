import type { InventedLanguageDef } from '../../engine/language';

/**
 * Abyssal, for demons and aberrations: nothing about it is made for a human mouth. Sounds from
 * deep in the throat (q, kh, the gurgled hh), a hissed hl, catches in the breath, "ng" to start a
 * word, and vowels that sit oddly: the y of "ih" and the uu of a flat "oo".
 */
const abyssal: InventedLanguageDef = {
  kind: 'invented',
  id: 'abyssal',
  name: 'Abyssal',
  flow: 'fi-seitseman-veljesta',
  sounds: {
    classes: {
      C: 'q:4 x:3 k:3 ʔ:3 ɬ:3 z:3 χ:2 ħ:2 ts:2 ʒ:2 t:2 g:2 ŋ:2 m:2 n:2 l:2 r:2 j:1 w:1',
      O: 'q:2 k:2 t:2 x:1 g:1',
      L: 'l:2 ɬ:2 z:1 r:1 ŋ:1',
      V: 'a:4 u:4 ɨ:4 ɯ:3 o:3 i:2 ə:2 aː:1 uː:1',
      F: 'q:3 x:3 ŋ:3 ɬ:2 m:2 n:2 l:2 r:2 z:2 ʔ:2 k:2 ts:1',
    },
    first: 'CV:4 CVF:5 OLV:3 V:2 VF:2',
    syllables: 'CV:5 CVF:4 OLV:1 V:1',
    last: 'CVF:6 CV:3',
    single: 'CVF:4 CV:3 OLVF:2 VF:2',
    stress: 'penultimate',
    hiatus: true,
    avoid: ['jj|ww', 'ʔ\\.?ʔ', '(.)\\1\\1', '([xχqkħzlɬ]|ts)\\.\\1'],
    maxSyllables: 4,
  },
  spelling: [
    { sounds: 'ʔ', write: "'" },
    { sounds: 'x', write: 'kh' },
    { sounds: 'χ', write: 'x' },
    { sounds: 'ħ', write: 'hh' },
    { sounds: 'ɬ', write: 'hl' },
    { sounds: 'ʒ', write: 'zh' },
    { sounds: 'ŋ', write: 'ng' },
    { sounds: 'ɨ', write: 'y' },
    { sounds: 'ɯ', write: 'uu' },
    { sounds: 'uː', write: 'ou' },
    { sounds: 'aː', write: 'aa' },
    { sounds: 'ə', write: 'e' },
    { sounds: 'j', write: 'y' },
  ],
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Nothing about it should sound comfortable. Catch your breath at every apostrophe, gurgle q, kh and x deep in the throat, hiss hl through the sides of your tongue, and start “ng” words straight on the ng. Keep the pace uneven.',
};

export default abyssal;
