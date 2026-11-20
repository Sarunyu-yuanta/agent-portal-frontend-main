import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Shared layers must never reach up into routes. */
const NO_ROUTE_IMPORTS = {
  group: ["@/app/*", "**/app/\\[lang\\]/*"],
  message:
    "Shared code must not import from route folders. Move the code into src/features or a shared layer.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Names prefixed with `_` mark intentionally-unused parameters.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    files: ["src/**"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["src/components/**", "src/hooks/**", "src/lib/**", "src/types/**", "src/i18n/**"],
    rules: {
      "no-restricted-imports": ["warn", { patterns: [NO_ROUTE_IMPORTS] }],
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Static assets only — no project source lives here.
    "public/**",
  ]),
]);

export default eslintConfig;
