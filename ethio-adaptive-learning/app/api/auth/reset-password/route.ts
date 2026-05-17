import { NextResponse } from "next/server"

import {
  invalidatePasswordResetToken,
  updateUserPassword,
  verifyPasswordResetToken,
} from "@/lib/users"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
      token?: string
    }
    const email = body.email?.trim().toLowerCase() ?? ""
    const password = body.password ?? ""
    const token = body.token ?? ""

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      )
    }

    if (!token) {
      return NextResponse.json(
        {
          error:
            "The password reset token is missing. Please use the link from your email.",
        },
        { status: 400 }
      )
    }

    const tokenIsValid = await verifyPasswordResetToken(email, token)

    if (!tokenIsValid) {
      return NextResponse.json(
        {
          error:
            "The password reset link is invalid or has expired. Please request a new link.",
        },
        { status: 400 }
      )
    }

    await updateUserPassword(email, password)
    await invalidatePasswordResetToken(email, token)

    return NextResponse.json(
      { ok: true, message: "Your password has been successfully reset." },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reset your password."
    console.error("Reset password request failed", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
