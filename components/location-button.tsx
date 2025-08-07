"use client"

import { useState } from "react"
import { MapPin, Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLocation, type LocationData } from "@/hooks/use-location"

interface LocationButtonProps {
  onLocationUpdate?: (location: LocationData) => void
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  showAddress?: boolean
}

export function LocationButton({
  onLocationUpdate,
  className = "",
  variant = "outline",
  size = "default",
  showAddress = true,
}: LocationButtonProps) {
  const { location, isLoading, error, getCurrentLocation, clearError, isSupported } = useLocation()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleGetLocation = async () => {
    try {
      clearError()
      setShowSuccess(false)

      const locationData = await getCurrentLocation()

      // Show success message briefly
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Call the callback if provided
      if (onLocationUpdate) {
        onLocationUpdate(locationData)
      }
    } catch (err) {
      // Error is already handled by the hook
      console.error("Location error:", err)
    }
  }

  const getLocationButtonText = () => {
    if (isLoading) return "Getting location..."
    if (location) return "Update location"
    return "Get my location"
  }

  const getLocationIcon = () => {
    if (isLoading) return <Loader2 className="animate-spin" size={16} />
    if (showSuccess) return <CheckCircle size={16} />
    return <MapPin size={16} />
  }

  if (!isSupported) {
    return (
      <Alert className="border-red-500/50 bg-red-500/10">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-400">
          <div className="font-medium">Location services not supported</div>
          <div className="mt-1 text-sm">
            Your browser doesn't support location services. Please use a modern browser like Chrome, Firefox, or Safari.
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGetLocation}
        disabled={isLoading}
        loading={isLoading}
        loadingText="Getting location..."
        variant={variant}
        size={size}
        leftIcon={!isLoading && !showSuccess ? <MapPin size={16} /> : undefined}
        className={`${className} ${showSuccess ? "border-green-500 text-green-400" : ""}`}
      >
        {getLocationButtonText()}
      </Button>

      {/* Success Message */}
      {showSuccess && location && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400">
            <div className="font-medium">Location updated successfully!</div>
            {showAddress && location.address && <div className="mt-1 text-sm text-gray-300">📍 {location.address}</div>}
            <div className="mt-1 text-xs text-gray-400">
              Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">
            <div className="font-medium">{error.userMessage}</div>
            {error.actionRequired && <div className="mt-1 text-sm text-gray-300">{error.actionRequired}</div>}
            <div className="flex gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGetLocation}
                leftIcon={<RefreshCw size={14} />}
                className="text-red-400 hover:text-red-300"
              >
                Try Again
              </Button>
              <Button variant="ghost" size="sm" onClick={clearError} className="text-red-400 hover:text-red-300">
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Location Display */}
      {location && !error && !showSuccess && (
        <div className="text-sm text-gray-400 p-3 bg-black/20 rounded border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-gold" />
            <span className="font-medium">Current location:</span>
          </div>
          {showAddress && location.address && <div className="text-gray-300 mb-1">📍 {location.address}</div>}
          <div className="text-xs text-gray-500">
            Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} • Accuracy: ±
            {Math.round(location.accuracy)}m
          </div>
        </div>
      )}
    </div>
  )
}
