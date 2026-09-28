# Dummy Text Generator

Lorem ipsum for tabletop games: text in real and fantasy languages that nobody at the table can
understand, but that looks and sounds like a real language. Use it for the filler on a handout, the
words of an inscription, or NPC speech a game master can read aloud without knowing the language.
It pairs with [Stele](https://stele.invigoro.me/), which turns the text into a weathered object.

**Live site:** https://invigoro.github.io/dummy-text-generator/

## Using it

- **Pick an order:** a passage in its original order, or paragraphs, sentences or words shuffled
  from all over the book. Shuffled words make no sense but keep the rhythm and punctuation of
  prose.
- **Set the length** in paragraphs or words. The text always stops at the end of a sentence.
- 🎲 **Reroll** for new text. **Copy** puts it on the clipboard with a blank line between
  paragraphs, ready to paste into Stele or anywhere else.

For now the text is English, from *Treasure Island* (1883). Invented words in other languages,
and a pronunciation guide for reading them aloud, come next: see the [plan](docs/PLAN.md).

## Development

Requires Node.js 22.12 or newer. The repo pins 24 in [`.nvmrc`](.nvmrc).

```sh
npm install
npm run dev       # dev server with hot reload
npm test          # unit tests
npm run build     # type-check, then build to dist/
npm run preview   # serve the production build locally
```

Every push to `master` runs the tests, builds the site and deploys it to GitHub Pages
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). Pushes to other branches run the
tests and the build without deploying ([`.github/workflows/test.yml`](.github/workflows/test.yml)).

### Source texts

Every source text is in the public domain; [SOURCES.md](SOURCES.md) records where each one came
from. To add one from Project Gutenberg:

1. Add a recipe to [`scripts/import-gutenberg.ts`](scripts/import-gutenberg.ts) and run
   `npm run import-gutenberg -- <id>`.
2. Register the file in [`src/data/corpora/index.ts`](src/data/corpora/index.ts).
3. Record its provenance in SOURCES.md.

## Plan

[docs/PLAN.md](docs/PLAN.md) covers the approach, the languages, public-domain sources, and the
roadmap.
