/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do Worker proxy de placares ao vivo. Vazio = recurso desligado. */
  readonly VITE_LIVE_SCORES_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
