"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Scan, Smartphone, Plus, Minus, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Quagga from '@ericblade/quagga2'; // Import Quagga

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

import type { ScanLogEntry } from "./scan-log";

interface ScannerProps {
  profileId: number
  onScanComplete: () => void
  onScanResult: (entry: ScanLogEntry) => void;
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

  const videoRef = useRef<HTMLDivElement>(null); // Ref for Quagga's target element
  const ndefReaderRef = useRef<NDEFReader | null>(null); // Ref for NDEFReader instance
  const nfcReadingHandlerRef = useRef<((event: NDEFReadingEvent) => void) | null>(null);
  const nfcErrorHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Check for NFC support
    if ("NDEFReader" in window) {
      setNfcSupported(true)
    }

    return () => {
      // Cleanup for NFC
      if (ndefReaderRef.current && nfcReadingHandlerRef.current && nfcErrorHandlerRef.current) {
        ndefReaderRef.current.removeEventListener("reading", nfcReadingHandlerRef.current as (event: NDEFReadingEvent) => void);
        ndefReaderRef.current.removeEventListener("readingerror", nfcErrorHandlerRef.current as () => void);
        ndefReaderRef.current = null;
        nfcReadingHandlerRef.current = null;
        nfcErrorHandlerRef.current = null;
      }
      // Cleanup for Quagga2
      if (isCameraScanning) {
        Quagga.stop();
        Quagga.offDetected();
      }
    };
  }, [isCameraScanning, isScanning]); // Depend on isCameraScanning and isScanning for cleanup

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
      ndefReaderRef.current = ndef; // Store the NDEFReader instance
 
      await ndef.scan()
 
      const mappingsResponse = await fetch(`/api/nfc-mappings?profileId=${profileId}`)
      const mappings = await mappingsResponse.json()
 
      const readingHandler = ({ message }: NDEFReadingEvent) => {
        for (const mapping of mappings) {
          const matchingRecord = message.records.find(record => record.recordType === mapping.record_type);
          if (matchingRecord) {
            try {
              const data = JSON.parse(new TextDecoder().decode(matchingRecord.data as ArrayBuffer));
              const serial = data[mapping.field_path];
              if (serial) {
                setSerialCode(serial);
                setLastScanResult(`NFC: ${serial}`);
                stopNFCScan(); // Stop scanning after a successful read
                return;
              }
            } catch {
              const text = new TextDecoder().decode(matchingRecord.data as ArrayBuffer);
              setSerialCode(text);
              setLastScanResult(`NFC: ${text}`);
              stopNFCScan(); // Stop scanning after a successful read
              return;
            }
          }
        }
        setLastScanResult("NFC: No matching mapping found.");
        stopNFCScan(); // Stop scanning if no mapping is found
      };
 
      const errorHandler = () => {
        setIsScanning(false)
        toast({
          title: "NFC Read Error",
          description: "Failed to read NFC tag",
          variant: "destructive",
        })
      };
      
      nfcReadingHandlerRef.current = readingHandler;
      nfcErrorHandlerRef.current = errorHandler;
 
      ndef.addEventListener("reading", readingHandler);
      ndef.addEventListener("readingerror", errorHandler);
 
      toast({
        title: "NFC Scanning Active",
        description: "Tap an NFC tag to scan",
      })
    } catch (error) {
      setIsScanning(false)
      toast({
        title: "NFC Error",
        description: error instanceof Error ? error.message : "Failed to start NFC scanning",
        variant: "destructive",
      })
    }
  }
 
  const stopNFCScan = () => {
    if (ndefReaderRef.current && nfcReadingHandlerRef.current && nfcErrorHandlerRef.current) {
      ndefReaderRef.current.removeEventListener("reading", nfcReadingHandlerRef.current as (event: NDEFReadingEvent) => void);
      ndefReaderRef.current.removeEventListener("readingerror", nfcErrorHandlerRef.current as () => void);
      ndefReaderRef.current = null; // Clear the ref
      nfcReadingHandlerRef.current = null;
      nfcErrorHandlerRef.current = null;
    }
    setIsScanning(false)
    toast({
      title: "NFC Scanning Stopped",
      description: "NFC scanning has been stopped.",
    })
  }
 
  const startCameraScan = async () => {
    if (isCameraScanning) return;
 
    try {
      setIsCameraScanning(true);
      if (videoRef.current) {
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              width: { min: 1280 },
              height: { min: 720 },
              facingMode: "environment", // Prefer the back camera
              aspectRatio: { min: 1, max: 2 }
            }
          },
          numOfWorkers: navigator.hardwareConcurrency || 4,
          decoder: {
            readers: ["code_128_reader"],
            multiple: false // Decode only one barcode at a time
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          locate: true
        }, (err) => {
          if (err) {
            console.error("Quagga initialization error:", err);
            toast({
              title: "Camera Scan Error",
              description: `Failed to initialize camera: ${err.message || err}`,
              variant: "destructive",
            });
            setIsCameraScanning(false);
            return;
          }
          Quagga.start();

          toast({
            title: "Camera Scanning Active",
            description: "Point the camera at a barcode to scan",
          });
        
          const syncCanvasSize = () => {
            const canvas = Quagga.canvas?.dom?.overlay;
            const container = videoRef.current;
 
            if (canvas && container instanceof HTMLElement) {
              const { offsetWidth, offsetHeight } = container;
              canvas.width = offsetWidth;
              canvas.height = offsetHeight;
              canvas.style.width = `${offsetWidth}px`;
              canvas.style.height = `${offsetHeight}px`;
            }
          };
 
          window.addEventListener("resize", syncCanvasSize);
 
          Quagga.onProcessed((result) => {
          const ctx = Quagga.canvas?.ctx?.overlay;
          const canvas = Quagga.canvas?.dom?.overlay;
 
          if (!ctx || !canvas) return;
 
          ctx.clearRect(0, 0, canvas.width, canvas.height);
 
          const rawBox = result?.box as number[][];
 
          if (
            Array.isArray(rawBox) &&
            rawBox.every(point => Array.isArray(point) && point.length === 2)
          ) {
            const box = rawBox.map(([x, y]) => ({ x, y }));
 
            ctx.strokeStyle = "lime";
            ctx.lineWidth = 3;
            ctx.beginPath();
            box.forEach((point, i) => {
              const next = box[(i + 1) % box.length];
              ctx.moveTo(point.x, point.y);
              ctx.lineTo(next.x, next.y);
            });
            ctx.closePath();
            ctx.stroke();
          }
        });
 
          Quagga.onDetected((result) => {
            if (result.codeResult && result.codeResult.code !== null) {
              setSerialCode(result.codeResult.code);
              stopCameraScan();
              toast({
                title: "Barcode Scanned",
                description: `Scanned: ${result.codeResult.code}`,
              });
            }
          });
        });
      } else {
        toast({
          title: "Camera Scan Error",
          description: "Video element not found. Cannot start camera scanning.",
          variant: "destructive",
        });
        setIsCameraScanning(false);
      }
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
    if (isCameraScanning) {
      Quagga.stop();
      Quagga.offDetected(); // Deregister the event listener
      setIsCameraScanning(false);
      toast({
        title: "Camera Scan Stopped",
        description: "Barcode scanning has been stopped.",
      });
    }
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
        message: `${errorMessage} (Serial: ${serialCode})`,
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

    const handleNextRow = () => {
    setRow((prev) => prev + 1)
  }

  const handlePreviousRow = () => {
    if (row > 1) {
      setRow((prev) => prev - 1)
    }
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
                  disabled={isCameraScanning}
                />
              </div>
              <div className="flex items-end gap-2">
                {nfcSupported && (
                  isScanning ? (
                    <Button type="button" variant="destructive" size="icon" onClick={stopNFCScan}>
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" size="icon" onClick={startNFCScan} disabled={isCameraScanning}>
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  )
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

            <div ref={videoRef} id="interactive" className={`viewport relative w-full h-64 border rounded-md overflow-hidden ${isCameraScanning ? '' : 'hidden'}`}>
              {/* Quagga will inject video and canvas here */}
              {/* Bounding box is drawn by Quagga */}
              
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
                <div className="flex gap-1">
                  <Button type="button" variant="outline" size="icon" onClick={handlePreviousRow} disabled={row <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                <Input
                  id="row"
                  type="number"
                  value={row}
                  onChange={(e) => setRow(Number.parseInt(e.target.value) || 1)}
                  min="1"
                  className="text-center"
                  required
                />
                <Button type="button" variant="outline" size="icon" onClick={handleNextRow}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  </div>
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
