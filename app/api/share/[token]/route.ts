import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const { token } = params

    const result = await sql`
      SELECT profile_id, expires_at
      FROM share_tokens
      WHERE token = ${token}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid share token" }, { status: 404 })
    }

    const { profile_id, expires_at } = result[0]

    if (expires_at && new Date() > new Date(expires_at)) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 })
    }

    const [profile] = await sql`
      SELECT * FROM profiles WHERE id = ${profile_id}
    `

    const panels = await sql`
      SELECT * FROM panels
      WHERE profile_id = ${profile_id}
      ORDER BY
        substring(section from '^[^0-9]+'),
        CAST(substring(section from '[0-9]+') AS INTEGER),
        row_number,
        column_number
    `

    const response = NextResponse.json({ panels, profile })
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    return response
  } catch (error) {
    console.error("Failed to fetch shared data:", error)
    return NextResponse.json({ error: "Failed to fetch shared data" }, { status: 500 })
  }
}