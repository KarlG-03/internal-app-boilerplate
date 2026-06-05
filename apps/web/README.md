# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Vercel Web Analytics

Production page views are tracked with [`@vercel/analytics`](https://vercel.com/docs/analytics) (see `VercelAnalytics` in the app shell). No env var is required on Vercel.

1. Deploy the web project to Vercel (`loancompass-web`).
2. In the [Vercel dashboard](https://vercel.com/karlg03s-projects/loancompass-web/analytics) → **Analytics** → enable **Web Analytics** for the project.
3. Redeploy if you enabled analytics after the package was added.

SPA route changes are tracked via React Router (`route` + `path` on the Analytics component).

## Google Analytics 4 (GA4, optional)

GA4 loads only when `VITE_GA_MEASUREMENT_ID` is set at build time (in addition to Vercel Analytics).

### Setup

1. Go to [Google Analytics](https://analytics.google.com/) → Admin → Create Property
2. Set up a **Web** data stream for your domain
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)
4. Add it as an environment variable:
   - **Local dev**: create `apps/web/.env.local` with `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX`
   - **Vercel (production)**: add `VITE_GA_MEASUREMENT_ID` on the `loancompass-web` project, then redeploy
5. Rebuild/redeploy — GA4 will start collecting page views automatically

> If the env var is not set or doesn't start with `G-`, the GA4 script won't load (no errors, no tracking).

---

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
