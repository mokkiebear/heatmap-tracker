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
  // Configure code coverage
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
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
