import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Dutch: stress on the first syllable, and Dutch's spelling of its long vowels, single in
 * an open syllable and double in a closed one ("maken", "maak"), with a short vowel always closed
 * in by a consonant. g and ch are the rasp in the throat, sch starts a word as "s-kh", ij and ui
 * are Dutch's own diphthongs, and words end the way so many Dutch ones do: -en, -e, -er, -ig, -lijk.
 */
const dutch: InventedLanguageDef = {
  kind: 'invented',
  id: 'dutch',
  name: 'Dutch',
  flow: 'nl-kleine-johannes',
  sounds: {
    classes: {
      C: 'd:6 v:5 ɣ:5 z:4 b:4 m:4 ɦ:4 ʋ:4 k:4 l:4 n:3 t:3 p:3 r:3 s:3 j:2 f:2',
      M: 'd:5 l:5 r:5 n:5 t:5 k:4 v:4 ɣ:4 m:4 z:3 b:3 s:3 ʋ:3 p:2 x:2 j:1',
      // Clusters at the start of a word: br, dr, gr, kl, sl, st, zw, sch, schr, kn…
      O: 'b:3 d:2 ɣ:3 k:3 p:2 t:2 f:1 v:1',
      L: 'r:4 l:3',
      S: 's+t:3 s+x:3 s+x+r:1 s+l:1 s+p:1 s+m:0.5 s+n:0.5 k+n:1 z+ʋ:1.5 d+ʋ:0.5 t+ʋ:0.5 k+ʋ:0.5',
      // Short vowels, always closed in by a consonant; long ones and diphthongs, open or closed.
      A: 'ɑ:6 ɛ:5 ɪ:5 ɔ:4 ʏ:2',
      V: 'aː:5 eː:5 oː:4 i:3 u:3 y:2 øː:1 ɛi:3 œy:1.5 ɑu:1.5',
      F: 'n:5 l:4 r:4 t:4 s:3 k:3 x:2 m:2 p:1 f:1 ŋ:1',
      // The endings: -en, -e, -er, -el, and -ig, -lijk, -ing.
      E: 'ə',
      N: 'n:6 r:3 l:2',
      G: 'x',
      I: 'ɪ',
      Q: 'ŋ',
    },
    first: 'CAF:6 CV:5 CVF:3 OLAF:1 OLV:1 SAF:1 SV:0.5 AF:1 V:1',
    syllables: 'MAF:4 MV:4 MVF:2',
    last: 'ME:4 MEN:6 MEG:1 MIQ:1 MAF:3 MV:1 MVF:2',
    single: 'CAF:6 CVF:4 CV:2 AF:2 OLAF:1 SAF:1 VF:1',
    stress: 'initial',
    avoid: [
      // No j or w before a short i, no h at a syllable's end, the same consonant twice only as the
      // double one of "zitten".
      'ji|ʋʏ|([ndlrksmpfx])\\.\\1(?=[ɑɛɪɔʏaeiouyøə])',
      // After the first syllable, s and z and f and v go where Dutch puts them.
      '\\.[zv]ə',
      'ŋ\\.[^kx]',
    ],
    maxSyllables: 4,
  },
  spelling: [
    // Endings: -ig, -lijk, -ing.
    { sounds: 'ə x', write: 'ig', before: '#' },
    { sounds: 'l ə k', write: 'lijk', before: '#' },
    { sounds: 's x', write: 'sch' },
    // A long vowel is written once where its syllable is open, twice where it's closed.
    { sounds: 'aː', write: 'a', syllable: 'open' },
    { sounds: 'aː', write: 'aa' },
    { sounds: 'eː', write: 'ee', before: '#' },
    { sounds: 'eː', write: 'e', syllable: 'open' },
    { sounds: 'eː', write: 'ee' },
    { sounds: 'oː', write: 'o', syllable: 'open' },
    { sounds: 'oː', write: 'oo' },
    { sounds: 'y', write: 'u', syllable: 'open' },
    { sounds: 'y', write: 'uu' },
    { sounds: 'øː', write: 'eu' },
    { sounds: 'i', write: 'ie' },
    { sounds: 'u', write: 'oe' },
    { sounds: 'ɛi', write: 'ij:3 ei:1' },
    { sounds: 'œy', write: 'ui' },
    { sounds: 'ɑu', write: 'ou:2 au:1' },
    { sounds: 'ɑ', write: 'a' },
    { sounds: 'ɛ', write: 'e' },
    { sounds: 'ɪ', write: 'i' },
    { sounds: 'ɔ', write: 'o' },
    { sounds: 'ʏ', write: 'u' },
    { sounds: 'ə', write: 'e' },
    { sounds: 'x', write: 'ch' },
    { sounds: 'ɣ', write: 'g' },
    { sounds: 'ɦ', write: 'h' },
    { sounds: 'ʋ', write: 'w' },
    { sounds: 'ŋ', write: 'ng' },
    // A d at the end of a word is said t, and written either way: "hond", "want".
    { sounds: 't', write: 't:3 d:1', before: '#' },
  ],
  say: {
    ɑ: { say: 'ah', sayClosed: 'ah' },
    ɣ: { say: 'kh' },
    ɦ: { say: 'h' },
  },
  punctuation: { quotes: ['‘', '’'] },
  voicing:
    'Stress the first syllable. g and ch are both the rasp of Scottish “loch”, sch is “s” then that rasp, and w is between a v and a w. ij and ei are “eye” said with a flatter mouth, ui is “ow” with rounded lips, oe is “oo” and ie “ee”. A final -en is just “uh”.',
};

export default dutch;
