# Dummy Text Generator

Lorem ipsum for tabletop games: text in real and fantasy languages that nobody at the table can
understand, but that looks and sounds like a real language. Use it for the filler on a handout, the
words of an inscription, or NPC speech a game master can read aloud without knowing the language.
It pairs with [Stele](https://stele.invigoro.me/), which turns the text into a weathered object.

## Development

Requires Node.js 22.12 or newer. The repo pins 24 in [`.nvmrc`](.nvmrc).

```sh
npm install
npm run dev       # dev server with hot reload
npm test          # unit tests
npm run build     # type-check, then build to dist/
npm run preview   # serve the production build locally
```

## Plan

[docs/PLAN.md](docs/PLAN.md) covers the approach, the languages, public-domain sources, and the
roadmap.
