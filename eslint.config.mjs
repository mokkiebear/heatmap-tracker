import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-undef": "off",
      semi: ["warn", "always"],
    },
  },
  {
    files: ["**/__tests__/**/*.[jt]s?(x)", "**/*.spec.[jt]s?(x)"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    // `**/` matters: a bare `*.mjs` only matches the repo root, which left
    // harness/esbuild.harness.mjs without Node globals.
    files: ["**/*.mjs", "**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-undef": "error",
      semi: ["error", "always"],
    },
  },
  {
    // The product site (website/) is plain browser JavaScript served straight to
    // GitHub Pages: no bundler, no Node globals.
    files: ["website/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      sourceType: "script",
    },
  },
  {
    // Test files are deliberately NOT ignored here: they are part of the
    // codebase and drift just as easily as src/.
    ignores: [
      "build/**",
      "dist/**",
      "node_modules/**",
      "coverage/**",
      // Generated bundle: 3 MB of other people's code.
      "harness/dist/**",
      "EXAMPLE_VAULT/**",
      // Nested git worktrees hold a full copy of the repo (plus a vendored
      // hot-reload plugin), which otherwise drowns real findings in noise.
      ".claude/**",
    ],
  },
];
