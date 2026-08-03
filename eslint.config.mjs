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
    files: ["*.mjs", "*.js"],
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
    // Test files are deliberately NOT ignored here: they are part of the
    // codebase and drift just as easily as src/.
    ignores: [
      "build/**",
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "EXAMPLE_VAULT/**",
      // Nested git worktrees hold a full copy of the repo (plus a vendored
      // hot-reload plugin), which otherwise drowns real findings in noise.
      ".claude/**",
    ],
  },
];
