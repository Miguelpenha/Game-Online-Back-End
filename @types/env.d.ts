declare global {
    namespace NodeJS {
      interface ProcessEnv {
        TZ: string
        PORT: number
        DOMAIN: string
        URLS_AUTHORIZED: string
      }
    }
}

export {}