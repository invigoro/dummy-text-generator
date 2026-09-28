import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Italian: words ending in vowels, double consonants held a beat longer (tt, ll, zz),
 * and stress on the second-to-last syllable, now and then on the one before, and rarely on the
 * last, which the spelling marks: "città".
 */
const italian: InventedLanguageDef = {
  kind: 'invented',
  id: 'italian',
  name: 'Italian',
  flow: 'it-promessi-sposi',
  sounds: {
    classes: {
      C: 't:6 s:6 p:6 k:6 d:6 m:6 l:5 n:4 r:4 v:4 b:3 f:3 g:3 tʃ:3 dʒ:2 ts:1 ʃ:1',
      M: 'r:7 n:7 t:6 l:6 d:5 s:4 m:4 v:4 k:4 tʃ:3 p:3 dʒ:2 b:2 g:2 f:2 ɲ:1.5 ʎ:1 ts:1.5 dz:0.5 ʃ:0.5',
      // Double consonants, which start a syllable after a vowel: "gatto", "bella", "pezzo".
      G: 'tː:6 lː:5 sː:4 nː:3 pː:3 kː:3 rː:3 mː:2 tʃː:2 tsː:2 bː:1 dː:1 gː:1 dʒː:1 fː:1',
      O: 'p:3 t:3 k:3 b:2 d:2 g:2 f:2',
      L: 'r:4 l:2',
      // s before a consonant starts a syllable: "strada", "sposo", "scala".
      S: 's',
      K: 't:4 p:3 k:2 m:1 n:1 v:0.5',
      // Glides, as in "piede" and "buono", and the vowels after them.
      J: 'j',
      Y: 'e:4 a:3 o:2 u:1',
      W: 'w',
      U: 'o:5 a:3 e:2 i:1',
      V: 'a:9 e:8 o:8 i:7 u:3 ɛ:2 ɔ:2',
      E: 'o:9 a:9 e:8 i:7',
      F: 'n:5 r:5 l:4 s:3 m:1',
    },
    first: 'CV:12 V:2 CVF:3 OLV:2 SKV:1.5 CJY:1 CWU:1',
    syllables: 'MV:10 GV:4 MVF:3 OLV:1 SKV:0.5 MJY:1 MWU:0.8',
    last: 'ME:10 GE:4 OLE:1 MJY:0.5',
    single: 'CV:8 V:3 CVF:2 VF:1',
    stress: 'penultimate',
    irregularStress: { chance: 0.22, to: ['antepenultimate', 'antepenultimate', 'antepenultimate', 'final'], marked: 'final' },
    avoid: [
      'tl|dl',
      'm\\.[^pb]',
      'n\\.[pbm]',
      'jj|ww|ji|wu',
      '^[ɲʎ]',
      // Palatal sounds already carry their glide: "gnocco", not "gniocco"; "cena", not "ciuena".
      '(ɲ|ʎ|ʃ|tʃ|dʒ)ː?[jw]',
      // A double consonant only follows a vowel.
      '[nrlsm]\\.[^.aeiouɛɔ]{1,2}ː',
    ],
    maxSyllables: 5,
  },
  spelling: [
    // A stressed last syllable is written with an accent: "città", "perché", "virtù".
    { sounds: 'a', write: 'à', stress: 'marked' },
    { sounds: 'e', write: 'é', stress: 'marked' },
    { sounds: 'ɛ', write: 'è', stress: 'marked' },
    { sounds: 'i', write: 'ì', stress: 'marked' },
    { sounds: 'o', write: 'ò', stress: 'marked' },
    { sounds: 'ɔ', write: 'ò', stress: 'marked' },
    { sounds: 'u', write: 'ù', stress: 'marked' },
    { sounds: 'k w', write: 'qu' },
    { sounds: 'g w', write: 'gu' },
    // c and g are hard before a, o, u; before e and i they need an h to stay hard.
    { sounds: 'k', write: 'ch', before: 'front j' },
    { sounds: 'k', write: 'c' },
    { sounds: 'kː', write: 'cch', before: 'front j' },
    { sounds: 'kː', write: 'cc' },
    { sounds: 'g', write: 'gh', before: 'front j' },
    { sounds: 'gː', write: 'ggh', before: 'front j' },
    // …and soft c and g need an i to stay soft before a, o, u.
    { sounds: 'tʃ', write: 'c', before: 'front' },
    { sounds: 'tʃ', write: 'ci' },
    { sounds: 'tʃː', write: 'cc', before: 'front' },
    { sounds: 'tʃː', write: 'cci' },
    { sounds: 'dʒ', write: 'g', before: 'front' },
    { sounds: 'dʒ', write: 'gi' },
    { sounds: 'dʒː', write: 'gg', before: 'front' },
    { sounds: 'dʒː', write: 'ggi' },
    { sounds: 'ʃ', write: 'sc', before: 'front' },
    { sounds: 'ʃ', write: 'sci' },
    { sounds: 'ɲ', write: 'gn' },
    { sounds: 'ʎ', write: 'gl', before: 'i' },
    { sounds: 'ʎ', write: 'gli' },
    { sounds: 'ts', write: 'z' },
    { sounds: 'dz', write: 'z' },
    { sounds: 'tsː', write: 'zz' },
    { sounds: 'j', write: 'i' },
    { sounds: 'w', write: 'u' },
    { sounds: 'ɛ', write: 'e' },
    { sounds: 'ɔ', write: 'o' },
  ],
  punctuation: { quotes: ['«', '»'] },
  voicing:
    'Let every word end on a vowel, and sing it a little: lean on the capital syllable and let the rest ride. Hold double consonants a beat longer (the “t-t” in “gaht-toh”), and tap or roll the r.',
};

export default italian;
