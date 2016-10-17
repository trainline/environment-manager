module.exports = {
  env: {
    browser: true,
    es6: false,
  },
  globals: {
    angular: false
  },

  extends: "airbnb-base/legacy",
  plugins: ['angular'],

  rules: {
    "angular/di": ['error', 'array'],
    "indent": ['error', 2],
    "linebreak-style": ['off'],
    "quotes": ['error', 'double', { avoidEscape: false, allowTemplateLiterals: true }],
    "semi": ['error', 'always'],
    "no-var": 'off', // We don't use ES6
    "no-param-reassign": ['error', { props: false }],

  },
};
