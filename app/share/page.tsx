"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LayoutView } from "@/components/layout-view"
import type { Panel, Profile } from "@/lib/db"

export default function SharePage() {
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")
  const [panels, setPanels] = useState<Panel[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSharedData = async () => {
      if (!token) {
        setError("Share token is missing.")
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/share/${token}`)
        if (!response.ok) {
          throw new Error("Failed to load shared layout")
        }
        const { panels, profile } = await response.json()
        setPanels(panels)
        setProfiles([profile])
        setSelectedProfileId(profile.id)
      } catch (err) {
        setError("Invalid or expired share link.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSharedData()
  }, [token])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LayoutView panels={panels} profiles={profiles} selectedProfileId={selectedProfileId} />
    </div>
  )
}