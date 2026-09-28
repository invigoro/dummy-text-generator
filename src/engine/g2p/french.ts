/**
 * How a written French word is said, near enough for a "say it" line: its sounds and syllables.
 * French spelling is regular in its rules and irregular in its words. The rules here cover
 * the silent endings, nasal vowels, the vowel spellings (eau, ou, oi, eu), soft c and g, and ill,
 * and a short list covers the commonest words that break them. What they can't know, such as a
 * verb's silent "-ent" against a noun's "-ment", they guess.
 */
import type { Syllable, WordSounds } from '../sounds/system';

/** Words whose sounds the rules would get wrong, with sounds separated by spaces. */
const WORDS: Readonly<Record<string, string>> = {
  // Small words and common irregulars
  eh: 'ɛ',
  ah: 'a',
  oh: 'o',
  hé: 'e',
  bah: 'b a',
  hein: 'ɛ̃',
  et: 'e',
  est: 'ɛ',
  es: 'ɛ',
  les: 'l e',
  des: 'd e',
  mes: 'm e',
  tes: 't e',
  ses: 's e',
  ces: 's e',
  un: 'œ̃',
  eu: 'y',
  eus: 'y',
  eut: 'y',
  eût: 'y',
  femme: 'f a m',
  femmes: 'f a m',
  monsieur: 'm ə s j ø',
  messieurs: 'm e s j ø',
  m: 'm ə s j ø',
  mm: 'm e s j ø',
  mme: 'm a d a m',
  mlle: 'm a d m wa z ɛ l',
  fils: 'f i s',
  six: 's i s',
  dix: 'd i s',
  sept: 's ɛ t',
  huit: 'ɥ i t',
  vingt: 'v ɛ̃',
  cent: 's ɑ̃',
  mille: 'm i l',
  ville: 'v i l',
  village: 'v i l a ʒ',
  tranquille: 't ʁ ɑ̃ k i l',
  second: 's ə g ɔ̃',
  seconde: 's ə g ɔ̃ d',
  clef: 'k l e',
  temps: 't ɑ̃',
  corps: 'k ɔ ʁ',
  doigt: 'd wa',
  pays: 'p e i',
  hier: 'j ɛ ʁ',
  ciel: 's j ɛ l',
  yeux: 'j ø',
  œil: 'œ j',
  chœur: 'k œ ʁ',
  écho: 'e k o',
  christ: 'k ʁ i s t',
  oignon: 'ɔ ɲ ɔ̃',
  ennui: 'ɑ̃ n ɥ i',
  ennemi: 'ɛ n m i',
  ennemis: 'ɛ n m i',
  hélas: 'e l a s',
  ours: 'u ʁ s',
  os: 'ɔ s',
  sens: 's ɑ̃ s',
  plus: 'p l y',
  tous: 't u',
  août: 'u t',
  ouest: 'w ɛ s t',
  aujourdhui: 'o ʒ u ʁ d ɥ i',
  gentil: 'ʒ ɑ̃ t i',
  fusil: 'f y z i',
  outil: 'u t i',
  // Dumas's people and places
  athos: 'a t o s',
  porthos: 'p ɔ ʁ t o s',
  aramis: 'a ʁ a m i s',
  artagnan: 'a ʁ t a ɲ ɑ̃',
  tréville: 't ʁ e v i l',
  richelieu: 'ʁ i ʃ ə l j ø',
  milady: 'm i l ɛ d i',
  bonacieux: 'b ɔ n a s j ø',
  planchet: 'p l ɑ̃ ʃ ɛ',
  buckingham: 'b y k i ŋ a m',
  rochefort: 'ʁ ɔ ʃ f ɔ ʁ',
  paris: 'p a ʁ i',
  louis: 'l w i',
};

/** Final "-ent" in these is said, as in "moment"; in most other words it's a silent verb ending. */
const SAID_ENT = new Set([
  'vent', 'dent', 'lent', 'souvent', 'argent', 'accent', 'talent', 'serpent', 'parent', 'présent', 'absent', 'content',
  'client', 'patient', 'régiment', 'orient', 'occident', 'continent', 'agent', 'urgent', 'prudent', 'violent',
  'excellent', 'différent', 'évident', 'innocent', 'précédent', 'accident', 'incident', 'événement', 'comment',
]);

/** Final "-er" in these is said "air", as in "mer"; elsewhere it's the "é" of an infinitive. */
const SAID_ER = new Set(['mer', 'fer', 'cher', 'fier', 'ver', 'hiver', 'enfer', 'amer', 'cancer', 'hier']);

const VOWEL = 'aeiouyàâäéèêëîïôöùûüœæ';


/** Consonant letters silent at the end of a word ("petit", "trop", "chez"). C, r, f and l are said. */
const SILENT_FINAL = /[dgpstxz]+$/;

interface Rule {
  /** Letters to match here, as a regular expression, with lookarounds for the context. */
  pattern: RegExp;
  sounds: string;
}

const rule = (pattern: string, sounds: string): Rule => ({ pattern: new RegExp(pattern, 'uy'), sounds });

const V = `[${VOWEL}]`;
const C = `[^${VOWEL}]`;
/** What makes a vowel before n or m nasal: another consonant, or the end of the word. */
const NASAL = `(?=[^${VOWEL}nmh]|$)`;

/**
 * The rules, tried in order at each letter; the first that matches wins. Letters no rule covers
 * are said as themselves.
 */
const RULES: readonly Rule[] = [
  // Endings
  rule(`[ae]mment$`, 'a m ɑ̃'),
  rule(`ement$`, 'ə m ɑ̃'),
  rule(`ment$`, 'm ɑ̃'),
  // "-ent" not in "-ment" is a verb's silent ending: "parlent", "étaient".
  rule(`ent$`, ''),
  rule(`eds?$`, 'e'),
  rule(`ier$`, 'j e'),
  rule(`er$`, 'e'),
  rule(`ez$`, 'e'),
  rule(`ets?$`, 'ɛ'),
  rule(`ai[st]?$`, 'ɛ'),
  // ail, eil, euil and ouil end in "y": "travail", "soleil", "feuille", "bouillon"
  rule(`ail(?:le?s?)?$|aill`, 'a j'),
  rule(`eil(?:le?s?)?$|eill`, 'ɛ j'),
  rule(`(?:eu|œ)il(?:le?s?)?$|(?:eu|œ)ill`, 'œ j'),
  rule(`ouil(?:le?s?)?$|ouill`, 'u j'),
  // Vowels together
  rule(`eaux?`, 'o'),
  rule(`(?<=i)ence`, 'ɑ̃ s'),
  rule(`oin${NASAL}`, 'w ɛ̃'),
  rule(`(?:ai|ei)[nm]${NASAL}`, 'ɛ̃'),
  rule(`(?<=[iéy])en${NASAL}`, 'ɛ̃'),
  rule(`[ae][nm]${NASAL}`, 'ɑ̃'),
  rule(`[iy][nm]${NASAL}`, 'ɛ̃'),
  rule(`o[nm]${NASAL}`, 'ɔ̃'),
  rule(`u[nm]${NASAL}`, 'œ̃'),
  rule(`au`, 'o'),
  rule(`ay(?=${V})`, 'ɛ j'),
  rule(`oy(?=${V})`, 'wa j'),
  rule(`uy(?=${V})`, 'ɥ i j'),
  rule(`a[iî]|e[iî]`, 'ɛ'),
  rule(`o[iî]`, 'wa'),
  rule(`ou(?=[aeiéèê])(?!e(?:s|nt)?$)`, 'w'),
  rule(`o[uùû]`, 'u'),
  rule(`(?:œu|eu|eû)(?=[rlfv])`, 'œ'),
  rule(`œu|eu|eû`, 'ø'),
  rule(`œ`, 'œ'),
  rule(`(?<=${C})ui`, 'ɥ i'),
  // ill after a consonant is "ee-y": "fille", "billet"
  rule(`(?<=${C})ill`, 'i j'),
  // e, and the other vowels
  rule(`é`, 'e'),
  rule(`[èêë]`, 'ɛ'),
  rule(`e(?=(${C})\\1)`, 'ɛ'),
  rule(`ex(?=[${VOWEL}h])`, 'ɛ g z'),
  rule(`ex`, 'ɛ k s'),
  rule(`e(?=[bcdfgklmnpqstvxz](?:[bcdfgkmnpqstvxz]|$))`, 'ɛ'),
  rule(`e(?=[rlcf]$)`, 'ɛ'),
  rule(`e(?=r${C})`, 'ɛ'),
  rule(`e(?=s?$)`, ''),
  rule(`e`, 'ə'),
  rule(`[àâä]`, 'a'),
  rule(`[îï]`, 'i'),
  // Before another vowel, i is a glide ("pied"), but not before a silent final e ("partie", "étudient").
  rule(`i(?=${V})(?!e(?:s|nt)?$)`, 'j'),
  rule(`ô`, 'o'),
  rule(`o(?=[dgpstxz]+$|se?s?$)`, 'o'),
  rule(`o(?=${C}(?:${C}|e?s?$))`, 'ɔ'),
  rule(`(?<=${C})u(?=[aeiéèê])(?!e(?:s|nt)?$)`, 'ɥ'),
  rule(`[uùûü]`, 'y'),
  rule(`y`, 'i'),
  // Consonants
  rule(`(?<!s)ti(?=on|el|al|eu[sx]?$)`, 's j'),
  rule(`ch`, 'ʃ'),
  rule(`ph`, 'f'),
  rule(`th`, 't'),
  rule(`rh`, 'ʁ'),
  rule(`gn`, 'ɲ'),
  rule(`qu`, 'k'),
  rule(`gu(?=[eiyéèêî])`, 'g'),
  rule(`ge(?=[aouâô])`, 'ʒ'),
  rule(`g(?=[eiyéèêî])`, 'ʒ'),
  rule(`cc(?=[eiyéèê])`, 'k s'),
  rule(`sc(?=[eiyéèê])`, 's'),
  rule(`c(?=[eiyéèêî])`, 's'),
  rule(`ç`, 's'),
  rule(`(?<=${V})s(?=${V})`, 'z'),
  rule(`x`, 'k s'),
  rule(`([bcdfgklmnprstvz])\\1`, '$1'),
  // A c after a nasal vowel at the end is silent: "blanc", "banc".
  rule(`(?<=n)c$`, ''),
  rule(`c|k|q`, 'k'),
  rule(`h`, ''),
  rule(`r`, 'ʁ'),
  rule(`j`, 'ʒ'),
];

/** Letters whose sound isn't the letter itself, when no rule has said otherwise. */
const LETTERS: Readonly<Record<string, string>> = { c: 'k', q: 'k', r: 'ʁ', j: 'ʒ', h: '', x: 'k s', y: 'i' };

/** The sounds of a word's letters, before they're grouped into syllables. */
function letterSounds(word: string): string[] {
  // The consonants silent at the end go first, but not those of an ending with its own rule
  // ("-ment", "-ez"): each rule sees the word as it's written.
  const silent = /(?:ent|ez|ets?|er|ais|ait|eds?)$/.test(word) ? '' : (SILENT_FINAL.exec(word)?.[0] ?? '');
  let letters = silent && silent.length < word.length ? word.slice(0, word.length - silent.length) : word;
  // An "-er" left by a silent t or d is said "air", not the "é" of an infinitive: "ouvert", "vert".
  if (/[td]/.test(silent) && letters.endsWith('er')) letters = `${letters.slice(0, -2)}èr`;
  const out: string[] = [];
  for (let i = 0; i < letters.length; ) {
    let matched = false;
    for (const { pattern, sounds } of RULES) {
      pattern.lastIndex = i;
      const match = pattern.exec(letters);
      if (!match || match.index !== i || match[0].length === 0) continue;
      const said = sounds === '$1' ? (LETTERS[match[1]] ?? match[1]) : sounds;
      out.push(...said.split(' ').filter(Boolean));
      i += match[0].length;
      matched = true;
      break;
    }
    if (!matched) {
      out.push(...(LETTERS[letters[i]] ?? letters[i]).split(' ').filter(Boolean));
      i++;
    }
  }
  return out;
}

const NUCLEI = new Set(['a', 'e', 'ɛ', 'ə', 'i', 'o', 'ɔ', 'u', 'y', 'ø', 'œ', 'ɑ̃', 'ɔ̃', 'ɛ̃', 'œ̃', 'wa']);
const GLIDES = new Set(['j', 'w', 'ɥ']);
/** Consonant pairs that start a syllable together: "pré", "blé", "tra". */
const ONSETS = /^[pbtdkgfv][ʁl]$/;

/** Sounds grouped into syllables: a consonant between vowels starts the next one, as do "pr", "bl" and a glide. */
function syllabify(sounds: readonly string[]): Syllable[] {
  const nuclei = sounds.flatMap((sound, i) => (NUCLEI.has(sound) ? [i] : []));
  if (nuclei.length === 0) return [];
  const syllables: Syllable[] = nuclei.map((at) => ({ onset: [], nucleus: sounds[at], coda: [] }));
  syllables[0].onset = sounds.slice(0, nuclei[0]);
  for (let n = 0; n < nuclei.length - 1; n++) {
    const between = sounds.slice(nuclei[n] + 1, nuclei[n + 1]);
    // The next syllable takes a glide, the consonant before it, and a whole "pr" or "bl".
    let take = Math.min(1, between.length);
    if (between.length >= 2 && GLIDES.has(between[between.length - 1])) take = 2;
    const head = between.slice(between.length - take - 1, between.length - take + 1).join('');
    if (between.length > take && ONSETS.test(head)) take++;
    syllables[n].coda = between.slice(0, between.length - take);
    syllables[n + 1].onset = between.slice(between.length - take);
  }
  syllables[syllables.length - 1].coda = sounds.slice(nuclei[nuclei.length - 1] + 1);
  return syllables;
}

/** A word's sounds, from its written form: the list above, or the rules. */
function wordSounds(written: string): string[] {
  let word = written.toLowerCase().normalize('NFC').replace(/[^\p{L}]/gu, '');
  const known = WORDS[word];
  if (known !== undefined) return known.split(' ');
  // Endings said against the rule: "vent" as "vant", "mer" as "mèr".
  if (SAID_ENT.has(word)) word = `${word.slice(0, -3)}ant`;
  else if (SAID_ER.has(word)) word = `${word.slice(0, -2)}èr`;
  const sounds = letterSounds(word);
  // The e of a one-syllable word is said: "le", "de", "que".
  if (!sounds.some((sound) => NUCLEI.has(sound)) && word.endsWith('e')) sounds.push('ə');
  return sounds;
}

/** An elided word before an apostrophe ("l’", "qu’", "jusqu’"): the word with its e, less the e. */
function cliticSounds(written: string): string[] {
  const sounds = wordSounds(`${written}e`);
  return sounds[sounds.length - 1] === 'ə' ? sounds.slice(0, -1) : sounds;
}

/**
 * How a written French word is said: one entry for each part of a hyphenated word ("peut-être"),
 * with elided words joined to the next ("l’homme", "qu’il"). A part without a vowel ("a-t-il")
 * joins its neighbour. Stress belongs to the phrase, as always in French.
 */
export function pronounceFrench(word: string): WordSounds[] {
  // Words spelled with an apostrophe inside them: "aujourd’hui".
  const joined = word.replace(/['’]/g, '').toLowerCase();
  const parts = WORDS[joined] ? [joined] : word.split('-').filter(Boolean);
  const said: string[][] = [];
  let pending: string[] = [];
  for (const part of parts) {
    const pieces = WORDS[part.replace(/['’]/g, '').toLowerCase()] ? [part.replace(/['’]/g, '')] : part.split(/['’]/).filter(Boolean);
    for (let i = 0; i < pieces.length; i++) {
      // An elided word always runs into the next: "jusqu’à" is said as one word.
      if (i < pieces.length - 1) {
        pending = [...pending, ...cliticSounds(pieces[i])];
        continue;
      }
      const sounds = wordSounds(pieces[i]);
      if (!sounds.some((sound) => NUCLEI.has(sound))) {
        pending = [...pending, ...sounds];
        continue;
      }
      said.push([...pending, ...sounds]);
      pending = [];
    }
  }
  if (pending.length > 0) {
    if (said.length > 0) said[said.length - 1].push(...pending);
    else return [];
  }
  return said.map((sounds) => ({ syllables: syllabify(sounds), stress: null }));
}
