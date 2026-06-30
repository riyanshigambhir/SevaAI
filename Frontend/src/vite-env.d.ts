/// <reference types="vite/client" />

// This file tells TypeScript what environment variables exist on
// import.meta.env. Without this, every `import.meta.env.VITE_X` access
// errors with "Property 'env' does not exist on type 'ImportMeta'".
//
// Vite normally generates a default version of this automatically when
// scaffolded with `npm create vite`, but since this project was hand-built
// (and partly via Figma Make export), it was missing — that's the root
// cause of all the import.meta.env errors in supabase.ts, api.ts, etc.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
