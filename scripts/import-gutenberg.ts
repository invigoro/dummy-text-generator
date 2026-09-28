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
