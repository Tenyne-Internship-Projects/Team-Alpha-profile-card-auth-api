//@ Log to confirm this config file is loaded when Jest runs
console.log("jest.config.js loaded");

module.exports = {
  //@ Tell Jest where to find test files (any `.test.js` inside the tests folder)
  testMatch: ["**/tests/**/*.test.js"],

  //@ Ignore node_modules folder during testing
  testPathIgnorePatterns: ["/node_modules/"],

  //@ Show detailed test results in the terminal
  verbose: true,
};
