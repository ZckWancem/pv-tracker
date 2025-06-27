"use client"

import { useState } from "react"
import { Smartphone, Wifi, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface NFCData {
  serialNumber: string;
  records: {
    recordType: string;
    mediaType?: string;
    data: string | number[] | ArrayBuffer; // Add ArrayBuffer here
    raw?: ArrayBuffer;
  }[];
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

export function NFCTestTool() {
  const [isScanning, setIsScanning] = useState(false)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [rawData, setRawData] = useState<NFCData | null>(null)
  const [mappedField, setMappedField] = useState<string>("")
  const [customField, setCustomField] = useState<string>("")
  const { toast } = useToast()

  const checkNFCSupport = () => {
    const supported = "NDEFReader" in window
    setNfcSupported(supported)

    if (!supported) {
      toast({
        title: "NFC Not Supported",
        description: "NFC is not supported on this device or browser",
        variant: "destructive",
      })
    }

    return supported
  }

  const startNFCScan = async () => {
    if (!checkNFCSupport()) return

    try {
      setIsScanning(true)
      setRawData(null)

      const ndef = new (window as Window).NDEFReader!()
      await ndef.scan()

      ndef.addEventListener("reading", ({ message, serialNumber }: NDEFReadingEvent) => {
        const data: NFCData = {
          serialNumber,
          records: message.records.map((record: NDEFRecord) => {
            const decoder = new TextDecoder()
            let decodedData: string | number[] = "Unable to decode"

            try {
              if (record.recordType === "text") {
                decodedData = decoder.decode(record.data as ArrayBuffer)
              } else if (record.recordType === "url") {
                decodedData = decoder.decode(record.data as ArrayBuffer)
              } else {
                decodedData = Array.from(new Uint8Array(record.data as ArrayBuffer))
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join(" ")
              }
            } catch {
              // Keep default message
            }

            return {
              recordType: record.recordType,
              mediaType: record.mediaType,
              data: decodedData,
              raw: record.raw,
            }
          }),
        }

        setRawData(data)
        setIsScanning(false)

        toast({
          title: "NFC Tag Read",
          description: "Tag data captured successfully",
        })
      })

      ndef.addEventListener("readingerror", () => {
        setIsScanning(false)
        toast({
          title: "NFC Read Error",
          description: "Failed to read NFC tag",
          variant: "destructive",
        })
      })

      toast({
        title: "NFC Scanning Active",
        description: "Tap an NFC tag to read its data",
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

  const stopNFCScan = () => {
    setIsScanning(false)
    toast({
      title: "NFC Scanning Stopped",
      description: "NFC scanning has been stopped",
    })
  }

  const getMappedValue = () => {
    if (!rawData) return ""

    const fieldToUse = mappedField === "custom" ? customField : mappedField

    if (fieldToUse === "serialNumber") {
      return rawData.serialNumber || ""
    }

    // Look for the field in text records
    for (const record of rawData.records) {
      if (record.recordType === "text") {
        try {
          const parsed = JSON.parse(record.data as string)
          if (parsed[fieldToUse]) {
            return parsed[fieldToUse]
          }
        } catch {
          // If not JSON, check if it's the direct value
          if (fieldToUse === "text") {
            return record.data as string
          }
        }
      } else if (record.recordType === "url") {
        // Handle URL records
        return record.data as string
      }
    }

    return ""
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          NFC Test Tool
        </CardTitle>
        <CardDescription>Test NFC tag reading and configure field mapping</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={nfcSupported ? "default" : "destructive"}>
            {nfcSupported ? "NFC Supported" : "NFC Not Supported"}
          </Badge>
          <Button variant="outline" size="sm" onClick={checkNFCSupport}>
            Check Support
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={startNFCScan} disabled={!nfcSupported || isScanning} className="flex-1">
            {isScanning ? (
              <>
                <Wifi className="mr-2 h-4 w-4 animate-pulse" />
                Scanning...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                Start NFC Scan
              </>
            )}
          </Button>

          {isScanning && (
            <Button variant="outline" onClick={stopNFCScan}>
              Stop
            </Button>
          )}
        </div>

        {isScanning && (
          <Alert>
            <Wifi className="h-4 w-4" />
            <AlertDescription>NFC scanning active. Tap an NFC tag to read its data.</AlertDescription>
          </Alert>
        )}

        {rawData && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Raw NFC Data</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono">
                <div>
                  <strong>Serial Number:</strong> {rawData.serialNumber || "N/A"}
                </div>
                <div className="mt-2">
                  <strong>Records:</strong>
                </div>
                {rawData.records.map((record, index: number) => (
                  <div key={index} className="ml-4 mt-1">
                    <div>
                      <strong>Type:</strong> {record.recordType}
                    </div>
                    <div>
                      <strong>Data:</strong> {typeof record.data === 'string' ? record.data : JSON.stringify(Array.from(new Uint8Array(record.data as ArrayBuffer)))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Field Mapping</h4>
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="field-select">Map Serial Code to:</Label>
                  <Select value={mappedField} onValueChange={setMappedField}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field to map" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serialNumber">Serial Number</SelectItem>
                      <SelectItem value="text">Text Content</SelectItem>
                      <SelectItem value="id">ID Field</SelectItem>
                      <SelectItem value="serial">Serial Field</SelectItem>
                      <SelectItem value="code">Code Field</SelectItem>
                      <SelectItem value="custom">Custom Field</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mappedField === "custom" && (
                  <div>
                    <Label htmlFor="custom-field">Custom Field Name:</Label>
                    <Input
                      id="custom-field"
                      value={customField}
                      onChange={(e) => setCustomField(e.target.value)}
                      placeholder="Enter field name"
                    />
                  </div>
                )}

                {mappedField && (
                  <div>
                    <Label>Mapped Value:</Label>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <code className="text-green-800 dark:text-green-200">
                        {getMappedValue() || "No value found for this field"}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!nfcSupported && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              NFC is not supported on this device or browser. You can still use manual barcode scanning.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
