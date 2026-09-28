import type { InventedLanguageDef } from '../../engine/language';

/**
 * Invented French: mostly open syllables, nasal vowels, a throaty r, no stress inside a phrase.
 * Spelling adds the silent endings that make French look French (-ent, -eau, -ais, -oix).
 */
const french: InventedLanguageDef = {
  kind: 'invented',
  id: 'french',
  name: 'French',
  flow: 'fr-trois-mousquetaires',
  sounds: {
    classes: {
      // Consonants at the start of a syllable.
      C: 'l:8 s:8 d:8 t:7 m:7 ʁ:7 p:6 k:6 n:5 v:5 ʒ:3 b:3 f:3 ʃ:2 g:2 z:1 j:1 ɲ:0.3',
      // The first consonant of a cluster (pr, bl, tr, gr…), and the second.
      O: 'p:3 t:3 k:3 b:2 f:2 d:1 g:1 v:1',
      L: 'ʁ:3 l:2',
      // The glide in "pied", "bien", "nation".
      J: 'j',
      V: 'a:9 e:7 i:7 ɛ:6 ɑ̃:5 o:4 u:4 ɔ̃:4 ɔ:3 y:3 ə:3 ɛ̃:2 wa:2 ø:1 œ:1',
      // Vowels after the glide.
      W: 'ɛ:3 ɔ̃:3 ɛ̃:3 e:2 a:2 ɑ̃:1 o:1',
      // Consonants ending a word ("porte", "belle", "sac"), and ending a syllable inside one.
      F: 'ʁ:6 l:4 s:2 t:2 k:2 m:1 n:1 d:1 ʒ:1 v:1 p:0.5 z:0.5',
      R: 'ʁ:3 l:1 s:1',
    },
    syllables: 'CV:12 OLV:2 CJW:1.5 CVR:2',
    first: 'CV:12 V:2 OLV:2 CJW:1 CVR:2',
    last: 'CV:10 CVF:5 OLV:2 CJW:2 OLVF:1',
    single: 'CV:10 V:1 VF:1 CVF:3 OLV:1',
    stress: 'phrase',
    avoid: [
      // A schwa is silent at the end of a longer word, and never starts one.
      '\\.[^.]*ə[^.]*$',
      '^ə',
      'tl|dl|vl|jj',
      // French has no closed "é" syllable: "bète" would be "bête", with the other e.
      'e[ʁlstkmndʒvpzfbgʃ](\\.|$)',
      // A nasal vowel before n or m would be spelled like a plain one ("anne"), and one closed
      // by most consonants looks wrong ("onlle"). "Tante", "monde", "danse" and "ange" are fine.
      '[ɑ̃ɔ̃ɛ̃œ̃]\\.?[nmɲ]',
      '[ɑ̃ɔ̃ɛ̃œ̃][lʁkpfvbgʃ]',
      '^ɲ',
      // French doesn't double consonants in speech, and puts s inside a word only before p, t or k.
      'ʁ\\.ʁ|l\\.l|s\\.s',
      's\\.[^ptk]',
    ],
    maxSyllables: 4,
  },
  spelling: [
    // Endings where the vowel's spelling depends on the consonant after it: "belle", "mère", "fleur".
    { sounds: 'ɛ l', write: 'elle:4 èle:1 el:1', before: '#' },
    { sounds: 'ɛ t', write: 'ette:3 ète:1 aite:1', before: '#' },
    { sounds: 'ɛ ʁ', write: 'ère:2 er:1 erre:1 air:1 aire:1', before: '#' },
    { sounds: 'ɛ s', write: 'esse:3 èce:1 aisse:1', before: '#' },
    { sounds: 'ɛ k', write: 'èque:2 ec:1', before: '#' },
    { sounds: 'ɛ m', write: 'ème:2 emme:1 aime:1', before: '#' },
    { sounds: 'ɛ n', write: 'enne:3 aine:2 ène:1', before: '#' },
    { sounds: 'ɛ d', write: 'ède:2 aide:1', before: '#' },
    { sounds: 'ɛ v', write: 'ève:3 aive:0.5', before: '#' },
    { sounds: 'ɛ ʒ', write: 'ège:2 eige:1', before: '#' },
    { sounds: 'ɛ p', write: 'èpe:1 eppe:1', before: '#' },
    { sounds: 'ɛ z', write: 'èse:2 aise:2', before: '#' },
    { sounds: 'i l', write: 'ile:4 il:2', before: '#' },
    { sounds: 'œ ʁ', write: 'eur:4 eure:1 œur:1', before: '#' },

    // Vowels. At the end of a word they take the silent letters French is known for.
    { sounds: 'wa', write: 'oi:6 oix:1 oie:1 ois:1', before: '#' },
    { sounds: 'wa', write: 'oi' },
    { sounds: 'j ɛ̃', write: 'ien' },
    // After c or g, "en" would read as "sen" or "zhen".
    { sounds: 'ɑ̃', write: 'am', after: 'k g', before: 'labial' },
    { sounds: 'ɑ̃', write: 'ant:2 an:2 and:1', after: 'k g', before: '#' },
    { sounds: 'ɑ̃', write: 'an', after: 'k g' },
    { sounds: 'ɑ̃', write: 'am:1 em:1', before: 'labial' },
    { sounds: 'ɑ̃', write: 'ant:3 ent:3 an:2 and:1 ans:1 ang:0.5', before: '#' },
    { sounds: 'ɑ̃', write: 'an:3 en:2' },
    { sounds: 'ɔ̃', write: 'om', before: 'labial' },
    { sounds: 'ɔ̃', write: 'on:4 ont:1 ond:1 ons:1', before: '#' },
    { sounds: 'ɔ̃', write: 'on' },
    { sounds: 'ɛ̃', write: 'im:2 aim:1', before: 'labial' },
    { sounds: 'ɛ̃', write: 'in:3 ain:3 ein:1 int:1 aint:1', before: '#' },
    { sounds: 'ɛ̃', write: 'in:3 ain:2 ein:1' },
    { sounds: 'œ̃', write: 'un:3 um:1' },
    { sounds: 'e', write: 'é:4 er:3 ez:1 ée:1 és:1', before: '#' },
    { sounds: 'e', write: 'é' },
    { sounds: 'ɛ', write: 'et:3 ait:3 ais:2 ès:1 êt:1', before: '#' },
    { sounds: 'ɛ', write: 'è:3 ai:3 ê:1 ei:1', syllable: 'open' },
    { sounds: 'ɛ', write: 'e:6 ai:1 ê:1' },
    { sounds: 'o', write: 'eau:3 o:2 ot:2 aud:1 aux:1', before: '#' },
    { sounds: 'o', write: 'o:5 au:3 ô:1' },
    { sounds: 'ɔ', write: 'o' },
    { sounds: 'u', write: 'ou:4 oux:1 out:1 oue:0.5', before: '#' },
    { sounds: 'u', write: 'ou' },
    { sounds: 'y', write: 'u:4 ue:1 us:1 ut:1', before: '#' },
    { sounds: 'y', write: 'u' },
    { sounds: 'ø', write: 'eu:3 eux:2', before: '#' },
    { sounds: 'ø', write: 'eu' },
    { sounds: 'œ', write: 'eu:5 œu:1' },
    { sounds: 'ə', write: 'e' },
    { sounds: 'i', write: 'i:4 is:1 it:1 ie:1', before: '#' },
    { sounds: 'i', write: 'i:18 y:1 î:1' },
    { sounds: 'a', write: 'a:5 as:1 at:1 â:0.5', before: '#' },
    { sounds: 'a', write: 'a:24 â:1' },

    // Consonants. Ending a word, most take a silent e ("porte", "belle"). An e (or schwa) after c
    // or g softens it, so before one they become "qu" and "gu", and ʒ can be a plain g.
    { sounds: 'k', write: 'que:3 c:1', before: '#' },
    { sounds: 'k', write: 'qu', before: 'front ə j' },
    { sounds: 'k', write: 'c', before: 'C' },
    { sounds: 'k', write: 'c:8 qu:1' },
    { sounds: 'g', write: 'gue', before: '#' },
    { sounds: 'g', write: 'gu', before: 'front ə' },
    { sounds: 'ʒ', write: 'ge', before: '#' },
    { sounds: 'ʒ', write: 'g:2 j:1', before: 'front ə' },
    { sounds: 'ʒ', write: 'j:4 ge:1', before: 'back' },
    { sounds: 'ʒ', write: 'j' },
    { sounds: 's', write: 'sse:2 ce:2', before: '#' },
    // After a nasal vowel one s is enough: "penser", "danser".
    { sounds: 's', write: 's:3 c:2', after: 'ɑ̃ ɔ̃ ɛ̃ œ̃', before: 'front ə' },
    { sounds: 's', write: 's', after: 'ɑ̃ ɔ̃ ɛ̃ œ̃' },
    { sounds: 's', write: 'ss:4 c:1', after: 'V', before: 'front ə' },
    { sounds: 's', write: 'ss:5 ç:1', after: 'V', before: 'V' },
    { sounds: 's', write: 's:4 c:2', before: 'front ə' },
    { sounds: 'z', write: 'se:3 ze:1', before: '#' },
    { sounds: 'z', write: 's', after: 'V', before: 'V' },
    { sounds: 'ʃ', write: 'che', before: '#' },
    { sounds: 'ʃ', write: 'ch' },
    { sounds: 'ɲ', write: 'gne', before: '#' },
    { sounds: 'ɲ', write: 'gn' },
    { sounds: 'f', write: 'f:2 ffe:1 phe:0.5', after: 'a ɛ ɔ o', before: '#' },
    { sounds: 'f', write: 'f:2 phe:0.5', before: '#' },
    { sounds: 'f', write: 'f:6 ph:1 ff:1', after: 'a ɛ ɔ o', before: 'V' },
    { sounds: 'f', write: 'f:8 ph:1' },
    { sounds: 'v', write: 've', before: '#' },
    // Doubled letters only follow a, o and the open e: "patte", "bonne", "belle".
    { sounds: 't', write: 'te:3 tte:1', after: 'a ɛ ɔ o', before: '#' },
    { sounds: 't', write: 'te', before: '#' },
    { sounds: 't', write: 't:5 tt:1', after: 'a ɛ ɔ o', before: 'V' },
    { sounds: 'd', write: 'de', before: '#' },
    { sounds: 'p', write: 'pe:2 ppe:1', after: 'a ɛ ɔ o', before: '#' },
    { sounds: 'p', write: 'pe', before: '#' },
    { sounds: 'b', write: 'be', before: '#' },
    { sounds: 'm', write: 'me:3 mme:1', after: 'a ɛ ɔ o', before: '#' },
    { sounds: 'm', write: 'me', before: '#' },
    { sounds: 'm', write: 'm:5 mm:1', after: 'a ɛ ɔ o', before: 'V' },
    { sounds: 'n', write: 'ne:3 nne:1', after: 'a ɛ ɔ o', before: '#' },
    { sounds: 'n', write: 'ne', before: '#' },
    { sounds: 'n', write: 'n:5 nn:1', after: 'a ɛ ɔ o', before: 'V' },
    { sounds: 'l', write: 'le:3 lle:3 l:1', after: 'a ɛ ɔ o', before: '#' },
    { sounds: 'l', write: 'le:3 l:1', before: '#' },
    { sounds: 'l', write: 'l:5 ll:2', after: 'a ɛ ɔ o', before: 'V' },
    { sounds: 'ʁ', write: 're:3 r:2', before: '#' },
    { sounds: 'ʁ', write: 'r:6 rr:1', after: 'a ɛ ɔ o', before: 'V' },
    { sounds: 'ʁ', write: 'r' },
    // The glide: "travail", "payer", "pied", "yeux".
    { sounds: 'j', write: 'ille:2 il:1', after: 'V', before: '#' },
    { sounds: 'j', write: 'y', after: 'V', before: 'V' },
    { sounds: 'j', write: 'i', after: 'C' },
    { sounds: 'j', write: 'y:1 hi:1' },
  ],
  punctuation: { quotes: ['« ', ' »'], spaceBefore: '!?:;' },
  voicing:
    'Keep it smooth and even, with no strong stress inside a phrase, and lean a little on the last syllable before each comma or full stop. Say r at the back of your throat. For “ahn”, “ohn”, “an” and “uhn”, let the sound go through your nose and don’t finish the n.',
};

export default french;
