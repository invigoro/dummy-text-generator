import type { InventedLanguageDef } from '../../engine/language';
import type { SpellingRule } from '../../engine/spelling';

/** Arabic's consonants: IPA, then the Arabic letter and its Latin transliteration. */
const CONSONANTS: readonly (readonly [string, string, string])[] = [
  ['b', 'ب', 'b'],
  ['t', 'ت', 't'],
  ['θ', 'ث', 'th'],
  ['dʒ', 'ج', 'j'],
  ['ħ', 'ح', 'ḥ'],
  ['x', 'خ', 'kh'],
  ['d', 'د', 'd'],
  ['ð', 'ذ', 'dh'],
  ['r', 'ر', 'r'],
  ['z', 'ز', 'z'],
  ['s', 'س', 's'],
  ['ʃ', 'ش', 'sh'],
  ['sˤ', 'ص', 'ṣ'],
  ['dˤ', 'ض', 'ḍ'],
  ['tˤ', 'ط', 'ṭ'],
  ['ðˤ', 'ظ', 'ẓ'],
  ['ʕ', 'ع', 'ʿ'],
  ['ɣ', 'غ', 'gh'],
  ['f', 'ف', 'f'],
  ['q', 'ق', 'q'],
  ['k', 'ك', 'k'],
  ['l', 'ل', 'l'],
  ['m', 'م', 'm'],
  ['n', 'ن', 'n'],
  ['h', 'ه', 'h'],
  ['w', 'و', 'w'],
  ['j', 'ي', 'y'],
];

/** The consonants that can be doubled, as the sound system doubles them. */
const DOUBLED = new Set(['b', 't', 'd', 'k', 'f', 's', 'z', 'ʃ', 'm', 'n', 'l', 'r', 'θ', 'ð', 'x', 'j', 'q', 'ħ', 'ʕ', 'w', 'sˤ', 'dˤ', 'tˤ']);

/**
 * Arabic script writes a word's consonants and long vowels, and leaves out its short ones; a
 * doubled consonant is written once. The catch in the throat, hamza, sits on the letter its vowels
 * call for, and a word's last short a is mostly the ة of the feminine. Latin letters write it all:
 * "kitāb", "madrasa".
 */
function spelling(alphabet: 'arabic' | 'latin'): SpellingRule[] {
  const arabic = alphabet === 'arabic';
  return [
    ...(arabic
      ? [
          { sounds: 'ʔ aː', write: 'آ' },
          { sounds: 'ʔ', write: 'إ', after: '#', before: 'i iː' },
          { sounds: 'ʔ', write: 'أ', after: '#' },
          { sounds: 'ʔ', write: 'ء', before: '#' },
          { sounds: 'ʔ', write: 'ئ', before: 'i iː' },
          { sounds: 'ʔ', write: 'ئ', after: 'i iː' },
          { sounds: 'ʔ', write: 'ؤ', before: 'u uː' },
          { sounds: 'ʔ', write: 'أ' },
          { sounds: 'aː', write: 'ا' },
          { sounds: 'iː', write: 'ي' },
          { sounds: 'uː', write: 'و' },
          { sounds: 'a', write: 'ة:3 ∅:2', before: '#' },
          { sounds: 'a', write: '∅' },
          { sounds: 'i', write: '∅' },
          { sounds: 'u', write: '∅' },
        ]
      : [
          // The catch that starts a word isn't written in Latin letters: "amīr", not "ʾamīr".
          { sounds: 'ʔ', write: '∅', after: '#' },
          { sounds: 'ʔ', write: 'ʾ' },
          { sounds: 'aː', write: 'ā' },
          { sounds: 'iː', write: 'ī' },
          { sounds: 'uː', write: 'ū' },
        ]),
    ...CONSONANTS.flatMap(([sound, letter, latin]): SpellingRule[] => [
      ...(DOUBLED.has(sound) ? [{ sounds: `${sound}ː`, write: arabic ? letter : latin + latin }] : []),
      { sounds: sound, write: arabic ? letter : latin },
    ]),
  ];
}

/**
 * Invented Arabic, in Arabic script, right to left, with Latin letters a switch away: its throaty
 * ḥ and ʿ, its emphatic ṣ, ḍ, ṭ and ẓ, q far back in the throat; three vowels, each short or long;
 * doubled consonants; and its article joined to the next word, as al- is.
 */
const arabic: InventedLanguageDef = {
  kind: 'invented',
  id: 'arabic',
  name: 'Arabic',
  flow: 'ar-nazarat',
  sounds: {
    classes: {
      // Every word starts with a consonant; a catch in the throat, if nothing else.
      C: 'm:5 k:4 q:4 ʕ:4 ħ:3 ʔ:5 j:3 w:4 t:3 n:3 f:3 b:3 s:3 dʒ:2 x:2 h:2 r:2 d:2 ʃ:2 sˤ:2 tˤ:1 dˤ:1 z:1 θ:1 ð:1 ɣ:1 ðˤ:0.5 l:1',
      M: 'l:6 r:5 n:5 m:4 t:4 d:3 s:3 k:3 b:3 f:3 q:3 ʕ:3 ħ:3 j:3 w:3 h:2 ʔ:2 dʒ:2 z:2 ʃ:2 x:1 sˤ:2 tˤ:1 dˤ:1 θ:1 ð:1 ɣ:1',
      // Doubled, as in "kattaba" and "mudarris".
      D: 'lː:3 dː:2 tː:2 rː:2 sː:2 mː:2 nː:2 kː:1 bː:1 qː:1 ħː:1 ʕː:1 jː:1 wː:1',
      V: 'a:10 i:5 u:4 aː:5 iː:3 uː:2',
      // A word of one syllable ends in a consonant or a long vowel: من, في, لا.
      L: 'aː:3 iː:2 uː:1',
      F: 'l:3 n:3 r:3 m:2 s:2 ʕ:2 b:2 t:2 d:2 q:2 k:2 ħ:1 f:1 ʃ:1 dʒ:1 w:1 j:1 x:1 ʔ:1',
      // Words end in a vowel, or -n, -t, -m, -r, -l, -d, -b, -q.
      Z: 'n:4 t:3 m:2 r:2 l:2 d:2 b:1 q:1 k:1 s:1 ħ:1 ʕ:1 h:1',
    },
    first: 'CV:7 CVF:4',
    syllables: 'MV:7 MVF:3 DV:1',
    last: 'MV:4 MVZ:6 DVZ:1',
    single: 'CVZ:5 CL:3',
    stress: 'latin',
    avoid: [
      // A long vowel doesn't close in on a consonant inside a word; a doubled consonant follows a
      // short open syllable ("ka.tːa"); and no consonant follows itself.
      '[aiu]ː[^.]+\\.',
      '[^aiuː.]\\.[^.aiu]+ː|[aiu]ː\\.[^.aiu]+ː',
      '([bdfhjklmnqrstwzðħʃʕʔθxɣ])\\.\\1',
      // No two sounds of the throat side by side: ʕ, ħ, ʔ, h.
      'jiː|wuː|[ʔʕħh]\\.?[ʔʕħh]',
    ],
    maxSyllables: 4,
  },
  spelling: spelling('arabic'),
  alphabet: { name: 'Arabic', direction: 'rtl', latin: spelling('latin') },
  say: {
    a: { sayClosed: 'a' },
    // English starts a vowel with a catch anyway; the syllable break shows one inside a word.
    ʔ: { say: '' },
  },
  punctuation: { quotes: ['«', '»'] },
  voicing:
    'Stress a long syllable near the end, and say the long vowels (ā, ī, ū, and aa, ee, oo below) twice as long as the short ones. ḥ is a breathy h from deep in the throat, ʿ (an apostrophe below) a squeeze of the throat, q a k made far back, kh the rasp of “loch” and gh its voiced, gargled cousin. A doubled consonant is held.',
};

export default arabic;
