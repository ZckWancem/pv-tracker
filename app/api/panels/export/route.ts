import { type NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { sql } from "@/lib/db"
import Papa from "papaparse"
import * as XLSX from "xlsx"

console.log("Type of XLSX:", typeof XLSX);
console.log("XLSX object:", XLSX);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileIdParam = searchParams.get("profileId")
    const format = searchParams.get("format")

    if (!profileIdParam || !format) {
      return NextResponse.json({ error: "Profile ID and format are required" }, { status: 400 })
    }

    const profileId = Number.parseInt(profileIdParam)
    if (Number.isNaN(profileId)) {
      return NextResponse.json({ error: "Invalid Profile ID" }, { status: 400 })
    }

    if (format !== "csv" && format !== "xlsx") {
      return NextResponse.json({ error: "Invalid format. Must be 'csv' or 'xlsx'." }, { status: 400 })
    }

    // Fetch panels from the database
    const panels = await sql`
      SELECT 
        serial_code, 
        pallet_no, 
        section, 
        row_number, 
        column_number, 
        scanned_at, 
        created_at, 
        updated_at
      FROM panels 
      WHERE profile_id = ${profileId}
      ORDER BY created_at ASC
    `

    let fileContent: Buffer | string
    let contentType: string
    let filename: string

    if (format === "csv") {
      fileContent = Papa.unparse(panels)
      contentType = "text/csv"
      filename = `panels_profile_${profileId}.csv`
    } else { // xlsx
      const worksheet = XLSX.utils.json_to_sheet(panels)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Panels")
      fileContent = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      filename = `panels_profile_${profileId}.xlsx`
    }

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Failed to export panels:", error)
    return NextResponse.json({ error: "Failed to export panels" }, { status: 500 })
  }
}