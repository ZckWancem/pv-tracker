import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = 'force-dynamic' // force dynamic rendering

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

    const panels = await sql`
      SELECT * FROM panels
      WHERE profile_id = ${profileId}
      ORDER BY
        substring(section from '^[^0-9]+'),
        CAST(substring(section from '[0-9]+') AS INTEGER),
        row_number,
        column_number
    `

    return NextResponse.json(panels)
  } catch (error) {
    console.error("Failed to fetch panels:", error)
    return NextResponse.json({ error: "Failed to fetch panels" }, { status: 500 })
  }
}
