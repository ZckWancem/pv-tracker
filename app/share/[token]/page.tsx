"use client"

import { useEffect, useState } from "react"
import { LayoutView } from "@/components/layout-view"

import type { Panel, Profile } from "@/lib/db"

export default function SharePage({ params }: { params: { token: string } }) {
  const [panels, setPanels] = useState<Panel[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const response = await fetch(`/api/share/${params.token}`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to fetch shared data")
        }
        const data = await response.json()
        setPanels(data.panels)
        setProfile(data.profile)
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred")
      }
    }

    fetchSharedData()
  }, [params.token])

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  if (!profile) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{profile.name}</h1>
      <LayoutView
        panels={panels}
        profile={profile}
      />
    </div>
  )
}