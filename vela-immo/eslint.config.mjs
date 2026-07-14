import eslint from "@eslint/js";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.turbo/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.next/**",
      "**/.open-next/**",
      "**/.wrangler/**",
      "**/*.ts",
    ],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
];
