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
