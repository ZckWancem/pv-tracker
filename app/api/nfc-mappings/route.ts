import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const nfcMappingSchema = z.object({
  profileId: z.number().min(1, "Profile ID is required"),
  recordType: z.string().min(1, "Record type is required"),
  fieldPath: z.string().min(1, "Field path is required"),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileIdParam = searchParams.get("profileId")

    if (!profileIdParam) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 })
    }

    const profileId = Number.parseInt(profileIdParam)
    if (Number.isNaN(profileId)) {
      return NextResponse.json({ error: "Invalid Profile ID" }, { status: 400 })
    }

    const mappings = await sql`
      SELECT * FROM nfc_mappings
      WHERE profile_id = ${profileId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(mappings)
  } catch (error) {
    console.error("Failed to fetch NFC mappings:", error)
    return NextResponse.json({ error: "Failed to fetch NFC mappings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = nfcMappingSchema.parse(body)

    const [mapping] = await sql`
      INSERT INTO nfc_mappings (profile_id, record_type, field_path, description)
      VALUES (${validatedData.profileId}, ${validatedData.recordType}, ${validatedData.fieldPath}, ${validatedData.description || null})
      RETURNING *
    `

    revalidatePath("/api/nfc-mappings")

    return NextResponse.json(mapping)
  } catch (error) {
    console.error("Failed to create NFC mapping:", error)
    return NextResponse.json({ error: "Failed to create NFC mapping" }, { status: 500 })
  }
}