import { NextResponse } from "next/server"

import {
  invalidateEmailVerificationToken,
  markUserEmailVerified,
  verifyEmailVerificationToken,
} from "@/lib/users"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? ""
  const token = url.searchParams.get("token") ?? ""

  if (!EMAIL_REGEX.test(email) || !token) {
    return NextResponse.json(
      { error: "Verification link is invalid or missing required data." },
      { status: 400 }
    )
  }

  const tokenIsValid = await verifyEmailVerificationToken(email, token)

  if (!tokenIsValid) {
    return NextResponse.json(
      {
        error:
          "The verification link is invalid or has expired. Please request a new link.",
      },
      { status: 400 }
    )
  }

  await markUserEmailVerified(email)
  await invalidateEmailVerificationToken(email, token)

  return NextResponse.json(
    {
      ok: true,
      message: "Your email address has been verified successfully.",
    },
    { status: 200 }
  )
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; token?: string }
  const email = body.email?.trim().toLowerCase() ?? ""
  const token = body.token ?? ""

  if (!EMAIL_REGEX.test(email) || !token) {
    return NextResponse.json(
      { error: "Email and token are required for verification." },
      { status: 400 }
    )
  }

  const tokenIsValid = await verifyEmailVerificationToken(email, token)

  if (!tokenIsValid) {
    return NextResponse.json(
      {
        error:
          "The verification token is invalid or has expired. Please request a new link.",
      },
      { status: 400 }
    )
  }

  await markUserEmailVerified(email)
  await invalidateEmailVerificationToken(email, token)

  return NextResponse.json(
    {
      ok: true,
      message: "Your email address has been verified successfully.",
    },
    { status: 200 }
  )
}
