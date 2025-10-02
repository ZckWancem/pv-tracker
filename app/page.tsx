"use client"

import { useState, useEffect, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { ProfileSelector } from "@/components/profile-selector"
import { FileUpload } from "@/components/file-upload"
import { ImageUpload } from "@/components/image-upload"
import { DataExport } from "@/components/data-export"
import { Scanner } from "@/components/scanner"
import { ScanLog, ScanLogEntry } from "@/components/scan-log" // Import ScanLog and ScanLogEntry
import { DashboardStats } from "@/components/dashboard-stats"
import { LayoutView } from "@/components/layout-view"
import { SectionGrid } from "@/components/section-grid"
import { PanelsTable } from "@/components/panels-table"
import { NFCTestTool } from "@/components/nfc-test-tool"
import { NfcMappingConfig } from "@/components/nfc-mapping-config"
import { useToast } from "@/hooks/use-toast"
import type { Profile, Panel } from "@/lib/db"

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null)
  const [panels, setPanels] = useState<Panel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]); // State for scan logs
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

  const handleScanResult = useCallback((entry: ScanLogEntry) => {
    setScanLogs((prevLogs) => [...prevLogs, entry]);
  }, []);

  const totalPanels = panels.length
  const scannedPanels = panels.filter((p) => p.scanned_at).length
  const sections = [...new Set(panels.filter((p) => p.section).map((p) => p.section!))]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.jpg" alt="Company Logo" width={112} height={112} className="mr-2" />
              <div className="flex flex-col">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">PV Tracer</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Created by AstraZ</p>
              </div>
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-black data-[state=active]:text-white hover:bg-stone-300 hover:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-black data-[state=active]:text-white hover:bg-stone-300 hover:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Data
              </TabsTrigger>
              <TabsTrigger
                value="layout"
                className="data-[state=active]:bg-black data-[state=active]:text-white hover:bg-stone-300 hover:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Layout View
              </TabsTrigger>
              <TabsTrigger
                value="scan"
                className="data-[state=active]:bg-black data-[state=active]:text-white hover:bg-stone-300 hover:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Scan
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-black data-[state=active]:text-white hover:bg-stone-300 hover:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <DashboardStats totalPanels={totalPanels} scannedPanels={scannedPanels} sections={sections} />
              <SectionGrid panels={panels} />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUpload profileId={selectedProfileId} onUploadComplete={handleDataUpdate} />
                <ImageUpload profileId={selectedProfileId} onUploadComplete={handleDataUpdate} />
              </div>
              <DataExport profileId={selectedProfileId} />
              <PanelsTable panels={panels} onPanelUpdated={handleDataUpdate} />
            </TabsContent>

            <TabsContent value="layout">
              <LayoutView panels={panels} profiles={profiles} selectedProfileId={selectedProfileId} />
            </TabsContent>

            <TabsContent value="scan" className="space-y-4">
              <Scanner profileId={selectedProfileId} onScanComplete={handleDataUpdate} onScanResult={handleScanResult} />
              <ScanLog logs={scanLogs} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <NFCTestTool />
              <NfcMappingConfig profileId={selectedProfileId} />
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
