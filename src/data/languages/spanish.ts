import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented Spanish, in Castilian pronunciation: open syllables, five pure vowels, a rolled rr,
 * the "th" of c and z, and the "kh" of j. Words end in -o, -a, -os, -as, -ar, -dad and -ción, and
 * written accents mark the ones stressed against the rule.
 */
const spanish: InventedLanguageDef = {
  kind: 'invented',
  id: 'spanish',
  name: 'Spanish',
  flow: 'es-don-quijote',
  sounds: {
    classes: {
      // Consonants starting a word, and starting a syllable inside one (where the tapped r goes).
      C: 's:9 d:8 k:8 t:7 l:7 m:7 n:6 p:6 b:6 r:3 g:3 f:3 θ:3 x:2 tʃ:2 j:1.5 ɲ:0.5',
      M: 'd:8 ɾ:7 s:7 t:7 k:7 l:7 n:7 m:6 b:5 p:4 g:3 θ:3 r:2 x:2 tʃ:2 f:2 j:1.5 ɲ:1',
      // Clusters: pr, br, tr, dr, cr, gr, fr, pl, bl, cl, gl, fl.
      O: 'p:3 b:3 t:3 k:3 d:2 g:2 f:2',
      L: 'ɾ:4 l:2',
      // Glides: the i of "tierra", the u of "bueno", and the vowels after them.
      J: 'j',
      Y: 'e:5 a:3 o:3',
      W: 'w',
      U: 'e:5 a:4 i:2',
      V: 'a:10 e:9 o:8 i:6 u:3',
      // Vowels and consonants that end words: -o, -a, -os, -an, -ar, -al, -dad, -az.
      E: 'o:9 a:9 e:6 i:1',
      Z: 's:10 n:7 ɾ:4 l:3 d:2 θ:1.5',
      // Consonants closing a syllable inside a word: "can-to", "tor-re", "es-pa-da".
      F: 'n:6 s:5 ɾ:5 l:3 m:1 k:0.5',
    },
    first: 'CV:12 V:3 CVF:4 VF:2 OLV:2 CJY:1 CWU:1',
    syllables: 'MV:12 MVF:4 OLV:1.5 MJY:1 MWU:1',
    last: 'ME:10 MEZ:6 OLE:1.5 MJY:1 MJYZ:0.8 MWU:0.5',
    single: 'CV:6 V:3 VZ:3 CVZ:4 CWU:0.5',
    stress: 'spanish',
    irregularStress: { chance: 0.18, to: ['final', 'antepenultimate'], marked: 'all' },
    // Spanish doesn't double consonants in speech: no "nn", "ll" or "ss" across syllables.
    avoid: ['tl|dl', 'm\\.[^pb]', 'n\\.[pbmn]', 'l\\.l|s\\.s|ɾ\\.ɾ', 'jj|ww|ji|wu', '^ɾ', 's\\.[^ptkmnlbdgfθx]'],
    maxSyllables: 5,
  },
  spelling: [
    // Accents on stress that breaks the rule: "canción", "árbol", "médico".
    { sounds: 'a', write: 'á', stress: 'marked' },
    { sounds: 'e', write: 'é', stress: 'marked' },
    { sounds: 'i', write: 'í', stress: 'marked' },
    { sounds: 'o', write: 'ó', stress: 'marked' },
    { sounds: 'u', write: 'ú', stress: 'marked' },
    // A silent h before some words that start with a vowel: "hombre", "hacer".
    { sounds: 'a', write: 'a:5 ha:1', after: '#' },
    { sounds: 'e', write: 'e:5 he:1', after: '#' },
    { sounds: 'o', write: 'o:5 ho:1', after: '#' },
    { sounds: 'k', write: 'qu', before: 'front' },
    { sounds: 'k', write: 'c' },
    { sounds: 'g', write: 'gu', before: 'front' },
    { sounds: 'x', write: 'j:2 g:1', before: 'front' },
    { sounds: 'x', write: 'j' },
    { sounds: 'θ', write: 'c', before: 'front' },
    { sounds: 'θ', write: 'z' },
    { sounds: 'tʃ', write: 'ch' },
    { sounds: 'ɲ', write: 'ñ' },
    // b and v are the same sound in Spanish, so both spellings turn up.
    { sounds: 'b', write: 'b:3 v:2' },
    // The rolled r is rr between vowels, a plain r elsewhere.
    { sounds: 'r', write: 'rr', after: 'V' },
    { sounds: 'r', write: 'r' },
    { sounds: 'ɾ', write: 'r' },
    // Glides: "tierra", "bueno", "huevo", "yeso".
    { sounds: 'j', write: 'i', after: 'C' },
    { sounds: 'j', write: 'y' },
    { sounds: 'w', write: 'hu', after: '#' },
    { sounds: 'w', write: 'u' },
  ],
  say: {
    e: { say: 'eh', sayClosed: 'e' },
    r: { say: 'rr' },
  },
  punctuation: { quotes: ['«', '»'] },
  voicing:
    'Crisp and even, every syllable its own length, the stress where the capitals are. Keep the vowels pure: “oh” never slides into “ow”. Roll the rr, say “th” for c and z, and “kh” for j, at the back of the throat.',
};

export default spanish;
