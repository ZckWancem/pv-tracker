"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, Image as ImageIcon, AlertCircle, Trash2, Replace } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Button } from "./ui/button"

interface ImageUploadProps {
  profileId: number
  onUploadComplete: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSIONS = 2000
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']

export function ImageUpload({ profileId, onUploadComplete }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(img.src)
        resolve(img.width <= MAX_DIMENSIONS && img.height <= MAX_DIMENSIONS)
      }
      img.onerror = () => resolve(false)
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      setError("Unsupported file format. Please use JPG, PNG, GIF, or SVG files.")
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 5MB limit.")
      return
    }

    // Validate image dimensions
    const validDimensions = await validateImageDimensions(file)
    if (!validDimensions) {
      setError("Image dimensions must not exceed 2000x2000 pixels.")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('image', file)
      formData.append('profileId', profileId.toString())

      // Upload image
      const response = await fetch('/api/profiles/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload image')
      }

      const data = await response.json()
      setPreview(data.imageUrl)
      setUploadProgress(100)

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })

      onUploadComplete()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload image")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleRemove = async () => {
    try {
      const response = await fetch(`/api/profiles/upload-image?profileId=${profileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove image')
      }

      setPreview(null)
      toast({
        title: "Success",
        description: "Image removed successfully",
      })

      onUploadComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove image",
        variant: "destructive",
      })
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Upload Image
        </CardTitle>
        <CardDescription>
          Upload a profile image (JPG, PNG, GIF, SVG). Max size: 5MB, dimensions: 2000x2000px
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {preview ? (
            <div className="relative aspect-square w-full max-w-[300px] mx-auto">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                >
                  <Replace className="h-4 w-4 mr-1" />
                  Replace
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isUploading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 dark:border-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    JPG, PNG, GIF or SVG (max. 5MB)
                  </p>
                </div>
              </label>
            </div>
          )}

          <input
            ref={fileInputRef}
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/svg+xml"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}