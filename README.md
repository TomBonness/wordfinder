# Word Finder

A minimalist word-discovery archive for Roman-alphabet words from an imported dictionary corpus.

## Features

- Search and discover words from a finite dictionary corpus
- Rediscovery/search counts for previously discovered words
- Anonymous public notes per word with validation and rate limiting
- Public stats page with top rediscovered words, a rank/count curve, and daily discovery chart
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

`typecheck` uses `tsconfig.typecheck.json` as the TypeScript gate for `src/`, `scripts/`, and root config files. It intentionally excludes generated `.next/**` output and disables incremental state so stale build caches cannot make validation scan generated route artifacts; `next build` may still add `.next/types/**/*.ts` to `tsconfig.json` for its own build-time route checks. `lint` is intentionally bounded to JavaScript config linting; do not reintroduce `eslint-config-next`/`FlatCompat` or broad `eslint src ...` scans unless the large generated/cache artifact issue is solved another way.

Large corpus files are import inputs, not application assets. Keep Kaikki/Wiktextract downloads outside `src/`, do not import them from TypeScript, and run the importer with a filesystem path as shown below. Verification commands should only use the in-memory seed corpus unless `WORD_FINDER_STORE=dynamodb` is explicitly set. Corpus/database artifacts are ignored by `.gitignore`.

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
