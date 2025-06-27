"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { parseCSV, parseExcel } from "@/lib/file-parser"

interface FileUploadProps {
  profileId: number
  onUploadComplete: () => void
}

export function FileUpload({ profileId, onUploadComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Parse file based on type
      let parsedData
      if (file.name.endsWith(".csv")) {
        parsedData = await parseCSV(file)
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        parsedData = await parseExcel(file)
      } else {
        throw new Error("Unsupported file format. Please use CSV or Excel files.")
      }

      if (parsedData.length === 0) {
        throw new Error("No valid data found in file")
      }

      setUploadProgress(50)

      // Upload to server
      const response = await fetch("/api/panels/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          panels: parsedData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const result = await response.json()
      setUploadProgress(100)

      toast({
        title: "Upload Successful",
        description: `${result.count} panels uploaded successfully`,
      })

      onUploadComplete()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed")
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // Reset file input
      event.target.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Packing List
        </CardTitle>
        <CardDescription>Upload a CSV or Excel file containing pallet numbers and serial codes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 dark:border-gray-600"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileText className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">CSV or Excel files only</p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

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

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-2">Expected file format:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Column 1: pallet_no (or &quot;Pallet No&quot;)</li>
            <li>Column 2: serial_code (or &quot;Serial Code&quot;)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
