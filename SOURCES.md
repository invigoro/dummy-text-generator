# Sources

Every source text here is in the public domain. The rule of thumb, as of 2026: published in 1930
or earlier (the US rule), and by an author who died in 1955 or earlier (the rule in the EU and
most other countries). Translations have their own copyright, so texts are used in their original
language. See [docs/PLAN.md](docs/PLAN.md#public-domain-sources).

Texts from Project Gutenberg are cleaned by `npm run import-gutenberg`, whose recipes in
[`scripts/import-gutenberg.ts`](scripts/import-gutenberg.ts) rebuild each file from the original
download. Cleaning removes the Project Gutenberg header and footer, and with them its trademark
and license text.

## English

### Treasure Island

- **Author:** Robert Louis Stevenson (1850–1894)
- **Published:** 1883
- **File:** [`src/data/corpora/en/treasure-island.txt`](src/data/corpora/en/treasure-island.txt)
- **From:** Project Gutenberg eBook #120, <https://www.gutenberg.org/ebooks/120> (the edition
  updated 4 September 2026)
- **Cleaning:** `npm run import-gutenberg -- en-treasure-island` removes:
  - the title page, the dedication, the poem "To the Hesitating Purchaser" and the contents
  - part and chapter headings
  - the songs, letters, map notes and crew list, which the edition sets as indented blocks
  - one footnote

  Double hyphens become em dashes, and the underscores marking italics are removed. Ship names
  printed in capitals (for italics) become "Hispaniola", "Walrus", "Royal Fortune" and
  "Cassandra". Words in capitals for emphasis get ordinary case.
- **When loading:** three sentences containing slurs are left out (see
  [`src/engine/blocklist.ts`](src/engine/blocklist.ts)). The file itself is the full text.

The texts below only lend their flow to invented words: the generator keeps their sentence and
paragraph lengths, punctuation and word lengths, and replaces every word.

## French

### Les Trois Mousquetaires

- **Author:** Alexandre Dumas (1802–1870), with Auguste Maquet (1813–1888)
- **Published:** 1844
- **File:** [`src/data/corpora/fr/trois-mousquetaires.txt`](src/data/corpora/fr/trois-mousquetaires.txt)
- **From:** Project Gutenberg eBook #13951, <https://www.gutenberg.org/ebooks/13951>
- **Cleaning:** `npm run import-gutenberg -- fr-trois-mousquetaires` keeps chapters I–XV (about
  56,000 words) and removes the preface, the chapter headings and the underscores marking italics.

## Latin

### Lorem ipsum

- **Author:** after Cicero, *De finibus bonorum et malorum* 1.32–33 (45 BC)
- **File:** [`src/data/corpora/la/lorem-ipsum.txt`](src/data/corpora/la/lorem-ipsum.txt)
- **From:** typed in. The file holds the classic passage typesetters have used since at least the
  1500s ("Lorem ipsum dolor sit amet…"), and the two passages of Cicero it scrambles, as they're
  commonly reproduced.
- **Used for:** the words of the Lorem ipsum language, laid on the flow of *De Bello Gallico*.

### De Bello Gallico, books I–IV

- **Author:** Julius Caesar (100–44 BC)
- **Written:** about 58–50 BC
- **File:** [`src/data/corpora/la/de-bello-gallico.txt`](src/data/corpora/la/de-bello-gallico.txt)
- **From:** Project Gutenberg eBook #218, <https://www.gutenberg.org/ebooks/218>
- **Cleaning:** `npm run import-gutenberg -- la-de-bello-gallico` removes the book headings and the
  square brackets the edition puts round passages it doubts (the words stay), and puts back one
  missing space between sentences.

## Icelandic

### Sæfarinn

- **Author:** Jules Verne (1828–1905), in an anonymous Icelandic translation of *Vingt mille lieues
  sous les mers*
- **Published:** Reykjavík, 1908
- **File:** [`src/data/corpora/is/saefarinn.txt`](src/data/corpora/is/saefarinn.txt)
- **From:** Project Gutenberg eBook #17025, <https://www.gutenberg.org/ebooks/17025>
- **Public domain:** Verne died in 1905, and the translation was published anonymously in 1908. That
  puts it in the public domain in the US (published before 1931) and in the EU (an anonymous work,
  more than 70 years after publication).
- **Cleaning:** `npm run import-gutenberg -- is-saefarinn` removes the title pages and chapter
  numbers.
- **Why this text:** it lends its flow to invented Old Norse. Project Gutenberg has no Old Norse or
  Icelandic sagas, and Icelandic is the closest living language to Old Norse.

## Spanish

### Don Quijote

- **Author:** Miguel de Cervantes (1547–1616)
- **Published:** 1605
- **File:** [`src/data/corpora/es/don-quijote.txt`](src/data/corpora/es/don-quijote.txt)
- **From:** Project Gutenberg eBook #2000, <https://www.gutenberg.org/ebooks/2000>
- **Cleaning:** `npm run import-gutenberg -- es-don-quijote` keeps chapters I–XI (about 24,000
  words) and removes the front matter, the prologue's verses and the chapter headings.

## Portuguese

### Os Maias

- **Author:** Eça de Queirós (1845–1900)
- **Published:** 1888
- **File:** [`src/data/corpora/pt/os-maias.txt`](src/data/corpora/pt/os-maias.txt)
- **From:** Project Gutenberg eBook #40409, <https://www.gutenberg.org/ebooks/40409>
- **Cleaning:** `npm run import-gutenberg -- pt-os-maias` keeps chapters I–IV (about 32,000
  words), removes the front matter and chapter numbers, and writes out the transcription's
  superscripts ("M.^{me}" as "Mme") and ligatures ("[oe]" as "œ").

## Italian

### I promessi sposi

- **Author:** Alessandro Manzoni (1785–1873)
- **Published:** 1840, in its final form
- **File:** [`src/data/corpora/it/promessi-sposi.txt`](src/data/corpora/it/promessi-sposi.txt)
- **From:** Project Gutenberg eBook #45334, <https://www.gutenberg.org/ebooks/45334>
- **Cleaning:** `npm run import-gutenberg -- it-promessi-sposi` keeps chapters I–VIII (about 44,000
  words) and removes the front matter, the chapter headings and the notes where pictures were.

## Finnish

### Seitsemän veljestä

- **Author:** Aleksis Kivi (1834–1872)
- **Published:** 1870
- **File:** [`src/data/corpora/fi/seitseman-veljesta.txt`](src/data/corpora/fi/seitseman-veljesta.txt)
- **From:** Project Gutenberg eBook #11940, <https://www.gutenberg.org/ebooks/11940>
- **Cleaning:** `npm run import-gutenberg -- fi-seitseman-veljesta` keeps chapters 1–5 (about
  25,000 words) and removes the front matter, the chapter headings and the songs.

## Welsh

### Cartrefi Cymru

- **Author:** Owen M. Edwards (1858–1920)
- **Published:** 1896
- **File:** [`src/data/corpora/cy/cartrefi-cymru.txt`](src/data/corpora/cy/cartrefi-cymru.txt)
- **From:** Project Gutenberg eBook #3680, <https://www.gutenberg.org/ebooks/3680>
- **Cleaning:** `npm run import-gutenberg -- cy-cartrefi-cymru` keeps the twelve essays and
  removes the title pages, the contents, the headings, the indented verse and the notes at the
  end.

## German

### Die Verwandlung

- **Author:** Franz Kafka (1883–1924)
- **Published:** 1915
- **File:** [`src/data/corpora/de/verwandlung.txt`](src/data/corpora/de/verwandlung.txt)
- **From:** Project Gutenberg eBook #22367, <https://www.gutenberg.org/ebooks/22367>
- **Cleaning:** `npm run import-gutenberg -- de-verwandlung` removes the title page and the
  chapter numbers.
- **Why this text:** the Grimms' *Deutsche Sagen* was the first choice, but it includes
  antisemitic legends, so it's not used even as a flow.
