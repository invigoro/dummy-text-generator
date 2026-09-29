import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Quechua, the language of the Incas, spelled as Cusco spells it today ("Qosqo",
 * "ch’aska", "phuyu"). Stress on the second-to-last syllable, always; three vowels, a, i and u,
 * which open to e and o beside q; and at most one breathy (ph, kh) or popped (t’, q’) consonant a
 * word, at its start, as in Quechua's roots.
 */
const quechua: InventedLanguageDef = {
  kind: 'invented',
  id: 'quechua',
  name: 'Quechua',
  flow: 'qu-tercero',
  sounds: {
    classes: {
      // A word's first consonant may be breathy or popped.
      C: 'k:5 p:5 m:5 t:4 tʃ:4 w:4 j:4 s:4 ɾ:3 ʎ:3 h:3 n:2 ɲ:1 kʰ:1.5 pʰ:1 tʰ:1 tʃʰ:1 tʼ:1.5 kʼ:1.5 tʃʼ:1.5 pʼ:1',
      U: 'q:4 qʰ:1.5 qʼ:1.5',
      M: 'n:5 ɾ:5 k:5 t:4 p:4 tʃ:4 m:4 s:4 w:4 ʎ:4 j:3 ɲ:2 h:1',
      G: 'q',
      V: 'a:10 u:6 i:5',
      // Beside q, i and u are said and written e and o.
      E: 'a:10 o:6 ɛ:5',
      // Syllables close with n, y, s, r, w or k inside a word, and with q after e, o or a.
      F: 'n:5 j:3 s:3 ɾ:2 w:1 k:1',
      Q: 'q',
      // Words end in a vowel, or -n, -s, -y, -r: "runasimi", "kan", "llaqtas", "munay".
      Z: 'n:6 j:4 s:3 ɾ:1 w:0.5',
    },
    first: 'CV:7 CVF:3 UE:2 UEF:0.5 CEQ:1 V:2 VF:1.5',
    syllables: 'MV:7 MVF:3 GE:2 GEF:0.5 MEQ:1',
    last: 'MV:8 MVZ:3 GE:2 MEQ:1.5',
    single: 'CV:2 CVZ:3 CEQ:1 UE:0.5 VZ:1',
    stress: 'penultimate',
    avoid: [
      // No yi or wu; the same consonant twice across a syllable break only as ll.
      'ji|wu|j\\.j|w\\.w|([nsɾkq])\\.\\1',
      // q closes a syllable only before a consonant other than q.
      'q\\.q',
    ],
    maxSyllables: 6,
  },
  spelling: [
    { sounds: 'pʰ', write: 'ph' },
    { sounds: 'tʰ', write: 'th' },
    { sounds: 'kʰ', write: 'kh' },
    { sounds: 'qʰ', write: 'qh' },
    { sounds: 'tʃʰ', write: 'chh' },
    { sounds: 'pʼ', write: 'p’' },
    { sounds: 'tʼ', write: 't’' },
    { sounds: 'kʼ', write: 'k’' },
    { sounds: 'qʼ', write: 'q’' },
    { sounds: 'tʃʼ', write: 'ch’' },
    { sounds: 'tʃ', write: 'ch' },
    { sounds: 'ʎ', write: 'll' },
    { sounds: 'ɲ', write: 'ñ' },
    { sounds: 'ɾ', write: 'r' },
    { sounds: 'j', write: 'y' },
    { sounds: 'ɛ', write: 'e' },
    // n is m before p: "pampa", "tampu".
    { sounds: 'n', write: 'm', before: 'p pʰ pʼ' },
  ],
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Stress the second-to-last syllable, always. q is a k made far back in the throat, and it opens the vowels beside it, which is why they’re written e and o there. An apostrophe after a letter makes it popped (t’, k’, ch’), and an h after one makes it breathy: ph, th and kh are a p, t or k with a puff of air, never an f or a th. ll is the lli of “million”, ñ the ny of “canyon”, and r is tapped, as in Spanish.',
};

export default quechua;
