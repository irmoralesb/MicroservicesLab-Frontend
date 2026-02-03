/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_IDENTITY_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
