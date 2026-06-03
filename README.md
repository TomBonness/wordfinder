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

1. Deploy this repository with AWS Amplify Hosting connected to GitHub.
2. Keep the Amplify build spec from `amplify.yml` so the backend deploys before the frontend build.
3. Set production environment variables:
   - `WORD_FINDER_STORE=dynamodb`
   - `WORD_FINDER_NOTE_HASH_SALT=<random secret>`
   - `AWS_REGION=<deployment region>`
4. After backend deployment, attach the generated `wordFinderComputeRoleArn` as the Amplify Hosting SSR compute role.
5. Import a dictionary corpus into the generated dictionary table:

```bash
WORD_FINDER_DICTIONARY_TABLE=<table-name> npm run import:dictionary -- /path/to/kaikki.jsonl.gz
```

The importer expects Kaikki/Wiktextract JSONL or JSONL.GZ entries and stores only normalized Latin-script words.
