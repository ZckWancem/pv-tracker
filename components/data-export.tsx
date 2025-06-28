"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // Import Card components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface DataExportProps {
  profileId: number | null
}

export function DataExport({ profileId }: DataExportProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async (format: "csv" | "xlsx") => {
    if (!profileId) {
      toast({
        title: "Error",
        description: "Please select a profile first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/panels/export?profileId=${profileId}&format=${format}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to export data")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `panels_profile_${profileId}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `Data exported to ${format.toUpperCase()} successfully.`,
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data
        </CardTitle>
        <CardDescription>Export tabular panel data to CSV or Excel format.</CardDescription>
      </CardHeader>
      <CardContent>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline" 
              className="bg-white-500 hover:bg-gray-100 text-black-500" 
              disabled={!profileId || isLoading}
            >
              Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport("csv")} disabled={isLoading}>
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("xlsx")} disabled={isLoading}>
              XLSX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}