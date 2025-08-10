declare global {
  interface Window {
    __PUBLIC_ENV?: {
      NEXT_PUBLIC_SUPABASE_URL?: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
    }
  }
}
export {}
