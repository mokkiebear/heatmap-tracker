/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  // Add paths to ignore during testing if needed
  testPathIgnorePatterns: ["/node_modules/", "/.claude/worktrees/"],
  // testPathIgnorePatterns only skips *test* discovery — haste-map still crawls
  // everything else for modules/mocks, so nested git worktrees (e.g. under
  // .claude/worktrees/) cause "duplicate manual mock" collisions unless
  // excluded here too.
  modulePathIgnorePatterns: ["/.claude/worktrees/"],
  // Coverage is opt-in (`npm run test:coverage`).
  // `.tsx` matters here — App, every view/component, and the whole
  // `heatmap.context.tsx` data pipeline live in .tsx files and were previously
  // absent from the report entirely.
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/__mocks__/**",
    "!src/localization/**",
    "!src/test-utils/**",
  ],
  coverageDirectory: "coverage",
  // A ratchet, not a target: set a couple of points under the level the suite
  // reached so ordinary refactors don't trip it, but deleting tests to make a
  // change pass does. Raise these when coverage rises; don't lower them.
  coverageThreshold: {
    global: {
      statements: 72,
      branches: 66,
      functions: 68,
      lines: 73,
    },
  },
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
};
