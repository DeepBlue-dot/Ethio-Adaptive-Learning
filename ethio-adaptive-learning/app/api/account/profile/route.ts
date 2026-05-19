import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, username, phoneNumber, grade } = body

    // Validate required fields
    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const trimmedUsername = username.trim()

    // Check if username is already taken (by another user)
    if (trimmedUsername !== session.user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: trimmedUsername },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 })
      }
    }

    // Validate phone number format (basic validation)
    if (phoneNumber && !/^[\d+\-\s()]+$/.test(phoneNumber)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name?.trim() || session.user.name,
        username: trimmedUsername,
        phoneNumber: phoneNumber?.trim() || null,
        grade: grade || undefined,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phoneNumber: true,
        grade: true,
        emailVerified: true,
      },
    })

    return NextResponse.json(updatedUser, { status: 200 })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
