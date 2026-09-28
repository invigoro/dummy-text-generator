import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Welsh: stress on the second-to-last syllable, w and y used as vowels, and the letters
 * Welsh is known for: ll (a breathy l), dd (the th of "this"), ch, ff and rh.
 */
const welsh: InventedLanguageDef = {
  kind: 'invented',
  id: 'welsh',
  name: 'Welsh',
  flow: 'cy-cartrefi-cymru',
  sounds: {
    classes: {
      C: 'k:5 d:5 b:4 g:4 m:5 n:4 t:3 p:3 ɬ:3 h:3 r:3 s:3 v:3 w:3 f:2 l:2 θ:1 x:1 j:1',
      M: 'r:5 n:5 d:4 ð:4 l:4 ɬ:3 v:3 g:3 b:3 m:3 θ:2 x:2 s:2 w:2 ŋ:1 j:1',
      // Clusters: br, cr, dr, gr, pr, tr, bl, cl, gl, fl, gw, chw.
      O: 'k:3 g:3 b:2 d:2 p:2 t:2 f:1 x:0.5',
      L: 'r:4 l:2 w:1',
      V: 'a:8 ɛ:5 ɔ:5 i:4 u:4 ɨ:4 ə:3 aɪ:1 aɨ:1 ʊɨ:1 au:1 ei:1 ɔɨ:0.5 ɛu:0.5 ɨu:0.5',
      // Vowels in a word's last syllable, where y is the "ee" sound, never the "uh".
      E: 'a:6 ɛ:4 ɨ:4 ɔ:4 u:3 i:3',
      F: 'n:6 r:5 l:4 ð:3 ɬ:2 s:2 θ:1 x:1 d:1 g:1 m:1 ŋ:1 n+t:1',
    },
    first: 'CV:8 CVF:6 OLV:2 OLVF:1 V:1 VF:2',
    syllables: 'MV:6 MVF:4',
    last: 'MEF:7 ME:4',
    single: 'CVF:5 CV:3 VF:3 OLVF:1',
    stress: 'penultimate',
    avoid: ['^ð|^ŋ', '[^aeiouɛɔɨə]\\.ŋ', 'tl|dl|θl|ɬl|lɬ', 'ww|jj|wu|ji'],
    maxSyllables: 4,
  },
  spelling: [
    { sounds: 'ʊɨ', write: 'wy' },
    { sounds: 'aɨ', write: 'au:2 ae:1' },
    { sounds: 'aɪ', write: 'ai' },
    { sounds: 'ɔɨ', write: 'oe' },
    { sounds: 'au', write: 'aw' },
    { sounds: 'ɛu', write: 'ew' },
    { sounds: 'ɨu', write: 'yw:2 uw:1' },
    // w and y are vowels: w is "oo", y "ee" in a last syllable and "uh" before it.
    { sounds: 'u', write: 'w' },
    { sounds: 'ɨ', write: 'u:2 y:3' },
    { sounds: 'ə', write: 'y' },
    { sounds: 'ɛ', write: 'e' },
    { sounds: 'ɔ', write: 'o' },
    // f is v and ff is f; dd is the th of "this", th the th of "thin".
    { sounds: 'f', write: 'ff' },
    { sounds: 'v', write: 'f' },
    { sounds: 'ð', write: 'dd' },
    { sounds: 'θ', write: 'th' },
    { sounds: 'x', write: 'ch' },
    { sounds: 'ɬ', write: 'll' },
    { sounds: 'ŋ', write: 'ng' },
    { sounds: 'k', write: 'c' },
    { sounds: 'r', write: 'rh:1 r:5', after: '#' },
    { sounds: 'j', write: 'i' },
  ],
  say: {
    ɨ: { say: 'ee', sayClosed: 'i' },
  },
  punctuation: { quotes: ['“', '”'] },
  voicing:
    'Stress the second-to-last syllable. ll is a breathy l: put your tongue where l goes and blow past it (“hl”). ch is the “kh” of loch, dd the th of “this”, and f is v (ff is f). w and y are vowels: w is “oo”, y is “uh” or “ee”.',
};

export default welsh;
