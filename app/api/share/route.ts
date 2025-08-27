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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

    await sql`
      INSERT INTO share_tokens (profile_id, token, expires_at)
      VALUES (${profileId}, ${token}, ${expiresAt.toISOString()})
    `

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Failed to create share token:", error)
    return NextResponse.json({ error: "Failed to create share token" }, { status: 500 })
  }
}