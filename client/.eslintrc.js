module.exports = {
  env: {
    browser: true,
    jasmine: true,
    es6: true,
  },
  globals: {
    angular: false,
    _: false,
    moment: false,
    it: false,
    expect: false,
    beforeEach: false,
    inject: false,
    Promise: true
  },

  extends: ["airbnb-base/legacy", "plugin:jasmine/recommended"],
  plugins: ['jasmine', 'angular'],

  rules: {
    "indent": ['error', 2],
    "func-names": ['off', 'never'],
    "comma-dangle": ["error", {
      "arrays": "never",
      "objects": "never",
      "imports": "ignore",
      "exports": "ignore",
      "functions": "ignore",
    }],
    "max-len": [1, 150, 2, { ignoreComments: true }],
    "linebreak-style": ['off'],
    "quotes": ['error', 'single', { avoidEscape: false, allowTemplateLiterals: true }],
    "semi": ['error', 'always'],
    "no-var": 'off', // We don't use ES6
    "vars-on-top": 'off',
    "no-plusplus": 'off',
    "no-param-reassign": ['off', { props: false }],
    "no-use-before-define": 'off',
    "no-warning-comments": 'off'
  },
};
