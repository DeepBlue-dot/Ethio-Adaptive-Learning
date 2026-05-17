import { createElement } from "react"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { createPasswordResetToken } from "@/lib/users"
import { sendEmail } from "@/lib/email/send-email"
import { PasswordResetTemplate } from "@/lib/email/templates"
import { verifyRecaptcha } from "@/lib/verify-recaptcha"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      recaptchaToken?: string
    }
    const email = body.email?.trim().toLowerCase() ?? ""
    const recaptchaToken = String(body.recaptchaToken ?? "")

    if (!recaptchaToken) {
      return NextResponse.json(
        { error: "Please complete the CAPTCHA verification." },
        { status: 400 }
      )
    }

    const isValidCaptcha = await verifyRecaptcha(recaptchaToken)

    if (!isValidCaptcha) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed. Please try again." },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true },
    })

    if (user) {
      const token = await createPasswordResetToken(email)

      if (token) {
        const resetUrl = `${APP_URL}/reset-password?email=${encodeURIComponent(
          email
        )}&token=${encodeURIComponent(token)}`
        const template = createElement(PasswordResetTemplate, {
          userEmail: email,
          resetUrl,
          userName: user.name ?? undefined,
        })

        const emailResult = await sendEmail({
          to: email,
          subject: "Reset your EthioPrep password",
          template,
        })

        if (!emailResult.success) {
          console.error("Password reset email delivery failed", {
            email,
            error: emailResult.error,
          })
        }
      }
    }

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
    const message =
      error instanceof Error
        ? error.message
        : "Unable to process your request."
    console.error("Forgot password request failed", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
