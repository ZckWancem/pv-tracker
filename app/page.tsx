"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSelector } from "@/components/profile-selector"
import { FileUpload } from "@/components/file-upload"
import { Scanner } from "@/components/scanner"
import { DashboardStats } from "@/components/dashboard-stats"
import { SectionGrid } from "@/components/section-grid"
import { PanelsTable } from "@/components/panels-table"
import { NFCTestTool } from "@/components/nfc-test-tool"
import { useToast } from "@/hooks/use-toast"
import type { Profile, Panel } from "@/lib/db"

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null)
  const [panels, setPanels] = useState<Panel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadProfiles = useCallback(async () => {
    try {
      const response = await fetch("/api/profiles")
      if (!response.ok) throw new Error("Failed to load profiles")
      const data = await response.json()
      setProfiles(data)

      // Select first profile by default
      if (data.length > 0 && !selectedProfileId) {
        setSelectedProfileId(data[0].id)
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      })
    }
  }, [selectedProfileId, toast])

  const loadPanels = useCallback(async () => {
    if (!selectedProfileId) return

    try {
      const response = await fetch(`/api/panels?profileId=${selectedProfileId}`)
      if (!response.ok) throw new Error("Failed to load panels")
      const data = await response.json()
      setPanels(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load panels",
        variant: "destructive",
      })
    }
  }, [selectedProfileId, toast])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await loadProfiles()
      setIsLoading(false)
    }
    loadData()
  }, [loadProfiles])

  useEffect(() => {
    if (selectedProfileId) {
      loadPanels()
    }
  }, [selectedProfileId, loadPanels])

  const handleDataUpdate = () => {
    loadPanels()
  }

  const totalPanels = panels.length
  const scannedPanels = panels.filter((p) => p.scanned_at).length
  const sections = [...new Set(panels.filter((p) => p.section).map((p) => p.section!))]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Solar Panel Tracker</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage and track your solar panel installations</p>
            </div>
            <ProfileSelector
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onProfileChange={setSelectedProfileId}
              onProfileCreated={loadProfiles}
            />
          </div>
        </div>

        {selectedProfileId ? (
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="scan">Scan</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <DashboardStats totalPanels={totalPanels} scannedPanels={scannedPanels} sections={sections} />
              <SectionGrid panels={panels} />
              <PanelsTable panels={panels} onPanelUpdated={handleDataUpdate} />
            </TabsContent>

            <TabsContent value="upload">
              <FileUpload profileId={selectedProfileId} onUploadComplete={handleDataUpdate} />
            </TabsContent>

            <TabsContent value="scan">
              <Scanner profileId={selectedProfileId} onScanComplete={handleDataUpdate} />
            </TabsContent>

            <TabsContent value="settings">
              <NFCTestTool />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Please select or create a profile to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
