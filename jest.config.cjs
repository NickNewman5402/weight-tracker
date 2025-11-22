module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  modulePathIgnorePatterns: ["<rootDir>/frontend/"],
  // Jest ignores node_modules by default; this is just to be explicit
  coveragePathIgnorePatterns: ["<rootDir>/frontend/", "/node_modules/"],
};
