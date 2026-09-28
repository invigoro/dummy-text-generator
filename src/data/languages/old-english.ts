import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Old English, the English of Beowulf: stress on the first syllable, þ, ð and æ, sc for
 * "sh", c and g that soften before e and i, and endings in -an, -um, -es and -e. Project
 * Gutenberg has no Old English prose, so it borrows the flow of Treasure Island.
 */
const oldEnglish: InventedLanguageDef = {
  kind: 'invented',
  id: 'old-english',
  name: 'Old English',
  flow: 'en-treasure-island',
  sounds: {
    classes: {
      C: 'w:5 h:5 s:5 f:5 θ:4 m:4 l:4 b:4 g:4 k:4 d:3 t:3 n:3 r:3 j:2 tʃ:2 ʃ:2 p:1',
      M: 'r:5 l:5 n:5 d:4 ð:4 t:3 ɣ:2 s:3 m:3 v:3 k:3 w:2 j:2 tʃ:1 ʃ:1',
      // Clusters: hr, hl, hw, hn, cw, þr, þw, br, cr, gr, fr, bl, cl, gl, fl.
      O: 'h:3 k:3 b:2 g:2 f:2 θ:1 d:1 t:1',
      L: 'r:4 l:3 w:2 n:1',
      V: 'a:6 æ:6 e:5 o:5 u:5 i:4 y:3 eɑ:3 eo:2 aː:2 æː:2 eː:2 iː:2 oː:2 uː:2 yː:1',
      E: 'e:6 a:5 u:3 o:2',
      F: 'n:5 r:4 l:4 d:3 t:3 s:3 θ:2 x:2 m:2 k:2 ŋ:1 f:1 n+d:2 r+d:1 l+d:1 s+t:1 x+t:1',
      Z: 'n:6 m:3 s:3 r:1 θ:1 d:1',
    },
    first: 'CV:5 CVF:6 OLV:2 OLVF:2 V:1 VF:2',
    syllables: 'MV:5 MVF:3',
    last: 'ME:5 MEZ:6',
    single: 'CVF:6 CV:3 VF:2 OLVF:1',
    stress: 'initial',
    avoid: ['^ð|^ɣ|^v', 'tl|dl|θl|jj', '([ptk])\\.\\1'],
    maxSyllables: 4,
  },
  spelling: [
    // þ and ð stand for the same sounds, and scribes used both.
    { sounds: 'θ', write: 'þ:3 ð:2' },
    { sounds: 'ð', write: 'ð:3 þ:1' },
    { sounds: 'ʃ', write: 'sc' },
    { sounds: 'tʃ', write: 'c' },
    { sounds: 'j', write: 'g' },
    { sounds: 'ɣ', write: 'g' },
    { sounds: 'x', write: 'h' },
    { sounds: 'k w', write: 'cw' },
    { sounds: 'k', write: 'c' },
    { sounds: 'v', write: 'f' },
    { sounds: 'ŋ', write: 'ng' },
    { sounds: 'eɑ', write: 'ea' },
    { sounds: 'eo', write: 'eo' },
    // Long vowels as manuscripts write them, without marks.
    { sounds: 'aː', write: 'a' },
    { sounds: 'æː', write: 'æ' },
    { sounds: 'eː', write: 'e' },
    { sounds: 'iː', write: 'i' },
    { sounds: 'oː', write: 'o' },
    { sounds: 'uː', write: 'u' },
    { sounds: 'yː', write: 'y' },
  ],
  say: {
    e: { sayClosed: 'e' },
    i: { sayClosed: 'i' },
    o: { sayClosed: 'o' },
  },
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Stress the first syllable of every word. þ and ð are both th; sc is “sh”; c before e or i is “ch”, and g before them is “y”; h at the end of a syllable is the “kh” of loch. Every letter is said, final e included.',
};

export default oldEnglish;
