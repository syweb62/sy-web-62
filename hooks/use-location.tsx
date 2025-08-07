"use client"

import { useState, useCallback } from "react"

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  address?: string
}

export interface LocationError {
  code: number
  message: string
  userMessage: string
  actionRequired?: string
}

interface UseLocationReturn {
  location: LocationData | null
  isLoading: boolean
  error: LocationError | null
  getCurrentLocation: () => Promise<LocationData>
  clearError: () => void
  isSupported: boolean
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<LocationError | null>(null)

  // Check if geolocation is supported
  const isSupported = typeof window !== "undefined" && "geolocation" in navigator

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getCurrentLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        const locationError: LocationError = {
          code: 0,
          message: "Geolocation is not supported by this browser",
          userMessage: "Your browser doesn't support location services",
          actionRequired: "Please use a modern browser that supports location services",
        }
        setError(locationError)
        reject(locationError)
        return
      }

      setIsLoading(true)
      setError(null)

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds
        maximumAge: 300000, // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }

            // Try to get address using reverse geocoding (simulated)
            try {
              const address = await reverseGeocode(locationData.latitude, locationData.longitude)
              locationData.address = address
            } catch (geocodeError) {
              console.warn("Failed to get address:", geocodeError)
              // Continue without address - this is not a critical error
            }

            setLocation(locationData)
            setIsLoading(false)
            resolve(locationData)
          } catch (err) {
            const locationError: LocationError = {
              code: 999,
              message: "Failed to process location data",
              userMessage: "Unable to process your location",
              actionRequired: "Please try again",
            }
            setError(locationError)
            setIsLoading(false)
            reject(locationError)
          }
        },
        (positionError) => {
          let locationError: LocationError

          switch (positionError.code) {
            case positionError.PERMISSION_DENIED:
              locationError = {
                code: positionError.PERMISSION_DENIED,
                message: "User denied the request for Geolocation",
                userMessage: "Location access was denied",
                actionRequired: "Please enable location permissions in your browser settings and try again",
              }
              break
            case positionError.POSITION_UNAVAILABLE:
              locationError = {
                code: positionError.POSITION_UNAVAILABLE,
                message: "Location information is unavailable",
                userMessage: "Your location is currently unavailable",
                actionRequired: "Please check your internet connection and GPS settings, then try again",
              }
              break
            case positionError.TIMEOUT:
              locationError = {
                code: positionError.TIMEOUT,
                message: "The request to get user location timed out",
                userMessage: "Location request timed out",
                actionRequired: "Please ensure GPS is enabled and try again",
              }
              break
            default:
              locationError = {
                code: 999,
                message: "An unknown error occurred while retrieving location",
                userMessage: "Unable to get your location",
                actionRequired: "Please try again or contact support if the problem persists",
              }
              break
          }

          setError(locationError)
          setIsLoading(false)
          reject(locationError)
        },
        options,
      )
    })
  }, [isSupported])

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    clearError,
    isSupported,
  }
}

// Simulated reverse geocoding function
async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Generate a more realistic address based on coordinates
  const areas = [
    "Downtown District",
    "Midtown Area",
    "Uptown Quarter",
    "Riverside District",
    "Hillside Neighborhood",
    "Central Business District",
    "Old Town",
    "New City Center",
  ]

  const streets = [
    "Main Street",
    "Oak Avenue",
    "Pine Road",
    "Elm Street",
    "Maple Drive",
    "Cedar Lane",
    "Park Boulevard",
    "First Avenue",
  ]

  const area = areas[Math.floor(Math.random() * areas.length)]
  const street = streets[Math.floor(Math.random() * streets.length)]
  const number = Math.floor(Math.random() * 9999) + 1

  return `${number} ${street}, ${area}`
}
