import { config as baseConfig } from "@repo/eslint-config/base";

export default [
  ...baseConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        fetch: "readonly",
        process: "readonly",
        URL: "readonly",
        AbortSignal: "readonly",
      },
    },
  },
];
