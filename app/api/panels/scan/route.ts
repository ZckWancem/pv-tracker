import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { scanSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = scanSchema.parse(body)

    // Check if panel exists
    const [existingPanel] = await sql`
      SELECT * FROM panels 
      WHERE profile_id = ${validatedData.profileId} 
      AND serial_code = ${validatedData.serial_code}
    `

    if (!existingPanel) {
      return NextResponse.json({ error: "Panel not found in database" }, { status: 404 })
    }

    // Check if already scanned
    if (existingPanel.scanned_at) {
      return NextResponse.json({ error: "Panel already scanned" }, { status: 409 })
    }

    // Check for location conflicts
    if (validatedData.column) {
      const [conflictingPanel] = await sql`
        SELECT * FROM panels 
        WHERE profile_id = ${validatedData.profileId}
        AND section = ${validatedData.section}
        AND row_number = ${validatedData.row}
        AND column_number = ${validatedData.column}
        AND scanned_at IS NOT NULL
      `

      if (conflictingPanel) {
        return NextResponse.json({ error: "Location already occupied by another panel" }, { status: 409 })
      }
    }

    // Update panel with scan information
    const [updatedPanel] = await sql`
      UPDATE panels 
      SET 
        section = ${validatedData.section},
        row_number = ${validatedData.row},
        column_number = ${validatedData.column || null},
        scanned_at = NOW(),
        updated_at = NOW()
      WHERE id = ${existingPanel.id}
      RETURNING *
    `

    return NextResponse.json(updatedPanel)
  } catch (error) {
    console.error("Failed to record scan:", error)
    return NextResponse.json({ error: "Failed to record scan" }, { status: 500 })
  }
}
