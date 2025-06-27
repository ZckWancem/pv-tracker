"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Scan, Smartphone, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  data: string | ArrayBuffer;
  raw?: ArrayBuffer;
}

interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFReadingEvent {
  message: NDEFMessage;
  serialNumber: string;
}

interface NDEFReader {
  scan: () => Promise<void>;
  addEventListener: (event: "reading" | "readingerror", handler: (event: NDEFReadingEvent) => void) => void;
  removeEventListener: (event: "reading" | "readingerror", handler: (event: NDEFReadingEvent) => void) => void;
}

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReader;
  }
}

interface ScannerProps {
  profileId: number
  onScanComplete: () => void
}

export function Scanner({ profileId, onScanComplete }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [serialCode, setSerialCode] = useState("")
  const [section, setSection] = useState("")
  const [row, setRow] = useState<number>(1)
  const [column, setColumn] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check for NFC support
    if ("NDEFReader" in window) {
      setNfcSupported(true)
    }
  }, [])

  const startNFCScan = async () => {
    if (!nfcSupported) {
      toast({
        title: "NFC Not Supported",
        description: "NFC is not supported on this device",
        variant: "destructive",
      })
      return
    }

    try {
      setIsScanning(true)
      const ndef = new (window as Window).NDEFReader!()

      await ndef.scan()

      ndef.addEventListener("reading", ({ message }: NDEFReadingEvent) => {
        const textRecord = message.records.find((record: NDEFRecord) => record.recordType === "text")
        if (textRecord) {
          const decoder = new TextDecoder()
          const text = decoder.decode(textRecord.data as ArrayBuffer)
          setSerialCode(text)
          setLastScanResult(`NFC: ${text}`)
          setIsScanning(false)
        }
      })

      toast({
        title: "NFC Scanning Active",
        description: "Tap an NFC tag to scan",
      })
    } catch {
      setIsScanning(false)
      toast({
        title: "NFC Error",
        description: "Failed to start NFC scanning",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serialCode.trim() || !section.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/panels/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          serial_code: serialCode.trim(),
          section: section.trim(),
          row,
          column,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Scan failed")
      }

      toast({
        title: "Panel Scanned",
        description: `Panel ${serialCode} recorded at ${section}-${row}-${column}`,
      })

      // Auto-increment column for next scan
      setColumn((prev) => prev + 1)
      setSerialCode("")
      setLastScanResult(`Success: ${serialCode} at ${section}-${row}-${column}`)
      onScanComplete()
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to record scan",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    setColumn((prev) => prev + 1)
    setSerialCode("")
  }

  const handlePrevious = () => {
    if (column > 1) {
      setColumn((prev) => prev - 1)
    }
    setSerialCode("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Panel Scanner
        </CardTitle>
        <CardDescription>Scan barcodes or NFC tags to record panel locations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastScanResult && (
          <Alert>
            <AlertDescription>{lastScanResult}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="serial-code">Serial Code</Label>
                <Input
                  id="serial-code"
                  value={serialCode}
                  onChange={(e) => setSerialCode(e.target.value)}
                  placeholder="Scan or enter serial code"
                  required
                />
              </div>
              {nfcSupported && (
                <div className="flex items-end">
                  <Button type="button" variant="outline" size="icon" onClick={startNFCScan} disabled={isScanning}>
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g., A, B, North"
                  required
                />
              </div>
              <div>
                <Label htmlFor="row">Row</Label>
                <Input
                  id="row"
                  type="number"
                  value={row}
                  onChange={(e) => setRow(Number.parseInt(e.target.value) || 1)}
                  min="1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="column">Column</Label>
                <div className="flex gap-1">
                  <Button type="button" variant="outline" size="icon" onClick={handlePrevious} disabled={column <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="column"
                    type="number"
                    value={column}
                    onChange={(e) => setColumn(Number.parseInt(e.target.value) || 1)}
                    min="1"
                    className="text-center"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleNext}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || !serialCode.trim() || !section.trim()}>
              {isSubmitting ? "Recording..." : "Record Scan"}
            </Button>
            <Button type="button" variant="outline" onClick={handleNext}>
              Next Position
            </Button>
          </div>
        </form>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Current Position:</span>
          <Badge variant="outline">
            {section || "?"}-{row}-{column}
          </Badge>
        </div>

        {isScanning && (
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>NFC scanning active. Tap an NFC tag to read.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
