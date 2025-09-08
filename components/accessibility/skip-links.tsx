"use client"

export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-4 left-4 bg-black text-gold px-4 py-2 rounded z-50 focus:not-sr-only border border-gold"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="absolute top-4 left-32 bg-black text-gold px-4 py-2 rounded z-50 focus:not-sr-only border border-gold"
      >
        Skip to navigation
      </a>
      <a
        href="#footer"
        className="absolute top-4 left-60 bg-black text-gold px-4 py-2 rounded z-50 focus:not-sr-only border border-gold"
      >
        Skip to footer
      </a>
    </div>
  )
}
