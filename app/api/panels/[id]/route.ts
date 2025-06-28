import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { section, row_number, column_number } = body

    const [updatedPanel] = await sql`
      UPDATE panels 
      SET 
        section = ${section},
        row_number = ${row_number},
        column_number = ${column_number},
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    if (!updatedPanel) {
      return NextResponse.json({ error: "Panel not found" }, { status: 404 })
    }

    revalidatePath("/api/panels")

    return NextResponse.json(updatedPanel)
  } catch (error) {
    console.error("Failed to update panel:", error)
    return NextResponse.json({ error: "Failed to update panel" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [deletedPanel] = await sql`
      DELETE FROM panels 
      WHERE id = ${params.id}
      RETURNING *
    `

    if (!deletedPanel) {
      return NextResponse.json({ error: "Panel not found" }, { status: 404 })
    }

    revalidatePath("/api/panels")

    return NextResponse.json({ message: "Panel deleted successfully" })
  } catch (error) {
    console.error("Failed to delete panel:", error)
    return NextResponse.json({ error: "Failed to delete panel" }, { status: 500 })
  }
}
