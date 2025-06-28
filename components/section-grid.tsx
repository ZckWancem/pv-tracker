"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Panel } from "@/lib/db"

interface SectionGridProps {
  panels: Panel[]
}

export function SectionGrid({ panels }: SectionGridProps) {
  // Group panels by section
  const panelsBySection = panels.reduce(
    (acc, panel) => {
      if (!panel.section) return acc

      if (!acc[panel.section]) {
        acc[panel.section] = []
      }
      acc[panel.section].push(panel)
      return acc
    },
    {} as Record<string, Panel[]>,
  )

  const sections = Object.keys(panelsBySection).sort()

  if (sections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Section Layout</CardTitle>
          <CardDescription>No sections with scanned panels yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Section Layout</h3>
      <div className="grid gap-4">
        {sections.map((sectionName) => {
          const sectionPanels = panelsBySection[sectionName]
          const scannedPanels = sectionPanels.filter((p) => p.scanned_at)

          // Create grid layout
          const maxRow = Math.max(...sectionPanels.map((p) => p.row_number || 0))
          const maxCol = Math.max(...sectionPanels.map((p) => p.column_number || 0))

          const grid: (Panel | null)[][] = Array(maxRow)
            .fill(null)
            .map(() => Array(maxCol).fill(null))

          sectionPanels.forEach((panel) => {
            if (panel.row_number && panel.column_number) {
              grid[panel.row_number - 1][panel.column_number - 1] = panel
            }
          })

          return (
            <Card key={sectionName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Section {sectionName}</CardTitle>
                  <Badge variant="outline">
                    {scannedPanels.length}/{sectionPanels.length} scanned
                  </Badge>
                </div>
                <CardDescription>
                  {maxRow} rows × {maxCol} columns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <div className="grid gap-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto">
                    {grid.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex gap-1">
                        <div className="w-8 text-xs text-center text-gray-500 flex items-center justify-center">
                          {rowIndex + 1}
                        </div>
                        {row.map((panel, colIndex) => (
                          <Tooltip key={colIndex}>
                            <TooltipTrigger asChild>
                              <div
                                className={`w-8 h-8 border rounded text-xs flex items-center justify-center cursor-pointer ${
                                  panel
                                    ? panel.scanned_at
                                      ? "bg-green-500 text-white border-green-600"
                                      : "bg-yellow-500 text-white border-yellow-600"
                                    : "bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                                }`}
                              >
                                {colIndex + 1}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {panel ? (
                                <div className="text-sm">
                                  <div className="font-medium">{panel.serial_code}</div>
                                  <div>
                                    Position: {sectionName}-{panel.row_number}-{panel.column_number}
                                  </div>
                                  <div>Pallet: {panel.pallet_no}</div>
                                  {panel.scanned_at ? (
                                    <div className="text-green-600">✓ Scanned</div>
                                  ) : (
                                    <div className="text-yellow-600">⏳ Pending</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm">Empty position</div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    ))}
                    <div className="flex gap-1 mt-2">
                      <div className="w-8"></div>
                      {Array.from({ length: maxCol }, (_, i) => (
                        <div key={i} className="w-8 text-xs text-center text-gray-500">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </TooltipProvider>

                <div className="flex gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Scanned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <span>Empty</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
