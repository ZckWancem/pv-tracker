import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { profileSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function GET() {
  try {
    const profiles = await sql`
      SELECT * FROM profiles 
      ORDER BY created_at DESC
    `

    return NextResponse.json(profiles)
  } catch (error) {
    console.error("Failed to fetch profiles:", error)
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    const [profile] = await sql`
      INSERT INTO profiles (name, description)
      VALUES (${validatedData.name}, ${validatedData.description || null})
      RETURNING *
    `

    revalidatePath("/api/profiles")

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Failed to create profile:", error)
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }
}
