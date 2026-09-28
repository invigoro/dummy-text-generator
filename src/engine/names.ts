/**
 * Names for people and places, in any language, made from the flow text the way the rest of the
 * text is. People are named after the text's own people ("Athos", "Sancho Panza"), with the little
 * words its language puts between names ("de", "da", "von"). Places join a word to one of the
 * words real place names are made of in the text's language: "-ford" and "-wood" in English,
 * "Saint-" and "-ville" in French, "Llan-" in Welsh. The language then says them in its own words.
 */
import { atBreak } from './arrange';
import { randomInt, type Random } from './rng';
import type { Corpus } from './tokenize';

export type NameKind = 'people' | 'places';

export const NAME_KINDS: readonly NameKind[] = ['people', 'places'];

/** A name as source words, before the language turns them into its own. */
export type NameRecipe =
  /** Words written apart: "Athos", "Sancho Panza", "Puerto Lérant". */
  | { kind: 'words'; words: string[] }
  /** Two words made one, with `joiner` between them: "Doumévoren", "Saint-Lérant". */
  | { kind: 'compound'; words: [string, string]; joiner: '' | '-' };

/** How a language names things, for telling a person's name from a place's, and for making new ones. */
interface Naming {
  /** Words before a thing's name, or a people's, rather than a person's: "the Hispaniola", "les Anglais". */
  articles?: readonly string[];
  /** Words before a place's name: "to Bristol", "à Paris". */
  toPlaces?: readonly string[];
  /** Words for kinds of place, before a place's name with or without a "de" or "of": "rue Férou", "château de Meung". */
  kindsOfPlace?: readonly string[];
  /** Words that go between a person's names: the "de" of "Cyrano de Bergerac". */
  particles?: readonly string[];
  /** Words written with a capital that aren't anyone's name: titles, and words for God. */
  notNames?: readonly string[];
  /** Words that end a place's name as part of it: "Ashford", "Beaumont". */
  after?: readonly string[];
  /** Words that start one: "Saint-Malo", "Puerto Rico", "Llandaff". */
  before?: readonly string[];
  /** What goes between a starting word and the rest: a hyphen, a space, or nothing. */
  joiner?: '' | '-' | ' ';
  /** Words that make poor places, by their endings: verbs, adverbs and plurals ("Growingford", "Kneeswood"). */
  notStems?: RegExp;
}

/** By the language of the flow text: a BCP 47 tag's first part. */
const NAMING: Readonly<Record<string, Naming>> = {
  en: {
    articles: ['the', 'a', 'an'],
    toPlaces: ['to', 'in', 'at', 'from', 'into'],
    kindsOfPlace: ['town', 'city', 'port', 'island', 'river', 'bay', 'street', 'county', 'village'],
    notNames: [
      ...['god', 'providence', 'bible', 'lord', 'sir', 'captain', 'doctor', 'squire', 'mister', 'madam', 'heaven'],
      ...['english', 'french', 'spanish', 'dutch', 'portuguese', 'irish', 'scotch', 'indian', 'christian'],
    ],
    after: ['ford', 'wood', 'hill', 'stone', 'port', 'mouth', 'cove', 'water', 'bay', 'head', 'well', 'bridge', 'field', 'haven', 'moor', 'marsh'],
    notStems: /(?:ing|ed|ly|est|[^s]s)$/,
  },
  fr: {
    articles: ['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du'],
    toPlaces: ['à', 'en', 'au', 'aux', 'vers'],
    kindsOfPlace: ['rue', 'ville', 'château', 'route', 'porte', 'pont', 'faubourg', 'hôtel', 'place', 'quai', 'abbaye', 'couvent', 'province', 'forêt', 'village'],
    particles: ['de'],
    notNames: ['sire', 'monseigneur', 'éminence', 'excellence', 'milord', 'majesté', 'altesse', 'dieu', 'monsieur', 'madame', 'mademoiselle', 'seigneur', 'ier'],
    after: ['ville', 'mont', 'bourg', 'court', 'val'],
    before: ['saint', 'mont', 'port', 'val', 'sainte'],
    joiner: '-',
    notStems: /(?:ment|er|ez|ait|ais|aient|ent|ons|a|it|[sx])$/,
  },
  es: {
    articles: ['el', 'la', 'los', 'las', 'un', 'una'],
    toPlaces: ['en', 'a', 'hacia', 'desde'],
    kindsOfPlace: ['ciudad', 'villa', 'calle', 'río', 'pueblo', 'reino', 'castillo', 'sierra', 'puerto'],
    particles: ['de'],
    notNames: ['dios', 'señor', 'señora', 'don', 'doña', 'san', 'santa', 'vuestra', 'merced'],
    before: ['villa', 'puerto', 'monte', 'san', 'valle', 'sierra', 'santa'],
    joiner: ' ',
    notStems: /(?:mente|ar|er|ir|aba|ado|ando|ía|s)$/,
  },
  pt: {
    articles: ['o', 'a', 'os', 'as', 'um', 'uma'],
    toPlaces: ['em', 'no', 'na', 'para'],
    particles: ['da', 'de'],
    notNames: ['deus', 'senhor', 'senhora', 'dom', 'dona'],
    before: ['vila', 'porto', 'monte', 'são', 'vale', 'serra', 'santa'],
    joiner: ' ',
    notStems: /(?:mente|ar|er|ir|ava|ado|ando|s)$/,
  },
  it: {
    articles: ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una'],
    toPlaces: ['a', 'in', 'verso'],
    particles: ['di'],
    notNames: ['dio', 'signore', 'signora', 'don', 'donna', 'padre'],
    before: ['monte', 'porto', 'villa', 'san', 'castel', 'borgo', 'santa'],
    joiner: ' ',
    notStems: /(?:mente|are|ere|ire|ava|ato|ando)$/,
  },
  de: {
    articles: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine'],
    toPlaces: ['in', 'nach', 'aus'],
    particles: ['von'],
    notNames: ['gott', 'herr', 'frau'],
    after: ['burg', 'berg', 'dorf', 'stadt', 'bach', 'feld', 'heim', 'wald', 'brück'],
  },
  la: {
    toPlaces: ['in', 'ad', 'ab', 'ex'],
    after: ['dunum', 'acum', 'briga'],
    before: ['portus', 'mons', 'fons', 'forum', 'castra'],
    joiner: ' ',
  },
  is: { toPlaces: ['í', 'til', 'frá'], after: ['fjörður', 'vík', 'nes', 'dalur', 'fell', 'bær', 'staðir', 'eyri'] },
  fi: { after: ['järvi', 'mäki', 'joki', 'niemi', 'saari', 'lahti', 'vaara', 'koski', 'kylä'] },
  cy: { articles: ['y', 'yr'], toPlaces: ['yn', 'i', 'o'], particles: ['ap'], before: ['aber', 'llan', 'pen', 'tre', 'caer', 'nant', 'bryn', 'cwm'], joiner: '' },
};

/** How the corpus's language names things; English's place words, and nothing more, where it's not known. */
function namingOf(corpus: Corpus): Naming {
  const tag = corpus.language?.toLowerCase().split('-')[0];
  return (tag && NAMING[tag]) || { after: NAMING.en.after };
}

const capitalized = (word: string) => word.replace(/\p{L}/u, (letter) => letter.toUpperCase());

/** Something about a text, worked out once and kept with it. */
function cached<T>(make: (corpus: Corpus) => T): (corpus: Corpus) => T {
  const found = new WeakMap<Corpus, T>();
  return (corpus) => {
    if (!found.has(corpus)) found.set(corpus, make(corpus));
    return found.get(corpus)!;
  };
}

export interface Names {
  /** People's names: capitalized words never written in lowercase, not places or things, commonest first. */
  people: string[];
  /** Places' names: those that follow the words places do ("to Bristol"). */
  places: string[];
  /** Common longer words, capitalized, for a text with too few names. */
  others: string[];
}

/**
 * The text's names, sorted into people's and places'. A name is a place's when it often follows
 * the words places do ("to Bristol", "à Paris"), and a thing's when it often follows an article
 * ("the Hispaniola", "les Anglais"). In a text of unknown language the commonest word stands in
 * for its article.
 */
export const namesOf = cached((corpus: Corpus): Names => {
  const naming = namingOf(corpus);
  const words = new Map<string, number>();
  for (const paragraph of corpus.paragraphs) {
    for (const { tokens } of paragraph.sentences) {
      for (const token of tokens) if (token.kind === 'word') words.set(token.text.toLowerCase(), (words.get(token.text.toLowerCase()) ?? 0) + 1);
    }
  }
  const commonest = [...words].reduce((best, entry) => (entry[1] > best[1] ? entry : best), ['', 0])[0];
  const articles = new Set(naming.articles ?? [commonest]);
  const toPlaces = new Set(naming.toPlaces ?? []);
  const kindsOfPlace = new Set(naming.kindsOfPlace ?? []);
  const particles = new Set([...(naming.particles ?? []), 'of']);
  const notNames = new Set(naming.notNames ?? []);

  const counts = new Map<string, { count: number; afterArticle: number; afterPlace: number }>();
  const lowercase = new Set<string>();
  for (const paragraph of corpus.paragraphs) {
    for (const { tokens } of paragraph.sentences) {
      tokens.forEach((token, i) => {
        if (token.kind !== 'word') return;
        if (!/^\p{Lu}/u.test(token.text)) lowercase.add(token.text.toLowerCase());
        if (!/^\p{Lu}\p{Ll}{2,}$/u.test(token.text) || atBreak(tokens, i)) return;
        const seen = counts.get(token.text) ?? { count: 0, afterArticle: 0, afterPlace: 0 };
        seen.count++;
        const wordBack = (n: number) => (tokens[i - 2 * n]?.kind === 'word' ? tokens[i - 2 * n].text.toLowerCase() : '');
        const before = wordBack(1);
        if (articles.has(before)) seen.afterArticle++;
        // "to Bristol", "rue Férou", "château de Meung"
        if (toPlaces.has(before) || kindsOfPlace.has(before) || (particles.has(before) && kindsOfPlace.has(wordBack(2)))) seen.afterPlace++;
        counts.set(token.text, seen);
      });
    }
  }
  const names = [...counts]
    .filter(([name]) => !lowercase.has(name.toLowerCase()) && !notNames.has(name.toLowerCase()) && !corpus.options.abbreviations.has(name))
    .sort((a, b) => b[1].count - a[1].count || (a[0] < b[0] ? -1 : 1));
  // A place follows the words places do twice at least, and in a good share of its uses.
  const isPlace = ({ count, afterPlace }: { count: number; afterPlace: number }) => afterPlace >= 2 && afterPlace >= count * 0.3;
  const people = names
    .filter(([, seen]) => seen.count >= 3 && !isPlace(seen) && seen.afterArticle <= seen.count / 4)
    .map(([name]) => name);
  const places = names.filter(([, seen]) => seen.count >= 2 && isPlace(seen)).map(([name]) => name);
  // Ordinary words only: a name turned down as a thing ("the Hispaniola") stays out.
  const others = [...words]
    .filter(([word]) => /^\p{L}{4,}$/u.test(word) && lowercase.has(word))
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([word]) => capitalized(word))
    .filter((word) => !people.includes(word))
    .slice(0, 40);
  return { people, places, others };
});

/**
 * Ordinary words to name places with: of four to seven letters, past the commonest few dozen
 * (mostly the little words of grammar), and without the endings of verbs and adverbs.
 */
const placeStems = cached((corpus: Corpus): string[] => {
  const notStems = namingOf(corpus).notStems;
  const counts = new Map<string, number>();
  for (const paragraph of corpus.paragraphs) {
    for (const { tokens } of paragraph.sentences) {
      for (const token of tokens) if (token.kind === 'word' && /^\p{Ll}{4,}$/u.test(token.text)) counts.set(token.text, (counts.get(token.text) ?? 0) + 1);
    }
  }
  const ranked = [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  // A short text has fewer little words to pass over.
  const skip = Math.min(60, Math.floor(ranked.length / 5));
  return ranked
    .slice(skip, skip + 840)
    .map(([word]) => word)
    .filter((word) => word.length <= 7 && !notStems?.test(word));
});

const pick = <T>(items: readonly T[], random: Random): T => items[randomInt(random, items.length)];

/** People's names, as source words: some alone, most with a family name, now and then with a particle between. */
export function personNames(corpus: Corpus, count: number, random: Random): NameRecipe[] {
  const { people, others } = namesOf(corpus);
  const pool = people.length >= 6 ? people : [...people, ...others];
  if (pool.length === 0) return [];
  const particles = namingOf(corpus).particles ?? [];
  const recipes: NameRecipe[] = [];
  const seen = new Set<string>();
  for (let attempt = 0; recipes.length < count && attempt < count * 20; attempt++) {
    const given = pick(pool, random);
    const roll = random();
    let words = [given];
    if (roll >= 0.3) {
      const family = pick(pool, random);
      if (family === given) continue;
      words = particles.length > 0 && roll >= 0.8 ? [given, pick(particles, random), family] : [given, family];
    }
    const key = words.join(' ');
    if (seen.has(key)) continue;
    seen.add(key);
    recipes.push({ kind: 'words', words });
  }
  return recipes;
}

/** Places' names, as source words: an ordinary word or a name, with a word of the kind places are named with. */
export function placeNames(corpus: Corpus, count: number, random: Random): NameRecipe[] {
  const stems = placeStems(corpus);
  const { people } = namesOf(corpus);
  if (stems.length === 0) return [];
  const naming = namingOf(corpus);
  const recipes: NameRecipe[] = [];
  const seen = new Set<string>();
  for (let attempt = 0; recipes.length < count && attempt < count * 20; attempt++) {
    const before = !!naming.before?.length && (!naming.after?.length || random() < 0.5);
    let recipe: NameRecipe;
    if (!before) {
      recipe = { kind: 'compound', words: [pick(stems, random), pick(naming.after ?? NAMING.en.after!, random)], joiner: '' };
    } else {
      // A place named for someone, as most are ("Saint-Athos", "San Sancho"), or for something.
      const stem = people.length > 0 && random() < 0.7 ? pick(people, random) : capitalized(pick(stems, random));
      const start = capitalized(pick(naming.before!, random));
      const joiner = naming.joiner ?? ' ';
      recipe = joiner === ' ' ? { kind: 'words', words: [start, stem] } : { kind: 'compound', words: [start, joiner === '' ? stem.toLowerCase() : stem], joiner };
    }
    const key = recipe.words.join(' ').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipes.push(recipe);
  }
  return recipes;
}
