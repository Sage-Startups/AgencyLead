import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // The dashboard pages use the standard "fetch on mount" pattern:
      // a useCallback that sets loading/data state, invoked from useEffect.
      // React 19's lint rules flag the synchronous setState inside that
      // effect. The pattern is intentional and working, so this is surfaced
      // as a warning rather than blocking a build. Migrating these screens to
      // a data-fetching library (SWR / React Query) would remove it properly.
      'react-hooks/set-state-in-effect': 'warn',

      // CSV export links point at /api/leads/export, an API route that streams
      // a file download. This rule assumes such hrefs are page routes and wants
      // <Link>, but client-side navigation cannot trigger a download, so a
      // plain <a> is correct here.
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
]

export default eslintConfig
