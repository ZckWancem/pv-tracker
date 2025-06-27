import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { panelUploadSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileId, panels } = body

    if (!profileId || !Array.isArray(panels)) {
      return NextResponse.json({ error: "Profile ID and panels array are required" }, { status: 400 })
    }

    // Validate each panel
    const validatedPanels = panels.map((panel) => panelUploadSchema.parse(panel))

    // Insert panels in batch
    const insertedPanels = []
    for (const panel of validatedPanels) {
      try {
        const [insertedPanel] = await sql`
          INSERT INTO panels (profile_id, pallet_no, serial_code)
          VALUES (${profileId}, ${panel.pallet_no}, ${panel.serial_code})
          RETURNING *
        `
        insertedPanels.push(insertedPanel)
      } catch (error: unknown) {
        // Skip duplicates but continue with others
        if (error instanceof Error && 'code' in error && error.code === "23505") {
          // Unique constraint violation, do nothing (skip duplicate)
        } else {
          // Not a unique constraint violation or unexpected error object, re-throw
          throw error
        }
      }
    }

    return NextResponse.json({
      message: "Panels uploaded successfully",
      count: insertedPanels.length,
      total: validatedPanels.length,
    })
  } catch (error) {
    console.error("Failed to upload panels:", error)
    return NextResponse.json({ error: "Failed to upload panels" }, { status: 500 })
  }
}
