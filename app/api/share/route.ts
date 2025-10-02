import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { randomBytes } from "crypto"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { profileId } = await request.json()

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 })
    }

    const token = randomBytes(16).toString("hex")

    await sql`
      INSERT INTO share_tokens (profile_id, token, expires_at)
      VALUES (${profileId}, ${token}, NULL)
    `

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Failed to create share token:", error)
    return NextResponse.json({ error: "Failed to create share token" }, { status: 500 })
  }
}