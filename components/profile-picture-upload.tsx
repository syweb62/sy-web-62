"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Camera, Upload, X, Check, User, Lock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { IconButton } from "@/components/ui/icon-button"
import { supabase } from "@/lib/supabase"

interface ProfilePictureUploadProps {
  currentImage?: string | null
  onImageUpdate: (imageUrl: string) => void
  className?: string
  isEditable?: boolean
}

export function ProfilePictureUpload({
  currentImage,
  onImageUpdate,
  className = "",
  isEditable = true,
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, or GIF)")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB")
      return
    }

    setIsUploading(true)
    setImageError(false)

    try {
      // Create preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setPreviewImage(imageUrl)
      }
      reader.readAsDataURL(file)

      // For now, we'll use the data URL as the image source
      // In a real implementation, you would upload to Supabase Storage
      const reader2 = new FileReader()
      reader2.onload = async (e) => {
        const imageUrl = e.target?.result as string
        
        // Simulate upload delay
        setTimeout(() => {
          try {
            onImageUpdate(imageUrl)
            setIsUploading(false)
            setUploadSuccess(true)

            // Hide success message after 2 seconds
            setTimeout(() => setUploadSuccess(false), 2000)
          } catch (error) {
            console.error("Failed to update image:", error)
            setIsUploading(false)
            alert("Failed to update image. Please try again.")
          }
        }, 500)
      }
      reader2.readAsDataURL(file)

    } catch (error) {
      console.error("Upload error:", error)
      setIsUploading(false)
      setImageError(true)
      alert("Failed to upload image. Please try again.")
    }
  }

  useEffect(() => {
    if (currentImage !== previewImage) {
      setPreviewImage(currentImage)
      setImageError(false)
    }
  }, [currentImage])

  const handleRemoveImage = () => {
    if (!isEditable) return
    
    setPreviewImage(null)
    setImageError(false)
    onImageUpdate("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    if (!isEditable) return
    fileInputRef.current?.click()
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const renderProfileImage = () => {
    if (imageError || !previewImage) {
      return (
        <div className="w-full h-full rounded-full bg-gray-800 border-4 border-gray-600 flex items-center justify-center">
          <User size={48} className="text-gray-400" />
        </div>
      )
    }

    return (
      <div className="w-full h-full rounded-full border-4 border-gray-600 overflow-hidden bg-gray-800">
        <Image
          src={previewImage || "/placeholder.svg"}
          alt="Profile Picture"
          width={128}
          height={128}
          className="w-full h-full object-cover"
          onError={handleImageError}
          priority
        />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Circular container with fixed dimensions */}
      <div className="relative w-32 h-32 mx-auto group">
        {/* Main circular frame */}
        <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-600 overflow-hidden relative">
          {renderProfileImage()}

          {/* Upload overlay - only show when editable */}
          {isEditable ? (
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer">
              <Button
                variant="ghost"
                size="icon"
                onClick={triggerFileInput}
                disabled={isUploading}
                loading={isUploading}
                className="text-white hover:text-gold hover:bg-transparent"
              >
                <Camera size={24} />
              </Button>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
              <div className="bg-gray-800/90 rounded-full p-2 border border-gray-600">
                <Lock size={20} className="text-gray-400" />
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
              <div className="text-center">
                <Upload className="animate-spin mx-auto mb-1" size={20} color="white" />
                <div className="text-xs text-white font-medium">Uploading...</div>
              </div>
            </div>
          )}
        </div>

        {/* Success indicator - positioned outside the circular frame */}
        {uploadSuccess && (
          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1.5 animate-pulse shadow-lg border-2 border-gray-800">
            <Check size={14} className="text-white" />
          </div>
        )}

        {/* Remove button - positioned outside the circular frame - only when editable */}
        {previewImage && !isUploading && !imageError && isEditable && (
          <IconButton
            icon={<X size={14} />}
            variant="destructive"
            size="icon-sm"
            onClick={handleRemoveImage}
            label="Remove profile picture"
            className="absolute -top-1 -left-1 shadow-lg border-2 border-gray-800"
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!isEditable}
      />

      {/* Upload button - only show when editable */}
      {isEditable && (
        <div className="text-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={isUploading}
            loading={isUploading}
            loadingText="Uploading..."
            leftIcon={<Camera size={16} />}
            className="border-gray-600 hover:border-gold hover:text-gold bg-transparent"
          >
            {previewImage && !imageError ? "Change Photo" : "Upload Photo"}
          </Button>
        </div>
      )}

      {/* Locked state message */}
      {!isEditable && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <Lock size={14} />
            Click "Edit Profile" to change photo
          </p>
        </div>
      )}

      {/* Upload status */}
      {isUploading && <p className="text-center text-sm text-gray-400 mt-2 animate-pulse">Processing your image...</p>}

      {uploadSuccess && (
        <p className="text-center text-sm text-green-400 mt-2">✅ Profile picture updated successfully!</p>
      )}

      {imageError && (
        <p className="text-center text-sm text-red-400 mt-2">⚠️ Failed to load image. Please try uploading again.</p>
      )}
    </div>
  )
}
