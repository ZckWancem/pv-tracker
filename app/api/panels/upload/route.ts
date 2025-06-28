import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { panelUploadSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileId, panels } = body

    if (!profileId || !Array.isArray(panels)) {
      return NextResponse.json({ error: "Profile ID and panels array are required" }, { status: 400 })
    }

    // Validate each panel
    const validatedPanels = panels.map((panel) => panelUploadSchema.parse(panel))

    // Fetch existing serial codes for the given profile to prevent duplicates
    const existingPanels = await sql`
      SELECT serial_code FROM panels WHERE profile_id = ${profileId}
    `
    const existingSerialCodes = new Set(existingPanels.map((p) => p.serial_code))

    const panelsToInsert = validatedPanels.filter(
      (panel) => !existingSerialCodes.has(panel.serial_code)
    )

    // Insert panels in batch
    const insertedPanels = []
    for (const panel of panelsToInsert) { // Iterate over filtered panels
      const [insertedPanel] = await sql`
        INSERT INTO panels (profile_id, pallet_no, serial_code)
        VALUES (${profileId}, ${panel.pallet_no}, ${panel.serial_code})
        RETURNING *
      `
      insertedPanels.push(insertedPanel)
    }
    // Remove the catch block related to unique constraint as duplicates are now handled before insertion

    revalidatePath("/api/panels") // Revalidate the panels data path

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
