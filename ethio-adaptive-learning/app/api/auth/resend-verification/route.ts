import { createElement } from "react"
import { NextResponse } from "next/server"

import { createEmailVerificationToken } from "@/lib/users"
import { sendEmail } from "@/lib/email/send-email"
import { VerifyEmailTemplate } from "@/lib/email/templates"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"

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

    const token = await createEmailVerificationToken(email)

    if (token) {
      const verificationUrl = `${APP_URL}/api/auth/verify-account?email=${encodeURIComponent(
        email
      )}&token=${encodeURIComponent(token)}`

      const template = createElement(VerifyEmailTemplate, {
        userEmail: email,
        verificationUrl,
        userName: undefined,
      })

      const emailResult = await sendEmail({
        to: email,
        subject: "Verify your EthioPrep email address",
        template,
      })

      if (!emailResult.success) {
        console.error("Verification email delivery failed", {
          email,
          error: emailResult.error,
        })
      }
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          "If an account exists for that email, a verification link will be sent shortly.",
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process the request."
    console.error("Resend verification request failed", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
