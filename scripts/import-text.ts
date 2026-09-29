/**
 * Downloads a public-domain text that isn't on Project Gutenberg and cleans it into a source text
 * under src/data/corpora/: the OCR text of a scanned book on the Internet Archive, the sentences of
 * a published corpus, or a text's pages on Wikisource.
 *
 *   npm run import-text -- nah-chimalpahin               # download and clean it
 *   npm run import-text -- nah-chimalpahin scan.txt      # or clean files you downloaded, in order
 *
 * Each text's recipe lives here, so the committed file can always be rebuilt from the original.
 * Add a text's provenance to SOURCES.md when you add its recipe.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { cleanScan } from '../src/engine/corpus/scan.ts';
import { paragraphsFromTable } from '../src/engine/corpus/table.ts';
import { cleanWikitext } from '../src/engine/corpus/wiki.ts';

interface Recipe {
  /** Where the text is: one address, or several fetched in turn, such as a book's chapters. */
  urls: readonly string[];
  output: string;
  clean: (raws: readonly string[]) => string;
}

/** A Wikisource page's wikitext. */
const wikisource = (language: string, title: string) =>
  `https://${language}.wikisource.org/w/index.php?${new URLSearchParams({ title, action: 'raw' })}`;

/** Pages cleaned one by one and joined, leaving out any with nothing left. */
const eachPage = (clean: (raw: string) => string) => (raws: readonly string[]) =>
  raws
    .map((raw) => clean(raw).trim())
    .filter(Boolean)
    .join('\n\n') + '\n';

/** French's commonest little words, for leaving out a French translation printed beside the text. */
const FRENCH = {
  words: [
    ...['le', 'la', 'les', 'des', 'du', 'et', 'est', 'il', 'ils', 'elle', 'dans', 'par', 'pour', 'sur', 'ne', 'pas', 'se'],
    ...['sa', 'son', 'ses', 'au', 'aux', 'qui', 'que', 'ont', 'sont', 'comme', 'mais', 'plus', 'lui', 'leur', 'leurs'],
    ...['cette', 'avait', 'fut', 'furent', 'alors', 'aussi', 'année', 'dont', 'avec', 'nous', 'fils', 'en'],
    // An editor's notes: "voyez ci-dessus", "on lit en marge".
    ...['voyez', 'dessus', 'page', 'lit', 'marge', 'verso', 'naquit', 'appelle', 'effet', 'habitants', 'seigneur', 'gouverneur'],
  ],
  letters: /[éèêàùâîôûëœ]/u,
  share: 0.08,
};

/** Spanish's, likewise. Not "y", "a" or "o", which a text beside it may use too. */
const SPANISH = {
  words: [
    ...['de', 'la', 'que', 'el', 'en', 'los', 'las', 'del', 'se', 'por', 'con', 'no', 'su', 'sus', 'para', 'al', 'lo'],
    ...['como', 'mas', 'más', 'pero', 'es', 'son', 'le', 'les', 'este', 'esta', 'estos', 'esto', 'nos', 'os', 'ni'],
    ...['cuando', 'porque', 'todos', 'todo', 'muy', 'sin', 'sobre', 'hay', 'donde', 'vuestras', 'vuestros', 'hijos'],
  ],
  letters: /[éáíóú]/u,
  share: 0.1,
};

/**
 * Note marks and specks of dirt an OCR engine reads as characters, and the ° of an abbreviation
 * ("Fran°" for Francisco).
 */
const SPECKS: readonly [RegExp, string] = [/[\^■»«*•†‡§|~_<>{}\\"'’‘`[\]¡°$%=/—]/g, ''];

/** Punctuation left hanging once specks and numbers are gone. */
const TIDY: readonly (readonly [RegExp, string])[] = [
  [/\s+([,.;:!?])/g, '$1'],
  [/[,;:]+\./g, '.'],
  [/\.{2,}/g, '.'],
  [/([,;:])[,;:]+/g, '$1'],
  [/([.;:!?])(?=\p{L})/gu, '$1 '],
  [/¿\s+/g, '¿'],
  // A speck read as an accented letter on its own.
  [/(^|\s)[îïíìéèê](?=[\s,.;:]|$)/gu, '$1'],
  [/\s+-(?=[\s.,;:!?]|$)/g, ''],
  [/-(?=[.,;:!?])/g, ''],
  [/^[\s,.;:!?-]+/, ''],
];

const RECIPES: Record<string, Recipe> = {
  'nah-chimalpahin': {
    urls: ['https://archive.org/download/bibliothquelin12adamuoft/bibliothquelin12adamuoft_djvu.txt'],
    output: 'src/data/corpora/nah/chimalpahin.txt',
    // The annals, from the first heading to the index, without Siméon's French translation in the
    // facing column, and his notes below it.
    clean: ([raw]) =>
      cleanScan(raw, {
        startAt: /^SIXI[EÈ]ME\s+RELATION$/,
        endBefore: /^TABLE\s+DES\s+MATI[EÈ]RES$/,
        misreadings: [
          // An l read as "!", and a Q as "(^".
          [/(\p{L})!(?=\p{L}|-)/gu, '$1l'],
          [/\(\^/g, 'Q'],
          // A running head read into the line below it.
          [/(?:^|\s)ANNALES\s+DE\s+(?:CHIMALPAHIN\b\.?)?/, ' '],
          SPECKS,
        ],
        otherLanguage: FRENCH,
        // Each year starts a new entry: "III calli xihuitl".
        paragraphStart: /^[IVXL]+\.?\s+\p{L}+\s+xihui/u,
        fixes: [
          // Siméon's pointers to his other notes, where they share a block with the text.
          [/\(?\s*Voyez\s[^.)]*[.)]*/g, ''],
          // The l of "xihuitl" read as i.
          [/\b([Xx])ihuiti\b/g, '$1ihuitl'],
          // The Christian year after the Mexican one ("III calli xihuitl, 1261 años."), and the
          // numbers of Siméon's notes, stuck to words ("Tepetlicpac3") or standing alone.
          [/,?\s*\b(?:[il]\s?)?\d[\d\s]*(?:\s*(?:años|anos|afios)\b)?/g, ''],
          [/(\p{L})\d+/gu, '$1'],
          [/\b(?:años|anos|afios)\b/g, ''],
          ...TIDY,
        ],
      }),
  },
  'qu-tercero': {
    urls: ['https://archive.org/download/tercerocatecism00cath/tercerocatecism00cath_djvu.txt'],
    output: 'src/data/corpora/qu/tercero.txt',
    // The thirty-one sermons in Quechua, which face their Spanish page by page; the Spanish goes.
    clean: ([raw]) =>
      cleanScan(raw, {
        startAt: /^Ancha\s+munascay\s+ch/,
        // Running heads the OCR has put a lowercase letter in: "SERMOiN PRIMERO".
        dropLines: /\bSERM\S{1,3}N\b|MISTERIOS\s+DE\s+LA/,
        misreadings: [
          // ll read as "U" or "11" ("aUicta", "11apan"), and a C that starts a word as G ("Gayta"):
          // this Quechua has no G.
          [/(\p{L})U(?=\p{Ll})/gu, '$1ll'],
          [/\bU(?=[ae])/g, 'll'],
          [/\b11(?=\p{Ll})|(?<=\p{L})11/gu, 'll'],
          [/\bG(?=[aouh])/g, 'C'],
          SPECKS,
          // A letter read as a bracket inside a word: "chay)aGm".
          [/(\p{L})[()](?=\p{L})/gu, '$1'],
        ],
        otherLanguage: SPANISH,
        // Numbers are page and note numbers; a bracket can still end up inside a word once the
        // lines are joined.
        fixes: [[/\p{N}+/gu, ''], [/(\p{L})[()](?=\p{L})/gu, '$1'], ...TIDY],
      }),
  },
  'nv-narratives': {
    urls: ['https://raw.githubusercontent.com/OpenTextCollections/nava1243a/v1.0/sentences.csv'],
    output: 'src/data/corpora/nv/narratives.txt',
    // Seven of the nine narratives, leaving out the two sacred ones: the fourth, on the traditional
    // Navajo country and the emergence, and the fifth, on First Man and First Woman.
    clean: ([raw]) =>
      paragraphsFromTable(raw, {
        text: 'Primary_Text',
        texts: { column: 'Text_ID', keep: ['01_3', '02_3', '03_3', '06_3', '07_3', '08_3', '09_3'] },
        sentencesPerParagraph: 6,
        fixes: [
          // Quotation marks typed as in LaTeX: ``…''.
          [/``\s*/g, '“'],
          [/\s*''/g, '”'],
          [/[`{}\\]/g, ''],
          [/“\s+/g, '“'],
          // The glottal stop as a letter (ʼ), so a word isn't cut at it; at the start of a word it
          // goes, as today's spelling mostly leaves it out there.
          [/(^|[\s“(])[’']/gu, '$1'],
          [/[’']/g, 'ʼ'],
          [/\s+([,.;:!?”])/g, '$1'],
        ],
      }),
  },
  'ru-geroy': {
    // The novel in its modern spelling, part by part.
    urls: ['Предисловие', 'Бэла', 'Максим Максимыч', 'Журнал Печорина', 'Тамань', 'Княжна Мери', 'Фаталист'].map((part) =>
      wikisource('ru', `Герой нашего времени (Лермонтов)/СО/${part}`),
    ),
    output: 'src/data/corpora/ru/geroy.txt',
    // Asterisks mark the author's notes.
    clean: eachPage((raw) => cleanWikitext(raw, { fixes: [[/\s*\*+/g, '']] })),
  },
  'ar-nazarat': {
    // The essays of the first volume, but for two on Islam and Christianity.
    urls: [
      'المقدمة',
      'الغد',
      'الكأس الأولى',
      'الدَّفِينُ الصَّغِير',
      'مناجاة القمر',
      'أين الفضيلة؟',
      'الغَنيُّ والفقير',
      'مدينة السعادة',
      'أيها المحزون',
      'إلى الدَّيْر',
      'الرحمة',
      'رسالة الغفران',
      'عبرة الدهر',
      'أفسدك قومُك',
      'الصدق والكذب',
      'النظَّامون',
      'الحرية',
      'عِبرةُ الهجرة',
      'الإنصاف',
      'المدنية الغربية',
      'يوم الحساب',
      'الشعرة البيضاء',
      'الصياد',
      'الانتحار',
      'الجمال',
      'الكذب',
      'غرفة الأحزان',
      'الشرف',
      'الحب والزواج',
      'أهناءٌ أم عزاء؟',
      'الزوجتان',
      'في سبيل الإحسان',
      'أدب المناظرة',
      'الإحسان في الزواج',
      'البخيل',
      'البعوض والإنسان',
      'الجزع',
      'الاتحاد',
      'النبوغ',
      'البائسات',
      'البيان',
      'السريرة',
      'زيدٌ وعمرو',
      'أبو الشمقمق',
      'دورة الفلك',
      'تأبين فولتير',
      'العلماء والجهلاء',
      'الرجل والمرأة',
      'الدعوة',
    ].map((essay) => wikisource('ar', `النظرات/${essay}`)),
    output: 'src/data/corpora/ar/nazarat.txt',
    clean: eachPage((raw) =>
      cleanWikitext(raw, {
        fixes: [
          // Verses of the Qur’an, which the essays quote between ﴿ and ﴾, or with its pause
          // marks (ۖ, ۚ): the sentence goes.
          [/﴿[^﴾]*﴾/gu, ''],
          [/[^.؟!:\n]*[ۖ-ۭ][^.؟!\n]*[.؟!]?/gu, ''],
          // The short vowels and other marks the edition writes on some words, and the tatweel
          // that stretches a letter: the same word is then always written the same.
          [/[\u064B-\u0652\u0670\u0640]/gu, ''],
          // "\u0627.\u0647\u0640", the mark that ends a quotation.
          [/\s*\u0627\.\u0647\.?/gu, ''],
          [/\s+([،؛؟.,;:!?])/gu, '$1'],
        ],
      }),
    ),
  },
};

const [id, ...files] = process.argv.slice(2);
const recipe = RECIPES[id];
if (!recipe) {
  console.error(`Usage: npm run import-text -- <${Object.keys(RECIPES).join(' | ')}> [downloaded files]`);
  process.exit(1);
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A page, fetched gently: Wikimedia asks for a name and a pause, and says when it's too busy. */
async function download(url: string): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': 'Jabberwock source import (https://github.com/invigoro/dummy-text-generator)' } });
    if (response.ok) return response.text();
    if (response.status !== 429 || attempt === 5) throw new Error(`${url}: HTTP ${response.status}`);
    await pause(10_000 * attempt);
  }
}

const raws: string[] = [];
if (files.length > 0) {
  for (const file of files) raws.push(await readFile(file, 'utf8'));
} else {
  for (const url of recipe.urls) {
    if (raws.length > 0) await pause(1_000);
    raws.push(await download(url));
  }
}

const text = recipe.clean(raws);
await writeFile(recipe.output, text);
const paragraphs = text.split('\n\n').length;
const words = text.split(/\s+/).filter(Boolean).length;
console.log(`Wrote ${recipe.output}: ${paragraphs} paragraphs, ${words} words.`);
