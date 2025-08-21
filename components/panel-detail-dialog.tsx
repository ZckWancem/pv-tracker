"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Panel } from "@/lib/db"

interface PanelDetailDialogProps {
  panel: Panel | null
  sectionName: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function PanelDetailDialog({
  panel,
  sectionName,
  isOpen,
  onOpenChange,
}: PanelDetailDialogProps) {
  if (!panel) return null

  const getSectionLetter = (sectionNumber: string) => {
    const num = parseInt(sectionNumber, 10)
    if (isNaN(num) || num < 1) return sectionNumber
    return String.fromCharCode(64 + num)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Panel Details</DialogTitle>
          <DialogDescription>
            Detailed information for panel {panel.serial_code}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>PV Module</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Serial Code:</strong> {panel.serial_code}</p>
              <p><strong>Pallet:</strong> {panel.pallet_no}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Position</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Section:</strong> {getSectionLetter(sectionName)}</p>
              <p><strong>Row:</strong> {panel.row_number}</p>
              <p><strong>Column:</strong> {panel.column_number}</p>
              <p><strong>Status:</strong> {panel.scanned_at ? "Scanned" : "Pending"}</p>
              {panel.scanned_at && <p><strong>Scanned At:</strong> {new Date(panel.scanned_at).toLocaleString()}</p>}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}