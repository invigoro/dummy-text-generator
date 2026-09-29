/**
 * Downloads a Project Gutenberg text and cleans it into a source text under src/data/corpora/.
 *
 *   npm run import-gutenberg -- en-treasure-island             # download and clean it
 *   npm run import-gutenberg -- en-treasure-island pg120.txt   # or clean a file you downloaded
 *
 * Each text's recipe lives here, so the committed file can always be rebuilt from the original.
 * Add a text's provenance to SOURCES.md when you add its recipe.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { cleanGutenberg, type CleanOptions } from '../src/engine/corpus/gutenberg.ts';

interface Recipe extends CleanOptions {
  url: string;
  output: string;
}

const RECIPES: Record<string, Recipe> = {
  'en-treasure-island': {
    url: 'https://www.gutenberg.org/cache/epub/120/pg120.txt',
    output: 'src/data/corpora/en/treasure-island.txt',
    // Skips the title, dedication, the poem "To the Hesitating Purchaser" and the contents.
    startAt: /^PART ONE--/,
    // Ship names, which this edition prints in capitals for italics.
    capitals: { HISPANIOLA: 'Hispaniola', WALRUS: 'Walrus', ROYAL: 'Royal', FORTUNE: 'Fortune', CASSANDRA: 'Cassandra' },
  },
  'fr-trois-mousquetaires': {
    url: 'https://www.gutenberg.org/cache/epub/13951/pg13951.txt',
    output: 'src/data/corpora/fr/trois-mousquetaires.txt',
    // The first fifteen chapters (about 50,000 words) are plenty, and keep the download small.
    startAt: /^CHAPITRE PREMIER$/,
    endBefore: /^CHAPITRE XVI\.$/,
    // This edition keeps a space where a compound broke across a line in print: "lui- même".
    fixes: [[/(\p{L})- (\p{L})/gu, '$1-$2']],
  },
  'la-de-bello-gallico': {
    url: 'https://www.gutenberg.org/cache/epub/218/pg218.txt',
    output: 'src/data/corpora/la/de-bello-gallico.txt',
    startAt: /^C\. IULI CAESARIS DE BELLO GALLICO COMMENTARIUS PRIMUS$/,
    // The edition brackets passages it doubts, and marks a doubtful word or two with %; the words stay.
    remove: /[[\]%]/g,
  },
  'is-saefarinn': {
    url: 'https://www.gutenberg.org/cache/epub/17025/pg17025.txt',
    output: 'src/data/corpora/is/saefarinn.txt',
    // Skips the title pages, which end just before chapter I.
    startAt: /^I\.$/,
  },
  'es-don-quijote': {
    url: 'https://www.gutenberg.org/cache/epub/2000/pg2000.txt',
    output: 'src/data/corpora/es/don-quijote.txt',
    // The first eleven chapters, after the prologue and the dedicatory verses.
    startAt: /^Capítulo primero\./,
    endBefore: /^Capítulo XII\./,
  },
  'pt-os-maias': {
    url: 'https://www.gutenberg.org/cache/epub/40409/pg40409.txt',
    output: 'src/data/corpora/pt/os-maias.txt',
    // The first four chapters.
    startAt: /^I$/,
    endBefore: /^V$/,
  },
  'it-promessi-sposi': {
    url: 'https://www.gutenberg.org/cache/epub/45334/pg45334.txt',
    output: 'src/data/corpora/it/promessi-sposi.txt',
    // The first eight chapters.
    startAt: /^\s+CAPITOLO PRIMO\.$/,
    endBefore: /^\s+CAPITOLO IX\.$/,
  },
  'fi-seitseman-veljesta': {
    url: 'https://www.gutenberg.org/cache/epub/11940/pg11940.txt',
    output: 'src/data/corpora/fi/seitseman-veljesta.txt',
    // The first five chapters.
    startAt: /^ENSIMMÄINEN LUKU$/,
    endBefore: /^KUUDES LUKU$/,
  },
  'cy-cartrefi-cymru': {
    url: 'https://www.gutenberg.org/cache/epub/3680/pg3680.txt',
    output: 'src/data/corpora/cy/cartrefi-cymru.txt',
    // The twelve essays, without the title pages, the contents or the notes after them.
    startAt: /^DOLWAR FECHAN\.$/,
    endBefore: /^NODIADAU\.$/,
  },
  'enm-canterbury-prose': {
    url: 'https://www.gutenberg.org/cache/epub/22120/pg22120.txt',
    output: 'src/data/corpora/enm/canterbury-prose.txt',
    // The Canterbury Tales in prose, Melibee and the Parson's Tale, about 48,000 words. Skeat
    // indents the verse between them and his notes, which go.
    startAt: /^THE TALE OF MELIBEUS\.$/,
    endBefore: /^=Here is ended the book of the Tales of Caunterbury/,
    // Section headings (=Sequitur de…=) and the notes that give a passage's line numbers.
    dropBlocks: /^(?:=|\[\d+:)/,
    fixes: [
      // Page numbers ("[200]"), section numbers ("§ 23."), and the line markers "/" and "/2160".
      [/\[\d+\]\s*/g, ''],
      [/§\s*\d+\.\s*/g, ''],
      [/\s*\/\d*(?=\s|$)/g, ''],
    ],
    // Square brackets round words the editor supplied; the words stay.
    remove: /[[\]]/g,
  },
  'en-hamlet': {
    url: 'https://www.gutenberg.org/cache/epub/1524/pg1524.txt',
    output: 'src/data/corpora/en/hamlet.txt',
    // From the first act, after the contents and the list of characters.
    startAt: /^ACT I$/,
    // Stage directions, alone ("Enter Horatio.") or in brackets ("[_Exit._]"), and the dumb-show.
    dropBlocks: /^(?:Enter|Exit|Exeunt|Re-enter|Flourish|Alarum|Trumpets|Danish march|A march|Noise|Sound|Drum|Hautboys|\[|_)/,
    // Stage directions inside a speech: "[_Aside._]", "[_Sings._]".
    fixes: [[/\s*\[[^\]]*\]\s*/g, ' ']],
  },
  'de-verwandlung': {
    url: 'https://www.gutenberg.org/cache/epub/22367/pg22367.txt',
    output: 'src/data/corpora/de/verwandlung.txt',
    startAt: /^I\.$/,
  },
  'oj-catechism': {
    url: 'https://www.gutenberg.org/cache/epub/40466/pg40466.txt',
    output: 'src/data/corpora/oj/catechism.txt',
    // The prayers and the catechism, after the title page. The hymns are indented, so they go, and
    // the spelling lessons and numbers at the back are left out.
    startAt: /^Mi manda Misinaigans KATECHISM ejinikadeg\.$/,
    endBefore: /^A\. {4}B\. {4}C\.$/,
  },
};

const [id, file] = process.argv.slice(2);
const recipe = RECIPES[id];
if (!recipe) {
  console.error(`Usage: npm run import-gutenberg -- <${Object.keys(RECIPES).join(' | ')}> [downloaded file]`);
  process.exit(1);
}

let raw: string;
if (file) {
  raw = await readFile(file, 'utf8');
} else {
  const response = await fetch(recipe.url);
  if (!response.ok) throw new Error(`${recipe.url}: HTTP ${response.status}`);
  raw = await response.text();
}

const text = cleanGutenberg(raw, recipe);
await writeFile(recipe.output, text);
const paragraphs = text.split('\n\n').length;
const words = text.split(/\s+/).filter(Boolean).length;
console.log(`Wrote ${recipe.output}: ${paragraphs} paragraphs, ${words} words.`);
