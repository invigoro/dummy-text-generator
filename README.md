# Jabberwock

Lorem ipsum for tabletop games: text in real and fantasy languages that nobody at the table can
understand, but that looks and sounds like a real language. Use it for the filler on a handout, the
words of an inscription, or NPC speech a game master can read aloud without knowing the language.
It pairs with [Stele](https://stele.invigoro.me/), which turns the text into a weathered object.

**Live site:** https://jabberwock.invigoro.me/

## Using it

- **Pick a language:** a real one (English, French, Spanish, Portuguese, Italian, German, Latin,
  lorem ipsum, Finnish, Welsh, Old English, Middle English, Shakespearean English, Old Norse,
  Quechua, Nahuatl, Algonquian (Ojibwe), Navajo, Enochian), or one of D&D's, such as Elvish
  (invented French), Dwarvish (invented Old Norse) or Orc. Apart from Real English and Real French,
  the words are invented. The text flows like the real language, with its rhythm, its punctuation
  and its short words turning up everywhere, but nobody can understand it, not even someone who
  speaks the language. The same word always comes out the same, so a language keeps its vocabulary
  from one session to the next. Real French comes with a "say it" line worked out from its
  spelling, near enough to read aloud. Middle English and Shakespearean English keep their little
  words real ("whan", "quod", "thou", "hath") and invent the rest, as "Jabberwocky" does, so
  they read as Chaucer and Shakespeare and still mean nothing.
- **Name your own world's languages:** a setting of your own gives the languages your game's
  names, such as Renan for French and Old Deciman for Latin. Settings are kept in the browser,
  exported and imported as files, and carried in share links, so whoever opens one sees the same
  names and can save the setting.
- **Build a language of your own**, for a monster or a people of your world. Start from nothing
  or from any language here ("Orcish, but hissing"). Then set its sounds, how they make syllables,
  where the stress falls, how it's spelled and whose rhythm it borrows, with sample words and a
  passage updating as you go. Your languages are kept in the browser, exported and imported as
  files, and carried in share links like settings.
- **Pick a form:**
  - **Prose:** paragraphs, as in a letter or a book.
  - **Conversation:** lines of speech for two to four speakers, each after the speaker's name in
    the language. The lines come from the speech in the source text.
  - **Inscription:** a few short lines without punctuation, for a stone, a sign or a seal.
  - **Names:** names for people or places, in the language's own words. People are named after
    the source text's people, and places are built the way that language's real places are
    ("-ford" in English, "Saint-" in French, "Llan" in Welsh).
- **Show it written, or how to say it:**
  - "Say it" respells every word for English readers, with the stressed syllable in capitals
    ("lay-RAHN").
  - "Both" puts that under each word.
  - "IPA" is there for anyone who reads it.

  Each language comes with a tip for voicing it.
- **Pick an order:** a passage in its original order, or paragraphs, sentences (or lines) or words
  shuffled from all over the source text. Shuffled words keep the rhythm and punctuation of prose.
- **Set the length** in paragraphs (or lines) or words. The text always stops at the end of a
  sentence.
- 🎲 **Reroll** for new text. The seed is shown beside it: the same seed and settings always give
  the same text.
- **Take it away:**
  - **Read aloud** shows the text in large type for reading at the table, with the language's tip
    for voicing it.
  - **Listen** reads it out with the browser's own voices. A French voice reads Elvish, for one,
    and an English voice reads the "say it" line of a language with no voice of its own.
  - **Copy** copies the text as it's shown.
  - **Share link** copies a link that recreates it exactly.
  - **Open in Stele** puts it on an object: parchment for Elvish, runes on granite for Dwarvish,
    Roman lettering on marble for Latin.

Every text the words and flow come from is in the public domain. If you think one isn't, the
[copyright page](https://jabberwock.invigoro.me/copyright/) says how to ask for it to be taken
down.

## Development

Requires Node.js 22.12 or newer. The repo pins 24 in [`.nvmrc`](.nvmrc).

```sh
npm install
npm run dev       # dev server with hot reload
npm test          # unit tests
npm run build     # type-check, then build to dist/
npm run preview   # serve the production build locally
```

For tuning a language, the dev server also serves a lab at `/lab.html`. For any language it shows:
- the invented words for its source text's commonest words
- fresh words from its sound system
- statistics beside the source's
- samples of each form

The lab isn't part of the build, so it never reaches the live site.

Every push to `master` runs the tests, builds the site and deploys it to GitHub Pages
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). Pushes to other branches run the
tests and the build without deploying ([`.github/workflows/test.yml`](.github/workflows/test.yml)).

### Source texts

Every source text is in the public domain; [SOURCES.md](SOURCES.md) records where each one came
from. To add one:

1. Add a recipe to [`scripts/import-gutenberg.ts`](scripts/import-gutenberg.ts) and run
   `npm run import-gutenberg -- <id>`. For a text that isn't on Project Gutenberg, such as a
   scanned book on the Internet Archive, the recipe goes in
   [`scripts/import-text.ts`](scripts/import-text.ts), run with `npm run import-text -- <id>`.
2. Register the file in [`src/data/corpora/index.ts`](src/data/corpora/index.ts).
3. Record its provenance in SOURCES.md.

## Plan

[docs/PLAN.md](docs/PLAN.md) covers the approach, the languages, public-domain sources, and the
roadmap.
