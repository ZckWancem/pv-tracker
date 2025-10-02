"use client"

import Image from "next/image"
import type { Panel, Profile } from "@/lib/db"
import { DashboardStats } from "@/components/dashboard-stats"
import { SectionGrid } from "@/components/section-grid"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShareButton } from "./share-button"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

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
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div className="w-[200px] flex justify-center">
          {selectedProfile?.image_url ? (
            <Image
              src={`${selectedProfile.image_url}?t=${Date.now()}`}
              alt="Profile Image"
              width={200}
              height={200}
              className="object-cover rounded-lg"
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded-lg dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">No Image</p>
            </div>
          )}
        </div>
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
      <DashboardStats
        totalPanels={totalPanels}
        scannedPanels={scannedPanels}
        sections={sections}
      />
      {selectedProfileId && <ShareButton profileId={selectedProfileId} />}
      <ScrollArea className="h-[1000px] w-full rounded-md border p-4">
        <SectionGrid panels={panels} />
      </ScrollArea>
    </div>
  )
}