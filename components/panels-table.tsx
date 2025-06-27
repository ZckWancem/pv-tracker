"use client"

import { useState } from "react"
import { Edit, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { Panel } from "@/lib/db"

interface PanelsTableProps {
  panels: Panel[]
  onPanelUpdated: () => void
}

export function PanelsTable({ panels, onPanelUpdated }: PanelsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const filteredPanels = panels.filter(
    (panel) =>
      panel.serial_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      panel.pallet_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (panel.section && panel.section.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleUpdatePanel = async (formData: FormData) => {
    if (!editingPanel) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/panels/${editingPanel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: formData.get("section") || null,
          row_number: formData.get("row") ? Number.parseInt(formData.get("row") as string) : null,
          column_number: formData.get("column") ? Number.parseInt(formData.get("column") as string) : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update panel")
      }

      toast({
        title: "Success",
        description: "Panel updated successfully",
      })

      setEditingPanel(null)
      onPanelUpdated()
    } catch {
      toast({
        title: "Error",
        description: "Failed to update panel",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePanel = async (panelId: number) => {
    if (!confirm("Are you sure you want to delete this panel?")) return

    try {
      const response = await fetch(`/api/panels/${panelId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete panel")
      }

      toast({
        title: "Success",
        description: "Panel deleted successfully",
      })

      onPanelUpdated()
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete panel",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Panels Database</CardTitle>
        <CardDescription>Manage and view all panels in the system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search panels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial Code</TableHead>
                <TableHead>Pallet No</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scanned At</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPanels.map((panel) => (
                <TableRow key={panel.id}>
                  <TableCell className="font-medium">{panel.serial_code}</TableCell>
                  <TableCell>{panel.pallet_no}</TableCell>
                  <TableCell>
                    {panel.section && panel.row_number && panel.column_number
                      ? `${panel.section}-${panel.row_number}-${panel.column_number}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={panel.scanned_at ? "default" : "secondary"}>
                      {panel.scanned_at ? "Installed" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>{panel.scanned_at ? new Date(panel.scanned_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingPanel(panel)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Panel</DialogTitle>
                            <DialogDescription>Update panel location information</DialogDescription>
                          </DialogHeader>
                          <form action={handleUpdatePanel}>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label>Serial Code</Label>
                                <Input value={editingPanel?.serial_code || ""} disabled />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="section">Section</Label>
                                <Input
                                  id="section"
                                  name="section"
                                  defaultValue={editingPanel?.section || ""}
                                  placeholder="e.g., A, B, North"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="row">Row</Label>
                                  <Input
                                    id="row"
                                    name="row"
                                    type="number"
                                    defaultValue={editingPanel?.row_number || ""}
                                    min="1"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="column">Column</Label>
                                  <Input
                                    id="column"
                                    name="column"
                                    type="number"
                                    defaultValue={editingPanel?.column_number || ""}
                                    min="1"
                                  />
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Updating..." : "Update Panel"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Button variant="ghost" size="icon" onClick={() => handleDeletePanel(panel.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredPanels.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No panels match your search." : "No panels found."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
