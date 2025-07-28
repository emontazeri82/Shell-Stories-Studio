import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginSecurity from "eslint-plugin-security";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js, security: pluginSecurity },
    languageOptions: { globals: globals.browser },
    rules: {
      ...pluginSecurity.configs.recommended.rules, // ✅ adds security rules
    },
    extends: ["plugin:security/recommended", "js/recommended"],
  },
  pluginReact.configs.flat.recommended,
]);
