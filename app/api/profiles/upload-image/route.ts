import { NextRequest, NextResponse } from "next/server"
import { writeFile, unlink, mkdir } from "fs/promises"
import path from "path"
import sharp from "sharp"
import { sql } from "@/lib/db"
import { existsSync } from "fs"

const UPLOADS_DIR = path.join(process.cwd(), "public/uploads")

// Ensure uploads directory exists
async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadsDir()

    const formData = await request.formData()
    const image = formData.get("image") as File
    const profileId = formData.get("profileId") as string

    if (!image) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      )
    }

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process image with sharp (validate dimensions and optimize)
    const metadata = await sharp(buffer).metadata()
    if (metadata.width && metadata.width > 2000 || metadata.height && metadata.height > 2000) {
      return NextResponse.json(
        { error: "Image dimensions must not exceed 2000x2000 pixels" },
        { status: 400 }
      )
    }

    // Create unique filename
    const ext = path.extname(image.name).toLowerCase()
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg']
    if (!validExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported file format. Please use JPG, PNG, GIF, or SVG files." },
        { status: 400 }
      )
    }

    const filename = `profile-${profileId}-${Date.now()}${ext}`
    const filepath = path.join(UPLOADS_DIR, filename)

    // Optimize image (except SVG)
    if (ext !== '.svg') {
      const optimizedBuffer = await sharp(buffer)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .toBuffer()
      await writeFile(filepath, optimizedBuffer)
    } else {
      await writeFile(filepath, buffer)
    }

    // Delete previous image if it exists
    const previousImage = await sql`
      SELECT image_url FROM profiles WHERE id = ${parseInt(profileId)}
    `
    if (previousImage[0]?.image_url) {
      const previousPath = path.join(process.cwd(), "public", previousImage[0].image_url)
      try {
        await unlink(previousPath)
      } catch (error) {
        console.error("Error deleting previous image:", error)
      }
    }

    // Update profile in database
    const imageUrl = `/uploads/${filename}`
    await sql`
      UPDATE profiles 
      SET image_url = ${imageUrl}
      WHERE id = ${parseInt(profileId)}
    `

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get("profileId")

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      )
    }

    // Get current image URL from database
    const result = await sql`
      SELECT image_url FROM profiles WHERE id = ${parseInt(profileId)}
    `

    const profile = result[0]
    if (!profile?.image_url) {
      return NextResponse.json({ message: "No image to delete" })
    }

    // Delete file
    const filepath = path.join(process.cwd(), "public", profile.image_url)
    try {
      await unlink(filepath)
    } catch (error) {
      console.error("Error deleting file:", error)
    }

    // Update database
    await sql`
      UPDATE profiles 
      SET image_url = NULL
      WHERE id = ${parseInt(profileId)}
    `

    return NextResponse.json({ message: "Image deleted successfully" })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    )
  }
}