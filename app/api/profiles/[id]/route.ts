import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { profileSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 })
    }

    const [profile] = await sql`SELECT * FROM profiles WHERE id = ${id}`

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Failed to fetch profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    const [profile] = await sql`
      UPDATE profiles
      SET name = ${validatedData.name}, description = ${validatedData.description || null}
      WHERE id = ${id}
      RETURNING *
    `

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    revalidatePath("/api/profiles")

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Failed to update profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 })
    }

    const deletedProfile = await sql`DELETE FROM profiles WHERE id = ${id} RETURNING id`

    if (deletedProfile.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    revalidatePath("/api/profiles")

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete profile:", error)
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 })
  }
}