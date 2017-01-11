module.exports = {
  env: {
    browser: true,
    es6: false,
  },
  globals: {
    angular: false,
    _: false,
    moment: false,
    it: false,
    expect: false,
    beforeEach: false
  },

  extends: "airbnb-base/legacy",
  plugins: ['angular'],

  rules: {
    "indent": ['error', 2],
    "func-names": ['off', 'never'],
    "max-len": [1, 150, 2, { ignoreComments: true }],
    "linebreak-style": ['off'],
    "quotes": ['error', 'single', { avoidEscape: false, allowTemplateLiterals: true }],
    "semi": ['error', 'always'],
    "no-var": 'off', // We don't use ES6
    "vars-on-top": 'off',
    "no-param-reassign": ['error', { props: false }],
    "no-use-before-define": 'off'
  },
};
