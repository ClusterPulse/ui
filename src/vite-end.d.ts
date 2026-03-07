/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_BACKEND_URL: string
  readonly VITE_ENVIRONMENT: string
  readonly VITE_ENABLE_DEVTOOLS: string
  readonly VITE_APP_VERSION: string
  readonly VITE_GIT_COMMIT: string
  readonly VITE_GIT_TREE_STATE: string
  readonly VITE_BUILD_DATE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
