module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    // --- 这里是关键的修改点 ---
    "ecmaVersion": 2021, // 将 2018 修改为 2021
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    // 建议添加以下规则，可以避免一些不必要的部署错误
    "max-len": "off",
    "require-jsdoc": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
