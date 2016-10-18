module.exports = {
  'parserOptions': {
    'ecmaVersion': 6,
    'sourceType': 'script'
  },
  "extends": "airbnb-base",
  'rules': {
    'max-len': [1, 120, 2, {ignoreComments: true}],
    'quote-props': [1, 'consistent-as-needed'],
    'no-cond-assign': [2, 'except-parens'],
    'no-unused-vars': [1, {'vars': 'local', 'args': 'none'}],
    'no-else-return': 0,
    'quotes': [2, 'single'],
    'import/no-unresolved': 0,
    'strict': [2, 'global'],
    'prefer-const': 0,
    'global-require': 1,
    "import/no-extraneous-dependencies": 0,
    "import/newline-after-import": 0,
    "no-use-before-define": 0,
    "no-useless-escape": 0,
    "newline-per-chained-call": 0,
    "no-plusplus": 0
  }
};