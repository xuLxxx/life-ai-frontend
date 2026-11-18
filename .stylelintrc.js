module.exports = {
  extends: require.resolve('@umijs/max/stylelint'),
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'layer',
          'config',
          'variants',
          'screen',
          'source',
          'theme',
          'utility',
          'custom-variant',
          'plugin',
        ],
      },
    ],
    'selector-class-pattern': [
      '^(?:[a-z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*|ProseMirror)$',
      {
        resolveNestedSelectors: true,
      },
    ],
  },
};
