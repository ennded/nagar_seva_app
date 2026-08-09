/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URL: string;
  readonly VITE_MEDIA_URL: string;
  readonly VITE_CORE_REST_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
