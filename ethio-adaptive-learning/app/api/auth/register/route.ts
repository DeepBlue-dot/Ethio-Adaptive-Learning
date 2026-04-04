import { NextResponse } from "next/server"

import { createStudentUser } from "@/lib/users"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string
      email?: string
      password?: string
    }

    const username = body.username?.trim() ?? ""
    const email = body.email?.trim().toLowerCase() ?? ""
    const password = body.password ?? ""

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long." },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      )
    }

    const user = await createStudentUser({
      username,
      email,
      password,
    })

    console.info("Student registration succeeded", { userId: user.id })

    return NextResponse.json(
      {
        ok: true,
        userId: user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create your account right now."

    console.error("Student registration failed", error)

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
