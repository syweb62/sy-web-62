import Image from "next/image"

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-darkBg flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-4">
          <Image
            src="/images/logo.png"
            alt="Sushi Yaki"
            width={200}
            height={120}
            className="h-auto w-auto max-w-[200px] animate-pulse"
          />
        </div>
        <div className="text-[#30c8d6] text-lg">Loading...</div>
      </div>
    </div>
  )
}
