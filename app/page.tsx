"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScanSearchIcon } from "lucide-react"
import { ProfileSelector } from "@/components/profile-selector"
import { FileUpload } from "@/components/file-upload"
import { DataExport } from "@/components/data-export"
import { Scanner } from "@/components/scanner"
import { ScanLog, ScanLogEntry } from "@/components/scan-log" // Import ScanLog and ScanLogEntry
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
            <div className="flex items-center gap-2">
              <ScanSearchIcon className="h-14 w-14 text-zinc-500 dark:text-white mr-2" />
              <div className="flex flex-col">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">PV Tracker</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">v0.0.1a</p>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-black data-[state=active]:text-white hover:bg-gray-300 hover:text-white dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-black data-[state=active]:text-white hover:bg-gray-300 hover:text-white dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Data
              </TabsTrigger>
              <TabsTrigger
                value="scan"
                className="data-[state=active]:bg-black data-[state=active]:text-white hover:bg-gray-300 hover:text-white dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Scan
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-black data-[state=active]:text-white hover:bg-gray-300 hover:text-white dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <DashboardStats totalPanels={totalPanels} scannedPanels={scannedPanels} sections={sections} />
              <SectionGrid panels={panels} />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <FileUpload profileId={selectedProfileId} onUploadComplete={handleDataUpdate} />
              <DataExport profileId={selectedProfileId} />
              <PanelsTable panels={panels} onPanelUpdated={handleDataUpdate} />
            </TabsContent>

            <TabsContent value="scan" className="space-y-4">
              <Scanner profileId={selectedProfileId} onScanComplete={handleDataUpdate} onScanResult={handleScanResult} />
              <ScanLog logs={scanLogs} />
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
