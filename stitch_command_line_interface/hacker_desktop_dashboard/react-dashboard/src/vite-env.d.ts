/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_ENABLE_MOCK: string;
  readonly VITE_LLM_PROVIDER: 'openai' | 'anthropic';
  readonly VITE_LLM_API_KEY: string;
  readonly VITE_LLM_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
