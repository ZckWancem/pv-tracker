"use client"

import Image from "next/image"
import type { Panel, Profile } from "@/lib/db"
import { DashboardStats } from "@/components/dashboard-stats"
import { SectionGrid } from "@/components/section-grid"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShareButton } from "./share-button"

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
    <>
      <div className="flex justify-between items-center mb-4">
        <div style={{ width: "200px" }} />
        <div className="text-center">
          <h2 className="text-2xl font-bold">{selectedProfile?.name}</h2>
          <p className="text-gray-500 dark:text-gray-400 whitespace-pre-line">
            {selectedProfile?.description}
          </p>
        </div>
        <Image
          src="/logo-2.jpg"
          alt="Company Logo"
          width={200}
          height={200}
          className="rounded-sm"
        />
      </div>
      <DashboardStats totalPanels={totalPanels} scannedPanels={scannedPanels} sections={sections} />
      {selectedProfileId && <ShareButton profileId={selectedProfileId} />}
      <ScrollArea className="h-[1000px] w-full rounded-md border p-4 mt-6">
        <SectionGrid panels={panels} />
      </ScrollArea>
    </>
  )
}