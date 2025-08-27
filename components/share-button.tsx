"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ShareButtonProps {
  profileId: number
}

export function ShareButton({ profileId }: ShareButtonProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const { toast } = useToast()

  const generateShareUrl = async () => {
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate share URL")
      }

      const { token } = await response.json()
      const url = `${window.location.origin}/share?token=${token}`
      setShareUrl(url)
      setIsAlertOpen(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate share URL. Please try again.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Copied!",
        description: "Share URL copied to clipboard.",
      })
    }
  }

  return (
    <>
      <Button onClick={generateShareUrl} variant="outline">
        Share
      </Button>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Layout View</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone with this link can view the layout. The link will expire in 24 hours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input id="link" defaultValue={shareUrl ?? ""} readOnly />
            </div>
            <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
              <span className="sr-only">Copy</span>
              {/* <CopyIcon className="h-4 w-4" /> */}
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}