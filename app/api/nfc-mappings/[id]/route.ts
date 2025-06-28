import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const nfcMappingUpdateSchema = z.object({
  recordType: z.string().min(1, "Record type is required").optional(),
  fieldPath: z.string().min(1, "Field path is required").optional(),
  description: z.string().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid mapping ID" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = nfcMappingUpdateSchema.parse(body)

    const [mapping] = await sql`
      UPDATE nfc_mappings
      SET 
        record_type = ${validatedData.recordType}, 
        field_path = ${validatedData.fieldPath}, 
        description = ${validatedData.description || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (!mapping) {
      return NextResponse.json({ error: "Mapping not found" }, { status: 404 })
    }

    revalidatePath("/api/nfc-mappings")

    return NextResponse.json(mapping)
  } catch (error) {
    console.error("Failed to update NFC mapping:", error)
    return NextResponse.json({ error: "Failed to update NFC mapping" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid mapping ID" }, { status: 400 })
    }

    const deletedMapping = await sql`DELETE FROM nfc_mappings WHERE id = ${id} RETURNING id`

    if (deletedMapping.length === 0) {
      return NextResponse.json({ error: "Mapping not found" }, { status: 404 })
    }

    revalidatePath("/api/nfc-mappings")

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete NFC mapping:", error)
    return NextResponse.json({ error: "Failed to delete NFC mapping" }, { status: 500 })
  }
}