# Dummy Text Generator implementation plan

Dummy Text Generator writes "lorem ipsum" for tabletop games: text in real and fantasy languages
that nobody at the table can understand, but that looks and sounds like a real language. It does two
jobs:

- **Text to look at:** the filler on a handout or the words of an inscription, which go on to
  [Stele](https://stele.invigoro.me/) to become a weathered object.
- **Text to say:** NPC speech the game master reads aloud. Each line comes with a spelling an
  English speaker can pronounce without knowing the language.

The generated text must flow like the real language, every source text must be in the public
domain, and the site must be static, hosted on GitHub Pages.

**Current phase:** Phase 2. Phases 0 and 1 are done. See [Milestones](#milestones).

## The approach

There are three ways to make the text:

| Approach | Flows like the language? | Pronunciation guide | Catch |
|---|---|---|---|
| Sample real public-domain text | Perfectly | Approximate: spelling doesn't map cleanly to sounds in French or English | Anyone who speaks the language understands it, and Orcish has no source text |
| Generate random syllables | Poorly: no repeated words, no rhythm | Exact | Sounds like generic fantasy gibberish |
| **Real skeleton, invented words** (this plan) | Yes | Exact | Invented words need tuning per language |

The generator takes a public-domain passage and keeps its **skeleton**: sentence and paragraph
lengths, punctuation, capitalization, word lengths, and which words repeat and how often. It
then swaps every distinct word for an **invented word** built from that language's sound system.

- The same source word always becomes the same invented word, and the mapping is fixed per
  language. French "de" becomes one short word that turns up everywhere, as a real function word
  would, and the same "Elvish" words recur from session to session.
- The text reads like French because its rhythm and repetition *are* French. Nobody can understand
  it, not even a French speaker, because none of the words are real.
- Each invented word is built as **sounds first, spelling second**. The generator always knows
  how a word is pronounced, so the pronunciation guide is exact, and the spelling can still add
  the silent letters that make French look French.

Real text still has two uses: Common filler in English, and real lorem ipsum.

An illustration, written by hand rather than generated, on a Treasure Island line so the swap is
visible. The French sound system would take its skeleton from a French novel.

> **Source:** "I reckon," he said at last—"I reckon, Cap'n Hawkins, you'll kind of want to get
> ashore now."
>
> **Invented French:** « Vé lérant », sa doumé ai louve — « Vé lérant, Cabrel Ouvanis, vul caine
> dou voren sé tière anvil mor. »
>
> **Say it:** vay lay-RAHN, sah doo-may eh LOOV — vay lay-RAHN, kah-brel oo-vah-NEE, vewl ken doo
> voh-rahn say tyehr ahn-veel MOR.

### The "say it" line

The pronunciation guide follows Wikipedia's style of respelling. Syllables are split with hyphens
and the stressed syllable is in capitals. Sounds English doesn't have are approximated: "ahn" for
French nasal vowels, "kh" for the *ch* in *loch*. Stress follows each language's own pattern:
French leans on the last syllable of each phrase, Finnish on the first syllable of every word.
That rhythm is a large part of what makes the text sound right.

The respelling is shared by every language, since it maps sounds to English spelling. Only the
sound systems and their spelling rules differ from language to language.

### Languages are data

Adding a language means adding one file. A sketch:

```ts
export default defineLanguage({
  id: 'french',
  skeleton: 'fr-dumas',                  // the public-domain text it borrows its flow from
  consonants: 'ʁ:9 l:7 s:6 t:5 d:5 n:5 m:4 p:3 k:3 v:3 ʒ:2 ʃ:2',   // sound:weight
  vowels:     'a:8 e:6 ɛ:5 i:5 ə:4 ɑ̃:3 u:3 o:3 y:2 ɔ̃:2 ɛ̃:2',
  syllables:  'CV:6 CVC:2 V:1 CCV:1',
  stress:     'phrase-final',
  spelling:   ['o → o|au|eau', 'ɑ̃ → an|en', 'k → qu before e/i', 'word end → add silent e/s/t'],
  punctuation: { quotes: ['« ', ' »'], spaceBefore: '?!:;' },
  voicing:    'Keep it flowing; lean on the last syllable of each phrase…',
});
```

## How it fits together

1. **Source:** a public-domain passage in the language's flow source, or a generated skeleton for
   a short inscription.
2. **Arrange:** keep the passage in order, or shuffle its paragraphs, sentences or words.
3. **Words:** keep the real words (Common, real lorem ipsum) or swap in invented ones.
4. **Render:** the language's own spelling, the "say it" line, both (the pronunciation in small
   type under each word), or IPA.
5. **Present:** prose, a conversation between two to four speakers, or a short inscription.

Every word in the output keeps all its forms, so switching views never changes the text. The
result can be copied, shared as a link (settings and seed live in the URL), or opened in Stele.

## Languages and settings

**Sound systems** are the building blocks: one per language, real or invented. **Settings** are
lists of names for them, one list per game world.

### Sound systems

| Sound system | Flow borrowed from (public domain) | Phase |
|---|---|---|
| English: real words, jumbled | Stevenson, *Treasure Island* (1883) | 0 |
| French | Dumas, *Les Trois Mousquetaires* (1844), chapters I–XV | 1 |
| Latin: classic lorem ipsum, or invented | Caesar, *De Bello Gallico* I–IV (about 50 BC). Lorem ipsum's own words come from Cicero's *De finibus*, which Project Gutenberg doesn't have in Latin | 1 |
| Old Norse | *Sæfarinn* (1908), an anonymous Icelandic translation of Verne. Project Gutenberg has no sagas, and Icelandic is the closest living language to Old Norse | 1 |
| English: invented words | *Treasure Island* | 2 |
| Spanish | Cervantes, *Don Quijote* (1605) | 2 |
| Portuguese | Eça de Queirós, *Os Maias* (1888) | 2 |
| Italian | Manzoni, *I promessi sposi* (1827) | 2 |
| German | the Grimms' *Kinder- und Hausmärchen* (1812) | 2 |
| Finnish | Kivi, *Seitsemän veljestä* (1870) | 2 |
| Welsh | the *Mabinogion* (medieval Welsh) | 2 |
| Old English | *Beowulf* | 2 |
| Enochian | John Dee's Enochian Keys (1580s) | 2 |
| Invented: harsh and clipped; hissing and grand; legalistic; alien; four elemental dialects | one of the texts above | 2 |

The exact edition of each text is chosen when its language is added, and it has to pass the
[public-domain rules](#public-domain-sources). Monstrous languages get invented sound systems, not
real living languages.

### Settings

- **Real world** (built in): every real-language sound system under its own name, for games
  where the in-world languages are real ones.
- **D&D 5e** (built in): the standard languages, named as in the SRD (CC BY 4.0).
- **Custom:** any names mapped to any sound systems. For example, a colonial-era setting where
  Renan = French, Threcian = English, Soranan = Spanish, Dreyillan = Portuguese, Deciman = Italian
  and Old Deciman = Latin. A custom setting is saved in the browser and shared by link or as a
  JSON file.

| D&D preset | Sound system | Suggested Stele script |
|---|---|---|
| Common | English: real words, jumbled | Latin letters |
| Elvish | French | Latin letters |
| High Elvish | Finnish | Latin letters |
| Sylvan, Druidic | Welsh | Latin letters |
| Dwarvish, Giant | Old Norse | Elder or Younger Futhark runes |
| Orc, Goblin | invented: harsh and clipped | Younger Futhark runes |
| Celestial | Enochian | Latin letters |
| Draconic | invented: hissing and grand | Latin letters |
| Infernal | invented: legalistic | Latin letters, blackletter hand |
| Abyssal, Deep Speech | invented: alien | cuneiform |

Each preset is only a default. If Elvish sounds Welsh in your world, change it in one dropdown.

### Build-your-own languages

A game master can build a sound system of their own, for a monster language with a particular
flow and sound. The builder starts from any existing sound system ("French, but harsher") or from
scratch, and shows sample words and a sample paragraph as it's edited. Its parts are the sounds
and their weights, the syllable shapes, the stress rule, the spelling rules and the flow source.
Built languages are saved in the browser, shared by link or JSON, and usable in custom settings.

## Working with Stele

This tool writes the words, and [Stele](https://github.com/invigoro/Stele) turns them into an
object. Anything to do with presentation stays in Stele: media, lettering styles and fonts,
scripts (runes, cuneiform), Roman lettering (V for U, interpuncts), damage, printing and export.
If a script is missing, such as Ogham or Greek, it gets added to Stele.

**Open in Stele** builds a link in the same format as Stele's share links: `#s=`, then JSON that
has been deflate-raw compressed and base64url encoded. The JSON is
`{ v: 1, medium, textEdited: true, blocks: [{ kind: 'text', role: 'main', text, script }] }`.
Stele fills in everything else from the medium's defaults, and `textEdited` stops it swapping in
its template text when the medium changes. Stele keeps at most 4,000 characters of text from a
link, so the button warns before it trims longer text. The encoder lives in one module, with a
test that decodes a link the way Stele does. If Stele's format changes, that module is the only
place to update. A plain `#text=` parameter in Stele would remove the coupling altogether.

## Public-domain sources

- **Rule of thumb for 2026:** published in 1930 or earlier (the US rule), *and* the author died in
  1955 or earlier (the EU and most other countries). Treasure Island passes both.
- **Original-language editions only.** Translations have their own copyright: a 1960s English
  *Kalevala* isn't public domain even though the poem is.
- **Project Gutenberg texts** are fine once the Project Gutenberg header and footer are stripped.
  Those hold the Project Gutenberg trademark and license terms; the work itself is free.
- **[SOURCES.md](../SOURCES.md)** records the title, author, year and origin of every text, and
  how it was cleaned.
- Nothing else here is sourced text. The sound systems and spelling rules are written from
  scratch, and the fonts are openly licensed.

## Stack and hosting

- **Vite + React + TypeScript**, deployed to GitHub Pages by
  [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) on every push to `master`. The
  workflow runs the tests and the type check before deploying. Pushes to other branches run the
  same checks without deploying ([`.github/workflows/test.yml`](../.github/workflows/test.yml)).
  Vite uses a relative `base`, so the same build works at `invigoro.github.io/dummy-text-generator/`,
  locally, or on a custom domain.
- **Node 24**, pinned in `.nvmrc` and used by CI. Anything from 22.12 up works locally.
- **The generator is plain TypeScript** (`src/engine/`) with no React in it. The same seed always
  gives the same text, which is what makes tests and share links possible.
- **Vitest** for the generator, and **Testing Library** for the UI.
- **Fully static.** Source texts are committed as cleaned plain text and loaded only when their
  language is chosen. Generation runs in the browser, and nothing is sent anywhere.

## Project layout

Items marked *(planned)* don't exist yet.

```
.github/workflows/               # deploy.yml (master → Pages), test.yml (other branches)
index.html · vite.config.ts · package.json · .nvmrc · tsconfig.json
docs/PLAN.md                     # this file
SOURCES.md                       # provenance of every source text
scripts/import-gutenberg.ts      # cleans a Project Gutenberg download into a source text
public/                          # copied as-is (favicon)
src/
  main.tsx · style.css           # app entry and styles
  engine/                        # the generator: no React, no DOM
    rng.ts                       # seeded PRNG, shuffling, string hashing
    tokenize.ts                  # paragraphs → sentences → words and punctuation, per language
    arrange.ts                   # original order, or shuffled paragraphs, sentences or words
    generate.ts                  # flow text + options → a document in the language's words
    corpus/gutenberg.ts          # the cleaning steps behind scripts/import-gutenberg.ts
    sounds/                      # phonemes, sound systems, and inventing words from them
    spelling.ts · respell.ts     # sounds → the language's spelling; sounds → "say it" and IPA
    language.ts                  # the three kinds of language: invented, vocabulary, real
    lexicon.ts · vocabulary.ts   # one invented (or lorem ipsum) word per source word, for good
    document.ts                  # the output: words with their sounds; written, "say it", IPA
    g2p/latin.ts                 # how written Latin is said, for lorem ipsum
    blocklist.ts                 # slurs and swear words, kept out of real and invented text
    stele.ts                     # Open in Stele links
  data/
    corpora/                     # source texts (one folder per language) and their registry
    languages/                   # one file per language, and the registry that loads them
    settings.ts                  # Real world and D&D 5e: names for languages, and Stele styles
  ui/                            # React components, and the page's state in its URL
```

## Milestones

**Phase 0: Setup and deploy.** *(done; a slur filter for real text came forward from Phase 2,
so the live site never shows one)*
- Replace Create React App with Vite, and delete the boilerplate.
- A tokenizer that splits text into paragraphs, sentences and words. It knows "Mr." doesn't end a
  sentence, and keeps each quotation's marks together.
- The whole of *Treasure Island* as the English source text, replacing the single chapter, cleaned
  by a reusable Gutenberg import script.
- The original idea, finished: real Treasure Island text in its original order or shuffled by
  paragraph, sentence or word, with a length control, a reroll button and a copy button.
- Tests for all of it, and the deploy and test workflows.
- *Done when* a push to `master` updates the site. That needs the repository public (or a paid
  GitHub plan) and Settings → Pages → Source set to "GitHub Actions".

**Phase 1: Invented words and both jobs.** *(done. The blocklist for invented words came forward
from Phase 2. Latin's flow comes from Caesar, since Project Gutenberg has no Latin Cicero of the
right kind, and Old Norse's from an Icelandic translation of Verne. Lorem ipsum got its own
language, with a Latin spelling-to-sound converter for its "say it" line.)*
- the sound-system word generator, spelling rules, the "say it" respelling and the word swap
- French, Latin (real lorem ipsum and invented) and Old Norse, under their own names (the Real
  world setting's first entries) and as the Elvish and Dwarvish presets
- views: written, say it, both, and IPA; a visible seed, and share links
- Open in Stele
- *Done when* you can generate a conversation in invented French to read aloud as Renan or Elvish,
  and a Dwarvish inscription that opens in Stele as runes.

**Phase 2: More languages and settings.**
- the colonial set first (invented English, Spanish, Portuguese, Italian), then the rest of the
  sound systems
- settings: Real world and D&D 5e built in, custom settings saved and shared
- conversation mode (two to four speakers, lines taken from quoted speech in the source texts),
  and a short-inscription length
- a tuning page showing sample words and statistics for each sound system

**Phase 3: Build-your-own languages.**
- the language builder described [above](#build-your-own-languages), with live samples
- saving, sharing by link or JSON, and use in custom settings
- a read-aloud view in large type, with each language's voicing tips

**Backlog:**
- a name generator for NPCs and places, using the same sound systems
- a preview through the browser's text-to-speech
- real French text with an approximate "say it" line

## Risks

- **Invented words that don't convince:** the tuning page and sample snapshots in the tests are
  for this. If a language still sounds generic, its spelling rules can borrow common real endings
  (French *-eau*, *-ment*) and short function words.
- **Pronunciation guides English readers misread:** "g" before e or i reads as "j", and "a" is
  ambiguous. The respelling has context rules for these, tested on known cases.
- **Public-domain mistakes:** the rules above, and a SOURCES.md entry for every text.
- **Stele's link format changing:** the encoder lives in one tested module (see
  [Working with Stele](#working-with-stele)).

## Decisions

- **Invented words** for every fantasy and "plain" language. Real words only for Common filler and
  real lorem ipsum.
- **Presentation stays in Stele.** This tool makes the text; styles, fonts, scripts and export
  belong there.
- **React for the UI.** Stele uses plain TypeScript because its hard part is the renderer. This
  tool is mostly forms (the language builder especially) and text that updates as you type,
  which is what React is for.
- Everything runs in the browser; nothing is sent anywhere.
- Source texts are committed already cleaned, in plain text, and split into words when they
  load. Doing that at runtime takes a few milliseconds, so no build step is needed.
- The deploy workflow doesn't cache dependencies, following setup-node's guidance for workflows
  that publish.
