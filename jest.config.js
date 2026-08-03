/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  // Add paths to ignore during testing if needed
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.claude/worktrees/"],
  // testPathIgnorePatterns only skips *test* discovery — haste-map still crawls
  // everything else for modules/mocks, so nested git worktrees (e.g. under
  // .claude/worktrees/) cause "duplicate manual mock" collisions unless
  // excluded here too.
  modulePathIgnorePatterns: ["/.claude/worktrees/"],
  // Coverage is opt-in (`npm run test:coverage`): collecting it on every local
  // run roughly doubles the suite time for a number nobody reads mid-change.
  collectCoverage: false,
  // `.tsx` matters here — App, every view/component, and the whole
  // `heatmap.context.tsx` data pipeline live in .tsx files and were previously
  // absent from the report entirely.
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/__mocks__/**",
    "!src/localization/**",
  ],
  coverageDirectory: "coverage",
  moduleDirectories: ["./node_modules", "./src"],
  rootDir: ".",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
};
