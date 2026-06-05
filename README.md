# Word Finder

Word Finder is a public experiment in word rediscovery.

People search for words from a finite dictionary corpus. When a word is found for the first time, it becomes part of the public archive. When someone searches for a word that has already been found, its rediscovery count rises.

Over time, those ranked rediscovery counts may begin to resemble a Zipf-like curve: a small number of words repeatedly searched at the top, followed by a long tail of words that are found rarely. The curve is not generated or forced. It is an observational trace of what visitors actually search.

## How it works

1. A visitor enters a word.
2. The site normalizes the input.
3. The normalized word is checked against the imported dictionary corpus.
4. If the word is in the corpus, the archive records either:
   - a first discovery, or
   - a rediscovery/search count increment.
5. The home page ranks the most rediscovered words and plots them by rank and count.

The main page combines search, the experiment explanation, live stats, the Zipf-style rank curve, daily first discoveries, inline word records, and public notes.

## Corpus boundary

Word Finder is not a claim about every word in every language. It only knows about the imported corpus.

The current corpus target is Kaikki.org/Wiktextract data derived from Wiktionary. During import, entries are normalized and filtered to Roman/Latin-script dictionary keys. Searches outside that boundary are rejected even if they are real words elsewhere.

No extra language corpora are loaded by the app at runtime. The corpus is an input to the archive, not something bundled into the public interface.

## Notes

Visitors can leave short anonymous public notes from the inline word record after a successful search. Notes are intended for usage context, etymological curiosity, memories, and small observations. They are plain text, length-limited, and rate-limited per word.