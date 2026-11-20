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
const NO_MOCK_IMPORTS = {
  group: ["@/mocks/*"],
  message:
    "Read data through an endpoint (src/features/<feature>/api) and its hook, never from src/mocks directly.",
};
const SHARED_LAYERS = [
  "src/components/**",
  "src/hooks/**",
  "src/lib/**",
  "src/types/**",
  "src/i18n/**",
  "src/config/**",
];
/**
 * Where bundled mock data may be read: endpoint modules, and the mocks themselves.
 *
 * LEGACY_MOCK_READERS still shape mock data synchronously instead of going
 * through an endpoint. Do not add to this list — move each file's reads behind
 * an endpoint and delete its entry (tracked in docs/architecture.md).
 */
const LEGACY_MOCK_READERS = [
  "src/features/calendar/lib/mock-market-feed.ts",
  "src/features/catalog/fixed-income/lib/fixed-income-data.ts",
  "src/features/catalog/global-bond/lib/global-bond-data.ts",
  "src/features/catalog/mutual-fund/lib/mutual-fund-data.ts",
  "src/features/catalog/robo-advisory/lib/investment-solution-data.ts",
  "src/features/catalog/structured-product/lib/structured-product-data.ts",
  "src/features/catalog/top-idea/lib/top-idea-data.ts",
  "src/features/client-hub/lib/client-hub-data.ts",
  "src/features/client-profile/lib/client-detail-data.ts",
  "src/features/command-center/lib/call-log-feed.ts",
  "src/features/command-center/lib/dashboard-data.ts",
  "src/features/insights/lib/research-data.ts",
  "src/features/orders/lib/order-book.ts",
  "src/features/orders/lib/order-requirements.ts",
  "src/features/shell/lib/page-breadcrumbs.ts",
];
const MOCK_READERS = ["src/mocks/**", "src/features/*/api/**", ...LEGACY_MOCK_READERS];

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
      "no-restricted-imports": [
        "error",
        { patterns: [NO_PARENT_IMPORTS, NO_ROUTE_IMPORTS, NO_MOCK_IMPORTS] },
      ],
    },
  },
  {
    files: SHARED_LAYERS,
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [NO_PARENT_IMPORTS, NO_ROUTE_IMPORTS, NO_FEATURE_IMPORTS, NO_MOCK_IMPORTS] },
      ],
    },
  },
  {
    files: MOCK_READERS,
    rules: {
      "no-restricted-imports": ["error", { patterns: [NO_PARENT_IMPORTS, NO_ROUTE_IMPORTS] }],
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
