"use client"

import type { Panel, Profile } from "@/lib/db"
import { DashboardStats } from "@/components/dashboard-stats"
import { SectionGrid } from "@/components/section-grid"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LayoutViewProps {
  panels: Panel[]
  profiles: Profile[]
  selectedProfileId: number | null
}

export function LayoutView({ panels, profiles, selectedProfileId }: LayoutViewProps) {
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId)
  const totalPanels = panels.length
  const scannedPanels = panels.filter((p) => p.scanned_at).length
  const sections = [...new Set(panels.filter((p) => p.section).map((p) => p.section!))]

  return (
    <ScrollArea className="h-[700px] w-full rounded-md border p-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">{selectedProfile?.name}</h2>
        <p className="text-gray-500 dark:text-gray-400 whitespace-pre-line">
          {selectedProfile?.description}
        </p>
      </div>
      <DashboardStats totalPanels={totalPanels} scannedPanels={scannedPanels} sections={sections} />
      <div className="mt-6">
        <SectionGrid panels={panels} />
      </div>
    </ScrollArea>
  )
}