import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

export type Profile = {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type Panel = {
  id: number
  profile_id: number
  pallet_no: string
  serial_code: string
  section: string | null
  row_number: number | null
  column_number: number | null
  scanned_at: string | null
  created_at: string
  updated_at: string
}

export type PanelWithProfile = Panel & {
  profile_name: string
}
