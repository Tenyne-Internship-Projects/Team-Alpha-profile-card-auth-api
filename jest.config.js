// Log to confirm this config file is loaded when Jest runs
console.log("jest.config.js loaded");

module.exports = {
  // Match test files inside the `tests` directory with `.test.js` extension
  testMatch: ["**/tests/**/*.test.js"],

  // Ignore these paths during testing
  testPathIgnorePatterns: ["/node_modules/"],

  // Enable coverage collection
  collectCoverage: true,

  // Where to output coverage reports
  coverageDirectory: "coverage",

  // Types of coverage reports to generate
  coverageReporters: ["text", "lcov"],

  //Clear mock calls and instances between every test
  clearMocks: true,

  //Display individual test results with the test suite hierarchy
  verbose: true,

  //  Use Node environment (important for backend testing)
  testEnvironment: "node",
};
