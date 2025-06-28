"use client"

import { useState, useEffect, useCallback } from "react"
import { Edit, Trash2, Cog} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface NfcMapping {
  id: number
  profile_id: number
  record_type: string
  field_path: string
  description: string | null
}

interface NfcMappingConfigProps {
  profileId: number | null
}

export function NfcMappingConfig({ profileId }: NfcMappingConfigProps) {
  const [mappings, setMappings] = useState<NfcMapping[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMapping, setEditingMapping] = useState<NfcMapping | null>(null)
  const { toast } = useToast()

  const fetchMappings = useCallback(async (profileId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/nfc-mappings?profileId=${profileId}`)
      if (!response.ok) throw new Error("Failed to fetch NFC mappings")
      const data = await response.json()
      setMappings(data)
    } catch (error) {
      console.error("Failed to fetch NFC mappings:", error)
      toast({
        title: "Error",
        description: "Failed to fetch NFC mappings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast]); // Added toast to useCallback dependencies

  useEffect(() => {
    if (profileId) {
      fetchMappings(profileId)
    }
  }, [profileId, fetchMappings])

  const handleSaveMapping = async (formData: FormData) => {
    if (!profileId) return

    setIsLoading(true)
    const url = editingMapping ? `/api/nfc-mappings/${editingMapping.id}` : "/api/nfc-mappings"
    const method = editingMapping ? "PUT" : "POST"

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          recordType: formData.get("recordType"),
          fieldPath: formData.get("fieldPath"),
          description: formData.get("description"),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save mapping")
      }

      toast({
        title: "Success",
        description: `Mapping ${editingMapping ? "updated" : "created"} successfully`,
      })

      setIsDialogOpen(false)
      setEditingMapping(null)
      fetchMappings(profileId)
    } catch (error) {
      console.error("Failed to save mapping:", error)
      toast({
        title: "Error",
        description: "Failed to save mapping",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMapping = async (mappingId: number) => {
    if (!profileId) return

    if (!confirm("Are you sure you want to delete this mapping?")) return

    try {
      const response = await fetch(`/api/nfc-mappings/${mappingId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete mapping")
      }

      toast({
        title: "Success",
        description: "Mapping deleted successfully",
      })

      fetchMappings(profileId)
    } catch (error) {
      console.error("Failed to delete mapping:", error)
      toast({
        title: "Error",
        description: "Failed to delete mapping",
        variant: "destructive",
      })
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle  className="flex items-center gap-2">
          <Cog className="h-5 w-5" />
          Mapping Configuration
          </CardTitle>
        <CardDescription>Configure how to extract serial codes from NFC tags for this profile.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4 flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMapping(null)} variant="default" className="text-white bg-black">+ Add New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMapping ? "Edit" : "Add"} NFC Mapping</DialogTitle>
                <DialogDescription>
                  Define a rule to extract a serial code from an NFC tag NDEF records.
                </DialogDescription>
              </DialogHeader>
              <form action={handleSaveMapping}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="recordType">Type</Label>
                    <Input id="recordType" name="recordType" placeholder="e.g., text, url, mime" defaultValue={editingMapping?.record_type || ""} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fieldPath">Field Path</Label>
                    <Input id="fieldPath" name="fieldPath" placeholder="e.g., serial_number" defaultValue={editingMapping?.field_path || ""} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" placeholder="Optional description" defaultValue={editingMapping?.description || ""} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Mapping"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left bg-stone-200 text-black">Type</TableHead>
                <TableHead className="text-left bg-stone-200 text-black">Field Path</TableHead>
                <TableHead className="text-left bg-stone-200 text-black">Desc.</TableHead>
                <TableHead className="w-[100px] bg-stone-200 text-black text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>{mapping.record_type}</TableCell>
                  <TableCell>{mapping.field_path}</TableCell>
                  <TableCell>{mapping.description}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingMapping(mapping); setIsDialogOpen(true); }}>
                      <Edit className="h-4 w-4 text-zinc-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteMapping(mapping.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {mappings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No mappings found.
          </div>
        )}
      </CardContent>
    </Card>
  )
}