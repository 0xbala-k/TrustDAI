/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_ENDPOINT: string;
    readonly VITE_CONTRACT_ADDRESS: string;
    readonly VITE_CHAIN_NAME: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }