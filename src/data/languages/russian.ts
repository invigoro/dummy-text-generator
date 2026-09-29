import type { InventedLanguageDef } from '../../engine/language';
import type { SpellingRule } from '../../engine/spelling';

/** Russian's consonants: IPA, then the Cyrillic letter and its Latin transliteration. */
const CONSONANTS: readonly (readonly [string, string, string])[] = [
  ['p', 'п', 'p'],
  ['b', 'б', 'b'],
  ['t', 'т', 't'],
  ['d', 'д', 'd'],
  ['k', 'к', 'k'],
  ['g', 'г', 'g'],
  ['f', 'ф', 'f'],
  ['v', 'в', 'v'],
  ['s', 'с', 's'],
  ['z', 'з', 'z'],
  ['m', 'м', 'm'],
  ['n', 'н', 'n'],
  ['l', 'л', 'l'],
  ['r', 'р', 'r'],
  ['x', 'х', 'kh'],
];

/** The ones without a soft partner: ц, ш, ж, ч, щ. */
const HUSHING: readonly (readonly [string, string, string])[] = [
  ['ts', 'ц', 'ts'],
  ['ʂ', 'ш', 'sh'],
  ['ʐ', 'ж', 'zh'],
  ['tɕ', 'ч', 'ch'],
  ['ɕ', 'щ', 'shch'],
];

/**
 * Spelling the sounds in one alphabet or the other. A soft consonant is written with the letter
 * for its hard partner: before a vowel, the vowel's soft letter shows the softness (ля, лю, ле);
 * before a consonant, or at the end of a word, the soft sign ь does (ль), a prime in Latin
 * letters (l'). й before a vowel joins it as я, ю, е, ё.
 */
function spelling(alphabet: 'cyrillic' | 'latin'): SpellingRule[] {
  const pick = (cyrillic: string, latin: string) => (alphabet === 'cyrillic' ? cyrillic : latin);
  return [
    { sounds: 'j a', write: pick('я', 'ya') },
    { sounds: 'j u', write: pick('ю', 'yu') },
    { sounds: 'j e', write: pick('е', 'ye') },
    { sounds: 'j o', write: pick('ё', 'yo') },
    { sounds: 'j', write: pick('й', 'y') },
    ...CONSONANTS.flatMap(([sound, cyrillic, latin]): SpellingRule[] => [
      { sounds: `${sound}ʲ`, write: pick(`${cyrillic}ь`, `${latin}'`), before: 'C #' },
      { sounds: `${sound}ʲ`, write: pick(cyrillic, latin) },
      { sounds: sound, write: pick(cyrillic, latin) },
    ]),
    ...HUSHING.map(([sound, cyrillic, latin]): SpellingRule => ({ sounds: sound, write: pick(cyrillic, latin) })),
    { sounds: 'a', write: pick('я', 'ya'), after: 'soft' },
    { sounds: 'u', write: pick('ю', 'yu'), after: 'soft' },
    { sounds: 'o', write: pick('ё', 'yo'), after: 'soft' },
    // ы after ш and ж is written и.
    { sounds: 'ɨ', write: pick('и', 'i'), after: 'ʂ ʐ' },
    { sounds: 'ɨ', write: pick('ы', 'y') },
    // э starts a word, or follows a vowel; е follows a consonant.
    { sounds: 'e', write: pick('э', 'e'), after: '# V' },
    { sounds: 'e', write: pick('е', 'e') },
    { sounds: 'a', write: pick('а', 'a') },
    { sounds: 'o', write: pick('о', 'o') },
    { sounds: 'u', write: pick('у', 'u') },
    { sounds: 'i', write: pick('и', 'i') },
  ];
}

/**
 * Invented Russian, in Cyrillic, with Latin letters a switch away: hard and soft consonants, the
 * hushing ш, ж, щ and ч, and ы; stress that moves from word to word, as Russian's does, and words
 * that end as so many Russian ones do: -ов, -ий, -ть, -ая, -ость.
 */
const russian: InventedLanguageDef = {
  kind: 'invented',
  id: 'russian',
  name: 'Russian',
  flow: 'ru-geroy',
  sounds: {
    classes: {
      C: [
        'v:5 s:5 n:5 d:4 k:4 m:4 p:3 b:3 t:3 r:3 z:2 g:2 l:2 tɕ:2 x:1 ts:1 ʂ:1 ʐ:1 j:1',
        'nʲ:1 lʲ:1 mʲ:1 vʲ:1 bʲ:1 dʲ:1 tʲ:1 sʲ:1 rʲ:0.5 pʲ:0.5',
      ].join(' '),
      M: [
        'n:5 l:4 r:4 t:4 k:4 v:4 d:3 s:3 m:3 ʐ:1 ʂ:1 tɕ:2 ts:1 x:1 b:1 p:1 z:1 g:1 j:2',
        'nʲ:3 lʲ:3 rʲ:2 tʲ:2 dʲ:2 vʲ:1 mʲ:1 sʲ:1 bʲ:0.5 kʲ:0.5',
      ].join(' '),
      // Clusters at the start of a word: пр, тр, кр, гр, бр, др, вр, пл, кл, гл, бл, вл, ст, ск, сп, зв, св, сл, сн.
      O: 'p:3 t:2 k:3 g:2 b:2 d:2 v:2',
      L: 'r:4 l:2',
      S: 's+t:4 s+k:2 s+p:1 s+t+r:1 z+v:1 s+v:1.5 s+l:1 s+n:0.5 s+m:0.5 v+z:0.5',
      V: 'a:7 o:7 e:6 i:5 u:3 ɨ:2',
      F: 's:3 n:3 l:2 r:2 j:2 v:1 k:1 t:1 m:1 lʲ:1',
      // Words end in a vowel, or й, в, н, т, ть, м, х, к, or -ость.
      Z: 'j:4 v:3 n:3 t:3 tʲ:3 m:2 x:2 k:2 l:1 lʲ:1 s+tʲ:1',
    },
    first: 'CV:7 CVF:2 OLV:2 SV:1.5 V:1 VF:0.5',
    syllables: 'MV:8 MVF:2',
    last: 'MV:6 MVZ:6',
    single: 'CV:3 CVZ:4 OLVZ:0.5 V:1 VZ:1',
    stress: 'penultimate',
    irregularStress: { chance: 0.45, to: ['final', 'antepenultimate'], marked: 'none' },
    avoid: [
      // ы never follows a soft consonant, й, ч or щ, or starts a word or a syllable; ё is rare.
      'ʲɨ|jɨ|tɕɨ|ɕɨ|^ɨ|\\.ɨ|ʲo',
      'jj|j[iɨ]|j\\.j',
    ],
    maxSyllables: 5,
  },
  spelling: spelling('cyrillic'),
  alphabet: { name: 'Cyrillic', latin: spelling('latin') },
  say: {
    e: { say: 'eh', sayClosed: 'e' },
  },
  punctuation: { quotes: ['«', '»'] },
  voicing:
    'Russian stress moves from word to word: lean on the syllable in capitals, and let the unstressed o’s slide towards “ah”. A y after a consonant (ty, ly, ny) softens it, as in “new”. ы is an i said with the tongue pulled back, kh the rasp of “loch”, zh the s of “measure”.',
};

export default russian;
