import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * Dependency direction (see docs/architecture.md):
 *   app (routes) → features → components / hooks / lib / config / types / i18n
 * Nothing imports a route file, and shared layers never import a feature.
 */
const NO_PARENT_IMPORTS = {
  group: ["../*"],
  message: "Use the @/ alias instead of climbing out of the folder.",
};
const NO_ROUTE_IMPORTS = {
  group: ["@/app/*", "!@/app/*.css"],
  message: "Route folders hold route files only. Import from src/features instead.",
};
const NO_FEATURE_IMPORTS = {
  group: ["@/features/*"],
  message: "Shared layers must not depend on a feature. Move the shared piece down a layer.",
};
const SHARED_LAYERS = [
  "src/components/**",
  "src/hooks/**",
  "src/lib/**",
  "src/types/**",
  "src/i18n/**",
  "src/config/**",
];

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
      "no-restricted-imports": ["error", { patterns: [NO_PARENT_IMPORTS, NO_ROUTE_IMPORTS] }],
    },
  },
  {
    files: SHARED_LAYERS,
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [NO_PARENT_IMPORTS, NO_ROUTE_IMPORTS, NO_FEATURE_IMPORTS] },
      ],
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
