module.exports = {
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "script"
  },
  "extends": "airbnb-base",
  "rules": {
    "arrow-body-style": [0, "never"],
    "comma-dangle": ["error", {
      "arrays": "never",
      "objects": "never",
      "imports": "ignore",
      "exports": "ignore",
      "functions": "ignore",
    }],
    "global-require": 1,
    "import/no-unresolved": 0,
    "import/no-dynamic-require": 1,
    "import/no-extraneous-dependencies": 0,
    "import/newline-after-import": 0,
    "max-len": [1, 120, 2, {ignoreComments: true}],
    "newline-per-chained-call": 0,
    "no-cond-assign": [2, 'except-parens'],
    "no-unused-vars": [1, {'vars': 'local', 'args': 'none'}],
    "no-else-return": 0,
    "no-use-before-define": 0,
    "no-useless-escape": 0,
    "no-plusplus": 0,
    "no-confusing-arrow": [2, {'allowParens': true}],
    "no-irregular-whitespace": 0,
    "no-param-reassign": [2, { "props": false }],
    "no-restricted-syntax": [1, "ForInStatement", "ForOfStatement"],
    "prefer-const": 0,
    "quote-props": [1, 'consistent-as-needed'],
    "quotes": [2, 'single'],
    "require-yield": 0,
    "strict": [2, 'global']
  }
};