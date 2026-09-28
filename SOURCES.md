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
