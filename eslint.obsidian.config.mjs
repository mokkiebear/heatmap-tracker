// The rules Obsidian's community-directory review runs against a release
// (eslint-plugin-obsidianmd). Kept separate from eslint.config.mjs because it
// needs type-aware linting, which makes it several times slower than the main
// lint pass.
//
//   npm run lint:obsidian
//
// The type-aware @typescript-eslint rules in the plugin's `recommended` preset
// are off here: Dataview's API is untyped, so `no-unsafe-*` fires on every call
// into it and buries the Obsidian-specific findings that this config exists to
// surface.
import obsidianmd from "eslint-plugin-obsidianmd";
import tsParser from "@typescript-eslint/parser";

const typeAwareNoise = Object.fromEntries(
  [
    "no-unsafe-member-access",
    "no-unsafe-assignment",
    "no-unsafe-argument",
    "no-unsafe-call",
    "no-unsafe-return",
    "no-redundant-type-constituents",
  ].map((rule) => [`@typescript-eslint/${rule}`, "off"]),
);

export default [
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: typeAwareNoise,
  },
  {
    ignores: [
      "build/**",
      "coverage/**",
      "node_modules/**",
      "website/**",
      "harness/**",
      "EXAMPLE_VAULT/**",
      // Test doubles and fixtures never ship inside main.js, so the
      // directory's review rules don't apply to them.
      "**/__tests__/**",
      "**/__mocks__/**",
      "**/*.spec.*",
      "src/test-utils/**",
    ],
  },
];
