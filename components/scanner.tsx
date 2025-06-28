"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react" // Import useRef
import { Scan, Smartphone, Plus, Minus, Camera } from "lucide-react" // Import Camera icon
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'; // Import BrowserQRCodeReader and IScannerControls

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

import type { ScanLogEntry } from "./scan-log"; // Import the ScanLogEntry interface

interface ScannerProps {
  profileId: number
  onScanComplete: () => void
  onScanResult: (entry: ScanLogEntry) => void; // New prop for logging results
}

export function Scanner({ profileId, onScanComplete, onScanResult }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false) // For NFC scanning
  const [isCameraScanning, setIsCameraScanning] = useState(false); // For camera scanning
  const [serialCode, setSerialCode] = useState("")
  const [section, setSection] = useState("")
  const [row, setRow] = useState<number>(1)
  const [column, setColumn] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<string | null>(null)
  const { toast } = useToast()

  const videoRef = useRef<HTMLVideoElement>(null); // Ref for the video element
  const codeReader = useRef<BrowserQRCodeReader | null>(null);
  const scannerControls = useRef<IScannerControls | null>(null);

  useEffect(() => {
    // Check for NFC support
    if ("NDEFReader" in window) {
      setNfcSupported(true)
    }
    // Cleanup effect for scanner
    return () => {
      if (scannerControls.current) {
        scannerControls.current.stop();
        scannerControls.current = null;
      }
      // Ensure codeReader.current is not null before attempting to use it
      if (codeReader.current) {
        // No reset method on BrowserQRCodeReader instance, just clear the ref
        codeReader.current = null;
      }
    };
  }, []);

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

      const mappingsResponse = await fetch(`/api/nfc-mappings?profileId=${profileId}`)
      const mappings = await mappingsResponse.json()

      ndef.addEventListener("reading", ({ message }: NDEFReadingEvent) => {
        for (const mapping of mappings) {
          const matchingRecord = message.records.find(record => record.recordType === mapping.record_type);
          if (matchingRecord) {
            try {
              // This is a simplified example. A robust solution would use a proper
              // JSONPath library or a more sophisticated path parser.
              const data = JSON.parse(new TextDecoder().decode(matchingRecord.data as ArrayBuffer));
              const serial = data[mapping.field_path];
              if (serial) {
                setSerialCode(serial);
                setLastScanResult(`NFC: ${serial}`);
                setIsScanning(false);
                return; // Stop processing further mappings
              }
            } catch {
              // Fallback for non-JSON data
              const text = new TextDecoder().decode(matchingRecord.data as ArrayBuffer);
              setSerialCode(text);
              setLastScanResult(`NFC: ${text}`);
              setIsScanning(false);
              return;
            }
          }
        }
        setLastScanResult("NFC: No matching mapping found.");
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

  const startCameraScan = async () => {
    if (isCameraScanning) return; // Prevent multiple scans

    try {
      setIsCameraScanning(true);
      codeReader.current = new BrowserQRCodeReader();
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices(); // Corrected usage

      if (videoInputDevices.length === 0) {
        throw new Error("No video input devices found.");
      }

      // Select the first available device, or a specific one if needed
      const selectedDeviceId = videoInputDevices[0].deviceId;

      toast({
        title: "Camera Scanning Active",
        description: "Scanning for barcodes...",
      });

      scannerControls.current = await codeReader.current.decodeFromVideoDevice( // Corrected usage
        selectedDeviceId,
        videoRef.current!, // Assert non-null as it's conditionally rendered
        (result, error) => {
          if (result) {
            setSerialCode(result.getText());
            stopCameraScan(); // Stop scanning after a successful scan
            toast({
              title: "Barcode Scanned",
              description: `Scanned: ${result.getText()}`,
            });
          }
          if (error && error.name !== "NotFoundException") { // Ignore NotFoundException as it's common before a scan
            console.error("Barcode scan error:", error);
            // Optionally, show a toast for other errors
          }
        }
      );
    } catch (error) {
      console.error("Failed to start camera scan:", error);
      toast({
        title: "Camera Scan Error",
        description: error instanceof Error ? error.message : "Failed to start camera scanning",
        variant: "destructive",
      });
      setIsCameraScanning(false);
    }
  };

  const stopCameraScan = () => {
    if (scannerControls.current) {
      scannerControls.current.stop();
      scannerControls.current = null;
    }
    if (codeReader.current) {
      codeReader.current = null; // No reset method on BrowserQRCodeReader instance
    }
    setIsCameraScanning(false);
    toast({
      title: "Camera Scan Stopped",
      description: "Barcode scanning has been stopped.",
    });
  };

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
      onScanComplete()
      onScanResult({
        type: "success",
        message: `Panel ${serialCode} recorded at ${section}-${row}-${column}`,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to record scan";
      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
      });
      onScanResult({
        type: "error",
        message: `${errorMessage} (Serial: ${serialCode})`, // Include serial code in error message
        timestamp: new Date(),
      });
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
              <div className="flex items-end gap-2"> {/* Added gap-2 here */}
                {nfcSupported && (
                  <Button type="button" variant="outline" size="icon" onClick={startNFCScan} disabled={isScanning || isCameraScanning}>
                    <Smartphone className="h-4 w-4" />
                  </Button>
                )}
                {isCameraScanning ? (
                  <Button type="button" variant="destructive" size="icon" onClick={stopCameraScan}>
                    <Camera className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="icon" onClick={startCameraScan} disabled={isScanning}>
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {isCameraScanning && (
              <div className="relative w-full h-64 border rounded-md overflow-hidden">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover"></video>
                {/* Bounding box placeholder - styling would be applied via CSS */}
                <div className="absolute inset-0 border-4 border-green-500 pointer-events-none"></div>
              </div>
            )}

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
