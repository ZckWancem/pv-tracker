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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Panel Details</DialogTitle>
          <DialogDescription>
            Detailed information for panel {panel.serial_code}
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardTitle>{panel.serial_code}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <p><strong>Position:</strong> {sectionName}-{panel.row_number}-{panel.column_number}</p>
              <p><strong>Pallet:</strong> {panel.pallet_no}</p>
              <p><strong>Status:</strong> {panel.scanned_at ? "Scanned" : "Pending"}</p>
              {panel.scanned_at && <p><strong>Scanned At:</strong> {new Date(panel.scanned_at).toLocaleString()}</p>}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}