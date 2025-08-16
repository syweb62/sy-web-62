export default function RootLoading() {
  // Full-screen route-level loader; shown by Next.js App Router
  // during route transitions and segment-level data fetching.
  return (
    <main className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4 text-white">
        <div className="relative animate-pulse" style={{ width: 160, height: 160 }}>
          <img
            className="w-full h-full object-contain rounded-lg shadow-2xl"
            src="/images/sushiyaki-logo.png"
            alt="Sushi Yaki Logo"
            style={{
              filter: "brightness(1.1) contrast(1.05)",
            }}
          />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-gold/10 to-transparent animate-pulse"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-[#30c8d6] tracking-wide">Loading...</p>
          <p className="text-xs text-gray-400 opacity-75">Preparing your experience</p>
        </div>
        <span className="sr-only">Loading Sushi Yaki Restaurant</span>
      </div>
    </main>
  )
}
