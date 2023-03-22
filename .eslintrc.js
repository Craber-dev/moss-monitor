module.exports = {
  'env': {
    'browser': true,
    'es2021': true
  },
  'extends': [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  'overrides': [
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module'
  },
  'plugins': [
    '@typescript-eslint',
    'prettier'
  ],
  'rules': {
    'strict': 2,
    'indent': [
      'error',
      2
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'warn',
      'always'
    ],
    'no-duplicate-case': 2,
    'no-func-assign': 2,
    'no-unreachable': 1,
    'block-scoped-var': 2,
    'default-case': 1,
    'no-empty-function': 2,
    'no-multi-spaces': 1,
    'no-param-reassign': 2,
    '@typescript-eslint/ban-ts-comment': 0,
    "react/react-in-jsx-scope": "off",
    "react/jsx-uses-react": "off"
  }
};
