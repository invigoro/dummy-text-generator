import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Portuguese, as spoken in Portugal: swallowed unstressed vowels, "sh" for a final s,
 * and nasal vowels and diphthongs (-ão, -ões, -em). Words stress their last syllable when it's
 * nasal or ends in r or l, and the one before otherwise; accents mark the exceptions.
 */
const portuguese: InventedLanguageDef = {
  kind: 'invented',
  id: 'portuguese',
  name: 'Portuguese',
  flow: 'pt-os-maias',
  sounds: {
    classes: {
      C: 's:7 d:7 t:7 k:7 m:7 p:6 l:6 v:5 n:5 b:4 f:4 ʁ:3 g:3 ʒ:3 ʃ:2 z:1',
      M: 'ɾ:7 d:7 t:6 m:6 n:6 l:6 s:5 k:5 v:4 b:3 p:3 ʒ:3 z:3 ʃ:2 g:2 f:2 ɲ:2 ʎ:2 ʁ:1.5 j:1',
      O: 'p:3 t:3 k:3 b:2 g:2 f:2 d:1',
      L: 'ɾ:4 l:1.5',
      V: 'a:9 i:6 e:5 o:5 ɛ:4 ɔ:4 u:4 ɐ:3 ɐ̃:2 ẽ:1.5 õ:1.5 ĩ:1 ũ:1 ei:1.5 aɪ:0.8 ɔɪ:0.5 au:0.3',
      // Unstressed vowels ending a word: -a (uh), -o (oo), -e (almost nothing).
      E: 'ɐ:9 u:9 ɨ:6 i:1',
      // Nasal endings: -ão, -ões, -em, -ã.
      N: 'ɐ̃w̃:4 ɐ̃j̃:1.5 õj̃:1 ɐ̃:1 ẽ:0.5',
      // An s before a consonant or at the end is "sh"; r and l end words too.
      F: 'ɾ:5 ʃ:4 l:3 ʒ:1',
      Z: 'ʃ:8 ɾ:4 l:3',
    },
    first: 'CV:12 V:3 CVF:4 VF:1 OLV:2',
    syllables: 'MV:12 MVF:4 OLV:1.5',
    last: 'ME:12 MEZ:5 MN:3 MNZ:1 MVZ:2 OLE:1',
    single: 'CV:6 V:4 CVZ:3 VZ:2 CN:1',
    stress: 'portuguese',
    irregularStress: { chance: 0.12, to: ['antepenultimate', 'final'], marked: 'all' },
    avoid: [
      'tl|dl',
      '^ɾ',
      '^[ɲʎ]',
      'ɨ[^.]*\\.',
      'ʃ\\.[bdgvzmnlɾʒ]',
      'ʒ\\.[ptksfʃ]',
      // A nasal vowel is never followed by n or m, or by r or l in its own syllable, and takes
      // an s only at the end of a word ("bens").
      '[ɐ̃ẽĩõũ]\\.?[nmɲ]',
      '[ɐ̃ẽĩõũ][ɾlʒ]',
      '[ɐ̃ẽĩõũ]ʃ\\.',
      '[ɐ̃ẽĩõũ]\\.ʁ',
    ],
    maxSyllables: 5,
  },
  spelling: [
    // Stress against the rule: "está", "você", "pássaro".
    { sounds: 'a', write: 'á', stress: 'marked' },
    { sounds: 'ɐ', write: 'â', stress: 'marked' },
    { sounds: 'e', write: 'ê', stress: 'marked' },
    { sounds: 'ɛ', write: 'é', stress: 'marked' },
    { sounds: 'i', write: 'í', stress: 'marked' },
    { sounds: 'o', write: 'ô', stress: 'marked' },
    { sounds: 'ɔ', write: 'ó', stress: 'marked' },
    { sounds: 'u', write: 'ú', stress: 'marked' },
    // Endings: -o and -os said "oo", -e said "uh".
    { sounds: 'u ʃ', write: 'os', before: '#' },
    { sounds: 'u', write: 'o', before: '#' },
    { sounds: 'ɐ', write: 'a' },
    { sounds: 'ɨ', write: 'e' },
    // Nasals.
    { sounds: 'õj̃ ʃ', write: 'ões' },
    { sounds: 'ɐ̃w̃', write: 'ão' },
    { sounds: 'õj̃', write: 'õe' },
    { sounds: 'ɐ̃j̃', write: 'em:3 ãe:1', before: '#' },
    { sounds: 'ɐ̃j̃', write: 'ãe' },
    { sounds: 'ɐ̃', write: 'ã:3 am:1', before: '#' },
    { sounds: 'ɐ̃', write: 'am', before: 'labial' },
    { sounds: 'ɐ̃', write: 'an' },
    { sounds: 'ẽ', write: 'em', before: 'labial #' },
    { sounds: 'ẽ', write: 'en' },
    { sounds: 'ĩ', write: 'im', before: 'labial #' },
    { sounds: 'ĩ', write: 'in' },
    { sounds: 'õ', write: 'om', before: 'labial #' },
    { sounds: 'õ', write: 'on' },
    { sounds: 'ũ', write: 'um', before: 'labial #' },
    { sounds: 'ũ', write: 'un' },
    { sounds: 'ei', write: 'ei' },
    { sounds: 'aɪ', write: 'ai' },
    { sounds: 'ɔɪ', write: 'oi' },
    { sounds: 'ɛ', write: 'e' },
    { sounds: 'ɔ', write: 'o' },
    // Consonants. A "sh" ending a syllable is written s; starting one, ch or x.
    { sounds: 'ʃ', write: 's:6 z:1', before: '#' },
    { sounds: 'ʃ', write: 's', before: 'C' },
    { sounds: 'ʃ', write: 'ch:3 x:2' },
    { sounds: 'ʒ', write: 's', before: 'C #' },
    { sounds: 'ʒ', write: 'g:2 j:1', before: 'front ɨ' },
    { sounds: 'ʒ', write: 'j' },
    { sounds: 's', write: 'ss:3 c:2', after: 'V', before: 'front ɨ' },
    { sounds: 's', write: 'ss:4 ç:1', after: 'V', before: 'V' },
    { sounds: 's', write: 's:3 c:1', before: 'front ɨ' },
    { sounds: 'z', write: 's:3 z:1', after: 'V', before: 'V' },
    { sounds: 'k', write: 'qu', before: 'front ɨ' },
    { sounds: 'k', write: 'c' },
    { sounds: 'g', write: 'gu', before: 'front ɨ' },
    { sounds: 'ɲ', write: 'nh' },
    { sounds: 'ʎ', write: 'lh' },
    { sounds: 'ʁ', write: 'rr', after: 'V' },
    { sounds: 'ʁ', write: 'r' },
    { sounds: 'ɾ', write: 'r' },
    { sounds: 'j', write: 'i' },
  ],
  say: {
    ɐ: { say: 'uh' },
    ɨ: { say: 'uh' },
  },
  punctuation: { quotes: ['«', '»'] },
  voicing:
    'Hurry the unstressed vowels, almost swallowing them, so the stressed syllable in capitals stands out: a final o is “oo” and a final e nearly disappears. An s before a consonant or at the end of a word is “sh”. Say the ng of “owng” and “oyng” through your nose.',
};

export default portuguese;
