export default function RootLoading() {
  // Full-screen route-level loader; shown by Next.js App Router
  // during route transitions and segment-level data fetching.
  return (
    <main className="min-h-screen w-full bg-black flex items-center justify-center">
      {/* Reuse the shared spinner */}
      {/* Note: import is not needed in this file since Next.js inlines components; 
          we render the component via dynamic import pattern below. */}
      {/* We’ll keep this simple and inline to avoid bundling issues */}
      <div className="flex flex-col items-center justify-center gap-3 text-white">
        <div className="relative" style={{ width: 128, height: 128 }}>
          <video
            className="w-full h-full rounded-full object-contain"
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sushi-7EnDgi4AZlDTFOrpwt6HOp3oC83HAn.webm"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
        <p className="text-sm text-gray-300">Loading...</p>
        <span className="sr-only">Loading</span>
      </div>
    </main>
  )
}
