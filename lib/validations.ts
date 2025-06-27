import { z } from "zod"

export const profileSchema = z.object({
  name: z.string().min(1, "Profile name is required").max(255),
  description: z.string().optional(),
})

export const panelUploadSchema = z.object({
  pallet_no: z.string().min(1, "Pallet number is required"),
  serial_code: z.string().min(1, "Serial code is required"),
})

export const scanSchema = z.object({
  profileId: z.string().min(1, "Profile ID is required"),
  serial_code: z.string().min(1, "Serial code is required"),
  section: z.string().min(1, "Section is required"),
  row: z.number().min(1, "Row must be at least 1"),
  column: z.number().min(1, "Column must be at least 1").optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type PanelUploadInput = z.infer<typeof panelUploadSchema>
export type ScanInput = z.infer<typeof scanSchema>
