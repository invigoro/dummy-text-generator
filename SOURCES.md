# Sources

Every source text here is in the public domain. The rule of thumb, as of 2026: published in 1930
or earlier (the US rule), and by an author who died in 1955 or earlier (the rule in the EU and
most other countries). Translations have their own copyright, so texts are used in their original
language. See [docs/PLAN.md](docs/PLAN.md#public-domain-sources).

Texts from Project Gutenberg are cleaned by `npm run import-gutenberg`, whose recipes in
[`scripts/import-gutenberg.ts`](scripts/import-gutenberg.ts) rebuild each file from the original
download. Cleaning removes the Project Gutenberg header and footer, and with them its trademark
and license text.

Texts from elsewhere, a scanned book's OCR text or a published corpus, are cleaned the same way
by `npm run import-text`, with recipes in [`scripts/import-text.ts`](scripts/import-text.ts).

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
  It closes up the space this edition leaves where a compound broke across a line in print
  ("lui- même" as "lui-même").

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
- **Cleaning:** `npm run import-gutenberg -- la-de-bello-gallico` removes the book headings, and the
  square brackets and percent signs the edition puts round passages and words it doubts (the words
  stay). It puts back one missing space between sentences.

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
  superscripts ("M.^{me}" as "Mme", "sr.^a" as "sra") and ligatures ("[oe]" as "œ").

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

## Middle English

### The Canterbury Tales: the Tale of Melibee and the Parson's Tale

- **Author:** Geoffrey Chaucer (c. 1343–1400), edited by Walter W. Skeat (1835–1912)
- **Written:** about 1390; this edition published 1894
- **File:** [`src/data/corpora/enm/canterbury-prose.txt`](src/data/corpora/enm/canterbury-prose.txt)
- **From:** Project Gutenberg eBook #22120, *The Complete Works of Geoffrey Chaucer*, Volume 4,
  <https://www.gutenberg.org/ebooks/22120>
- **Cleaning:** `npm run import-gutenberg -- enm-canterbury-prose` keeps the two tales Chaucer
  wrote in prose, Melibee and the Parson's Tale (about 47,000 words). It drops the verse between
  them and the editor's notes (Skeat indents both), the section headings and the notes giving
  line numbers. It removes page numbers, section numbers ("§ 23."), the line markers ("/" and
  "/2160") and the square brackets round words the editor supplied.
- **Why this text:** prose gives the flow of sentences, where the verse would give the rhythm of
  couplets.

## Shakespearean English

### Hamlet

- **Author:** William Shakespeare (1564–1616)
- **Written:** about 1600
- **File:** [`src/data/corpora/en/hamlet.txt`](src/data/corpora/en/hamlet.txt)
- **From:** Project Gutenberg eBook #1524, <https://www.gutenberg.org/ebooks/1524>
- **Cleaning:** `npm run import-gutenberg -- en-hamlet` starts at the first act, after the
  contents and the list of characters. It removes the act and scene headings, the stage
  directions (on their own, in brackets, or inside a speech) and the dumb-show. Speakers' names
  printed in capitals get ordinary case, so each paragraph is a speech that starts with its
  speaker's name ("Hamlet. …"): conversations use the names, and prose leaves them out.

Middle English and Shakespearean English keep some of their texts' little words real ("whan",
"quod", "thou", "hath"), as "Jabberwocky" does, and invent the rest.

## Quechua

### Tercero catecismo: the sermons

- **Author:** the Third Council of Lima (1582–1583), which had the sermons written in Spanish and
  Quechua; they're attributed to José de Acosta and others
- **Written:** 1585; this edition published in Paris by Rosa y Bouret, 1867
- **File:** [`src/data/corpora/qu/tercero.txt`](src/data/corpora/qu/tercero.txt)
- **From:** the Internet Archive's scan of the Smithsonian Libraries' copy,
  <https://archive.org/details/tercerocatecism00cath>, and its OCR text
- **Cleaning:** `npm run import-text -- qu-tercero` keeps the thirty-one sermons in Quechua
  (about 33,000 words). They face their Spanish page by page, and the Spanish pages go, told by
  their words. It also:
  - leaves out the running heads, and the page and note numbers
  - rejoins the words split across lines, and the paragraphs split across pages
  - corrects some OCR misreadings: ll read as "U" or "11", a C starting a word read as G, and a
    letter read as a bracket

  The OCR's other slips, such as c read as e, stay. They only make a few words into two.
- **Why this text:** it's the "lengua general" of the colonial Andes, the Quechua of the time,
  in prose. Only its flow is used; the invented words are spelled the way Cusco spells Quechua
  today.

## Nahuatl

### Sixth and Seventh Relations

- **Author:** Domingo Francisco de San Antón Muñón Chimalpahin Cuauhtlehuanitzin (1579–1660), a
  Nahua historian of Chalco-Amaquemecan, edited with a French translation by Rémi Siméon
  (1827–1890)
- **Written:** in the early 1600s; this edition published in Paris by Maisonneuve et Ch. Leclerc,
  1889, as *Annales de Domingo Francisco de San Anton Muñon Chimalpahin Quauhtlehuanitzin:
  sixième et septième relations (1258–1612)*
- **File:** [`src/data/corpora/nah/chimalpahin.txt`](src/data/corpora/nah/chimalpahin.txt)
- **From:** the Internet Archive's scan of the University of Toronto's copy,
  <https://archive.org/details/bibliothquelin12adamuoft>, and its OCR text
- **Cleaning:** `npm run import-text -- nah-chimalpahin` keeps the annals (about 37,000 words),
  from the first heading to the index. It leaves out:
  - Siméon's French translation in the facing column, and his notes, told by their words
  - the running heads and page numbers
  - the Christian year after the Mexican one ("III calli xihuitl, 1261 años"), and the numbers
    of the notes, stuck to words ("Tepetlicpac3")

  It rejoins the words split across lines, and puts back together the entries that run over a
  page. It corrects a few OCR misreadings (the l of "xihuitl" read as i, a Q as "(^") and removes
  specks, and the brackets round the letters Siméon restored. The OCR's other slips stay.
- **Why this text:** it's Nahuatl as a Nahua author wrote it, not translated scripture, and it's
  prose. Its many rulers and towns give the names form plenty to work from.

## Ojibwe (Algonquian)

### A Short Compendium of the Catechism for the Indians

- **Author:** Nicholas Louis Sifferath (1828–1898), missionary to the Odawa and Ojibwe, with the
  approbation of Bishop Frederic Baraga (1864)
- **Published:** Buffalo, 1869
- **File:** [`src/data/corpora/oj/catechism.txt`](src/data/corpora/oj/catechism.txt)
- **From:** Project Gutenberg eBook #40466, <https://www.gutenberg.org/ebooks/40466>
- **Cleaning:** `npm run import-gutenberg -- oj-catechism` keeps the prayers and the catechism
  (about 10,500 words), from the first line after the title page. It leaves out the hymns (set as
  indented blocks), the section headings in capitals, and the spelling lessons and numbers at the
  back. The underscores marking the questions' italics are removed.
- **Why this text:** it's clean, proofread Ojibwe prose, in the Odawa dialect and Baraga's
  French-based spelling. Longer Ojibwe texts are in the public domain, such as Chrysostom
  Verwyst's sermons (1907), but only as OCR. Only the flow is used; the invented words are
  spelled the way Ojibwe mostly is today.

## Navajo

### The Trouble at Round Rock and Navajo Historical Selections

- **Authors:** seven Navajo narrators: Left-Handed Mexican Clansman, Howard Gorman, the Nephew of
  Former Big Man, John C. Claw, Dan Phillips, the Blind Man's Daughter and Tim Yazzie. Robert W.
  Young and William Morgan recorded and published them.
- **Published:** by the US Bureau of Indian Affairs, in 1952 and 1954
- **Public domain:** the US government published both books, without a copyright notice. The
  edition the text comes from (below) records that the Bureau and the US Copyright Office
  confirmed they're in the public domain.
- **File:** [`src/data/corpora/nv/narratives.txt`](src/data/corpora/nv/narratives.txt)
- **From:** the Navajo text of Lukas Denk and Melvatha R. Chee's edition, *Nine Navajo
  Narratives* (Language Science Press, 2026), in its dataset,
  <https://github.com/OpenTextCollections/nava1243a> (v1.0), also at
  <https://zenodo.org/records/21377033>. The edition's own work, its glosses and translations, is
  licensed CC BY 4.0. Only the Navajo, as Young and Morgan published it, is used here.
- **Cleaning:** `npm run import-text -- nv-narratives` keeps seven of the nine narratives (about
  9,100 words). The two it leaves out are sacred: the fourth, on the traditional Navajo country
  and the emergence, and the fifth, on First Man and First Woman. It also:
  - makes paragraphs, since the dataset has a sentence to a row: six sentences to a paragraph,
    with each narrative starting a new one
  - turns quotation marks typed as ``…'' into “…”
  - makes the glottal stop the letter ʼ, so a word isn't cut at it. At the start of a word it
    goes, as today's spelling mostly leaves it out there.
- **Why this text:** it's the cleanest Navajo in the public domain, with every accent and hook,
  and it's storytelling, with speech in it. *Ádahooníłígíí*, the newspaper the Bureau published in
  Navajo from 1943 to 1957, is far longer and also in the public domain, but its OCR loses every
  accent.
