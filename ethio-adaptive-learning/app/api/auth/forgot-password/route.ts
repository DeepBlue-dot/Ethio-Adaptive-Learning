import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string }
    const email = body.email?.trim().toLowerCase() ?? ""

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    console.info("Password reset requested", {
      email,
      userFound: Boolean(user),
    })

    return NextResponse.json(
      {
        ok: true,
        message:
          "If an account exists for that email, you will receive a reset link shortly.",
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process your request."
    console.error("Forgot password request failed", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
