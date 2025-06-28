"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area" // Assuming ScrollArea exists based on previous file analysis
import { CheckCircle2, XCircle } from "lucide-react"

export interface ScanLogEntry {
  type: "success" | "error"
  message: string
  timestamp: Date
}

interface ScanLogProps {
  logs: ScanLogEntry[]
}

export function ScanLog({ logs }: ScanLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Scan Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-60 w-full rounded-md border p-4 bg-stone-100">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">No scan events yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {entry.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    [{entry.timestamp.toLocaleTimeString()}]:
                  </span>
                  <span>{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}