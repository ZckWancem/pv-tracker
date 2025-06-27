"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Package, CheckCircle, Clock, Grid } from "lucide-react"

interface DashboardStatsProps {
  totalPanels: number
  scannedPanels: number
  sections: string[]
}

export function DashboardStats({ totalPanels, scannedPanels, sections }: DashboardStatsProps) {
  const remainingPanels = totalPanels - scannedPanels
  const completionPercentage = totalPanels > 0 ? (scannedPanels / totalPanels) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Panels</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPanels}</div>
          <p className="text-xs text-muted-foreground">Panels in inventory</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Scanned</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{scannedPanels}</div>
          <p className="text-xs text-muted-foreground">Panels installed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{remainingPanels}</div>
          <p className="text-xs text-muted-foreground">Panels to install</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sections</CardTitle>
          <Grid className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sections.length}</div>
          <p className="text-xs text-muted-foreground">Active sections</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Installation Progress</CardTitle>
          <CardDescription>{completionPercentage.toFixed(1)}% complete</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{scannedPanels} installed</span>
            <span>{remainingPanels} remaining</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
