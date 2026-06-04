import js from "@eslint/js";
import globals from "globals";

const ignores = [
  ".next/**",
  ".amplify/**",
  "node_modules/**",
  "coverage/**",
  "amplify_outputs.json",
  "next-env.d.ts",
  "tsconfig.tsbuildinfo",
  "*.jsonl",
  "*.jsonl.gz",
  "*.db",
  "*.sqlite",
  "*.sqlite3",
  "*.duckdb",
  "corpus/**",
  "data-imports/**",
];

export default [
  { ignores },
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
  },
];
