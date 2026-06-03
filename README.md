# Word Finder

A minimalist word-discovery archive for Roman-alphabet words from an imported dictionary corpus.

## Features

- Search and discover words from a finite dictionary corpus
- Rediscovery/search counts for previously discovered words
- Anonymous public notes per word with validation and rate limiting
- Public stats page with top rediscovered words and daily discovery chart
- Word detail pages with discovery metadata and notes
- Next.js App Router API routes for the backend
- Amplify Gen 2 DynamoDB resources for production storage
- Kaikki/Wiktextract JSONL import script for dictionary seeding

## Local development

```bash
npm install
npm run dev
```

Local development uses the built-in in-memory seed corpus unless `WORD_FINDER_STORE=dynamodb` is set.

## Verification

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Production setup

1. Deploy the Amplify Gen 2 backend for the target branch.
2. Connect this repository to AWS Amplify Hosting.
3. Keep the Amplify build spec from `amplify.yml` for frontend CI/CD.
4. Set production environment variables:
   - `WORD_FINDER_STORE=dynamodb`
   - `WORD_FINDER_NOTE_HASH_SALT=<random secret>`
   - `WORD_FINDER_DICTIONARY_TABLE=<generated dictionary table>`
   - `WORD_FINDER_DISCOVERED_TABLE=<generated discovered table>`
   - `WORD_FINDER_NOTES_TABLE=<generated notes table>`
   - `WORD_FINDER_DAILY_STATS_TABLE=<generated daily stats table>`
5. Attach the generated `wordFinderComputeRoleArn` as the Amplify Hosting SSR compute role.
6. Import a dictionary corpus into the generated dictionary table:

```bash
WORD_FINDER_DICTIONARY_TABLE=<table-name> npm run import:dictionary -- /path/to/kaikki.jsonl.gz
```

The importer expects Kaikki/Wiktextract JSONL or JSONL.GZ entries and stores only normalized Latin-script words.
